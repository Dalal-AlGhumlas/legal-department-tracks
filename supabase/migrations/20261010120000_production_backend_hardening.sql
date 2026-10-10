-- =============================================================================
-- مسارات الإدارات القانونية | Legal Department Tracks
-- Migration 02: Production Backend Hardening, Server-Only Registration Gateway,
-- Narrow Participant Password-Flag RPC & Data Integrity Constraints
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ADD participant_account_created TO public.registrations & INDEXES
-- -----------------------------------------------------------------------------
alter table public.registrations
  add column if not exists participant_account_created boolean not null default false;

-- Backfill participant_account_created for any existing accepted registrations that have a participant row
update public.registrations r
   set participant_account_created = true
 where exists (
   select 1
     from public.participants p
    where p.registration_id = r.id
 );

-- Case-insensitive email uniqueness and lookup indexes
create unique index if not exists idx_registrations_email_lower
  on public.registrations (lower(email));

create unique index if not exists idx_participants_email_lower
  on public.participants (lower(email));

create index if not exists idx_registrations_status_track_created
  on public.registrations (status, selected_track_id, created_at desc);

create index if not exists idx_participants_user_id
  on public.participants (user_id);

create index if not exists idx_certificates_participant_id
  on public.certificates (participant_id);

create index if not exists idx_certificates_user_id
  on public.certificates (user_id);

create index if not exists idx_user_roles_user_id
  on public.user_roles (user_id);

-- -----------------------------------------------------------------------------
-- 2. LOCK DOWN public.registrations RLS (SERVER-SIDE API IS AUTHORITATIVE)
-- -----------------------------------------------------------------------------
-- Remove anonymous/public direct browser INSERT policy on registrations.
-- All public registrations must pass through POST /api/register using service_role.
-- The BEFORE INSERT trigger `trg_enforce_registration_window` remains active as defense-in-depth.
drop policy if exists "Public can submit registration while open" on public.registrations;

revoke insert, update, delete on public.registrations from anon;
revoke insert, delete on public.registrations from authenticated;

-- -----------------------------------------------------------------------------
-- 3. LOCK DOWN public.participants UPDATE RLS & ADD NARROW RPC
-- -----------------------------------------------------------------------------
-- Remove general participant UPDATE policy so participants cannot modify
-- status, selected_track_id, email, university_id, registration_id, or user_id.
drop policy if exists "Participants can update own password flag" on public.participants;

-- Allow only admins to directly UPDATE participant rows
drop policy if exists "Admins can update participants" on public.participants;
create policy "Admins can update participants"
  on public.participants for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can insert participants" on public.participants;
create policy "Admins can insert participants"
  on public.participants for insert
  to authenticated
  with check (public.is_admin());

-- Narrowly scoped SECURITY DEFINER RPC for a participant to mark their own
-- temporary password as changed after calling supabase.auth.updateUser(...)
create or replace function public.mark_own_password_changed()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_count int;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  update public.participants
     set must_change_password = false,
         updated_at = now()
   where user_id = auth.uid();

  get diagnostics v_updated_count = row_count;
  return v_updated_count > 0;
end;
$$;

revoke all on function public.mark_own_password_changed() from public;
revoke all on function public.mark_own_password_changed() from anon;
grant execute on function public.mark_own_password_changed() to authenticated;
