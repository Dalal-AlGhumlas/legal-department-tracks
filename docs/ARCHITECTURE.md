# Architecture Overview

## 1. Directory Structure

```text
src/
  components/         # Reusable UI components (Navbar, Footer, MasarLogo, TrackCard, TrackImage, PrimaryProgramCta)
  config/             # Single source of truth for tracks, program schedule/dates, and Discover quiz
  i18n/               # Strict Arabic (RTL) and English (LTR) language separation context & dictionary
  integrations/
    supabase/         # Browser-safe Supabase client initialization
  layouts/            # MainLayout wrapping public and portal routes
  pages/              # Route-level views (HomePage, TrackDetailPage, DiscoverPage, RegisterPage, LoginPage, DashboardPage, AdminPage)
  services/           # Program store, auth, registration submission, admin actions, and certificate helpers
  types/              # Shared TypeScript interfaces
supabase/
  migrations/         # PostgreSQL schema, triggers, storage buckets, and Row Level Security (RLS) policies
  functions/          # Supabase Edge Functions using SUPABASE_SERVICE_ROLE_KEY
api/
  register.ts         # Vercel serverless endpoint enforcing registration deadlines server-side
docs/                 # Project documentation
```

## 2. Design System & Strict Language Separation

- **Official Masar Palette**:
  - Cream (`#ECE2CE`) & Warm Light Canvas (`#F6F1E6`, `#FAF7F0`)
  - Deep Olive (`#3C4620`) & Olive (`#4B5D16`)
  - Controlled Accents: Yellow (`#F2B635`) & Orange (`#E45C10`)
- **Typography**:
  - Arabic mode (`html[lang="ar"][dir="rtl"]`) uses **Amiri** (400 Regular, 700 Bold) loaded from Google Fonts.
  - English mode (`html[lang="en"][dir="ltr"]`) uses **Inter** (400, 500, 600, 700) loaded from Google Fonts.
- **Zero Language Mixing**:
  - Arabic mode renders exclusively Arabic strings and RTL layout.
  - English mode renders exclusively English strings and LTR layout.

## 3. Centralized Registration State

Registration opening (`REGISTRATION_OPEN_AT`) and closing (`REGISTRATION_CLOSE_AT`) timestamps are centrally managed in `src/config/program.ts` and `public.program_settings`:
- **Before opening**: Primary CTA displays `التسجيل سيفتح قريبًا` (`Registration Opens Soon`).
- **During open window**: Primary CTA displays `التسجيل` (`Register`).
- **After closing**: Primary CTA is replaced across Navbar, Hero, Track Pages, and Final CTA with `دخول المشاركين` (`Participant Login`).
- Server-side deadline checks are enforced via both `/api/register` and the PostgreSQL `trg_enforce_registration_window` trigger.
