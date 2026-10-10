# Architecture & Production Data Flow

## 1. Directory Structure

```text
src/
  components/         # Reusable UI components (Navbar, Footer, MasarLogo, TrackCard, TrackImage, PrimaryProgramCta)
  config/             # Single source of truth for tracks, program schedule, and Discover quiz
  i18n/               # Strict Arabic (RTL) and English (LTR) language separation context & dictionary
  integrations/
    supabase/         # Browser-safe Supabase client initialization
  layouts/            # MainLayout wrapping public and portal routes
  pages/              # Route-level views (HomePage, TrackDetailPage, DiscoverPage, RegisterPage, LoginPage, DashboardPage, AdminPage)
  services/           # Supabase data store, auth session handling, and SVG certificate File builder
  types/              # Shared TypeScript interfaces aligned with PostgreSQL tables
supabase/
  migrations/         # PostgreSQL schema, triggers, RPCs, storage bucket, and RLS policies
  functions/          # Supabase Edge Function (admin-actions) using SUPABASE_SERVICE_ROLE_KEY
api/
  register.ts         # Authoritative Vercel serverless registration endpoint
docs/                 # Technical & operational documentation
```

## 2. Single Source of Truth (Supabase)

All production application data resides in Supabase:
- **No Demo or Local Fallback Data**: The application does not store registrations, participants, certificates, or sessions in `localStorage`. Only the UI language preference (`ar` / `en`) is persisted in `localStorage`.
- **Data Loading Functions** (`src/services/programStore.tsx`):
  - `loadProgramSettings()`: Reads `public.program_settings` (`id = 'default'`).
  - `loadAdminRegistrations()`: Loads `public.registrations` for authenticated admins.
  - `loadParticipants()`: Loads `public.participants` for authenticated admins.
  - `loadParticipantProfile(userId)`: Loads the authenticated participant's own profile and certificate metadata.
  - `loadCertificates()`: Loads `public.certificates` metadata.
  - `refreshAdminData()`: Refreshes settings, registrations, participants, and certificates concurrently.

## 3. Authoritative Registration Architecture (`POST /api/register`)

1. The browser submits the registration form exclusively via `POST /api/register`.
2. The browser never inserts directly into `public.registrations` and never sends client-controlled `openAt`/`closeAt` timestamps.
3. `api/register.ts`:
   - Validates and normalizes all required fields (`full_name`, lowercase `email`, Saudi mobile `phone`, `university`, `major`, `academic_level`, `university_id`, valid `selected_track_id`, `track_motivation`, `has_previous_legal_training`, conditional `previous_training_details`, `legal_department_knowledge_level`, and `attendance_commitment_confirmed = true`).
   - Reads the authoritative registration window from `public.program_settings` in Supabase using a server-only client (`SUPABASE_SERVICE_ROLE_KEY`).
   - Rejects submissions outside the active window (`REGISTRATION_NOT_OPEN_YET` / `REGISTRATION_CLOSED`).
   - Inserts the application with `status = 'pending'` and `participant_account_created = false`.
   - Returns `{ ok: true, id: registrationId }` or a safe mapped error code (`EMAIL_DUPLICATE`, `INVALID_REGISTRATION_DATA`).
4. As defense-in-depth, the PostgreSQL trigger `trg_enforce_registration_window` on `public.registrations` also enforces the deadline inside the database.

## 4. Authentication & Strict Role Verification

- On startup, `ProgramStoreProvider` calls `supabase.auth.getSession()` and subscribes to `supabase.auth.onAuthStateChange(...)`.
- For any authenticated user, the store queries `public.user_roles`:
  - **`admin`**: Grants access to `/admin` and triggers `refreshAdminData()`.
  - **`participant`**: Verifies that a matching row in `public.participants` (`user_id = auth.uid()`) exists before granting access to `/dashboard`.
  - If an authenticated user has no valid role or lacks an active participant profile, access is denied and the session is signed out cleanly.

## 5. Safe `must_change_password` Handling

- Participants do not have general `UPDATE` privileges on `public.participants`.
- When a participant updates their temporary password via `supabase.auth.updateUser({ password })`, the frontend invokes the `SECURITY DEFINER` PostgreSQL RPC `public.mark_own_password_changed()`, which updates only `must_change_password = false` and `updated_at = now()` for `user_id = auth.uid()`.

## 6. Private Certificates Storage & Signed URLs

- Certificate files (both admin-uploaded PDFs/images and auto-generated official SVG certificates converted to `File` blobs) are uploaded to the private Supabase Storage bucket `certificates` under `{participant.user_id}/certificate-...`.
- Only certificate metadata (`id`, `participant_id`, `user_id`, `storage_path`, `file_name`, `issued_at`, `issued_by`) is stored in `public.certificates`.
- When viewing or downloading a certificate, a short-lived signed URL (300 seconds) is generated at runtime from the private bucket after verifying ownership.
