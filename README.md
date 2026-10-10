# مسارات الإدارات القانونية | Legal Department Tracks

A production-ready bilingual (Arabic / English) web application built for the **"مسارات الإدارات القانونية" (Legal Department Tracks)** training program organized by the **Law Club at King Saud University (نادي القانون بجامعة الملك سعود)**.

---

## Core Capabilities

- **Public Program Website**: Editorial presentation of the official Masar identity, program structure, execution mechanism, three-day schedule (October 12–14), Law Club success partners, and FAQ.
- **Four Specialized Legal Track Pages**:
  - `/tracks/litigation` — التقاضي (Litigation)
  - `/tracks/contracts` — العقود (Contracts)
  - `/tracks/legislation` — التشريعات (Legislation)
  - `/tracks/governance-compliance` — الحوكمة والامتثال (Governance & Compliance)
- **Discover Your Track (`/discover`)**: Deterministic 5-question interest-based recommendation experience that preselects the suggested track upon proceeding to registration without making it binding.
- **Authoritative Server-Side Registration (`/register` → `POST /api/register`)**: Collects the approved applicant fields, single-track selection, motivation, conditional previous legal training details, knowledge level, and mandatory attendance commitment. Enforces opening and closing deadlines via the server-side API and PostgreSQL trigger.
- **Participant Portal (`/login` & `/dashboard`)**: Protected portal exclusively for accepted participants (no public signup) authenticated via Supabase Auth, displaying the participant's live profile, assigned track, password update flow (`mark_own_password_changed` RPC), and private certificate access.
- **Internal Administration (`/admin`)**: Role-protected administrative interface connected to Supabase for searching/filtering applications, reviewing and accepting/rejecting applicants via the `admin-actions` Edge Function, and issuing/uploading private certificates to Supabase Storage.

---

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Typography**: Google Fonts `Amiri` (400, 700) for Arabic (`RTL`) and `Inter` (400, 500, 600, 700) for English (`LTR`)
- **Backend & Database**: Supabase PostgreSQL, Supabase Auth, Supabase Storage (`certificates` private bucket), Supabase Edge Functions (`admin-actions`), and Vercel Serverless Functions (`api/register.ts`)
- **Hosting**: Vercel

---

## Required Environment Variables

Create a `.env` file locally (or configure in Vercel Project Settings) based on `.env.example`:

```env
# Public (Browser-safe)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-or-publishable-key

# Server-Only (NEVER expose to browser or prefix with VITE_)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Optional Server-Only Registration Window Fallbacks
REGISTRATION_OPEN_AT=2026-09-25T00:00:00+03:00
REGISTRATION_CLOSE_AT=2026-10-11T23:59:59+03:00
```

---

## Local Development & Verification

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run type checking:
   ```bash
   npm run lint
   ```
3. Run production build:
   ```bash
   npm run build
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## Documentation

- [Architecture & Data Flow](./docs/ARCHITECTURE.md)
- [Supabase Setup, Migrations & RLS](./docs/SUPABASE_SETUP.md)
- [Vercel Deployment Guide](./docs/DEPLOYMENT.md)
- [Internal Admin & Bootstrap Guide](./docs/ADMIN_GUIDE.md)
