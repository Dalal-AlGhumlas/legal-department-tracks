# مسارات الإدارات القانونية | Legal Department Tracks

A bilingual (Arabic / English) web application built for the **"مسارات الإدارات القانونية" (Legal Department Tracks)** training program organized by the **Law Club at King Saud University (نادي القانون بجامعة الملك سعود)**.

---

## Overview

- **Public Program Website**: Editorial presentation of the official Masar identity, program structure, execution mechanism, three-day schedule (October 12–14), Law Club success partners, and FAQ.
- **Four Specialized Legal Track Pages**:
  - `/tracks/litigation` — التقاضي (Litigation)
  - `/tracks/contracts` — العقود (Contracts)
  - `/tracks/legislation` — التشريعات (Legislation)
  - `/tracks/governance-compliance` — الحوكمة والامتثال (Governance & Compliance)
- **Discover Your Track (`/discover`)**: Deterministic 5-question interest-based recommendation experience that preselects the suggested track upon proceeding to registration without making it binding.
- **Public Registration (`/register`)**: Collects the approved applicant fields, single-track selection, motivation, conditional previous legal training details, knowledge level, and mandatory attendance commitment. Enforces opening and closing deadlines both client-side and server-side.
- **Participant Portal (`/login` & `/dashboard`)**: Protected portal exclusively for accepted participants (no public signup) displaying participant profile, assigned track, schedule, and private certificate viewing/downloading.
- **Internal Administration (`/admin`)**: Role-protected administrative interface for searching/filtering applications, reviewing and accepting/rejecting applicants, automatically provisioning participant accounts on acceptance, and issuing/uploading private certificates.

---

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Typography**: Google Fonts `Amiri` (400, 700) for Arabic (`RTL`) and `Inter` (400, 500, 600, 700) for English (`LTR`)
- **Backend & Database**: Supabase PostgreSQL, Supabase Auth, Supabase Storage (`certificates` private bucket), Supabase Edge Functions, and Vercel Serverless Functions (`api/register.ts`)
- **Hosting**: Vercel

---

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

---

## Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Supabase Setup & RLS Guide](./docs/SUPABASE_SETUP.md)
- [Vercel Deployment Guide](./docs/DEPLOYMENT.md)
- [Internal Admin Guide](./docs/ADMIN_GUIDE.md)
