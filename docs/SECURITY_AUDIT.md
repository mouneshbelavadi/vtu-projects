# VTU Adda Project Hub - Independent Security Audit & Launch Gate Report

**Date**: 2026-10-15  
**Version**: 1.0.0  
**Scope**: Production-readiness audit, authorization matrix verification, abuse penetration testing, data minimization, and launch gate validation for `projects.vtuadda.com`.  
**Auditor**: Independent Security Audit Suite (Prompt 12)  
**Status**: **PASS (Launch Gate Ready)**

---

## Executive Summary

A comprehensive automated, architectural, and penetration security audit was conducted against the entire VTU Adda Project Hub codebase. All automated checks (`npm run lint`, `npm run lint:copy`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run preflight`) pass with zero errors. All 15 unit test suites (163 tests) passed cleanly. 

Zero critical or high security vulnerabilities remain open. Production dependencies have zero known vulnerabilities (`npm audit --omit=dev`). Row Level Security (RLS) is strictly enforced on all public schema tables. All private storage files require short-lived cryptographic signed URLs (60s lifetime). Manual UPI payments utilize zero third-party webhooks and enforce idempotent state transitions.

---

## Section A: Automated Checks

| Check | Tool / Command | Result | Evidence & Output |
| :--- | :--- | :---: | :--- |
| **Clean Dependency Install** | `npm ci` | **PASS** | Dependencies verified and locked via `package-lock.json`. |
| **Linting** | `npm run lint` | **PASS** | 0 ESLint warnings or errors across the entire repository. |
| **Copy & Branding Lint** | `npm run lint:copy` | **PASS** | 0 banned hype phrases, 0 unapproved dashes, 0 emoji in copy. |
| **Type Integrity** | `npm run typecheck` | **PASS** | TypeScript 5.8 `tsc --noEmit` passed with 0 errors. |
| **Unit & Abuse Tests** | `npm run test` | **PASS** | 15 test files passed, 163 individual tests passed. |
| **Production Build** | `npm run build` | **PASS** | Next.js 15.5 production build compiled 48 static & dynamic routes cleanly. |
| **Preflight Gate** | `npm run preflight` | **PASS** | All active environment and code constraints verified. |
| **Dependency Vulnerability Scan** | `npm audit --omit=dev` | **PASS** | 0 vulnerabilities (0 low, 0 moderate, 0 high, 0 critical). |
| **Git History Secret Scan** | Custom git log pattern scan | **PASS** | Full commit history inspected; 0 leaked service keys or secrets. |
| **Sensitive Code Patterns** | Pattern scan on `src/` | **PASS** | Zero instances of `eval`, `new Function`, `innerHTML`, `localStorage`, `sessionStorage`, `console.log`, `Access-Control-Allow-Origin`, or unsanctioned `dangerouslySetInnerHTML`. |

---

## Section B: Database and Storage Security

### 1. Database Row Level Security (RLS)

All 11 public schema tables have Row Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` and `FORCE ROW LEVEL SECURITY`):

| Table | RLS Enabled | Policies Enforced | Access Rule Summary |
| :--- | :---: | :---: | :--- |
| `kits` | **YES** | Read (Public/Published), Write (Admin only) | Unpublished kits visible only to authenticated admins. |
| `orders` | **YES** | Read (Owner/Admin), Insert (Authenticated/Guest), Update (Admin only) | Students can only read their own orders; status transitions restricted to server RPCs. |
| `payment_proofs` | **YES** | Read (Owner/Admin), Insert (Owner only), Update (Admin only) | UTR redacted for public; admins only have full access. |
| `download_grants` | **YES** | Read (Owner/Admin), Update (Service RPC only) | Grants cannot be forged or updated directly by clients. |
| `custom_requests` | **YES** | Read (Owner/Builder/Admin), Write (Owner/Admin) | Students see only their own requests; builders see only assigned requests. |
| `mentoring_slots` | **YES** | Read (Public), Hold/Book (RPC only) | Concurrency handled by atomic DB locking. |
| `mentoring_bookings`| **YES** | Read (Owner/Mentor/Admin), Write (RPC only) | Video meeting links obscured until 15m prior to call. |
| `reviews` | **YES** | Read (Approved public), Write (Order owner) | Unapproved reviews hidden from public view. |
| `tickets` | **YES** | Read (Admin only), Insert (Public rate-limited) | Support tickets inaccessible to general public. |
| `audit_log` | **YES** | Read (Admin only), Insert (Server admin only) | Append-only ledger; no update or delete allowed. |
| `site_settings` | **YES** | Read (Public non-sensitive), Write (Admin only) | Internal configuration shielded from student access. |

### 2. Database Functions & Privilege Grants

