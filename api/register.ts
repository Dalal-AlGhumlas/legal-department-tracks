import { createClient } from '@supabase/supabase-js';

const VALID_TRACK_IDS = new Set([
  'litigation',
  'contracts',
  'legislation',
  'governance-compliance'
]);

const VALID_KNOWLEDGE_LEVELS = new Set(['متقدم', 'متوسط', 'مبتدئ']);

const MOTIVATION_MAX_LENGTH = 500;

interface ValidatedRegistrationInput {
  full_name: string;
  email: string;
  phone: string;
  university: string;
  major: string;
  academic_level: string;
  university_id: string;
  selected_track_id: string;
  track_motivation: string;
  has_previous_legal_training: boolean;
  previous_training_details: string | null;
  legal_department_knowledge_level: string;
  attendance_commitment_confirmed: true;
}

export function validateAndNormalizeRegistration(
  raw: unknown
): { ok: true; data: ValidatedRegistrationInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'INVALID_REGISTRATION_DATA' };
  }

  const body = raw as Record<string, unknown>;

  const full_name = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone =
    typeof body.phone === 'string' ? body.phone.replace(/[\s-]/g, '').trim() : '';
  const university =
    typeof body.university === 'string' ? body.university.trim() : '';
  const major = typeof body.major === 'string' ? body.major.trim() : '';
  const academic_level =
    typeof body.academic_level === 'string' ? body.academic_level.trim() : '';
  const university_id =
    typeof body.university_id === 'string' ? body.university_id.trim() : '';
  const selected_track_id =
    typeof body.selected_track_id === 'string' ? body.selected_track_id.trim() : '';
  const track_motivation =
    typeof body.track_motivation === 'string' ? body.track_motivation.trim() : '';
  const has_previous_legal_training =
    typeof body.has_previous_legal_training === 'boolean'
      ? body.has_previous_legal_training
      : null;
  const rawPrevDetails =
    typeof body.previous_training_details === 'string'
      ? body.previous_training_details.trim()
      : '';
  const legal_department_knowledge_level =
    typeof body.legal_department_knowledge_level === 'string'
      ? body.legal_department_knowledge_level.trim()
      : '';
  const attendance_commitment_confirmed =
    body.attendance_commitment_confirmed === true;

  if (!attendance_commitment_confirmed) {
    return { ok: false, error: 'INVALID_REGISTRATION_DATA' };
  }

  if (full_name.length < 2 || full_name.length > 200) {
    return { ok: false, error: 'INVALID_REGISTRATION_DATA' };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'INVALID_REGISTRATION_DATA' };
  }

  if (!phone || !/^(?:05\d{8}|\+?9665\d{8})$/.test(phone)) {
    return { ok: false, error: 'INVALID_REGISTRATION_DATA' };
  }

  if (!university || !major || !academic_level || !university_id) {
    return { ok: false, error: 'INVALID_REGISTRATION_DATA' };
  }

  if (!VALID_TRACK_IDS.has(selected_track_id)) {
    return { ok: false, error: 'INVALID_REGISTRATION_DATA' };
  }

  if (!track_motivation || track_motivation.length > MOTIVATION_MAX_LENGTH) {
    return { ok: false, error: 'INVALID_REGISTRATION_DATA' };
  }

  if (has_previous_legal_training === null) {
    return { ok: false, error: 'INVALID_REGISTRATION_DATA' };
  }

  if (has_previous_legal_training && !rawPrevDetails) {
    return { ok: false, error: 'INVALID_REGISTRATION_DATA' };
  }

  if (!VALID_KNOWLEDGE_LEVELS.has(legal_department_knowledge_level)) {
    return { ok: false, error: 'INVALID_REGISTRATION_DATA' };
  }

  return {
    ok: true,
    data: {
      full_name,
      email,
      phone,
      university,
      major,
      academic_level,
      university_id,
      selected_track_id,
      track_motivation,
      has_previous_legal_training,
      previous_training_details: has_previous_legal_training
        ? rawPrevDetails
        : null,
      legal_department_knowledge_level,
      attendance_commitment_confirmed: true
    }
  };
}

/**
 * Authoritative Vercel Serverless Registration Endpoint: POST /api/register
 * - Validates and normalizes payload
 * - Ignores any client-sent dates; reads authoritative window from Supabase `program_settings`
 * - Inserts registration using server-only `SUPABASE_SERVICE_ROLE_KEY` with `status = 'pending'`
 * - Returns `{ ok: true, id }` or safe mapped error code
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const rawBody =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const validation = validateAndNormalizeRegistration(rawBody);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(503).json({ error: 'SERVER_NOT_CONFIGURED' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // 1. Authoritative registration window check from Supabase program_settings
    // (with server-only env fallback only if the settings row does not exist)
    const fallbackOpenAt =
      process.env.REGISTRATION_OPEN_AT || '2026-09-25T00:00:00+03:00';
    const fallbackCloseAt =
      process.env.REGISTRATION_CLOSE_AT || '2026-10-11T23:59:59+03:00';

    const { data: ps } = await supabaseAdmin
      .from('program_settings')
      .select('registration_open_at, registration_close_at')
      .eq('id', 'default')
      .maybeSingle();

    const openAtTime = new Date(
      ps?.registration_open_at || fallbackOpenAt
    ).getTime();
    const closeAtTime = new Date(
      ps?.registration_close_at || fallbackCloseAt
    ).getTime();
    const now = Date.now();

    if (now < openAtTime) {
      return res.status(403).json({ error: 'REGISTRATION_NOT_OPEN_YET' });
    }

    if (now > closeAtTime) {
      return res.status(403).json({ error: 'REGISTRATION_CLOSED' });
    }

    // 2. Check for existing application with same normalized email
    const { data: existingEmailRow } = await supabaseAdmin
      .from('registrations')
      .select('id')
      .ilike('email', validation.data.email)
      .maybeSingle();

    if (existingEmailRow) {
      return res.status(409).json({ error: 'EMAIL_DUPLICATE' });
    }

    // 3. Insert into public.registrations with status forced to 'pending'
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('registrations')
      .insert({
        full_name: validation.data.full_name,
        email: validation.data.email,
        phone: validation.data.phone,
        university: validation.data.university,
        major: validation.data.major,
        academic_level: validation.data.academic_level,
        university_id: validation.data.university_id,
        selected_track_id: validation.data.selected_track_id,
        track_motivation: validation.data.track_motivation,
        has_previous_legal_training: validation.data.has_previous_legal_training,
        previous_training_details: validation.data.previous_training_details,
        legal_department_knowledge_level:
          validation.data.legal_department_knowledge_level,
        attendance_commitment_confirmed: true,
        status: 'pending',
        participant_account_created: false
      })
      .select('id')
      .single();

    if (insertError) {
      const msg = insertError.message || '';
      if (insertError.code === '23505' || msg.toLowerCase().includes('duplicate')) {
        return res.status(409).json({ error: 'EMAIL_DUPLICATE' });
      }
      if (msg.includes('REGISTRATION_NOT_OPEN_YET')) {
        return res.status(403).json({ error: 'REGISTRATION_NOT_OPEN_YET' });
      }
      if (msg.includes('REGISTRATION_CLOSED')) {
        return res.status(403).json({ error: 'REGISTRATION_CLOSED' });
      }
      return res.status(400).json({ error: 'INVALID_REGISTRATION_DATA' });
    }

    return res.status(201).json({
      ok: true,
      id: inserted.id
    });
  } catch {
    return res.status(500).json({ error: 'REGISTRATION_SUBMISSION_FAILED' });
  }
}
