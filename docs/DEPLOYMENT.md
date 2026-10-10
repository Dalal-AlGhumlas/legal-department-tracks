# Vercel Deployment Guide

## 1. Push Repository to GitHub

Ensure `.env` is excluded via `.gitignore` and never committed. Commit and push the repository to GitHub:

```bash
git add .
git commit -m "Replace demo backend with production Supabase integration"
git push origin main
```

## 2. Import Project into Vercel

1. Sign in to [Vercel](https://vercel.com) and choose **Add New → Project**.
2. Select your GitHub repository.
3. Build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

## 3. Configure Environment Variables in Vercel

In **Vercel Project Settings → Environment Variables**, configure:

| Variable Name | Scope / Exposure | Required | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Browser & Server | Yes | Supabase project URL (`https://<project-ref>.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser & Server | Yes | Supabase anonymous/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only** | Yes | Used by `/api/register` serverless function to read `program_settings` and insert into `public.registrations`. **Never** prefix with `VITE_`. |
| `REGISTRATION_OPEN_AT` | Server-Only | Optional | Fallback ISO 8601 opening timestamp if `public.program_settings` is absent |
| `REGISTRATION_CLOSE_AT` | Server-Only | Optional | Fallback ISO 8601 closing timestamp if `public.program_settings` is absent |

## 4. Routing & Serverless Functions

`vercel.json` routes `/api/*` requests to the Vercel Serverless Functions in `api/` (`api/register.ts`) and rewrites all frontend navigation routes (`/discover`, `/tracks/*`, `/register`, `/login`, `/dashboard`, `/admin`) to `/index.html` so direct refreshes work in production.
