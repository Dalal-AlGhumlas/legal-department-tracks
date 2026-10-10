# Vercel Deployment Guide

## 1. Push Repository to GitHub

Commit your repository to GitHub. Ensure `.env` is ignored by `.gitignore` and never committed.

## 2. Import Project into Vercel

1. Sign in to [Vercel](https://vercel.com) and click **Add New → Project**.
2. Import your GitHub repository.
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`

## 3. Configure Environment Variables in Vercel

Add the following variables in **Vercel Project Settings → Environment Variables**:

| Variable | Exposure | Description |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Public (Browser) | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public (Browser) | Your Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only** | Used exclusively by server-side functions (`api/*`). **Never** prefix with `VITE_`. |
| `VITE_REGISTRATION_OPEN_AT` | Public (Optional) | ISO 8601 timestamp for registration opening |
| `VITE_REGISTRATION_CLOSE_AT` | Public (Optional) | ISO 8601 timestamp for registration closing |

## 4. Direct Route Refresh & SPA Routing

`vercel.json` is preconfigured to route `/api/*` requests to serverless functions and rewrite all client routes (`/discover`, `/tracks/*`, `/register`, `/login`, `/dashboard`, `/admin`) to `/index.html` so direct browser refreshes work seamlessly.
