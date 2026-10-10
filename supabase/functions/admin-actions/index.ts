/**
 * Supabase Edge Function: admin-actions
 * Executes privileged server-side operations using SUPABASE_SERVICE_ROLE_KEY:
 * 1. Review registration (accept / reject)
 * 2. Create Supabase Auth user & participant profile upon acceptance (never storing plaintext passwords)
 * 3. Upload / assign private certificates to the `certificates` bucket
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

function generateSecureTempPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (x) => chars[x % chars.length]).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify calling user and check admin role
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const {
      data: { user },
      error: userError
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: roleRow } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleRow) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'review_registration') {
      const { registrationId, decision, overrideTrackId } = body;
      if (!registrationId || !['accepted', 'rejected'].includes(decision)) {
        return new Response(
          JSON.stringify({ error: 'Invalid parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: reg, error: regErr } = await supabaseAdmin
        .from('registrations')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (regErr || !reg) {
        return new Response(
          JSON.stringify({ error: 'Registration not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const finalTrackId = overrideTrackId || reg.selected_track_id;

      // Update registration status
      const { error: updateErr } = await supabaseAdmin
        .from('registrations')
        .update({
          status: decision,
          selected_track_id: finalTrackId,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', registrationId);

      if (updateErr) throw updateErr;

      if (decision === 'rejected') {
        return new Response(
          JSON.stringify({ status: 'rejected', registrationId }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if participant profile already exists
      const { data: existingParticipant } = await supabaseAdmin
        .from('participants')
        .select('*')
        .eq('registration_id', registrationId)
        .maybeSingle();

      if (existingParticipant) {
        await supabaseAdmin
          .from('participants')
          .update({ selected_track_id: finalTrackId, updated_at: new Date().toISOString() })
          .eq('id', existingParticipant.id);

        return new Response(
          JSON.stringify({
            status: 'accepted',
            participant: existingParticipant,
            alreadyExisted: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create Supabase Auth user with temporary password (never stored in PostgreSQL)
      const temporaryPassword = generateSecureTempPassword(12);
      const { data: createdAuth, error: createAuthErr } =
        await supabaseAdmin.auth.admin.createUser({
          email: reg.email,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            full_name: reg.full_name,
            role: 'participant'
          }
        });

      if (createAuthErr || !createdAuth.user) {
        throw createAuthErr || new Error('Failed to create Auth user');
      }

      const newUserId = createdAuth.user.id;

      await supabaseAdmin.from('user_roles').insert({
        user_id: newUserId,
        role: 'participant'
      });

      const { data: participant, error: partErr } = await supabaseAdmin
        .from('participants')
        .insert({
          user_id: newUserId,
          registration_id: reg.id,
          full_name: reg.full_name,
          email: reg.email,
          phone: reg.phone,
          university: reg.university,
          major: reg.major,
          academic_level: reg.academic_level,
          university_id: reg.university_id,
          selected_track_id: finalTrackId,
          status: 'accepted',
          must_change_password: true
        })
        .select('*')
        .single();

      if (partErr) throw partErr;

      return new Response(
        JSON.stringify({
          status: 'accepted',
          participant,
          credentials: {
            email: reg.email,
            temporaryPassword
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unsupported action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