- **Security Definer Functions**: All security-critical RPCs (`rate_limit_hit`, `approve_payment`, `reject_payment`, `refund_payment`, `consume_download`, `hold_slot`) have explicit `SET search_path = public, pg_temp;`.
- **Privilege Revocation**: Execution permissions on financial and state transition RPCs are explicitly revoked from `public`, `anon`, and `authenticated` roles. Calls can only be dispatched via Supabase Admin Client using `SUPABASE_SERVICE_ROLE_KEY` inside `src/server/`.

### 3. Supabase Storage Buckets

| Bucket | Public Flag | Max Size | Allowed MIME Types | Signed URL Lifetime |
| :--- | :---: | :---: | :--- | :---: |
| `project-files` | **FALSE** (private deliverable files) | 200 MB | `.zip`, `.pdf`, `.docx`, `.pptx`, `.txt` | 60 seconds |
| `payment-proofs` | **FALSE** | 3 MB | `.png`, `.jpeg`, `.webp` | 60 seconds (Admin only) |
| `custom-requests` | **FALSE** | 3 MB | `.pdf`, `.docx`, `.png`, `.jpeg`, `.txt` | 60 seconds |

---

## Section C: Authorization Matrix

The complete role-based authorization matrix is formally documented in `docs/AUTHZ_MATRIX.md` and enforced by automated testing in `tests/unit/authorization-matrix.test.ts`.

Summary across 7 privilege tiers:

1. **Signed-out Visitor**: Can only access public pages (`/`, `/projects`, `/mentoring`, `/contact`, `/legal/*`) and create new checkout sessions. Cannot access `/account/*`, `/admin/*`, `/builder/*`, or download files.
2. **Student A (Owner)**: Can view their own orders (`/account/orders/[id]`), download files granted to their purchase, view their own custom requests, and book mentoring slots.
3. **Student B (Other Student)**: Strictly blocked from viewing or downloading Student A's orders, downloads, custom requests, or licences (enforces HTTP 404/403).
4. **Builder (Assigned)**: Can access `/builder/requests/[id]` for assigned requests and upload deliverable files.
5. **Builder (Unassigned)**: Cannot view unassigned request details, client PII, or project files.
6. **Admin without MFA**: Redirected to `/admin/mfa` for step-up verification before any privileged read/write action can proceed.
7. **Admin with MFA (AAL2)**: Full administrative access to `/admin/*`, order management, payment verification, refunds, catalogue editing, and audit logs.

---

## Section D: Web and Platform Checks

1. **Security Headers**:
   - `Content-Security-Policy`: Default-src `'self'`, script-src `'self'` with nonces on dynamic routes, frame-ancestors `'none'`, object-src `'none'`.
   - `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`.
   - `X-Content-Type-Options`: `nosniff`.
   - `Referrer-Policy`: `strict-origin-when-cross-origin`.
   - `Permissions-Policy`: `camera=(), microphone=(), geolocation=(), browsing-topics=()`.
   - `Cross-Origin-Opener-Policy`: `same-origin`.
   - `X-Frame-Options`: `DENY`.
   - `X-Robots-Tag`: `noindex, nofollow` when `ALLOW_INDEXING !== 'true'` or in development/preview environments.
2. **Hidden Source Maps**: `productionBrowserSourceMaps: false` in `next.config.mjs`. Zero `.map` files exist in static production output.
3. **Hidden Server Internals**: Direct requests to `/.env`, `/.git/*`, `/supabase/config.toml`, `/package.json`, and cron routes without valid Bearer secret yield 404 or 401.
4. **CSRF & CORS**: Next.js Server Actions automatically validate origin headers. No wildcard `Access-Control-Allow-Origin` headers exist.
5. **Open Redirect Defense**: All redirects sanitized using `safeRedirectUrl()` which refuses protocol-relative (`//evil.example`) and backslash (`/\evil.example`) URL payloads.

---

## Section E: Input and Abuse Testing

1. **Cross-Site Scripting (XSS)**:
   - React JSX engine auto-escapes all dynamic content.
   - All email notifications utilize dedicated `escapeHtml()` sanitizer.
   - Custom reference uploads disallow SVG and HTML content disguises.
2. **SQL Injection**:
   - Zero raw string SQL interpolations exist in `src/server/`.
   - All database access is mediated by Supabase SDK or parameterized stored procedures.
3. **Upload Fuzzing & Magic Bytes**:
   - Real magic bytes enforced via `detectImageSignature()` and `detectProjectFileSignature()`.
   - Prohibits executable PE/ELF/Mach-O headers (`MZ`, `\x7fELF`, `0xCAFEBABE`).
   - Rejects zero-byte buffers and oversize files.
4. **Rate Limiting**:
   - Per-IP and per-user limits on `/checkout`, `/contact`, `/request`, and login routes.
5. **Race Condition Prevention**:
   - Atomic database transactions with row-level locks prevent double-approvals, double-downloads, and overselling of mentoring slots.
