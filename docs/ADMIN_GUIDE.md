# Internal Administration Guide (`/admin`)

## 1. Bootstrapping & Signing In as an Administrator

1. Ensure your Supabase account has a row in `public.user_roles` with `role = 'admin'` (see [Supabase Setup Guide](./SUPABASE_SETUP.md#5-bootstrap-the-first-admin-account)).
2. Sign in at `/login` using your administrator email and password.
3. Upon login, you are automatically routed to `/admin` and live data (`registrations`, `participants`, `certificates`, and `program_settings`) is loaded from Supabase.

## 2. Reviewing Applications & Provisioning Participant Accounts

1. Under the **طلبات التسجيل (Applications)** tab:
   - Search by applicant name, email, university ID, or mobile number.
   - Filter by status (`pending`, `accepted`, `rejected`) or by track (`litigation`, `contracts`, `legislation`, `governance-compliance`).
2. Click **عرض التفاصيل (Review Details)** on an application:
   - Review the applicant's academic information, selected track, motivation statement, previous legal training details, and current knowledge level.
   - Optionally adjust the assigned track if required for administrative reasons.
3. Click **قبول المتقدم وإنشاء حساب مشارك (Accept & Create Participant Account)**:
   - Invokes the `admin-actions` Supabase Edge Function.
   - Provisions the applicant's Supabase Auth account, assigns the `participant` role in `public.user_roles`, creates their `public.participants` profile with `must_change_password = true`, and updates `public.registrations` (`status = 'accepted'`, `participant_account_created = true`).
   - Displays the one-time generated temporary password in the modal so it can be sent to the accepted participant. Plaintext passwords are never stored in the database.
   - Automatically refreshes the live registrations and participants lists from Supabase.
   - The acceptance operation is idempotent: repeating acceptance for an already-accepted applicant safely updates their track without creating duplicate accounts.

## 3. Issuing & Uploading Private Certificates

1. Open the **المشاركون المقبولون والشهادات (Accepted Participants & Certificates)** tab.
2. For any accepted participant:
   - Click **رفع / إسناد شهادة** to automatically generate an official Masar SVG certificate file, upload it to the private `certificates` Supabase Storage bucket at `{user_id}/certificate-...svg`, and record its metadata in `public.certificates`.
   - Or click **PDF / PNG** to upload a custom PDF/image certificate file to `{user_id}/certificate-...` in the private `certificates` bucket.
3. Participants can immediately view or download their own certificate from `/dashboard` via a short-lived signed URL.

## 4. Managing the Registration Window

1. Open the **إعدادات فترة التسجيل (Registration Window Settings)** tab.
2. Set the opening and closing timestamps (opening must precede closing) and click **حفظ إعدادات التسجيل**.
3. This updates `public.program_settings` in Supabase and immediately updates both the public UI state (`التسجيل سيفتح قريبًا` / `التسجيل` / `دخول المشاركين`) and the server-side deadline enforcement in `/api/register` and PostgreSQL.
