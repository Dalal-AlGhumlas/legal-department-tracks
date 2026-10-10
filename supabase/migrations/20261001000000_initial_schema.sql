-- =============================================================================
-- مسارات الإدارات القانونية | Legal Department Tracks
-- Official Supabase PostgreSQL Schema, Triggers, Storage & Row Level Security
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. PROGRAM SETTINGS (Centralized Registration Window)
-- -----------------------------------------------------------------------------
create table if not exists public.program_settings (
  id text primary key default 'default',
  registration_open_at timestamptz not null default '2026-09-25T00:00:00+03:00',
  registration_close_at timestamptz not null default '2026-10-11T23:59:59+03:00',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.program_settings (id, registration_open_at, registration_close_at)
values ('default', '2026-09-25T00:00:00+03:00', '2026-10-11T23:59:59+03:00')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 2. TRACKS (Four Official Legal Department Tracks)
-- -----------------------------------------------------------------------------
create table if not exists public.tracks (
  id text primary key,
  slug text unique not null check (slug in ('litigation', 'contracts', 'legislation', 'governance-compliance')),
  name_ar text not null,
  name_en text not null,
  description_ar text not null,
  description_en text not null,
  image_url text not null,
  sort_order int not null default 1,
  created_at timestamptz not null default now()
);

insert into public.tracks (id, slug, name_ar, name_en, description_ar, description_en, image_url, sort_order)
values
  (
    'litigation',
    'litigation',
    'التقاضي',
    'Litigation',
    'يمثل دور القسم في تمثيل المنشأة أمام الجهات القضائية وشبه القضائية، ومتابعة الدعاوى والمذكرات، وإدارة التعامل مع مكاتب المحاماة الخارجية.',
    'Represents the department’s role in representing the organization before judicial and quasi-judicial bodies, following up on lawsuits and legal briefs, and managing engagements with external law firms.',
    '/images/tracks/litigation.png',
    1
  ),
  (
    'contracts',
    'contracts',
    'العقود',
    'Contracts',
    'يتناول دورة حياة العقد داخل المنشأة من التفاوض، الصياغة، المراجعة، والتوقيع إلى متابعة التنفيذ وتفادي النزاعات.',
    'Covers the contract lifecycle within the organization from negotiation, drafting, review, and execution to implementation follow-up and dispute prevention.',
    '/images/tracks/contracts.png',
    2
  ),
  (
    'legislation',
    'legislation',
    'التشريعات',
    'Legislation',
    'يتناول متابعة الأنظمة واللوائح ذات الصلة بنشاط المنشأة، رصد المستجدات، وإعداد الأنظمة واللوائح والسياسات الداخلية.',
    'Focuses on monitoring laws and regulations relevant to the organization’s operations, tracking regulatory updates, and drafting internal regulations, bylaws, and policies.',
    '/images/tracks/legislation.png',
    3
  ),
  (
    'governance-compliance',
    'governance-compliance',
    'الحوكمة والامتثال',
    'Governance & Compliance',
    'يتناول ضمان التزام المنشأة بالمتطلبات النظامية والرقابية، ومتابعة العلاقة مع الجهات الإشرافية، وأعمال مجالس الإدارة ولجانها.',
    'Covers ensuring organizational compliance with statutory and regulatory requirements, managing relationships with supervisory authorities, and supporting board and committee operations.',
    '/images/tracks/governance-compliance.png',
    4
  )
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 3. USER ROLES (Role-Based Authorization for Admin & Participant)
-- -----------------------------------------------------------------------------
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'participant')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- Security definer helper to check admin role without recursive RLS
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- 4. REGISTRATIONS (Public Applications — Exactly One Selected Track)
-- -----------------------------------------------------------------------------
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) >= 2),
  email text not null unique check (position('@' in email) > 1),
  phone text not null,
  university text not null,
  major text not null,
  academic_level text not null,
  university_id text not null,
  selected_track_id text not null references public.tracks(id),
  track_motivation text not null check (char_length(trim(track_motivation)) > 0 and char_length(track_motivation) <= 600),
  has_previous_legal_training boolean not null default false,
  previous_training_details text,
  legal_department_knowledge_level text not null check (legal_department_knowledge_level in ('متقدم', 'متوسط', 'مبتدئ')),
  attendance_commitment_confirmed boolean not null check (attendance_commitment_confirmed = true),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  constraint chk_previous_training_details check (
    (has_previous_legal_training = false) or
    (has_previous_legal_training = true and previous_training_details is not null and char_length(trim(previous_training_details)) > 0)
  )
);

