# Deployment Guide: VTU Adda Project Hub

This document defines the exact, ordered deployment and rollback procedures for `projects.vtuadda.com`.

---

## 1. Environments & Infrastructure

| Resource | Development / Preview | Production |
| :--- | :--- | :--- |
| **Site URL** | `http://localhost:3000` / Vercel Preview URL | `https://projects.vtuadda.com` |
| **Hosting Platform** | Vercel (Preview Deployments) | Vercel (Production) |
| **Compute Region** | Mumbai (`bom1`) | Mumbai (`bom1`) |
| **Database & Auth** | Supabase Project: `vtuadda-projects-dev` | Supabase Project: `vtuadda-projects-prod` |
| **Email Service** | Resend (Sandbox / Dev) | Resend (Verified Domain `projects.vtuadda.com`) |
| **Google OAuth** | Redirect URI: `.../auth/v1/callback` (Dev) | Redirect URI: `.../auth/v1/callback` (Prod) |

---

## 2. Environment Variables Specification

Never store secrets in Git or shell histories. Set these in the Vercel Dashboard under **Settings > Environment Variables**.

| Variable Name | Required Scope | Sensitivity | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | Production & Preview | Plain | `https://projects.vtuadda.com` for Production, Vercel URL for Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | Production & Preview | Plain | Public Supabase API URL (`https://<project-ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production & Preview | Plain | Supabase Anon Key (Safe in browser, guarded by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Production & Preview | **Secret** | Supabase Service Role Key (Bypasses RLS, Server-only) |
| `RESEND_API_KEY` | Production & Preview | **Secret** | Resend API key for transactional emails |
| `EMAIL_FROM` | Production & Preview | Plain | Sender identity (e.g., `VTU Adda Projects <no-reply@projects.vtuadda.com>`) |
| `CRON_SECRET` | Production & Preview | **Secret** | Random 32+ char token protecting `/api/cron/*` endpoints |
| `IP_HASH_SALT` | Production & Preview | **Secret** | Random 32+ char salt used to hash client IP addresses |
| `ALLOW_INDEXING` | Production **Only** | Plain | Set to `"true"` ONLY when ready for public search indexing |

> [!IMPORTANT]
> - Never reuse `CRON_SECRET` or `IP_HASH_SALT` between Development and Production environments.
> - `ALLOW_INDEXING` must remain unset or `"false"` until after the final launch audit.
> - Preview deployments must strictly use `vtuadda-projects-dev` keys. Never connect Preview to `vtuadda-projects-prod`.

---

## 3. Database Deployment & Migration Steps

All database schema, RLS policies, and triggers are stored under `supabase/migrations/`.

1. **Verify Supabase Link**:
   Before pushing schema migrations, verify that the CLI is linked to the intended project:
   ```bash
   supabase projects list
   supabase link --project-ref <prod-project-ref>
   ```
   *Caution: Always confirm the linked reference ID to avoid pushing to the wrong database.*

2. **Push Migrations**:
   ```bash
   supabase db push
   ```

3. **Verify Row Level Security (RLS)**:
   Run the RLS verification suite against the project:
   ```bash
   npm run test:rls
   ```

4. **Production Auth Configuration**:
   In the Supabase Production Dashboard:
   - **Authentication > Providers > Email**: Enabled. Set Email Confirmation template token to `{{ .Token }}`.
   - **Authentication > Multi-Factor (MFA)**: TOTP enabled.
   - **Authentication > URL Configuration**:
     - Site URL: `https://projects.vtuadda.com`
     - Redirect URLs: `https://projects.vtuadda.com/auth/callback`
   - **Authentication > SMTP Settings**:
     - Host: `smtp.resend.com`
     - Port: `465` (or `587`)
     - User: `resend`
     - Pass: `<RESEND_API_KEY>`
     - Sender Email: `no-reply@projects.vtuadda.com`

---

## 4. Google OAuth Production Setup

1. In the **Google Cloud Console** under Credentials:
   - Add Authorised JavaScript Origins: `https://projects.vtuadda.com`
   - Add Authorised Redirect URIs: `https://<prod-project-ref>.supabase.co/auth/v1/callback`
2. In **Google Cloud Console > OAuth Consent Screen**:
   - Add App Domain links:
     - Application home: `https://projects.vtuadda.com`
     - Privacy policy: `https://projects.vtuadda.com/privacy`
     - Terms of service: `https://projects.vtuadda.com/terms`
   - Publish the OAuth Consent Screen from "Testing" to "In production".
3. In **Supabase Production > Authentication > Providers > Google**:
   - Enable Google provider with your Google Client ID and Client Secret.

---

## 5. Domain, DNS & Vercel Setup

1. **Vercel Project Setup**:
   - Import the GitHub repository `vtuadda-projects`.
   - Framework preset: `Next.js`.
   - Node.js Version: 20.x or 22.x LTS.
   - Function Region: `bom1` (Mumbai, India).
2. **Domain Configuration**:
   - In Vercel, go to **Settings > Domains** and add `projects.vtuadda.com`.
   - At your DNS manager for `vtuadda.com`, create the required DNS record:
     - **Type**: `CNAME`
     - **Name**: `projects`
     - **Target**: `cname.vercel-dns.com`
     - **Proxy status**: DNS Only (if using Cloudflare) until certificate issuance completes.
3. **Scheduled Background Jobs (Vercel Crons)**:
   Configured in `vercel.json`:
   - `/api/cron/expire-orders`: Every hour (`0 * * * *`)
   - `/api/cron/session-reminders`: Every hour (`0 * * * *`)
   - `/api/cron/purge-proofs`: Daily at 02:00 UTC (`0 2 * * *`)
   *Note: Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` with each scheduled request when `CRON_SECRET` is defined.*

---

## 6. Indexing & Security Advisory

> [!NOTE]
> `robots.txt` is an advisory protocol for well-behaved web crawlers and search engine spiders. **`robots.txt` is NOT a security control.**
> Sensitive, authenticated, or internal endpoints (`/admin`, `/builder`, `/account`, `/checkout`, `/api`) are protected by server-side authorization checks, middleware redirects, and Supabase Row Level Security (RLS), not by robots exclusion.

---

## 7. Post-Deployment Verification

Immediately after production deployment:
1. Run the live verification suite:
   ```bash
   npm run preflight -- --launch --url https://projects.vtuadda.com
   ```
2. Test end-to-end user journeys:
   - Sign in via Email OTP.
   - Sign in via Google OAuth.
   - Verify MFA enrolment on `/admin/mfa`.
   - Complete a test order checkout and verify email delivery.
3. Test cron endpoints reject unauthenticated calls:
   ```bash
   curl -I https://projects.vtuadda.com/api/cron/expire-orders
   # Must return 401 Unauthorized
   ```

---

## 8. Rollback Procedures

If an incident occurs in production:
1. **Instant Application Rollback**:
   In the Vercel Dashboard under **Deployments**:
   - Locate the previous stable production deployment.
   - Click the three-dots menu and select **Rollback to this deployment**.
   - Deployment rollback takes effect within seconds worldwide.
2. **Database Schema Rollback**:
   - If an issue is tied to a migration, create a corrective forward-migration script (e.g., `20261013000008_revert_xyz.sql`) and push via `supabase db push`.
   - Do not perform destructive table drops while traffic is active.
