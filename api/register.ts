import { createClient } from '@supabase/supabase-js';

/**
 * Vercel Serverless Function: /api/register
 * Enforces registration opening and closing dates server-side before inserting into Supabase.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const defaultOpenAt =
      process.env.VITE_REGISTRATION_OPEN_AT || '2026-09-25T00:00:00+03:00';
    const defaultCloseAt =
      process.env.VITE_REGISTRATION_CLOSE_AT || '2026-10-11T23:59:59+03:00';

    const openAt = new Date(body?.openAt || defaultOpenAt).getTime();
    const closeAt = new Date(body?.closeAt || defaultCloseAt).getTime();
    const now = Date.now();

    if (now < openAt) {
      return res.status(403).json({ error: 'REGISTRATION_NOT_OPEN_YET' });
    }
    if (now > closeAt) {
      return res.status(403).json({ error: 'REGISTRATION_CLOSED' });
    }

    if (!body?.attendance_commitment_confirmed) {
      return res.status(400).json({ error: 'COMMITMENT_REQUIRED' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      // Verify against database program_settings as well
      const { data: ps } = await supabaseAdmin
        .from('program_settings')
        .select('registration_open_at, registration_close_at')
        .eq('id', 'default')
        .maybeSingle();

      if (ps) {
        const dbOpen = new Date(ps.registration_open_at).getTime();
        const dbClose = new Date(ps.registration_close_at).getTime();
        if (now < dbOpen) {
          return res.status(403).json({ error: 'REGISTRATION_NOT_OPEN_YET' });
        }
        if (now > dbClose) {
          return res.status(403).json({ error: 'REGISTRATION_CLOSED' });
        }
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}