-- Server-side trigger enforcing the registration deadline on INSERT
create or replace function public.enforce_registration_window()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_open_at timestamptz;
  v_close_at timestamptz;
begin
  select registration_open_at, registration_close_at
    into v_open_at, v_close_at
    from public.program_settings
   where id = 'default';

  if v_open_at is not null and now() < v_open_at then
    raise exception 'REGISTRATION_NOT_OPEN_YET';
  end if;

  if v_close_at is not null and now() > v_close_at then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  -- Force initial status to pending on public insert
  new.status := 'pending';
  new.reviewed_at := null;
  new.reviewed_by := null;
  return new;
end;
$$;

drop trigger if exists trg_enforce_registration_window on public.registrations;
create trigger trg_enforce_registration_window
before insert on public.registrations
for each row
execute function public.enforce_registration_window();

-- -----------------------------------------------------------------------------
-- 5. PARTICIPANTS (Accepted Participants Only — Created Server-Side)
-- -----------------------------------------------------------------------------
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  registration_id uuid not null unique references public.registrations(id) on delete restrict,
  full_name text not null,
  email text not null unique,
  phone text not null,
  university text not null,
  major text not null,
  academic_level text not null,
  university_id text not null,
  selected_track_id text not null references public.tracks(id),
  status text not null default 'accepted' check (status = 'accepted'),
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 6. CERTIFICATES (Metadata for Private Supabase Storage Objects)
-- -----------------------------------------------------------------------------
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null unique references public.participants(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  issued_at timestamptz not null default now(),
  issued_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------
alter table public.program_settings enable row level security;
alter table public.tracks enable row level security;
alter table public.user_roles enable row level security;
alter table public.registrations enable row level security;
alter table public.participants enable row level security;
alter table public.certificates enable row level security;

-- program_settings: public can read, only admin can update
create policy "Public can read program settings"
  on public.program_settings for select
  using (true);

create policy "Admins can update program settings"
  on public.program_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- tracks: public can read
create policy "Public can read tracks"
  on public.tracks for select
  using (true);

-- user_roles: users can read their own role, admins can read all
create policy "Users can read own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- registrations:
-- Public may INSERT only while registration window is open
create policy "Public can submit registration while open"
  on public.registrations for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and exists (
      select 1 from public.program_settings ps
      where ps.id = 'default'
        and now() >= ps.registration_open_at
        and now() <= ps.registration_close_at
    )
  );

-- Only admins may list or update registrations
create policy "Admins can read all registrations"
  on public.registrations for select
  to authenticated
  using (public.is_admin());

create policy "Admins can update registrations"
  on public.registrations for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- participants:
-- Participant can read ONLY their own profile; Admins can read/manage all
create policy "Participants can read own profile"
  on public.participants for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Participants can update own password flag"
  on public.participants for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- certificates:
-- Participant can read ONLY their own certificate metadata; Admins can read/write all
create policy "Participants can read own certificate metadata"
  on public.certificates for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Admins can manage certificates"
  on public.certificates for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 8. PRIVATE SUPABASE STORAGE BUCKET FOR CERTIFICATES
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do update set public = false;

-- Storage RLS: Participant A can ONLY access files inside folder `{auth.uid()}/...`
create policy "Participants can read own private certificate file"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'certificates'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

create policy "Admins can upload and manage certificate files"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'certificates'
    and public.is_admin()
  )
  with check (
    bucket_id = 'certificates'
    and public.is_admin()
  );
