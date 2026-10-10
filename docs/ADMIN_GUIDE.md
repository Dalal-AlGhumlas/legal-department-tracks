# Internal Administration Guide (`/admin`)

## 1. Accessing the Admin Panel

- Navigate directly to `/admin` (this route is intentionally omitted from public navigation).
- Sign in using an account authorized with the `admin` role in `public.user_roles`.
- Participants and unauthenticated visitors are blocked from accessing `/admin` both in the UI and via Supabase Row Level Security (RLS).

## 2. Reviewing Applications & Creating Participant Accounts

1. Open the **طلبات التسجيل (Applications)** tab.
2. Search by name, email, university ID, or mobile number, or filter by track (`التقاضي`, `العقود`, `التشريعات`, `الحوكمة والامتثال`) and status (`pending`, `accepted`, `rejected`).
3. Click **عرض التفاصيل (Review Details)** on any application to inspect:
   - Personal and academic details
   - Selected track
   - Track motivation response
   - Previous legal training details
   - Current knowledge level
   - Confirmed attendance commitment
4. Click **قبول المتقدم وإنشاء حساب مشارك (Accept & Create Participant Account)**:
   - Updates the application status to `accepted`.
   - Creates the participant's authentication account and `public.participants` profile linked to their selected track (or an explicit administrative override track if adjusted).
   - Displays a one-time generated temporary password so the committee can send the login credentials to the accepted participant. Plaintext passwords are never stored in the database.

## 3. Issuing & Uploading Private Certificates

1. Open the **المشاركون المقبولون والشهادات (Accepted Participants & Certificates)** tab.
2. For any accepted participant:
   - Click **رفع / إسناد شهادة** to issue a certificate or click **PDF / PNG** to upload a custom certificate file to the private `certificates` storage bucket (`certificates/{user_id}/...`).
3. Once issued, the participant will see **عرض الشهادة (View Certificate)** and **تحميل الشهادة (Download Certificate)** inside their `/dashboard`.
4. Private storage RLS guarantees that Participant A can never access Participant B's certificate.
