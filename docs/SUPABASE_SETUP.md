# Supabase Setup & Security Guide

## 1. Apply Database Migrations in Order

Open your Supabase project's **SQL Editor** (or use `supabase db push` via the Supabase CLI) and execute the migrations in chronological order:

1. **`supabase/migrations/20261001000000_initial_schema.sql`**
   - Creates `program_settings`, `tracks`, `user_roles`, `registrations`, `participants`, and `certificates`.
   - Seeds the four official tracks (`litigation`, `contracts`, `legislation`, `governance-compliance`) and default `program_settings`.
   - Creates `public.is_admin()` helper and `trg_enforce_registration_window` trigger.
   - Provisions the private `certificates` Storage bucket (`public = false`) and Storage RLS policies.
2. **`supabase/migrations/20261010120000_production_backend_hardening.sql`**
   - Adds `participant_account_created` column to `public.registrations` and case-insensitive email uniqueness indexes (`idx_registrations_email_lower`, `idx_participants_email_lower`).
   - Removes public anonymous direct `INSERT` access on `public.registrations` so all applications must pass through the server-side `POST /api/register` gateway.
   - Removes broad participant `UPDATE` access on `public.participants` so participants cannot alter `status`, `selected_track_id`, `email`, or `university_id`.
   - Creates the narrowly scoped `public.mark_own_password_changed()` RPC (`SECURITY DEFINER`) granted to `authenticated` users.

## 2. Row Level Security (RLS) Summary

| Table / Bucket | Anonymous (`anon`) | Participant (`authenticated`) | Admin (`public.is_admin()`) |
| :--- | :--- | :--- | :--- |
| `program_settings` | `SELECT` only | `SELECT` only | `SELECT`, `UPDATE` |
| `tracks` | `SELECT` only | `SELECT` only | `SELECT` |
| `user_roles` | None | `SELECT` own row (`user_id = auth.uid()`) | `SELECT` all |
| `registrations` | None (inserts via `/api/register` service role) | None | `SELECT`, `UPDATE` |
| `participants` | None | `SELECT` own row (`user_id = auth.uid()`); update password flag only via `mark_own_password_changed()` RPC | `SELECT`, `INSERT`, `UPDATE` |
| `certificates` | None | `SELECT` own row (`user_id = auth.uid()`) | `ALL` |
| `storage.objects` (`certificates`) | None | `SELECT` own folder (`{auth.uid()}/*`) | `ALL` |

## 3. Deploy the `admin-actions` Edge Function

Deploy `supabase/functions/admin-actions`:

```bash
supabase functions deploy admin-actions
```

The `admin-actions` Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` server-side to:
- Verify the caller is an authenticated admin (`user_roles.role = 'admin'`).
- Accept or reject applications idempotently.
- On acceptance: create or recover the Supabase Auth user with a temporary password, upsert `user_roles` (`participant`), insert `public.participants` (rolling back any newly created Auth user if profile creation fails), and mark `registrations.status = 'accepted'` and `participant_account_created = true`.

## 4. Configure Authentication Redirect URLs

In **Supabase Dashboard → Authentication → URL Configuration**:
- **Site URL**: `https://your-production-domain.vercel.app`
- **Redirect URLs**:
  - `https://your-production-domain.vercel.app/dashboard`
  - `https://your-production-domain.vercel.app/login`
  - `http://localhost:3000/dashboard`

## 5. Bootstrap the First Admin Account

There are no hardcoded admin accounts in the codebase. To create the first administrator:

1. In **Supabase Dashboard → Authentication → Users**, click **Add User → Create New User** and enter the administrator's email and strong password (with **Auto Confirm User** checked).
2. Copy the created user's `User UID`.
3. In **Supabase Dashboard → SQL Editor**, run:
   ```sql
   insert into public.user_roles (user_id, role)
   values ('PASTE_ADMIN_USER_UUID_HERE', 'admin')
   on conflict (user_id, role) do nothing;
   ```
4. Sign in at `/login` using those credentials to access `/admin`.
