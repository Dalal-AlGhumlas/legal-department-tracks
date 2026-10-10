# Supabase Setup Guide

## 1. Create Project & Apply Database Migration

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard (or use the Supabase CLI) and run:
   ```text
   supabase/migrations/20261001000000_initial_schema.sql
   ```
3. This migration provisions:
   - `public.program_settings` (centralized `registration_open_at` and `registration_close_at`)
   - `public.tracks` (seeded with the four official tracks: `litigation`, `contracts`, `legislation`, `governance-compliance`)
   - `public.user_roles` (`admin` and `participant` roles + `public.is_admin()` security definer function)
   - `public.registrations` (with `trg_enforce_registration_window` trigger enforcing registration deadlines server-side)
   - `public.participants` (accepted participant profiles linked to `auth.users` and `public.tracks`)
   - `public.certificates` (certificate metadata linked to `public.participants`)
   - `storage.buckets` (`certificates` private bucket with `public = false`)
   - Complete **Row Level Security (RLS)** policies on all tables and `storage.objects`.

## 2. Deploy the Privileged Admin Edge Function

Deploy `supabase/functions/admin-actions`:

```bash
supabase functions deploy admin-actions
```

Ensure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are available in the Edge Function environment (Supabase injects these automatically).

## 3. Configure Authentication URLs

In **Authentication → URL Configuration**:
- Set **Site URL** to your production Vercel domain (e.g., `https://your-domain.vercel.app`).
- Add Redirect URLs:
  - `https://your-domain.vercel.app/dashboard`
  - `https://your-domain.vercel.app/login`
  - `http://localhost:3000/dashboard`

## 4. Create First Admin User

1. In **Authentication → Users**, create an admin user (e.g., `Development.lawclub@gmail.com`).
2. Copy the user's UUID and assign the `admin` role in SQL Editor:
   ```sql
   insert into public.user_roles (user_id, role)
   values ('YOUR_ADMIN_USER_UUID', 'admin');
   ```