6. **Payment Gateway Webhooks**:
   - N/A: Pure manual UPI architecture with student screenshot and UTR submission. Zero external payment webhook routes exist.

---

## Section F: Privacy and Logging

1. **PII Redaction**:
   - Structured JSON logging (`src/server/log/`) automatically redacts email addresses, phone numbers, full UTRs, session tokens, passwords, and signed URLs.
   - UTR numbers are masked to show only the last 4 digits in student emails and non-financial logs.
2. **IP Hash Protection**:
   - Student and visitor IP addresses are hashed using SHA-256 with a 32+ character `IP_HASH_SALT`. Raw IP addresses are never persisted to the database.
3. **Data Minimization**:
   - Account profiles store only user ID and email.
   - No college, branch, semester, or scheme fields are collected during registration or checkout (only gathered voluntarily on custom request submissions).
   - Automated screenshot purge cron (`/api/cron/purge-proofs`) deletes payment screenshot images after `proof_retention_days` (default 30 days) while preserving financial ledger rows.

---

## Section G: Brand and Copy Gate

- **Tool & AI Wording**: Zero occurrences of AI tool names (*Antigravity, Lovable, Bolt, v0, Cursor, ChatGPT, Claude, Gemini, "Made with", "Built with", "Powered by"*) in user-facing copy, headers, metadata, or documentation.
- **Copy Polish**: All copy conforms to `scripts/lint-copy.ts`. No hype phrases, no unapproved dashes, no emoji.
- **Visual Design**: Strict adherence to design tokens:
  - Paper: `#FBFAF7`
  - Ink: `#17191C`
  - Subtle Border: `#DDD9D0`
  - Accent: Amber `#D97706`
  - Typography: Source Serif 4 (headings/wordmark) and clean system sans-serif.
  - Zero CSS gradients or bright purples.

---

## Section H: Launch Gate Verification (PROJECT_RULES.md Section 9)

| Gate Check | Description | Status |
| :---: | :--- | :---: |
| **Gate 1** | Automated test suite passes 100% (163 tests, 15 files) | **PASS** |
| **Gate 2** | Production build succeeds cleanly (48 routes) | **PASS** |
| **Gate 3** | Preflight script passes all code & environment checks | **PASS** |
| **Gate 4** | Legal and policy pages active with counsel review placeholder | **PASS** |
| **Gate 5** | Authentication, MFA (AAL2), and Role-Based Authorization verified | **PASS** |
| **Gate 6** | Magic byte validation active on all upload vectors | **PASS** |
| **Gate 7** | Zero PII or credentials in logs or git history | **PASS** |
| **Gate 8** | SEO robots disallow non-prod; canonical URLs and OG images ready | **PASS** |
| **Gate 9** | Deployment guide & rollback procedures documented in `docs/DEPLOY.md` | **PASS** |

---

## Section I: Findings & Mitigations

### Resolved Findings

1. **[RESOLVED - HIGH] Unified Payment Proof Buffer Validation**:
   - *Finding*: Payment screenshot validation was partly inlined in `orders/service.ts` rather than unified with the central file signature validation module.
   - *Resolution*: Exported `validatePaymentProofBuffer` from `src/server/storage/file-signatures.ts`, providing comprehensive magic byte, format, and size verification across all proof upload endpoints.
2. **[RESOLVED - MEDIUM] Dynamic Cron Secret Verification in Unit Tests**:
   - *Finding*: `expiry.ts` and `purge.ts` relied solely on static initialization of `env.CRON_SECRET`, preventing test-level environment variable overrides.
   - *Resolution*: Updated `verifyCronAuthorization` to prioritize `process.env.CRON_SECRET` with fallback to validated `env.CRON_SECRET`.
3. **[RESOLVED - LOW] Strict Authorization Matrix Coverage**:
   - *Finding*: Route catalog required an automated verification test to ensure zero routes escape role-based authorization scrutiny.
   - *Resolution*: Created `docs/AUTHZ_MATRIX.md` and `tests/unit/authorization-matrix.test.ts` (7 automated tests validating all 50 routes, 10 handlers, and 25 actions).

### Open Findings
- **Zero Critical or High findings**.
- **Low / Operational Notes**:
  - `site.config.ts`: `legalReviewedOn` is currently unset (`""`). The store owner must record the ISO date of legal counsel review prior to live commercial launch.
  - `ALLOW_INDEXING`: Currently unset/false. Must be set to `"true"` in Vercel production environment variables when ready for search engine crawling.

---

## Section J: Audit Limitations & Disclaimer

This audit was conducted using automated analysis tools, systematic source code review, and synthetic penetration tests. While all known vulnerability vectors have been addressed according to strict architectural guidelines, automated and assistant reviews do not replace formal third-party penetration testing. Before processing large financial transaction volumes, an independent human security firm should conduct black-box and white-box assessments.
