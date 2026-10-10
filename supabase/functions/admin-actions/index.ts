/**
 * Supabase Edge Function: admin-actions
 * Executes privileged server-side operations using SUPABASE_SERVICE_ROLE_KEY:
 * 1. Review registration (accept / reject) with idempotent participant & Auth user provisioning
 * 2. Guarantees 1 registration -> 1 participant -> 1 Supabase Auth account
 * 3. Never stores plaintext passwords in PostgreSQL
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const VALID_TRACK_SLUGS = new Set([
  'litigation',
  'contracts',
  'legislation',
  'governance-compliance'
]);

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
        JSON.stringify({ error: 'SERVER_CONFIGURATION_MISSING' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Verify calling user and enforce admin role
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const {
      data: { user },
      error: userError
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED' }),
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
        JSON.stringify({ error: 'FORBIDDEN' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'review_registration') {
      const { registrationId, decision, overrideTrackId } = body;
      if (!registrationId || !['accepted', 'rejected'].includes(decision)) {
        return new Response(
          JSON.stringify({ error: 'INVALID_PARAMETERS' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (overrideTrackId && !VALID_TRACK_SLUGS.has(overrideTrackId)) {
        return new Response(
          JSON.stringify({ error: 'INVALID_TRACK' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 2. Verify registration exists
      const { data: reg, error: regErr } = await supabaseAdmin
        .from('registrations')
        .select('*')
        .eq('id', registrationId)
        .maybeSingle();

      if (regErr || !reg) {
        return new Response(
          JSON.stringify({ error: 'REGISTRATION_NOT_FOUND' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const finalTrackId = overrideTrackId || reg.selected_track_id;
      const normalizedEmail = String(reg.email).trim().toLowerCase();
      const nowIso = new Date().toISOString();

      // Check if a participant record already exists for this registration or email
      const { data: existingParticipant } = await supabaseAdmin
        .from('participants')
        .select('*')
        .or(`registration_id.eq.${registrationId},email.ilike.${normalizedEmail}`)
        .maybeSingle();

      // Handle Rejection
      if (decision === 'rejected') {
        if (existingParticipant) {
          return new Response(
            JSON.stringify({ error: 'PARTICIPANT_ALREADY_PROVISIONED' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: rejectUpdateErr } = await supabaseAdmin
          .from('registrations')
          .update({
            status: 'rejected',
            selected_track_id: finalTrackId,
            participant_account_created: false,
            reviewed_at: nowIso,
            reviewed_by: user.id,
            updated_at: nowIso
          })
          .eq('id', registrationId);

        if (rejectUpdateErr) {
          return new Response(
            JSON.stringify({ error: 'REGISTRATION_UPDATE_FAILED' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ status: 'rejected', registrationId }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Handle Acceptance — Case A: Participant profile already exists (Idempotent retry)
      if (existingParticipant) {
        // Ensure participant role exists
        await supabaseAdmin
          .from('user_roles')
          .upsert(
            { user_id: existingParticipant.user_id, role: 'participant' },
            { onConflict: 'user_id,role' }
          );

        const { data: updatedParticipant, error: updatePartErr } = await supabaseAdmin
          .from('participants')
          .update({
            selected_track_id: finalTrackId,
            updated_at: nowIso
          })
          .eq('id', existingParticipant.id)
          .select('*')
          .single();

        if (updatePartErr) {
          return new Response(
            JSON.stringify({ error: 'PARTICIPANT_UPDATE_FAILED' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabaseAdmin
          .from('registrations')
          .update({
            status: 'accepted',
            selected_track_id: finalTrackId,
            participant_account_created: true,
            reviewed_at: nowIso,
            reviewed_by: user.id,
            updated_at: nowIso
          })
          .eq('id', registrationId);

        return new Response(
          JSON.stringify({
            status: 'accepted',
            participant: updatedParticipant,
            alreadyExisted: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Handle Acceptance — Case B: Provision Auth user + role + participant profile
      const temporaryPassword = generateSecureTempPassword(12);
      let authUserId: string | null = null;
      let createdFreshAuthUser = false;

      const { data: createdAuth, error: createAuthErr } =
        await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            full_name: reg.full_name,
            role: 'participant'
          }
        });

      if (!createAuthErr && createdAuth?.user) {
        authUserId = createdAuth.user.id;
        createdFreshAuthUser = true;
      } else {
        // Recovery path: check if an Auth user with this email already exists from an earlier partial attempt
        const { data: usersPage, error: listErr } =
          await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });

        if (listErr || !usersPage?.users) {
          return new Response(
            JSON.stringify({ error: 'AUTH_PROVISIONING_FAILED' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const matchedAuthUser = usersPage.users.find(
          (u) => u.email?.trim().toLowerCase() === normalizedEmail
        );

        if (!matchedAuthUser) {
          return new Response(
            JSON.stringify({ error: 'AUTH_PROVISIONING_FAILED' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        authUserId = matchedAuthUser.id;
        // Set temporary password so the recovered participant account can log in
        const { error: resetPassErr } =
          await supabaseAdmin.auth.admin.updateUserById(authUserId, {
            password: temporaryPassword,
            email_confirm: true,
            user_metadata: {
              ...matchedAuthUser.user_metadata,
              full_name: reg.full_name,
              role: 'participant'
            }
          });

        if (resetPassErr) {
          return new Response(
            JSON.stringify({ error: 'AUTH_RECOVERY_FAILED' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Upsert participant role (idempotent)
      const { error: roleInsertErr } = await supabaseAdmin
        .from('user_roles')
        .upsert(
          { user_id: authUserId, role: 'participant' },
          { onConflict: 'user_id,role' }
        );

      if (roleInsertErr) {
        if (createdFreshAuthUser && authUserId) {
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
        }
        return new Response(
          JSON.stringify({ error: 'ROLE_ASSIGNMENT_FAILED' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert participant profile
      const { data: participant, error: partErr } = await supabaseAdmin
        .from('participants')
        .insert({
          user_id: authUserId,
          registration_id: reg.id,
          full_name: reg.full_name,
          email: normalizedEmail,
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

      if (partErr || !participant) {
        // Rollback newly created Auth account if participant insertion failed
        if (createdFreshAuthUser && authUserId) {
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
        }
        return new Response(
          JSON.stringify({ error: 'PARTICIPANT_CREATION_FAILED' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Only mark registration accepted and participant_account_created = true AFTER account & profile succeed
      const { error: regAcceptErr } = await supabaseAdmin
        .from('registrations')
        .update({
          status: 'accepted',
          selected_track_id: finalTrackId,
          participant_account_created: true,
          reviewed_at: nowIso,
          reviewed_by: user.id,
          updated_at: nowIso
        })
        .eq('id', registrationId);

      if (regAcceptErr) {
        return new Response(
          JSON.stringify({ error: 'REGISTRATION_STATUS_SYNC_FAILED' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          status: 'accepted',
          participant,
          credentials: {
            email: normalizedEmail,
            temporaryPassword
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'UNSUPPORTED_ACTION' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'INTERNAL_SERVER_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
