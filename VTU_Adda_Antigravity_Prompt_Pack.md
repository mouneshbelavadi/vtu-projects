# VTU Adda Project Hub: Antigravity Prompt Pack

Thirteen paste-ready prompts for Google Antigravity, in build order, with the steps you do yourself before each one and a test to pass before the next.

Oct 13, 2026 · @Vinayak

## Before you start

Do the one-time setup below, paste Prompt 0 first, then run one prompt at a time and pass its test before starting the next. Antigravity does not remember earlier chats, so the rules live in a file inside the project (`PROJECT_RULES.md`) that every prompt tells the agent to read.

**Accounts and tools to have ready**

| What | Why | Your step |
| --- | --- | --- |
| Git and Node.js (LTS version) on your computer | The project runs locally while it is built | Install both, then run `git --version` and `node --version` in a terminal |
| GitHub account, one private repository | Code history and backups | Create a repository named `vtuadda-projects`, set it to Private, add no template files |
| Supabase account, two projects | Database, login and file storage | Create `vtuadda-projects-dev` and `vtuadda-projects-prod`, pick the Mumbai region if offered, and store each database password in a password manager |
| Resend account | Sends receipts and status emails | Sign up now; you verify the domain in Prompt 11 |
| Vercel account | Hosts the site | Sign up now. Vercel's free Hobby plan is meant for non-commercial use, so check Vercel's current terms and plan for a paid plan before you take payments |
| Google Cloud account | "Sign in with Google" | Used in Prompt 3 |
| A UPI ID, the name shown on it, and a QR image of the account that receives payments | Manual UPI checkout | Decide which account receives money; see the note on business accounts in the architecture doc |
| Access to the DNS settings of vtuadda.com | To point projects.vtuadda.com at the site | Log in to wherever the domain is managed and confirm you can add records |
| Password manager and an authenticator app | Admin login uses a second factor | Install both |

**Where keys and secrets go**

- Never paste a key into a prompt, a chat, a screenshot or the GitHub repository.
- On your computer, keys live in a file called `.env.local` that Git ignores. In production they live only in the Vercel dashboard.
- The agent will create `.env.example` listing the names with empty values. You fill the real values yourself.

| Variable name | What it is | Where you get it |
| --- | --- | --- |
| NEXT\_PUBLIC\_SITE\_URL | The site's web address | http://localhost:3000 locally, https://projects.vtuadda.com in production |
| NEXT\_PUBLIC\_SUPABASE\_URL | Your Supabase project address | Supabase, Project Settings, API |
| NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY | The public (publishable) key, safe in the browser because the database rules protect the data | Supabase, Project Settings, API |
| SUPABASE\_SERVICE\_ROLE\_KEY | The secret key that bypasses database rules. Server only | Supabase, Project Settings, API |
| RESEND\_API\_KEY | Email sending key | Resend, API Keys |
| EMAIL\_FROM | The sender address | You choose it, for example no-reply@projects.vtuadda.com |
| CRON\_SECRET | A long random string that protects scheduled jobs | Generate with a password manager, 32 or more characters |
| IP\_HASH\_SALT | A long random string used to hash IP addresses in logs | Generate the same way |

**How to run each prompt**

1. Open the project folder in Antigravity and start a new conversation for each prompt, so the agent works with a small, clean context.
2. Paste the prompt and let the agent write its plan. Read the plan and ask it to correct anything that contradicts the rules before it writes code.
3. When it finishes, read its pass or fail report. Treat any item without evidence as not done.
4. Run the test steps under the prompt yourself, on your own computer and, from Prompt 11 on, on the live site.
5. If something fails, paste only the failing step back with: "Fix only this, then rerun lint, type checks, tests and the preflight script and report the results."
6. Commit to Git after each passing prompt, so you can go back to a known good point.

**What "make no mistakes" means in practice.** No tool can promise zero mistakes. These prompts make mistakes unlikely and visible: every prompt demands checks that were actually run, every phase ends with a test you perform, and Prompt 12 audits the whole site. Before real volume, have one independent developer review the code and the database rules.

## Prompt 0: Project rules file

This prompt saves your design, copy, security and process rules into the project, so every later prompt can point at one file. It writes no application code.

**Your steps first**

1. On your computer, clone the empty private repository: `git clone <your repository address> vtuadda-projects`.
2. Open that folder in Google Antigravity.
3. Paste the prompt below into a new conversation.

**Prompt**

```text
Create a file named PROJECT_RULES.md in the repository root containing exactly the text between the lines BEGIN RULES and END RULES. Do not change any wording. Do not create any other file and do not write application code in this step. After creating it, print the file back and confirm it matches what I gave you.

BEGIN RULES
PROJECT RULES: VTU Adda Project Hub
These rules apply to every task in this repository. Read this file in full at the start of every task. If a task prompt conflicts with a rule here, stop and ask me before continuing.

1. WHAT WE ARE BUILDING
- A web store at projects.vtuadda.com for VTU engineering students in Karnataka, India. It sells three things: ready project kits (source code, setup guide, report template, PPT template, viva questions), custom project builds delivered in milestones, and mentoring sessions.
- Customers are students, often on phones and slow mobile networks, aged about 18 to 22 and cautious about whom to trust. The site must look like a careful, established small business and not like a template or a generated site.
- Payments are manual UPI. The student pays by scanning a UPI QR for the exact amount, submits the UTR (and, if they wish, a screenshot), and an admin verifies the payment against the bank record before files are released. All payment code sits behind a PaymentProvider interface so a gateway can be added later. Do not write any gateway code now.

2. STACK (do not add other services)
- Next.js (App Router, latest stable), React, TypeScript in strict mode, Tailwind CSS.
- Supabase for Postgres, Auth and Storage. Resend for email. Vercel for hosting.
- npm as the package manager. Pin dependency versions. Add a dependency only when it is clearly needed, check that it is actively maintained, and state the reason in your plan.
- Prefer the platform and the standard library over new packages.

3. HOW TO WORK (the no-mistakes process)
- Start every task with a short written plan: files to create or change, data changes, risks, and anything unclear. If a requirement is ambiguous or missing, ask me. Do not guess.
- Work in small steps. After each step run lint, the type check, the tests and a production build. Fix failures before moving on.
- Never claim something works unless you ran it. Final report format: each acceptance item marked PASS or FAIL with evidence (command output or test name), then every assumption you made, then anything you did not do.
- Do not change files outside the scope of the task. Do not rename or delete existing work unless the task says so.
- Never invent facts: no made-up business details, statistics, prices, customer names, reviews, project counts or certifications. If a real value is needed and unknown, read it from site.config.ts or the database, and fail loudly in production if it is missing.
- No placeholder text, lorem ipsum or sample data in any production code path. Fixtures are allowed only in test files and in a dev-only seed script that refuses to run when NODE_ENV is production.
- Write tests for every rule that protects money, files or personal data.
- Keep functions small and name things plainly. Comment the why, not the what.

4. DESIGN RULES (the site must not look generated)
Never use: purple, violet or indigo hues; gradients of any kind; pill-shaped or fully rounded buttons; glassmorphism; glow effects; heavy shadows; emoji as icons or decoration; stock photos; AI-generated images; abstract blob illustrations; mascots.
Never use: fake reviews, fake testimonials, fake metrics, fake customer or download counters, fake 'students trust us' claims, fake logos, fake urgency such as countdown timers or 'only 3 left'.
Never use: scroll-triggered animation, parallax, auto-playing carousels, marquee text, count-up numbers, cursor effects or custom cursors, animated backgrounds. The only motion allowed is a 120 to 160 ms colour or opacity transition on hover and focus, and it must respect prefers-reduced-motion.
Always use: the tokens and components from the design system (Prompt 2). Flat surfaces, 1 px borders, a 6 px corner radius for buttons, inputs and cards, 4 px for tags, one accent colour, and real screenshots of real projects only. Where a screenshot does not exist, show a plain labelled block, never a fake image.
- Layout is dense and informative, like a good technical catalogue: facts first, clear small type, tables and spec lists where they are clearer than cards.
- Every page works at 360 px width, has touch targets of at least 44 px, visible focus states, WCAG AA contrast and semantic HTML.
- The site is in English. Money is shown like ₹4,999. Dates are shown like 13 Oct 2026. Times are in IST.

5. COPY RULES
- Write plain, specific sentences that say what the thing is, what it includes and what it costs. Short words. No hype.
- Never use an em dash or an en dash in any text or code string. Use a comma, a colon, a full stop, or a hyphen with spaces.
- Banned words and phrases: seamless, revolutionize, supercharge, cutting-edge, game-changer, empower, elevate, leverage, unleash, next-level, world-class, best-in-class, journey, effortless, ultimate, guaranteed, 100%, trusted by, 'your success starts here', 'take your project to the next level'.
- Never promise marks, grades, placement or approval by VTU or any college. Never say or imply that VTU endorses us.
- No vague hero headlines. A headline states what is sold and to whom.
- Every error message says what happened and what the user can do next.
- scripts/lint-copy.ts checks for banned words, dashes and emoji in src and fails the build when it finds one. Legal pages under src/content/legal are scanned for dashes and emoji only.

6. SECURITY RULES (all mandatory)
Secrets
- No secret, key, token or password in source code, comments, logs, client bundles or git history. Secrets come from environment variables validated at startup with zod in a server-only module.
- Only variables named NEXT_PUBLIC_* may reach the browser, and only the Supabase URL, the public (anon) key and the site URL are allowed there.
- The Supabase service role key is used only in server-only modules (import 'server-only') and never in a file a client component can import.
- .env files stay out of git. A secret scan runs in CI and before launch, including the full git history.
Authentication and sessions
- Login is by email one-time code or Google, through Supabase Auth. We do not store passwords. If password login is ever added it must use Supabase Auth and never custom hashing.
- Sessions use cookies handled by the Supabase SSR helper. Never store auth tokens in localStorage or sessionStorage.
- Decide authorization with a server-verified user (the getUser call), never from a value sent by the browser or from an unverified session.
- Admin users must complete multi-factor authentication (TOTP). Admin pages and admin actions require an MFA-verified session (AAL2).
Authorization
- Every route, server action and API handler checks who is calling and what they may do. Default is deny.
- The database enforces access too: row level security is enabled on every table in the public schema with explicit policies. A table without policies is reachable only by the service role.
- Prevent object-level authorization bugs: never load a record by id alone. Scope by owner or check the role. Write tests in which two different students try to read, change and download each other's records.
- Roles live in a separate table that users cannot write to. A user must never be able to change their own role.
Input and output
- Validate every input on the server with zod: types, lengths, formats and allowed values. Reject unknown fields.
- Use only parameterised queries through the Supabase client or SQL functions that take parameters. Never build SQL by joining strings.
- React escapes output by default. Never use dangerouslySetInnerHTML, except for JSON-LD that has been serialised safely. If user-supplied rich text is ever needed, sanitise it on the server with a vetted library first.
- Never fetch a URL that a user supplies from the server (SSRF). When a user supplies a link, validate it against an allowed domain list, store it as text, and never request it.
- File uploads: an allowlist of types and extensions, a maximum size, a check of the real file signature (magic bytes), our own random file names, private buckets, and re-encoding of images with sharp to strip metadata and hidden payloads. Never serve uploaded files from our own origin with their original type.
- Rate limit every public endpoint and every action that sends email, creates an order, submits payment proof, uploads a file or downloads a file, using the shared Postgres rate limiter.
- CSRF: use server actions, which check the Origin header, or call assertSameOrigin on every state-changing route handler. Cookies are Secure and SameSite=Lax.
- CORS: no wildcard. The API is same-origin only. Add CORS headers only when a task names a specific origin.
Platform
- Security headers on every response: a strict Content-Security-Policy using nonces, Strict-Transport-Security, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, a Permissions-Policy that disables unused features, and frame-ancestors none.
- Remove the X-Powered-By header. Disable production browser source maps. Never run with debug flags or verbose error pages in production. Error pages never show stack traces.
- Logs never contain secrets, tokens, full email addresses, phone numbers, payment proof file paths or request bodies. Hash IP addresses with IP_HASH_SALT before storing them.
- Change or remove every default credential, sample account and test key before launch. No default admin account exists: the owner promotes the first admin by hand.
- Dependencies: npm audit runs in CI, Dependabot is enabled, unused packages are removed, the lock file is committed.
- Do not expose files: no source maps, .env, .git, database dumps or admin tools reachable from the public site. robots.txt hides /admin, /account, /checkout and /api from search engines but is never treated as a security control.
- Signature verification is mandatory for any future payment gateway webhook. Do not add a gateway endpoint without it.
- Every admin action that changes data writes an audit log row: who, what, when and the record id.

7. MONEY AND FILE RULES
- Prices are stored in whole rupees in the database and are always read from the database on the server. Never trust a price, amount, discount or role sent from the browser.
- An order is paid only after an admin approves the payment. Files are released only through the secure download route, which checks ownership, order status, expiry and the download limit.
- A UTR (UPI transaction reference) can be used for only one order, enforced by a unique index.
- Refunds are manual: record the refund reference and revoke the download grants.

8. ACADEMIC INTEGRITY RULES (these are product rules)
- Kits are sold for learning, reference and guided customisation. The site says plainly that students must follow their college and VTU rules and must be able to explain their project.
- Every checkout and every custom request requires an acknowledgement checkbox that says so.
- We decline requests that are clearly exam work, lab records or copied work. The request form says this before the student starts.
- No guaranteed outcomes and no 'VTU approved' claims.
- DATA MINIMISATION: collect only what a step needs. Never ask for or store a student's college, branch, semester or scheme on the account (branch, semester and scheme appear only as project details in a custom request, never on the profile). The account holds an email, a display name (a name or nickname) and an optional phone number. A payment screenshot is optional. Payment screenshots are deleted after the retention period set in the admin settings. Never add a field to a form without saying in the plan why it is needed.

9. LAUNCH GATE (the site does not go live until all of these are true)
- A custom domain (projects.vtuadda.com) is connected with HTTPS.
- A favicon, an apple touch icon and an Open Graph image exist.
- No 'Made with AI' badge, tool badge, generator meta tag or tool name appears anywhere in the page source, the headers or the footer.
- A Privacy Policy page and a Terms and Conditions page exist, are linked in the footer and at checkout, and the owner has recorded a legal review date in site.config.ts.
- All business details in site.config.ts are real and filled in.
- The catalogue contains only real kits with real screenshots.
- npm run preflight passes. It checks everything above plus the security items, and it fails the production build when anything is missing.

10. DEFINITION OF DONE
A task is done only when: every acceptance item passes with evidence; lint, the type check, tests and the build pass; no rule above is broken; the preflight script passes, or fails only on items that belong to later prompts; and a short note lists what I should test by hand.
END RULES
```

**Test before moving on**

- Open `PROJECT_RULES.md` and read it once. If any rule is wrong for your business, change the file now, because every later prompt obeys it.
- Run `git add . && git commit -m "Add project rules"` and push.
- Keep this file safe. If Antigravity ever drifts, paste the section it broke back into the chat.

## Prompt 1: Project setup and security baseline

This prompt builds the empty but hardened foundation: the project scaffold, environment handling, security headers, shared security helpers, the launch-gate script and automated checks. Nothing a student can see yet.

**Your steps first**

1. Make sure `PROJECT_RULES.md` is committed (Prompt 0 test).
2. Start a new Antigravity conversation in the same folder.
3. Install gitleaks (a free secret scanner) if you can: search for "gitleaks install" for your system. The prompt works without it but tells you what is missing.

**Prompt**

```text
Read PROJECT_RULES.md in full and follow it for this whole task.

TASK: Create the project foundation and the security baseline. No pages with real content yet.

1. SCAFFOLD
- Create a Next.js project (App Router, TypeScript, Tailwind CSS, ESLint, src directory, import alias @/*) in the current folder. Keep the existing PROJECT_RULES.md and .git.
- TypeScript strict mode, plus noUncheckedIndexedAccess and noImplicitOverride.
- Add Prettier with prettier-plugin-tailwindcss. Add Vitest for unit tests and Playwright for end-to-end tests (configuration plus one smoke test each).
- npm scripts: dev, build, start, lint, typecheck, format, test, test:e2e, lint:copy, scan:secrets, audit, preflight.
- Remove all default Next.js sample content, logos, boilerplate text and the default favicon. Replace the README with a factual one: what the project is, how to run it locally, the environment variable names, the scripts, and the folder structure.
- Set the package name to vtuadda-projects and the description to 'Project store for VTU students'. No tool or AI wording anywhere.

2. FOLDER STRUCTURE
src/app (routes), src/components/ui (design system, filled in Prompt 2), src/components/site (header, footer), src/lib (pure helpers shared by client and server), src/server (server-only code: env, supabase clients, auth, rate limit, email, payments, storage), src/server/payments, src/content (static copy and legal pages), supabase/migrations, scripts, tests, docs.
Every file in src/server starts with: import 'server-only'.

3. ENVIRONMENT HANDLING
- src/server/env.ts validates the server variables with zod and exports a typed object. Variables: NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, EMAIL_FROM, CRON_SECRET, IP_HASH_SALT. In production the app must refuse to start when any of them is missing or malformed. CRON_SECRET and IP_HASH_SALT must be at least 32 characters. NEXT_PUBLIC_SITE_URL must start with https in production.
- src/lib/public-env.ts validates only the NEXT_PUBLIC_ variables for use in the browser.
- Create .env.example with every name, an empty value and a one-line comment saying where the value comes from. Make .gitignore ignore every .env file except .env.example, plus .next, node_modules, coverage, test reports and .vercel.
- Add a test that fails if any file under src outside src/server references SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, CRON_SECRET or IP_HASH_SALT.

4. SITE CONFIG
- Create site.config.ts with: businessName, tradeName, siteName ('VTU Adda Projects'), siteUrl, supportEmail, whatsappNumber (international format, digits only), upi: { payeeName, vpa }, address, grievanceOfficer: { name, email }, gstin (optional), legalReviewedOn (a date string or empty), and social links (empty by default).
- Every required field starts as an empty string. getSiteConfig() returns the config and, when NODE_ENV is production and any required field is empty, throws an error listing the missing field names.
- I will fill these in myself. Do not invent values.

5. SECURITY HEADERS AND NEXT CONFIG
- next.config: poweredByHeader false, productionBrowserSourceMaps false, reactStrictMode true, and an image allow-list limited to our Supabase storage host.
- middleware.ts generates a per-request nonce and sets a strict Content-Security-Policy: default-src 'self'; script-src 'self' with the nonce and 'strict-dynamic'; style-src 'self' with the nonce and no 'unsafe-inline' in production; img-src 'self' data: and the Supabase storage host; font-src 'self'; connect-src 'self' and the Supabase URL; frame-src https://www.youtube-nocookie.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests. Add the extra sources that Next.js needs for hot reload only when NODE_ENV is development.
- Also set: Strict-Transport-Security (max-age of two years, includeSubDomains), X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, a Permissions-Policy that disables camera, microphone, geolocation, payment, usb and interest-cohort, Cross-Origin-Opener-Policy same-origin.
- Add a test that requests a page from the running app and asserts every header above is present and that X-Powered-By is absent.

6. SHARED SECURITY UTILITIES (write them now, each with unit tests)
- src/server/security/same-origin.ts: assertSameOrigin(request) compares the Origin header (or Referer when Origin is absent) with NEXT_PUBLIC_SITE_URL and throws a 403 AppError when it differs or is missing on a state-changing method.
- src/server/security/rate-limit.ts: export rateLimit(key, limit, windowSeconds) returning allowed or blocked. For now implement an in-memory store used only when NODE_ENV is development or test, and make production throw until the Postgres version is added in Prompt 3. Say so in a comment at the top of the file.
- src/server/security/ip.ts: getClientIp(headers) and hashIp(ip) using HMAC-SHA256 with IP_HASH_SALT.
- src/server/security/validate.ts: a helper that parses input with zod and returns a typed result or a safe error object. Errors returned to the browser never include internals.
- src/server/log.ts: a small logger with levels that redacts any key whose name looks like password, token, secret, authorization, cookie, key, email or phone, and never logs request bodies.
- src/server/errors.ts: AppError with a safe public message and an internal code. Add app/error.tsx, app/global-error.tsx and app/not-found.tsx with plain text and no stack traces.

7. PAYMENT PROVIDER INTERFACE (interface only)
- src/server/payments/provider.ts defines a PaymentProvider interface with an id, a method that prepares payment instructions for an order, and a method that describes how a payment is verified. Define the types PaymentMethod ('manual_upi') and PaymentStatus ('awaiting_payment' | 'pending_verification' | 'paid' | 'rejected' | 'expired' | 'refunded'). Do not implement a provider yet.

8. SCRIPTS
- scripts/lint-copy.ts scans src and content files for the banned words, em dashes, en dashes and emoji from PROJECT_RULES.md section 5, and exits non-zero listing each file and line.
- scripts/preflight.ts runs these checks and prints PASS or FAIL for each, exiting non-zero on any FAIL: site.config complete; legalReviewedOn set; favicon, apple-touch-icon and Open Graph image files exist; privacy and terms routes exist and are non-empty; no source map files in the production build output; no X-Powered-By; no generator meta tag; no tool or AI wording in package.json, README, layout and footer; no dangerouslySetInnerHTML outside the JSON-LD component; no console.log in src; lint:copy passes; npm audit shows no high or critical issues in production dependencies. A check that depends on a later prompt reports NOT YET APPLICABLE with the prompt number instead of a false PASS. Running npm run preflight -- --launch treats NOT YET APPLICABLE as FAIL.
- scripts/scan-secrets.sh runs gitleaks over the working tree and the full git history when gitleaks is installed, and prints clear install instructions when it is not.

9. CI AND DEPENDENCY HYGIENE
- .github/workflows/ci.yml: on every push and pull request, install from the lock file, then lint, typecheck, unit tests, build, lint:copy, npm audit (production dependencies, fail on high), and a gitleaks scan of the full history.
- .github/dependabot.yml: weekly npm and GitHub Actions updates, grouped by minor and patch.
- Pin GitHub Actions to full commit SHAs.

10. ACCEPTANCE CHECKLIST (report each as PASS or FAIL with evidence)
a. npm run lint, typecheck, test and build all succeed.
b. The app starts in development with an .env.local built from .env.example, and refuses to start in production mode when a required variable is missing.
c. The headers test passes and X-Powered-By is absent.
d. No client file can import server-only modules (the test from step 3 passes).
e. The unit tests for assertSameOrigin, hashIp, logger redaction and zod validation pass.
f. npm run preflight runs and prints each check, and the launch mode fails as expected right now.
g. The production build output contains no .map files.
h. A search of the repository finds no real secret, and .env.local is ignored by git.
i. The README, package.json and page source contain no tool or AI wording.
Finish with the report format from PROJECT_RULES.md section 3.
```

**Test before moving on**

1. In a terminal in the project folder run `npm install`, then `cp .env.example .env.local`. Fill only `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for now and use any 32-character random strings for the two secrets.
2. Run `npm run dev`, open http://localhost:3000 and confirm you see a plain page and no sample Next.js content.
3. Right-click the page, choose View Source, and search for "generator" and for the name of any tool. Nothing should match.
4. Run `npm run build && npm start`, then in another terminal run `curl -I http://localhost:3000`. You should see the Content-Security-Policy and Strict-Transport-Security headers and no X-Powered-By.
5. Run `npm run preflight`. Several checks will say NOT YET APPLICABLE or FAIL. That is correct at this stage.
6. Commit and push, then open the repository on GitHub and confirm the CI run is green.

**Note.** A strict, nonce-based content policy makes pages render on the server for each visit instead of being cached as static files. That costs a little speed and buys protection against injected scripts, which is the right trade for a site that takes payments.

## Prompt 2: Design system and site shell

This prompt sets the whole look: colours, type, spacing, components, header, footer, error pages and the favicon. The look is a restrained, paper-and-ink catalogue with one deep green accent. It deliberately avoids everything that makes a site read as generated.

**Your steps first**

1. Confirm Prompt 1 is committed and its CI run is green.
2. Decide whether you already have a logo. If you do, put it in a folder `design-assets` and tell the agent; if not, the prompt creates a plain typographic favicon you can replace later.
3. Start a new conversation.

**Prompt**

```text
Read PROJECT_RULES.md in full and follow it for this whole task.

TASK: Build the design system and the site shell. Do not build store pages yet.

1. TAILWIND SETUP
- Reset Tailwind's default colour palette, radius scale, shadow scale and animation utilities, using the configuration method of the installed Tailwind version (in Tailwind 4, use @theme and reset the colour namespace with --color-*: initial). Define only the tokens below so that off-palette colours, gradients, pill shapes and animated utilities do not exist in the project.
- Add a test that scans src for the forbidden utilities and CSS: any class or style containing gradient, rounded-full (allowed only inside the Radio component file), rounded-3xl, backdrop-, blur-, animate-, shadow-lg, shadow-xl, shadow-2xl, and any hex or hsl colour that is not defined in the token file. The test fails when it finds one.

2. DESIGN TOKENS (define as CSS variables and map them in Tailwind)
Colours:
- paper #FBFAF7 (page background)
- surface #FFFFFF (cards, inputs)
- ink #17191C (main text)
- ink-2 #4A5058 (secondary text)
- ink-3 #5F6670 (captions, never below 14 px)
- rule #DDD9D0 (borders and dividers)
- rule-strong #B9B4A8 (input borders)
- accent #0B5D4B (links, primary buttons)
- accent-hover #084A3C
- accent-weak #E4F0EC (selected rows, subtle highlights)
- warn-text #6B4700 on warn-bg #FFF4D6
- danger #A12B2B on danger-bg #FBE9E7
- success #1E6B3C on success-bg #E6F3EA
No other colours. No purple, violet or indigo. No gradients. Dark mode is not part of the first release.
Typography (load with next/font so the fonts are self-hosted at build time, with display swap):
- Headings: Source Serif 4, weights 600 and 700.
- Body and interface: IBM Plex Sans, weights 400, 500 and 600.
- Prices, order codes, UTR numbers and code: IBM Plex Mono, weight 400 and 500.
- Scale: body 16/26, small 14/22, caption 14/20 in ink-3, h1 40/46 (32/38 below 640 px), h2 28/34, h3 20/28, h4 16/24 weight 600. Maximum line length 68 characters for reading text.
Spacing: an 8 px grid (4, 8, 16, 24, 32, 48, 64, 96). Page container maximum width 1120 px with 16 px side padding below 640 px and 24 px above.
Shape: radius 6 px for buttons, inputs, cards, dialogs and alerts; 4 px for tags and badges; 0 for table cells. Borders 1 px solid rule. No shadows anywhere. The focus state is a 2 px accent outline with a 2 px offset on every interactive element.
Motion: only colour and opacity transitions of 120 ms on hover and focus. Under prefers-reduced-motion: reduce, remove them.

3. COMPONENTS (src/components/ui, accessible, keyboard operable, documented with a short comment)
Use Radix UI primitives for Dialog, Select, Tabs, Checkbox, RadioGroup and Tooltip, and restyle them fully to the tokens. Do not use shadcn default styling. Build: Button (primary, secondary, quiet, danger; sizes md 44 px and sm 36 px; always 6 px radius; loading state shown as text, not a spinner), LinkButton, Input, Textarea, Select, Checkbox, Radio, FormField (label, help text, error text, aria-describedby and aria-invalid wired correctly), FileInput (shows chosen file name and size, with a plain text error), Badge, StatusBadge (awaiting_payment, pending_verification, paid, rejected, expired, refunded, plus request and booking statuses defined as one typed map), Card, Table (responsive: becomes stacked rows below 640 px), Tabs, Dialog, Alert (info, warning, error, success), Breadcrumbs, Pagination, EmptyState (one factual sentence and one action), Price (formats whole rupees as ₹4,999 in IBM Plex Mono), DefinitionList (for specs), Prose (styles for legal and long text), and a plain Toast for confirmations with role='status'.
Icons: use lucide-react at 16 or 20 px with a 1.5 stroke, only where an icon carries meaning (search, external link, download, warning, check). Never place an icon in front of every heading or list item.

4. SITE SHELL (src/components/site)
- Header: a text wordmark 'VTU Adda Projects' in Source Serif (no logo graphic), a navigation list, and an account area with a Sign in link (wired in Prompt 3). Mobile: a button labelled 'Menu' that shows and hides the navigation list as a simple disclosure with no animation. Sticky header is not used.
- Navigation is defined in src/content/navigation.ts as an array with a status field of 'live' or 'planned'. Only 'live' items render in production. Planned items: Projects (/projects), Request a project (/request), Mentoring (/mentoring), How it works (/how-it-works), Contact (/contact). At this point none are live.
- Footer: four plain text columns. Store: Projects, Request a project, Mentoring. Help: How it works, Contact, Refund policy, Academic integrity. Legal: Privacy policy, Terms and conditions. VTU Adda: Notes and question papers (link to https://vtuadda.com, opens in the same tab). Last line: '© [year] [businessName from site.config]'. Items with a status of 'planned' do not render in production. No 'built with', no tool name, no badge.
- A skip-to-content link, proper landmarks (header, nav, main, footer), one h1 per page, and a lang attribute of en-IN on the html element.
- Pages: a minimal home page at / that shows the h1 'VTU Adda Projects' and one sentence: 'The project store is being set up.' (This is replaced in Prompt 5.) Plain 404 and error pages: '404: This page does not exist. Check the address or go to the home page.' and 'Something went wrong on our side. Try again, or write to [supportEmail] with the time it happened.'
- A development-only page at /design that renders every component in every state. It must return a 404 when NODE_ENV is production, and a test checks this.

5. FAVICON AND ICONS
- Create src/app/icon.svg: a square monogram of the letters VA in Source Serif 700, white on the accent colour, flat, 6 px corner radius. Create a 180 px apple-icon.png and a 32 px favicon.ico from it with a script (scripts/make-icons.ts using sharp). If I have placed a logo in design-assets, use it instead and say so.
- Do not generate any picture with AI. Do not add stock images.

6. METADATA
- Root layout metadata: title template '%s | VTU Adda Projects', a plain description, metadataBase from NEXT_PUBLIC_SITE_URL, robots set to noindex for now (Prompt 11 turns indexing on), viewport and themeColor set to the paper colour. No generator tag.

7. ACCEPTANCE CHECKLIST (report each as PASS or FAIL with evidence)
a. Every component renders in every state on /design, and /design returns 404 in a production build.
b. An automated accessibility scan (axe through Playwright) finds zero serious or critical violations on /design and on the home page, at 360 px and 1280 px widths.
c. A unit test computes the contrast ratio of every text and background token pair used and fails below 4.5:1 (7:1 for ink on paper).
d. The forbidden-utility test passes, and a deliberate rounded-full or gradient class added temporarily makes it fail (show this, then remove it).
e. No horizontal scrolling at 360 px width on any page.
f. Keyboard only: Tab reaches every interactive element in a logical order with a visible focus ring, Escape closes the dialog and returns focus to its trigger.
g. Fonts load from our own origin in the production build (no requests to Google at runtime).
h. favicon.ico, icon.svg and apple-icon.png exist, and the preflight favicon check now passes.
i. npm run lint, lint:copy, typecheck, test and build succeed.
Finish with the report format from PROJECT_RULES.md section 3.
```

**Test before moving on**

1. Run `npm run dev` and open http://localhost:3000/design. Scroll through every component and check it matches the description: flat, square-ish corners, no shadows, no gradients, one green accent.
2. Open the same page on your phone (use your computer's local network address) and confirm you can tap every button comfortably.
3. Press Tab repeatedly and check you can always see where the focus is.
4. Look at the browser tab: you should see the VA favicon.
5. If you have a logo, tell Antigravity to swap it in now.
6. Commit and push, and confirm CI is green.

## Prompt 3: Database, login and roles

This prompt creates the real database with access rules enforced by the database itself, private file storage, email-code and Google login, and mandatory two-factor login for admins. It is the most important security prompt, so take your time with the test.

**Your steps first (all on the dev project, never production)**

1. In Supabase open `vtuadda-projects-dev`, go to Project Settings, then API. Copy the project URL, the anon (publishable) key and the service role (secret) key into `.env.local` under the variable names listed at the start of this pack. Do not paste them into chat.
2. Install the Supabase CLI, then in the project folder run `supabase login` and `supabase link --project-ref <your dev project reference>`. The reference is the code in your project's URL. You will be asked for the database password you saved.
3. In Supabase, Authentication, Providers: keep Email enabled. In Authentication, Email Templates, open the template used for sign-in codes and make sure it shows the 6-digit code with `{{ .Token }}`, not only a link.
4. In Authentication, URL Configuration: set Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to the redirect URLs.
5. In Authentication, Multi-Factor: make sure TOTP (authenticator app) is enabled.
6. Google login: in Google Cloud Console create a project, then OAuth consent screen (External, app name VTU Adda Projects, your support email), then Credentials, Create OAuth client ID, type Web application. In Supabase, Authentication, Providers, Google, copy the Callback URL it shows and paste it into the client's Authorised redirect URIs in Google. Copy the Google client ID and secret back into Supabase's Google provider and enable it. Keep the consent screen in Testing mode and add your own email as a test user for now.
7. Supabase's built-in email sender is heavily rate limited and meant for testing. In Prompt 11 you connect Resend as the sender for production.

**Prompt**

```text
Read PROJECT_RULES.md in full and follow it for this whole task.

TASK: Create the database schema, row level security, storage buckets, login and roles, as Supabase CLI migrations in supabase/migrations. I have a dev Supabase project linked. Do not touch production. Do not write keys anywhere except .env.local. Do not run destructive commands on the database without telling me first. When migrations are ready, tell me to run 'supabase db push' myself and wait for my confirmation.

1. TYPES AND CONVENTIONS
- Primary keys are uuid with gen_random_uuid() unless stated. Every table has created_at timestamptz default now(). Money columns are integers in whole rupees (suffix _inr) with check constraints of zero or more. Text columns have length checks. Use check constraints for status values or enums, and keep status lists in one place in TypeScript too.
- Every function is created with set search_path = '' and, where it needs elevated rights, security definer.

2. TABLES (public schema)
- profiles: id (references auth.users, on delete cascade), display_name (a name or nickname, up to 60 characters), phone (null, optional, E.164 format check), updated_at. Do not store college, branch, semester or scheme on the profile. A trigger on auth.users insert creates the row.
- user_roles: user_id, role ('student', 'builder', 'admin'). Primary key (user_id, role). Writable by the service role only. Everyone is implicitly a student.
- categories: kind ('branch', 'domain', 'tech', 'semester', 'scheme'), name, slug, sort_order. Unique (kind, slug).
- projects: slug (unique), title, summary (max 300), description, course_type ('mini_project', 'project_phase_1', 'major_project_phase_2', 'capstone', 'hackathon_project', 'other'), difficulty ('beginner', 'intermediate', 'advanced'), tech_stack text[], price_inr, sales_limit (null means no limit, otherwise a positive integer), sales_window_start (timestamptz, default now()), status ('draft', 'live', 'hidden') default 'draft', cover_path, demo_video_url (null; check that it starts with https://www.youtube.com/ or https://youtu.be/), syllabus_note, published_at, updated_at, search (tsvector generated from title, summary, description and tech_stack) with a GIN index.
- project_categories: project_id, category_id.
- project_files: project_id, kind ('code', 'report', 'ppt', 'setup_guide', 'viva_qa', 'other'), storage_path (unique), original_name, size_bytes, content_type, sha256, version (default 1).
- project_media: project_id, storage_path, alt_text (required), sort_order.
- orders: order_code (unique, format VPH- plus 8 characters from an unambiguous uppercase alphabet), user_id, type ('kit', 'custom', 'mentoring'), status ('awaiting_payment', 'pending_verification', 'paid', 'rejected', 'expired', 'refunded', 'cancelled'), subtotal_inr, discount_inr, total_inr, coupon_id (null), ack_integrity (boolean, check it is true), expires_at, updated_at.
- order_items: order_id, project_id (null), mentoring_tier_id (null), request_id (null), label, price_inr. Check that exactly one of the three references is set.
- payments: order_id, method (default 'manual_upi'), amount_inr, status ('awaiting_payment', 'pending_verification', 'paid', 'rejected', 'expired', 'refunded'), utr (null, check it matches exactly 12 digits), proof_path (null, because the screenshot is optional), proof_deleted_at (null), submitted_at, verified_by, verified_at, reject_reason, attempt (default 1), refund_amount_inr, refund_reference, refunded_at. A partial unique index on utr where utr is not null and status in ('pending_verification', 'paid') so one UTR can pay for only one order.
- download_grants: order_id, user_id, project_id, max_downloads (default 5), download_count (default 0), expires_at (null), revoked_at (null). Unique (order_id, project_id).
- download_log: grant_id, file_id, ip_hash, created_at.
- custom_requests: user_id, title, brief, branch, semester, scheme, course_type, tech_pref, deadline (date), budget_inr (null), team_size (1 to 4), status ('submitted', 'under_review', 'quoted', 'accepted', 'in_progress', 'delivered', 'completed', 'declined', 'cancelled'), assigned_builder_id (null), quote_total_inr, quote_deposit_inr, quote_note, quote_valid_until, declined_reason, ack_integrity (check true), updated_at.
- request_files: request_id, uploaded_by, kind ('student_reference', 'deliverable'), storage_path, original_name, size_bytes, content_type.
- milestones: request_id, position, title, description, due_date, needs_student_input (boolean), student_input_text, status ('pending', 'in_progress', 'awaiting_student', 'done').
- messages: request_id, sender_id, body (max 4000).
- mentoring_tiers: name, description, price_inr, session_count, session_minutes, active, sort_order.
- mentor_slots: mentor_id, starts_at, ends_at, status ('open', 'held', 'booked', 'cancelled'). Use btree_gist and an exclusion constraint so one mentor has no overlapping slots.
- bookings: user_id, tier_id, slot_id (unique), order_id, status ('awaiting_payment', 'pending_verification', 'confirmed', 'completed', 'cancelled', 'refunded'), meet_url (null, must start with https://), notes.
- reviews: user_id, project_id, order_id, rating (1 to 5), body (max 2000), status ('pending', 'approved', 'hidden'). Unique (user_id, project_id).
- coupons: code (case-insensitive unique), percent_off (null), amount_off_inr (null), max_redemptions, redeemed_count, valid_from, valid_to, active. Check that exactly one of percent_off and amount_off_inr is set.
- coupon_redemptions: coupon_id, order_id (unique).
- tickets: user_id (null), email, kind ('support', 'deletion_request', 'other'), subject, body, status ('open', 'answered', 'closed').
- audit_log: id bigint identity, actor_id, action, entity, entity_id, details jsonb (never personal data), created_at.
- site_settings: key (primary key), value jsonb, updated_by, updated_at. Seed no values: the UPI payee name and VPA are entered by me in the admin panel (Prompt 4).
- rate_limits: key (primary key), window_start, count.

3. ROW LEVEL SECURITY
Enable RLS on every table above and also set it as forced where appropriate. Revoke all table privileges from anon and authenticated, then grant back only what the matrix below needs. Create these helper functions: is_admin() is true only when the caller has the admin role AND (auth.jwt() ->> 'aal') = 'aal2'; is_builder(); is_staff() is is_admin() or is_builder().
Policy matrix (anything not listed is denied):
- profiles: a user selects and updates only their own row, and may update only display_name and phone (use column-level grants). Admin selects all.
- user_roles: a user selects only their own rows. Nobody but the service role writes.
- categories, mentoring_tiers (active only): select for everyone.
- projects: select for everyone where status is 'live'. Admin has full access.
- project_media: select for everyone when the parent project is live. Admin full access.
- project_files: no direct access for anon or authenticated. Create a view project_file_summaries that exposes only project_id, kind, original_name and size_bytes for files of live projects (never storage_path) and grant select on it. Admin full access.
- orders, order_items, payments, download_grants: a user selects only their own. Admin selects all. All writes go through the server with the service role.
- download_log, audit_log, rate_limits, site_settings, coupons, coupon_redemptions: admin select only (site_settings: select of the non-secret keys the UI needs is done by the server). Writes by the service role.
- custom_requests: a user selects their own and inserts their own (user_id must equal auth.uid() and status must be 'submitted'). A builder selects and updates only requests assigned to them. Admin full access.
- request_files, milestones, messages: visible to the request owner, the assigned builder and admin. Messages can be inserted by those three, with sender_id equal to auth.uid().
- mentor_slots: select where status is 'open' for everyone signed in; builders manage their own slots; admin full access.
- bookings: owner selects own; the mentor of the slot selects theirs; admin full access. Inserts by the service role.
- reviews: everyone selects approved reviews; an owner selects their own; an owner may insert a pending review only for a project they have a paid order for (enforce with a policy or a function). Admin full access.
- tickets: an owner selects own and inserts own; admin full access.

4. RATE LIMITER
- Create a function rate_limit_hit(p_key text, p_limit int, p_window_seconds int) returning boolean. It must be atomic (insert on conflict update), count within the window, and be executable only by the service role (revoke from public, anon and authenticated).
- Replace the production branch of src/server/security/rate-limit.ts with a call to this function through the service role client. Keep the in-memory version for tests.

5. STORAGE
Create buckets in a migration: project-files (private, 200 MB limit; zip, pdf, pptx, docx, txt, md), payment-proofs (private, 3 MB; png, jpeg, webp), request-files (private, 200 MB; zip, pdf, docx, pptx, png, jpeg, txt), public-media (public, 2 MB; webp only). Add no storage policies for anon or authenticated on the private buckets: they are reached only through the server with the service role and short-lived signed URLs. public-media allows public read only; writes only by the service role.

6. AUTH IMPLEMENTATION
- src/server/supabase/server.ts (cookie-based client per request using @supabase/ssr), src/server/supabase/admin.ts (service role, import 'server-only'), src/lib/supabase/browser.ts (anon key, used only for the MFA enrolment screen).
- Helpers: requireUser(), requireRole(role), requireAdmin(). They call getUser() on the server (never trust an unverified session), and requireAdmin() also requires the aal2 level and otherwise redirects to /admin/mfa.
- Pages and routes: /login (email field, then a 6-digit code field; plus a 'Continue with Google' button), /auth/callback (exchanges the code and redirects only to a validated internal path taken from a 'next' parameter: it must start with a single slash, must not start with // or contain a backslash or a protocol, and must match an allowlist of path prefixes), /logout (POST only, with assertSameOrigin), /account (profile form with the profile fields, validated with zod). Make the Sign in link in the header live, and show the user's name and a Sign out button when signed in.
- Rate limits: 5 code requests per email per hour and 20 per hashed IP per hour. On limit, show a plain message saying how long to wait. Never reveal whether an email already has an account.
- Never store tokens in localStorage or sessionStorage. No passwords exist anywhere.
- middleware.ts: refresh the session cookie, protect /admin, /account and /checkout paths by redirecting to /login with a safe 'next' value. This is a convenience layer: every page and action also checks on its own.
- /admin/mfa: enrol a TOTP authenticator (show a QR code and the secret text, then verify a code), or challenge the existing factor, so the session reaches aal2. Write docs/ADMIN_RECOVERY.md explaining how I reset a lost authenticator from the Supabase dashboard, and tell me to store the setup secret in my password manager.
- /admin shows only the text 'Admin' and the signed-in email for now (Prompt 4 builds the panel).

7. TESTS
- scripts/rls-check.ts (npm run test:rls): creates throwaway users through the Admin API (student A, student B, a builder, an admin), signs in as each, and asserts every row of the policy matrix: student A cannot select B's orders, payments, grants, requests, messages or profile; anon cannot select any private table; a student cannot update their own role, insert into user_roles, read project_files or call rate_limit_hit; an admin session below aal2 cannot read admin tables; a builder sees only assigned requests; a student cannot update orders or payments; the public sees only live projects. It deletes the throwaway users afterwards. It refuses to run unless ALLOW_RLS_TESTS=true and the Supabase URL is not the production URL.
- Unit tests for the 'next' redirect validator with attack strings (//evil.com, /\evil.com, https://evil.com, javascript:alert(1), encoded variants).
- End-to-end tests: /login renders; an unauthenticated visit to /admin or /account redirects to /login; a test that opens a signed-in page and asserts localStorage and sessionStorage contain no token.

8. DOCS
- docs/DATABASE.md: every table, its purpose and the policy matrix in a readable table.

9. ACCEPTANCE CHECKLIST (report each as PASS or FAIL with evidence)
a. Migrations apply cleanly to a fresh database and are idempotent where marked.
b. Every table in the public schema has RLS enabled (show the query that proves it).
c. npm run test:rls passes every assertion, and show the output.
d. The service role key appears in no file outside src/server and is not in the client bundle (search the build output).
e. An open-redirect test suite passes.
f. Email code login and Google login both work in development (I will confirm by hand).
g. An admin without MFA is redirected to /admin/mfa, and after enrolment reaches /admin.
h. No token is stored in localStorage or sessionStorage.
i. Rate limiting blocks the sixth code request in an hour.
j. lint, lint:copy, typecheck, test and build pass, and npm audit shows no high issues.
Finish with the report format from PROJECT_RULES.md section 3.
```

**Your steps after the agent finishes**

1. Run `supabase db push` and let it apply the migrations to the dev project.
2. Run `npm run dev`, open `/login`, and sign in with your own email using the 6-digit code.
3. Make yourself the first admin. In Supabase, open SQL Editor and run the statement below, with your own email in place of the example.

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'you@example.com';
```

4. Open `/admin`. You should be sent to `/admin/mfa`. Scan the QR code with your authenticator app, enter the code, and save the secret in your password manager.
5. Run `npm run test:rls` with `ALLOW_RLS_TESTS=true` and check every line passes.
6. Sign out and try `/admin` as a signed-out visitor and as a plain student account. Both must be refused.

**Test before moving on:** the RLS test passes, a student cannot open `/admin`, an admin without the second factor cannot see admin data, and nothing about tokens appears in browser storage (open the browser developer tools, Application tab, and look).

## Prompt 4: Admin shell and catalogue management

This prompt builds the part of the admin panel you use to add real kits: projects, files, screenshots, categories and payment settings. It comes before the public catalogue because the catalogue must show only real kits that you upload.

**Your steps first**

1. Prepare your first real kit on your computer: the project code as a `.zip`, a setup guide (PDF), a viva questions file (PDF), optionally a report template and a PPT template, and at least three real screenshots of the project running. The site will refuse to publish a kit that lacks these.
2. Optional: upload a short demo video to YouTube as unlisted and keep its link.
3. Open `site.config.ts` and fill in the fields you know now (business name, support email, WhatsApp number, address). Leave `legalReviewedOn` empty until a lawyer has reviewed your policy pages.
4. Keep your UPI ID and the name shown on it ready. You enter them in the admin settings page after this prompt.

**Prompt**

```text
Read PROJECT_RULES.md in full and follow it for this whole task.

TASK: Build the admin shell, site settings, category management and project (kit) management. Admin only. Do not build public store pages in this task.

1. ADMIN SHELL
- Every /admin layout and page calls requireAdmin() itself, even though middleware also guards it.
- Navigation: a left list (stacked above the content on mobile) with Dashboard, Projects, Categories, Settings and Audit log. Use the navigation status approach from Prompt 2 so later sections (Orders, Requests, Mentoring, Reviews, Tickets) appear when their prompts are done.
- Dashboard: counts read from the database (projects by status; orders waiting for verification, which is 0 for now). Never show invented numbers.
- Audit log page: a read-only table (time in IST, admin email, action, entity, entity id, details) with pagination and a filter by action.

2. SETTINGS (/admin/settings)
- Edit these site_settings keys: upi_payee_name, upi_vpa (validate the VPA format: letters, digits, dot, hyphen or underscore, then @ and a handle), order_expiry_hours (default 24, range 1 to 72), max_downloads_default (default 5, range 1 to 20), proof_retention_days (a whole number from 1 to 365 with no default; npm run preflight -- --launch fails while it is empty).
- Changing upi_vpa or upi_payee_name requires a current TOTP code entered in the same form. Verify it through the Supabase MFA challenge and verify API before saving. After saving, write an audit row and send an email to the support email and to every admin email saying that the UPI details were changed, when, and by whom. This stops a hijacked session from quietly redirecting payments.
- Never show the settings values in client-side logs.

3. CATEGORIES (/admin/categories)
- List, add, rename, reorder (move up and down buttons, no drag animation) and deactivate categories by kind: branch, semester, scheme, domain, tech.
- scripts/seed-categories.ts inserts these starting values, refuses to run in production, and can be rerun safely: branches (CSE, ISE, CSE AI and ML, ECE, EEE, Mechanical, Civil), semesters 1 to 8, schemes 2018, 2021, 2022, 2025, domains (Web, Mobile, AI and ML, IoT, Blockchain, Cybersecurity, Data Science, Embedded, Networking). I will edit them in the admin page.

4. PROJECT MANAGEMENT (/admin/projects)
- List with search, a status filter and sorting by last updated. Columns: title, status, price, course type, files count, screenshots count, updated.
- Create and edit forms with: title, slug (generated from the title, editable, unique, lowercase letters, digits and hyphens only), summary (300 characters maximum), description, course type, difficulty, tech stack tags (up to 12, each up to 30 characters), price in rupees, an optional sales limit (a whole number; leave empty for no limit; it counts orders that are paid, pending or awaiting payment since sales_window_start, and the edit page shows that count next to a confirmed 'Start a new sales window' button that sets sales_window_start to now and writes an audit row, for example at the start of a semester), categories (branch, semester, scheme, domain), syllabus note, and demo video URL.
- The description is plain text: blank line makes a new paragraph and lines that begin with '- ' become bullet points. Render it with our own small renderer that builds React elements. Do not allow HTML and do not use dangerouslySetInnerHTML.
- The demo video URL must be a YouTube link (youtube.com or youtu.be). Parse out the video id, store it, and embed with the youtube-nocookie.com domain. The server never requests this URL.
- A project can be set to live only when: it has at least three screenshots with alt text, a code file, a setup guide and a viva questions file, a price above zero, and a description of at least 300 characters. Show this as a checklist on the edit page that explains what is missing. Report template and PPT template files are recommended and show a warning when absent.
- Delete is allowed only when no order references the project. Otherwise the page explains that the project can be hidden instead.
- Every create, update, status change and delete writes an audit_log row without personal data.

5. SCREENSHOTS
- Upload through a route handler or server action. Accept png, jpeg and webp only, 4 MB maximum. Check the real file signature, then re-encode with sharp to webp, maximum width 1600 px, metadata stripped, and store in public-media under a random file name. Require alt text. Allow reorder and delete. The first screenshot is the cover.
- SVG, GIF, HTML and any other type are refused.

6. PROJECT FILES (large, direct upload)
- Server action createUploadUrl(projectId, kind, fileName, size, contentType): requires an admin, validates the extension and content type allowed for that kind (code and other: zip; report, setup_guide and viva_qa: pdf, docx; ppt: pptx; size up to 200 MB), generates our own random object name under projects/{projectId}/, and returns a signed upload URL. The client uploads straight to storage and shows plain text progress.
- Server action finalizeUpload(...): reads the first bytes of the stored object and checks the real signature (zip files and OOXML start with PK, PDFs with %PDF), checks the real size from storage metadata, and only then inserts the project_files row. When anything fails, delete the object and show a plain error. Compute sha256 only for files up to 25 MB, otherwise leave it empty.
- Replace a file (version goes up, the old object is deleted only after the new one is verified) and delete a file. List each file with kind, original name, size and version.
- File names from the client are never used in paths. Sanitise the original name for display only.

7. SECURITY REQUIREMENTS FOR THIS TASK
- Every server action starts with requireAdmin(), assertSameOrigin where it is a route handler, zod validation of every field, and a rate limit of 60 actions per minute per admin.
- Never accept an id from the client without loading the record and checking it exists.
- Tests: a signed-out visitor, a student, and an admin without MFA are each refused on every action and page. An .exe renamed to .zip is refused. A text file renamed to .png is refused. An SVG is refused. A 5 MB screenshot is refused. A file name containing ../ is handled safely. Attempting to set a project live without the required files fails with a clear message. A second admin session cannot change the UPI details without a valid TOTP code.

8. ACCEPTANCE CHECKLIST (report each as PASS or FAIL with evidence)
a. All admin pages and actions pass the refusal tests above.
b. I can create a project, upload files and screenshots, see the go-live checklist, and publish it (I will confirm by hand).
c. Uploaded files sit in private buckets and a direct URL to them does not work without a signed link.
d. Screenshots are stored as webp with no metadata (verify with a tool).
e. Changing the UPI details demands a TOTP code and sends the notification email (use a log or test inbox in development).
f. Audit rows exist for every change made in the tests.
g. lint, lint:copy, typecheck, test and build pass.
Finish with the report format from PROJECT_RULES.md section 3.
```

**Your steps after the agent finishes**

1. Run the seed script for categories on the dev project and open `/admin/categories` to adjust the list to the branches you serve.
2. Open `/admin/settings` and enter your UPI payee name and UPI ID. Enter the TOTP code when asked.
3. Create your first kit as a draft. Upload its files and screenshots. Try to publish with a file missing and confirm the checklist blocks you.
4. In the Supabase dashboard open Storage and check that `project-files` is marked private, and try opening a file's address in a private browser window. It must not load.

**Test before moving on:** only you, with your second factor, can reach and use the admin pages; bad files are refused; the kit publishes only when complete; changing the UPI ID demands a fresh code.

## Prompt 5: Home page, catalogue and kit pages

This prompt builds everything a visitor sees before paying: the home page, the filterable project list and the kit detail page. The exact wording is supplied, so the agent does not invent hero lines, statistics or reviews.

**Your steps first**

1. Make sure at least one real kit is published in the dev admin panel (Prompt 4), with screenshots and files.
2. Check `site.config.ts` has your real WhatsApp number (digits only, with country code, for example 91 followed by your number), because the page builds a click-to-chat link from it.
3. Start a new conversation.

**Prompt**

```text
Read PROJECT_RULES.md in full and follow it for this whole task.

TASK: Build the home page, the public project list and the kit detail page. Use only the design system components from Prompt 2. Use the exact copy given here and do not add marketing copy of your own. Where I give no copy, write plain factual text that follows section 5 of the rules.

1. HOME PAGE (/)
Hero:
- h1: 'Mini project and major project kits for VTU engineering students'
- Paragraph: 'Each kit has the source code, a setup guide, report and presentation templates, and viva questions. You can also ask for a project built to your topic, or book a mentor to review your own work. Pay by UPI. We verify each payment by hand before releasing files.'
- Two buttons: 'Browse projects' (primary, links to /projects) and 'Request a project' (secondary, links to /request; render only when that route is live).
Section 'Three ways to get help' (three columns that stack on mobile, each a short heading and paragraph, no icons):
- 'Project kits': 'A finished, working project with everything you need to understand it, run it and present it. The price is shown on each page.'
- 'Custom project': 'Tell us your topic, branch and deadline. We reply with a written scope and a price. You take part in each milestone.'
- 'Mentoring': 'Book a session with a mentor to review your plan, code, report or presentation, or to practise your viva.'
Section 'What is in a kit' (a definition list):
- Source code: 'The full project as a zip file, with a README.'
- Setup guide: 'Step-by-step instructions to run the project on your own computer.'
- Report template: 'A chapter outline with notes on what each chapter should cover. Your college may require its own format, so check it. You write the report in your own words.'
- Presentation template: 'A slide outline for your project presentation.'
- Viva questions: 'Questions your evaluators may ask, with explanations, so that you understand your project.'
Section 'Find projects for your semester': links to /projects filtered by course type: 'Mini project', 'Project Phase I', 'Major project Phase II', 'Capstone'. Add this note: 'Course names and semesters differ by scheme and branch. Check your college's scheme document.'
Section 'How we work' (short, links to the integrity policy page when it is live): 'Kits are for learning, reference and guided customisation. You must follow your college's and VTU's rules, and you must be able to explain every part of your project. We do not take exam work, lab records or copied work.'
Section 'Questions' (an accessible disclosure list, no animation):
- 'Can I submit a kit as my own project?' 'No. A kit is a learning and reference resource. Your college expects your own work and you must be able to explain it in your viva. Use the kit to understand a working design, then customise it, extend it and write your own report.'
- 'Which scheme and branch does a kit cover?' 'Each kit page lists its branch, semester and scheme. Use the filters on the project list.'
- 'How do I get my files?' 'After we verify your payment, the files appear under My purchases and we send you an email. Each file can be downloaded a limited number of times.'
- 'What if my payment is rejected?' 'We email you the reason and you can submit the correct UTR number again.'
- 'Can you build a project on my own topic?' 'Yes, through a custom request. We review it, send a written scope and a price, and you take part in every milestone. We decline exam work, lab records and copied work.'
- 'Do you give refunds?' 'The refund policy explains what can be refunded. Please read it before you buy.' (link when live)
Mark up only these real questions as FAQPage structured data.
No statistics, no counters, no testimonials, no logos of colleges or companies, no stock or generated images, no 'trusted by' text. Do not render any section whose destination route is not live yet.

2. PROJECT LIST (/projects)
- Server-rendered, driven by URL parameters, and fully usable without JavaScript: the filters are a normal GET form. Parameters: q, branch, semester, scheme, type, tech, difficulty, price_min, price_max, sort (newest, price_low, price_high, title) and page.
- Validate every parameter with zod using allowlists taken from the categories table. Unknown values and invalid values are ignored and never echoed into queries. Use only the Supabase query builder or parameterised SQL. Search uses websearch_to_tsquery on the search column.
- Page size 12. Show the real result count, for example '12 projects'. Filters on mobile sit inside a disclosure labelled 'Filters'. Show the number of matches next to each filter option, calculated from live data.
- Card: cover image (next/image with explicit width and height, alt text from the project_media row), title, a meta line (course type, branches, semester, scheme), the summary limited to two lines, up to four tech tags, and the price on the right. Show a rating only if the project has at least one approved review, using the real average. Otherwise show nothing.
- Empty states: when no project is live: 'No projects are listed yet. You can request a project, or check again soon.' When filters match nothing: 'No projects match these filters.' with a 'Clear filters' link.
- Landing routes for single filters, generated from the categories: /projects/branch/[slug], /projects/semester/[number], /projects/type/[slug]. Each has its own h1 and a one-sentence factual intro. A landing page with zero results is set to noindex.

3. KIT DETAIL (/projects/[slug])
- Only projects with status live are public. A draft or hidden project returns 404 to everyone, including students. Admins see drafts at /admin/projects/[id]/preview, which renders the same component with a banner 'Draft preview. Not visible to the public.'
- Layout: breadcrumbs; h1 and summary; the price and a 'Buy this kit' button (render only when checkout is live; it links to the checkout start route from Prompt 6; when the project has a sales_limit and the number of its orders that are paid, pending or awaiting payment since sales_window_start has reached it, show the text 'Not available right now. You can request a custom version, or check again next semester.' in place of the button); a link 'Ask a question on WhatsApp' that opens https://wa.me/<number> with the prefilled text 'Hello, I have a question about the project: <title> (<page url>)', with rel='noopener noreferrer'.
- Screenshot gallery: the first image large, the rest as keyboard-operable thumbnails. No autoplay and no carousel animation.
- 'What is included': a table of the file kinds present, with name and size, read from the project_file_summaries view. Never show a storage path or a download link.
- 'Fits': course type, semester, scheme, branch, difficulty and tech stack as a definition list.
- Description rendered with the safe renderer from Prompt 4, then the syllabus note.
- Demo video: show a button 'Load video'. Only after the click, insert the youtube-nocookie.com iframe (no requests to YouTube before the click).
- 'Before you buy' notice: 'This kit is for learning and reference. You must follow your college and VTU rules and be able to explain the project.' with a link to the integrity policy when live.
- Approved reviews, if any, with the reviewer's first name and the date. When there are none, render nothing and no 'be the first' text.
- Up to three related kits (same branch and semester) when they exist.

4. SEO AND PERFORMANCE
- generateMetadata for every page: a unique title and description, a canonical URL, Open Graph tags (use the cover image). Keep robots noindex until Prompt 11.
- JSON-LD (serialised safely, with < escaped): Product with offers (price, priceCurrency INR, availability InStock, url) and BreadcrumbList. Add aggregateRating only when at least one approved review exists, using real values.
- Images use next/image with sizes, lazy loading (priority only for the main cover), and explicit dimensions so the layout does not shift.
- Report the JavaScript size of each route in your final report.

5. ACCEPTANCE CHECKLIST (report each as PASS or FAIL with evidence)
a. Home, list and detail pages render the exact copy above and nothing invented. Search the output for banned words and dashes (lint:copy passes).
b. The list works with JavaScript disabled, and each filter, sort and page works.
c. Injection strings in every parameter (a quote followed by a drop table statement, a script tag, very long values, arrays) return safe results or are ignored, never errors with internals.
d. Draft and hidden projects return 404 for guests and for students, and render for an admin only in the preview route.
e. The rendered HTML of any public page contains no storage path, no project-files bucket name and no signed URL.
f. The video loads only after the Load video click (check the network log).
g. Structured data validates, and aggregateRating is absent when there are no reviews.
h. An accessibility scan finds no serious violations at 360 px and 1280 px, and there is no horizontal scroll at 360 px.
i. lint, lint:copy, typecheck, test and build pass.
Finish with the report format from PROJECT_RULES.md section 3.
```

**Test before moving on**

1. Open the home page on your phone. Read every line: it should sound like a careful person wrote it, with no hype and no numbers you cannot back up.
2. Open `/projects`, use each filter, and search for a word from your kit's title.
3. Open your kit's page and check the screenshots, the included files list, and that no download link appears anywhere.
4. Tap the WhatsApp link and check it opens a chat with your number and the right message.
5. As a student account, try the address of a draft kit. You should get a 404.

## Prompt 6: Checkout and manual UPI payment

This prompt builds the student side of paying by QR: creating an order, showing a QR code with the exact amount, collecting the UTR number and an optional screenshot, and tracking the order. Nothing unlocks yet; you verify and approve payments in Prompt 7.

**Your steps first**

1. Create a Resend API key (Resend dashboard, API Keys) and put it in `.env.local` as `RESEND_API_KEY`.
2. For development, set `EMAIL_FROM` to Resend's test sender (shown in their dashboard) and note that in test mode it can send only to your own email address. You verify your real domain in Prompt 11.
3. Check that `/admin/settings` holds your real UPI payee name and UPI ID.
4. Start a new conversation.

**Prompt**

```text
Read PROJECT_RULES.md in full and follow it for this whole task.

TASK: Build the kit checkout with manual UPI payment, student order pages, the email service, and the order expiry job. Payments are verified by an admin in Prompt 7. Do not release files in this task.

0. SETTINGS ADDITION
- Add the key verification_time_text to /admin/settings (free text, up to 120 characters, no default). Checkout shows it when set. npm run preflight warns when it is empty.

1. EMAIL SERVICE (src/server/email)
- A Resend provider and sendEmail(template, to, data). Templates are typed functions that return a subject, a plain text body and a simple HTML body (no images, no tracking pixels, system fonts, every variable escaped). Create now: payment_submitted_admin (to the support email and all admin emails), payment_received_student, order_expired_student. Prompt 7 adds approved and rejected.
- Content rules: show the order code, the amount and the kit title; show only the last 4 digits of a UTR; link to the site by plain URL. Apply the copy rules (no hype, no dashes).
- Email failure never breaks the order: log the failure without addresses and continue. Rate limit sends per user per hour.
- In development when RESEND_API_KEY is empty, write each email to a .dev-mail folder (git-ignored) instead of sending.

2. ORDER CREATION
- /checkout/start?project=<slug> requires login (redirect to /login with a safe next value). Checkout needs no profile details beyond the sign-in. If the profile has no display name yet, show one small field on this page asking for a name or nickname (saved to the profile), because the order slip and the emails need something to address. Do not ask for phone, college, branch, semester or scheme anywhere in checkout.
- One kit per order in this release. The page shows the kit summary, the price read from the database, an optional coupon field, and a required checkbox with this exact label: 'I will follow my college and VTU rules, I will use this kit to learn and customise it, and I will be able to explain the project myself.' Link to the Terms and Privacy pages when they are live. Button: 'Create order'.
- Server action createOrder validates with zod, loads the live project, reads the price from the database, validates the coupon on the server (active, in date, not exhausted, and the total after discount must stay at least 1 rupee; a percentage discount is rounded down to whole rupees), and creates the order and its order_item inside one SQL function that first locks the project row (for update). When the project has a sales_limit and the number of its orders with status awaiting_payment, pending_verification or paid since sales_window_start has reached it, the function creates nothing and the page says: 'This kit is not available right now. You can ask for a custom version, or check again next semester.' Redeemed counts change only at approval (Prompt 7).
- Reuse an existing open order for the same user and kit (awaiting_payment, pending_verification) instead of creating a duplicate. If the user already has a paid order for the kit, redirect to /account/orders with a message.
- Generate the order code on the server with crypto randomness. Set expires_at from order_expiry_hours. Rate limit: 10 new orders per user per hour.

3. PAYMENT PAGE (/checkout/[orderId])
- Only the owner can open it. For anyone else return a plain 404 that does not reveal that the order exists.
- Show: the order code, the kit title, and the amount to pay in large IBM Plex Mono type. The UPI QR is generated on the server as an SVG with the qrcode package from this URI: upi://pay?pa=<vpa>&pn=<url-encoded payee name>&am=<amount with two decimals>&cu=INR&tn=<order code>. Also show the UPI ID as text with a copy button, the payee name, and on mobile a link 'Open in your UPI app' using the same URI. Build the URI with proper encoding so a payee name containing & or spaces cannot alter the other parameters.
- Instructions (plain text, numbered): 1. Pay exactly the amount shown, and put the order code in the payment note if your app allows it. 2. Enter the 12-digit UTR number (also called the UPI reference number) from your payment details. 3. If you want to, upload a screenshot of the successful payment. It is optional. 4. We check the payment against our bank record and release your files. Then show verification_time_text if it is set.
- Form fields: utr (exactly 12 digits, trimmed), paid_via (optional, up to 30 characters, for example the app name), screenshot (optional; png, jpeg or webp, 3 MB maximum). Under the screenshot field show: 'Optional. We check your UTR number and the amount against our bank record. If you upload a screenshot, we delete it N days after your payment is checked.' Read N from proof_retention_days in settings. Show the validation errors next to each field.
- Server action submitPaymentProof: confirm the signed-in user owns the order; the order status is awaiting_payment, or rejected with fewer than 3 attempts; the order has not expired. Validate with zod. Check that the UTR is not already used by another pending or paid payment and say only: 'This UTR is already used for another order. Check the number or contact support.' If a screenshot was supplied, verify its signature, re-encode it with sharp to webp (maximum 1600 px, metadata stripped) and store it in payment-proofs at <user id>/<order id>/<random>.webp with the service role. If none was supplied, leave proof_path empty and continue; a missing screenshot is never an error. Then in a single database transaction (a SQL function) insert the payment row (amount_inr copied from the order total on the server, status pending_verification, attempt number) and move the order to pending_verification, so a half-finished state is impossible. Send the two emails. Rate limit: 5 submissions per user per hour.
- An expired order shows 'This order has expired.' with a link to start again.
- Never trust any amount, price, status or user id sent from the browser.

4. ORDER PAGES
- /account/orders (list) and /account/orders/[id] (detail, owner only). Show the status in plain words: awaiting_payment 'Waiting for your payment'; pending_verification 'We are checking your payment'; paid 'Payment verified'; rejected 'Payment not accepted' followed by the reason; expired 'Order expired'; refunded 'Refunded'; cancelled 'Cancelled'. Show a simple dated timeline (created, proof submitted, verified). Actions: 'Pay now' for awaiting, 'Submit again' for rejected, and 'Downloads' for paid (built in Prompt 7). Add 'My orders' to the header account menu and switch the Projects 'Buy this kit' button on live.
- A printable order slip page at /account/orders/[id]/slip titled 'Order slip', showing the business name from site.config, the order code, date, kit, amount and status. Do not call it a tax invoice. Add a tax invoice only when the owner records a GSTIN in site.config and asks for it.

5. PAYMENT PROVIDER
- Implement ManualUpiProvider in src/server/payments/manual-upi.ts against the interface from Prompt 1. A registry function getProvider('manual_upi') is the only thing pages call, so a gateway provider can be added later without changing pages or orders.

6. EXPIRY JOB
- GET /api/cron/expire-orders requires the header 'Authorization: Bearer <CRON_SECRET>' compared in constant time. Without it, return 401 with no detail. It sets awaiting_payment orders past expires_at to expired, never touches pending_verification orders, sends order_expired_student emails, and returns only counts. Add vercel.json with an hourly cron for this path.

7. SECURITY REQUIREMENTS FOR THIS TASK
- Every action checks the session user against the order owner, validates with zod, uses rate limits, and writes no UTR (more than the last 4 digits), email address or file path to logs.
- Payment proofs are never public. They are viewed only by admins through signed links created in Prompt 7.
- Tests: student B opening or submitting against student A's order gets the same 404 as a nonexistent order; a changed price or amount in the request body is ignored; a reused UTR is refused; a fourth rejected resubmission is refused; a kit at its sales limit refuses a new order, and two simultaneous orders for the last place create only one; an expired order cannot take a proof; the UPI URI builder encodes a payee name like 'A & B Co' safely and formats the amount with two decimals; the QR encodes exactly that URI; a text file renamed .png is refused; a 4 MB image is refused; a submission with no screenshot is accepted and stores an empty proof_path; the cron route returns 401 without the secret and with a wrong secret.

8. ACCEPTANCE CHECKLIST (report each as PASS or FAIL with evidence)
a. An end-to-end test creates an order, sees the QR and amount, submits a test UTR with an image, and sees 'We are checking your payment'. A second test does the same on another order with no image.
b. The security tests above all pass, and the checkout and account forms ask for no college, branch, semester or scheme (list every form field as evidence).
c. The payment row and the order status change together, or neither changes (show the transaction test).
d. Emails are produced for each event (development mail folder), contain no more than the last 4 digits of the UTR, and contain no banned words.
e. The expiry job expires only the right orders.
f. lint, lint:copy, typecheck, test and build pass.
Finish with the report format from PROJECT_RULES.md section 3.
```

**Test before moving on**

1. In development you do not need to pay. Sign in as a student, open your kit and press Buy, create the order, and look at the QR and amount.
2. Scan the QR with your own UPI app and check it shows the right payee name and the exact amount. Do not complete the payment, close the app.
3. Submit any 12-digit number, once with a screenshot and once without. The order should say "We are checking your payment".
4. Look in the `.dev-mail` folder for the two emails and read them for tone and accuracy.
5. Sign in as a second student account and try the first student's order address. You should get a 404.

## Prompt 7: Payment verification and secure downloads

This prompt gives you the verification queue and releases files safely. Approving a payment is the one action that turns a screenshot into access, so it is built to be hard to do by mistake and impossible to do twice.

**Your steps first**

1. Decide how many days to keep a payment screenshot after the payment is checked (ask your accountant first) and enter that number in /admin/settings as proof\_retention\_days. Then decide how you will check payments: open your bank or UPI app's transaction history next to the admin page. The UTR in the history must match the one the student typed, the amount must equal the expected amount, and the credit must be dated after the order was created.
2. Start a new conversation.

**Prompt**

```text
Read PROJECT_RULES.md in full and follow it for this whole task.

TASK: Build payment verification, refunds, and secure file downloads. Admin pages and actions require requireAdmin() with the MFA level.

1. VERIFICATION QUEUE (/admin/payments)
- A list of payments with status pending_verification, oldest first, showing the age of each. Filter by status and search by order code.
- Detail page: order code, the student's display name, their phone number only if they gave one, kit, expected amount, the full UTR, the paid_via text, submission time, attempt number, and, only when the student uploaded one, the screenshot shown through a signed URL created on page load that expires in 60 seconds. When there is no screenshot, say 'No screenshot uploaded. Check the UTR and amount in your bank record.' Never show a college, branch, semester or scheme here. Show a plain checklist: 'Find this UTR in your bank record. The amount must equal the expected amount. The credit must be dated after the order was created.'
- Approve: a dialog that shows the amount and asks me to type the last 4 digits of the UTR as they appear in my bank record. The action is refused unless they match the stored UTR.
- Reject: choose a reason (Amount does not match, UTR not found in bank record, Screenshot unclear, Duplicate payment, Other) and write an optional note of up to 300 characters, which the student will see.
- Mark refunded: requires a refund amount (not above the paid amount) and a refund reference text, for example the UPI reference of the money I sent back. The money itself is returned by me outside the site.

2. DATABASE FUNCTIONS (each in one transaction, called only through the service role after the checks in section 5)
- approve_payment(payment_id, admin_id): lock the payment row (for update); do nothing and return 'already_processed' unless its status is pending_verification; set the payment to paid with verified_by and verified_at; set the order to paid; create one download_grants row per project in the order items using max_downloads_default from site_settings; if a coupon was used, add a coupon_redemptions row and increase redeemed_count; write an audit_log row; return 'ok'.
- reject_payment(payment_id, admin_id, reason, note): same locking and idempotency; set the payment and order to rejected, with verified_by and verified_at recording the decision time; write audit.
- refund_payment(payment_id, admin_id, amount, reference): allowed only from paid; set the payment and order to refunded; set revoked_at on every grant of the order; write audit.
- Cancelling or expiring never affects a paid order.
- Screenshot retention: a SQL function purge_expired_proofs(batch_size) selects payments whose proof_path is not null, proof_deleted_at is null, status is not pending_verification, and verified_at is older than proof_retention_days (from site_settings), and returns their ids and paths. GET /api/cron/purge-proofs, protected exactly like the expiry job (Bearer CRON_SECRET compared in constant time, 401 with no detail, returns only counts), deletes those files from the payment-proofs bucket with the service role, and only after a file is deleted sets proof_path to null and proof_deleted_at to now(). If a file cannot be deleted, leave the row so the next run retries it. It never deletes or edits the payment row's UTR, amount, status or the order, and it writes one audit row with the count only. If proof_retention_days is empty it does nothing and returns that fact. A payment that is still pending_verification is never purged. Add it to vercel.json as a daily cron.

3. EMAILS (add to the Prompt 6 service)
- payment_approved_student (links to the order page, never to a file), payment_rejected_student (reason and note, and a link to submit again), refund_recorded_student. Same content rules as before.

4. ADMIN ORDERS (/admin/orders)
- List with filters (status, type) and search by order code or student email. Detail page shows items, payment attempts, grants and download counts. Actions: resend the access email, reset a grant's download count, revoke a grant. Each writes an audit row. Add Orders and Payments to the admin navigation and show the true number of payments waiting on the dashboard together with the age of the oldest one.

5. SECURE DOWNLOADS
- On /account/orders/[id], for a paid order, list each file by kind, name and size, and show 'Downloads left: N of M' per kit.
- A download is a POST (a form button), never a link that changes state, so prefetching and email scanners cannot use up downloads. The server action: requires a signed-in owner; loads the grant by order id and user id; requires the order to be paid, the grant not revoked, not expired and download_count below max_downloads; then calls an atomic SQL function consume_download(grant_id, file_id, ip_hash) that rechecks the same conditions, increments the count, writes download_log and returns the storage path, all in one statement. Only then create a signed URL that expires in 60 seconds and redirect to it with a 303 response, Cache-Control no-store and Referrer-Policy no-referrer. If creating the URL fails, roll the count back.
- Rate limits: 5 downloads per minute and 30 per hour per user.
- A licence slip: a downloadable text file named LICENCE-<order code>.txt generated on the fly (it does not use up a download) with the buyer's display name, order code, kit title, date and the text from src/content/licence.ts. Write that text to say: 'Licensed to the named buyer for personal learning and reference. No resale, no sharing, no public upload. You must follow your college and VTU rules.' Prompt 10 reviews it against the Terms.
- Store hashed IP addresses only. Never log file paths or signed URLs.

6. SECURITY REQUIREMENTS FOR THIS TASK
- Each action runs requireAdmin() (or requireUser() for students), a same-origin check, zod validation and a rate limit. Admin actions: 60 per minute per admin.
- Never load a payment, order or grant by id alone for a student: always scope by the owner.
- Tests (all must exist and pass): student B cannot download or see student A's files (404); a revoked, expired, exhausted or unpaid grant is refused; a GET request to the download route does not change the count; the signed URL stops working after 60 seconds (use a test double); approving the wrong last-4 digits is refused; approving a payment that is already paid, rejected or refunded changes nothing; two simultaneous approvals create exactly one set of grants; an admin session without MFA is refused on every action; refunding revokes access and a download after refund is refused; the licence slip is generated without using up a download; guessing a storage path gives no access; a payment with no screenshot can be approved and rejected; the purge job deletes only screenshots of decided payments older than the retention period, keeps the payment, UTR and order rows, does nothing when the setting is empty, retries a file it failed to delete, and returns 401 without the secret.

7. ACCEPTANCE CHECKLIST (report each as PASS or FAIL with evidence)
a. The full loop works in development: a student submits proof, I approve, the student downloads the files and sees the counts go down, I refund, and the student loses access.
b. All security tests above pass, including the concurrency test.
c. Audit rows exist for approve, reject, refund, reset and revoke.
d. No file path, signed URL, full UTR or screenshot path appears in logs (search the log output of the test run). After the purge job runs on a test screenshot older than the retention period, the file is gone and the payment, UTR and order rows remain (show the rows before and after).
e. lint, lint:copy, typecheck, test and build pass.
Finish with the report format from PROJECT_RULES.md section 3.
```

**Test before moving on**

1. As a student, submit a payment proof for your kit (any 12-digit number works in development; try once with a screenshot and once without).
2. As admin, open `/admin/payments`, look at the screenshot if there is one, press Approve, and type the last four digits. Press Approve twice quickly and check nothing doubles.
3. As the student, open My orders, download one file, and check the "Downloads left" number drops. Download the licence slip and read it.
4. Reject a second submitted payment and read the email the student gets.
5. Refund the first order and check the student can no longer download.
6. Open the file's storage address (Supabase dashboard) in a private window. It must not open.

**This is Gate 2.** Do not go on until a test payment can be approved, unlocks a file, and can be refunded and revoked.

## Prompt 8: Custom project requests

This prompt builds the custom path: a student describes a project, you send a written scope and price, the student pays a deposit, a builder works through milestones that need the student's input, and the final files are released after the balance is paid. It reuses the UPI payment and download system from Prompts 6 and 7.

**Your steps first**

1. Decide who the builders are. Each builder signs up on the site with their own email. After this prompt you promote them with a SQL statement like the admin one in Prompt 3, using the role `builder` instead of `admin`.
2. Decide the deposit rule you want to offer (for example a share of the total) and write down what you will refuse. The form lists the refusals; they must match your real policy.
3. Start a new conversation.

**Prompt**

```text
Read PROJECT_RULES.md in full and follow it for this whole task.

TASK: Build the custom project request flow for students, builders and admins, reusing the existing payment, order and secure download systems. Add Requests to the admin navigation and make /request live.

0. MIGRATIONS TO ADD
- request_files: add is_final boolean default false.
- Change is_builder() so that it also requires the MFA level (aal2), the same as is_admin().
- Update approve_payment(): after an order is paid, if its order item has a request_id, then for an item labelled 'Deposit' set the request to in_progress, and for an item labelled 'Balance' set the request to completed. Keep it idempotent and add tests.

1. STUDENT REQUEST FORM (/request)
- Public explanation above the form, in plain text: how it works in four steps (you send the request, we reply with a written scope and a price, you accept and pay a deposit, we build in milestones and you take part in each one); you are not charged until you accept a quote; and a box titled 'What we do not take' listing exam answers, lab records, work another student has already submitted, and copied or plagiarised work.
- The form needs login (redirect with a safe next value). Fields: title (up to 120), brief (50 to 3000 characters), branch, semester and scheme (project details that live on the request only and are never copied to the profile), course type, technology preference (optional, up to 200), deadline (a date at least 7 days ahead), budget in rupees (optional), team size (1 to 4), up to three reference files (pdf, docx, png, jpeg, txt, each up to 3 MB, checked by real signature, stored privately), and a required checkbox with this label: 'I will follow my college and VTU rules, I will take part in each milestone, and I will be able to explain the project myself.'
- Server action createRequest with zod validation, rate limit of 3 new requests per user per day, and an email to the student and to the admins.

2. STATUS MACHINE
- Statuses and the only allowed transitions: submitted to under_review, declined or cancelled; under_review to quoted, declined or cancelled; quoted to accepted, declined or cancelled; accepted to in_progress (automatic, when the deposit order is paid); in_progress to delivered; delivered to completed (automatic, when the balance order is paid); any non-final status to cancelled by admin. Implement it as one typed table and one SQL-backed function, and write tests for every allowed and every forbidden transition. The browser can never set a status directly.

3. ADMIN (/admin/requests)
- Queue with status filters. Opening a submitted request moves it to under_review.
- Quote form: scope text, total price, deposit amount (at least 1 rupee and not above the total), valid until (date), expected delivery date, an assigned builder (chosen from users with the builder role), and two to eight milestones, each with title, description, due date, a 'needs student input' flag and, when flagged, a text saying exactly what the student must provide. Sending a quote moves the request to quoted and emails the student.
- Decline with a reason shown to the student. Admin can read all messages (for support and disputes) and can move a request to cancelled with a note. Every change writes an audit row.

4. STUDENT PAGES (/account/requests and /account/requests/[id])
- Plain-language statuses: Submitted; Under review; Quote ready; Accepted; In progress; Final files ready (balance due); Completed; Declined (with reason); Cancelled.
- Quote view with scope, price, deposit, balance, valid-until date and the milestone list. Buttons: 'Accept quote' (with the checkbox 'I accept this scope and price and I will take part in each milestone') and 'Decline quote'. Accepting creates an order of type custom with one order item labelled 'Deposit' for the deposit amount, with ack_integrity copied from the request, and sends the student to the existing payment page. An expired or already-accepted quote cannot be accepted.
- Milestones: for each one that needs input, show what is needed and a text box (up to 2000 characters) plus a Save button. Milestone statuses are pending, in_progress, awaiting_student and done.
- Messages: a plain-text thread per request (no attachments, no automatic links, line breaks kept), a send box up to 4000 characters, rate limit 20 messages per hour, and a 'Refresh' link. No live updates or animation. Email notification for a new message at most once every 30 minutes per thread.
- Files: milestone deliverables are visible to the student when the milestone is done. Final files (is_final true) are listed but locked, with the text 'Final files are released after the balance is paid.' Delivery of the final files moves the request to delivered and creates an order with one item labelled 'Balance' for the balance amount. After that order is paid and approved (Prompt 7), the final files become downloadable through the same secure download pattern (a POST, ownership check, 60-second signed URL, per-file counts and logs), and the request becomes completed.

5. BUILDER PAGES (/builder)
- Requires the builder role and the MFA level. Lists only assigned requests.
- Detail shows the brief, requirements, student reference files, milestones, messages and the student's first name only. It must never show the student's email address, phone number, surname or any college. Branch, semester and scheme appear only as project details of the request.
- Actions: update milestone status, add notes, upload deliverables, mark delivery. Uploads use the signed upload and finalize pattern from Prompt 4 into the request-files bucket (zip, pdf, docx, pptx, png, jpeg, txt; up to 200 MB; real signature check). A builder marks files as final only when marking delivery.

6. EMAILS
request_received, quote_sent, request_declined, milestone_input_needed, new_message (throttled), final_files_ready (with the balance amount), request_completed. Same content rules as before.

7. SECURITY REQUIREMENTS FOR THIS TASK
- Every page and action checks the role and the ownership or assignment, validates with zod, and uses rate limits. Student pages scope queries by user id. Builder pages scope by assigned_builder_id and select only allowed columns.
- Tests (all required): student B cannot read or write student A's request, files, milestones or messages; a builder cannot open an unassigned request; a builder view contains no email, phone, surname or college; a builder without MFA is refused; final files cannot be downloaded before the balance order is paid, even with a guessed id; a deposit approval moves the request to in_progress exactly once; a balance approval completes it; an expired quote cannot be accepted; accepting twice creates one order; every forbidden status transition is refused; an HTML or script string in the brief, a milestone input or a message is shown as plain text; a renamed executable upload is refused.

8. ACCEPTANCE CHECKLIST (report each as PASS or FAIL with evidence)
a. In development: I submit a request as a student, quote it as admin, accept and 'pay' the deposit (approved by me), work a milestone as a builder, mark delivery, 'pay' the balance, and download the final files as the student.
b. All tests above pass.
c. RLS tests (npm run test:rls) are extended for the new tables and pass.
d. lint, lint:copy, typecheck, test and build pass.
Finish with the report format from PROJECT_RULES.md section 3.
```

**Your steps after the agent finishes**

1. Run `supabase db push` for the new migrations.
2. Promote a builder account: in Supabase SQL Editor run the statement below with the builder's email, after they have signed in once.

```sql
insert into public.user_roles (user_id, role)
select id, 'builder' from auth.users where email = 'builder@example.com';
```

3. Ask the builder to open `/builder` and set up their authenticator the same way you did.

**Test before moving on (Gate 3):** a full request goes from form, to quote, to approved deposit, to a milestone, to final files locked until the balance is paid. Try to cheat each step as a second student and as the builder and confirm every attempt is refused.

## Prompt 9: Mentoring bookings

This prompt builds paid one-to-one mentoring sessions: tiers you define, time slots your mentors open, booking with a short hold while the student pays by UPI, and meeting links released only after you verify the payment. The first release supports single-session tiers only; packs of several sessions come later.

**Your steps first**

1. Decide your tiers: a name, what is covered, the session length in minutes and the price. You enter them in the admin panel after this prompt, so nothing is invented by the agent.
2. Decide who the mentors are. They use the builder role from Prompt 8, with their own accounts and authenticator.
3. Decide how a session is held (for example a Google Meet link the mentor creates). The site stores a link; it does not create meetings.
4. Start a new conversation.

**Prompt**

```text
Read PROJECT_RULES.md in full and follow it for this whole task.

TASK: Build mentoring tiers, slots, bookings, admin and mentor tools, reminders, and the student pages. Reuse the existing order, UPI payment and verification system. Make /mentoring live in the navigation and add Mentoring to the admin navigation.

0. MIGRATIONS TO ADD
- mentor_slots: add held_until (null) and held_by (null).
- bookings: add reminder_sent_at (null), cancelled_reason (null). Replace the unique constraint on slot_id by a partial unique index that applies only while the booking status is not cancelled or refunded.
- Restrict session_count to 1 for now with a check constraint.
- Update approve_payment(): when the paid order has a booking, set the booking to confirmed and the slot to booked. Keep it idempotent and add tests.

1. PUBLIC PAGE (/mentoring)
- Use this copy: 'Mentoring is a live session with a mentor. We review your own work and help you understand it. We do not write your project or your report.'
- 'What a session can cover' as a list: reviewing your project plan, walking through your code, reviewing your report, practising your presentation, and a mock viva.
- A table of active tiers read from the database: name, description, session length, price and a 'Choose a time' link. Do not render any tier text that is not in the database. If there are no active tiers, show: 'Mentoring sessions are not open for booking yet.'
- 'How booking works': choose a session, choose a time, pay by UPI, and we confirm the booking and send the meeting link after we verify your payment.

2. BOOKING FLOW
- /mentoring/book/[tierId] (login needed) lists open slots for the next 30 days grouped by date, always displayed in IST with the label 'IST'. A slot must start at least mentoring_min_notice_hours from now (default 12, editable in /admin/settings).
- Choosing a slot calls the SQL function hold_slot(slot_id, user_id, tier_id): lock the slot row (for update), require status open, set it to held with held_until two hours ahead, create the booking (awaiting_payment) and the order and order item (label is the tier name), and set the order expiry to match. Two people choosing the same slot at the same moment: exactly one succeeds and the other sees 'This time was just taken. Please choose another.'
- Then show the existing UPI payment page. Rejected payments keep the booking awaiting payment until the hold ends. When a payment is approved (Prompt 7 flow) the booking becomes confirmed and the slot booked.
- Extend the hourly expire job: release slots whose hold passed and cancel the related awaiting_payment bookings and orders.
- Rate limit: 5 bookings per user per hour. Add the required integrity checkbox on the booking page with the same label as the kit checkout.

3. STUDENT PAGES
- /account/bookings: each booking with tier, date and time in IST, status and, only when the booking is confirmed, the meeting link. Statuses in plain words: Waiting for payment; We are checking your payment; Confirmed; Completed; Cancelled; Refunded.
- A 'Request cancellation' button that creates a support ticket (kind support, subject 'Cancel booking <id>') and emails the admins. Cancelling and refunding are done by an admin. Show the cancellation rule from the refund policy page when it exists.

4. ADMIN (/admin/mentoring)
- Tiers: create, edit, activate or deactivate, reorder (name up to 80, description up to 500, price, session length 15 to 120 minutes, session_count fixed at 1).
- Slots: choose a mentor (a user with the builder role), a date, a start and an end time and a slot length (30, 45 or 60 minutes), and generate consecutive slots. All times are entered in IST and stored as timestamptz. The database exclusion constraint prevents overlaps, and the form shows a clear message when it blocks one. Only open slots can be deleted.
- Bookings: list with filters (status, date), student first name, tier, time and status. Admin can set the meeting link (must be https; display it as text, never auto-open it), mark completed, and cancel with a reason, which frees the slot. Refunds go through the Prompt 7 refund action. Every change writes an audit row.

5. MENTOR PAGES (/builder/sessions)
- Requires the builder role and the MFA level. Lists only the mentor's own upcoming and past sessions with the student's first name, tier and time. The mentor can add or change the meeting link for their own sessions. Mentors never see a student's email address or phone number.

6. REMINDERS AND EMAILS
- GET /api/cron/session-reminders (same CRON_SECRET protection as the expiry job), run hourly: send a reminder to the student and the mentor for confirmed sessions starting in 23 to 25 hours that have no reminder_sent_at, then set reminder_sent_at. Add it to vercel.json.
- Templates: booking_received, booking_confirmed (time in IST and the link), booking_cancelled, session_reminder.

7. SECURITY REQUIREMENTS FOR THIS TASK
- Every action checks role and ownership, validates with zod, and uses rate limits. Links entered by admins or mentors must start with https:// and are never fetched by the server.
- Tests (all required): two simultaneous holds of one slot produce exactly one booking; a slot in the past or inside the minimum notice cannot be booked; a student cannot see another student's booking or meeting link; the link is not shown before the booking is confirmed; a mentor sees only their own sessions and no contact details; overlapping slots are refused by the database; an expired hold frees the slot; a javascript: or http: meeting link is refused; the reminder route returns 401 without the secret and sends each reminder once; times are displayed in IST.

8. ACCEPTANCE CHECKLIST (report each as PASS or FAIL with evidence)
a. In development: admin creates a tier and slots, a student books and submits payment proof, admin approves, the booking shows confirmed with the link, and the reminder job sends an email for a session about 24 hours ahead (use a test slot).
b. All security tests pass, including the concurrency test.
c. RLS tests are extended for the new columns and pass.
d. lint, lint:copy, typecheck, test and build pass.
Finish with the report format from PROJECT_RULES.md section 3.
```

**Your steps after the agent finishes**

1. Run `supabase db push`.
2. In `/admin/mentoring` create your real tiers and have a mentor open a few slots.
3. Book a slot as a test student and walk through payment and approval.

**Test before moving on:** a slot can be booked by only one student, the meeting link appears only after you approve the payment, and the times everywhere say IST.

## Prompt 10: Legal pages, reviews, support and emails

This prompt builds the trust layer: Privacy Policy, Terms and Conditions, Refund policy, Academic integrity policy, How it works, Contact, support tickets, verified-buyer reviews, and account data export and deletion. It runs in two parts so that the legal text comes from your real facts, not from guesses.

**Important.** The agent drafts these pages from your answers and from what the site really does. It is not a lawyer. A lawyer must review the pages before launch, and you record the review date in `site.config.ts`. The launch gate refuses to pass until you do. Ask the lawyer in particular about users under 18, because many students are 17 or 18 and India's data protection law has special rules for children's data.

### Part A: create the fact sheet

**Your steps first:** start a new conversation, paste Part A, then fill in the file it creates, with real answers only. If you do not know an answer, write UNKNOWN and ask your lawyer or accountant.

```text
Read PROJECT_RULES.md in full and follow it for this whole task.

TASK: Create the file docs/LEGAL_FACTS.md containing the headings and questions below with an empty line after each question for my answer. Write nothing else and do not write any legal page in this step.

LEGAL FACTS SHEET (fill every answer; write UNKNOWN if not decided)
1. Business: legal name, type (proprietorship, partnership, company, or not yet registered), and the name customers see.
2. Address for correspondence, support email, phone or WhatsApp number.
3. Grievance officer: name and email.
4. GST: registered or not, and the GSTIN if registered.
5. Minimum age for an account, and what we require for users under 18 (for example a parent or guardian's consent).
6. Where our data sits: the Supabase project region, the Vercel region, and the email provider (Resend).
7. How long we keep: payment proof screenshots (they are optional, and the site deletes each one a set number of days after the payment is checked; the owner chooses that number, ideally after asking the accountant, and it is entered in site settings as proof_retention_days), order and UTR records, support messages, and accounts after a deletion request. Note any period an accountant tells us we must keep records.
8. How quickly we answer support emails and deletion requests.
9. Refund rules for kits (for example when files were not delivered, or the kit was not as described), for custom projects (deposit and balance), and for mentoring (how many hours before the session a cancellation is refundable).
10. Which city's courts we want for disputes, and the governing law.
11. Anything we promise customers that is not in this list (write each promise exactly).
12. Anything we must never promise.
```

### Part B: build the pages, reviews, support and data tools

**Your steps first:**

1. Fill in `docs/LEGAL_FACTS.md` completely and commit it.
2. Start a new conversation and paste Part B.

```text
Read PROJECT_RULES.md in full and follow it for this whole task. Also read docs/LEGAL_FACTS.md, docs/DATABASE.md and the code, because every statement in a policy must match what the site actually does. If an answer in LEGAL_FACTS.md is UNKNOWN or empty, stop and ask me before writing the page that depends on it.

TASK: Build the policy pages, contact and support tickets, verified reviews, account data tools and the remaining emails.

1. POLICY PAGES (static, in src/content/legal, rendered with the Prose component, each with a 'Last updated' date)
Routes: /privacy, /terms, /refund, /academic-integrity, /how-it-works, /contact. Make them live in the footer and navigation, and link Terms and Privacy at checkout, on custom requests and on bookings.
Writing rules: plain English, short sentences, specific to this site, no text copied from other websites, no hype, no dashes, and no promise that is not in LEGAL_FACTS.md.
- /privacy: who we are; exactly which personal data we collect (derive it from the database: display name, email, phone number (optional), orders, UTR numbers, payment screenshots (optional, deleted after the retention period), messages and files in custom requests including the branch, semester and scheme the student enters as project details, booking details, hashed IP addresses in download logs, support tickets), with a plain line that we do not ask for or store the student's college; why we use each; who processes it (Supabase, Vercel, Resend, Google sign-in) and where; how long we keep it; how to ask for access, correction, export and deletion; the grievance officer; what happens with users under 18 as stated in the facts; a short 'Cookies' section listing the cookies we really set (for example the sign-in session cookies) and stating that we use no advertising or analytics cookies; how we protect data in plain terms. Do not claim certifications we do not hold.
- /terms: what we sell (kits, custom builds, mentoring); accounts; how manual UPI payment and verification work; when files are released; download limits; the licence for kits (personal learning and reference, no resale, sharing or public upload; the same text as src/content/licence.ts, which you must now update to match); custom project rules (quote, deposit, milestones, balance, our right to decline); mentoring rules; academic integrity duties of the student; what we do not promise (no marks, grades or approval by VTU or any college, and we are not affiliated with VTU or any college); refunds by reference to the refund page; termination of accounts for misuse; limits of liability, governing law and disputes as stated in the facts.
- /refund: kits, custom projects and mentoring, each with the exact conditions and time limits from the facts, and the steps to ask for a refund (open a ticket from the contact page with the order code). State that refunds are sent manually to the payer's UPI and how long we take, using the facts.
- /academic-integrity: what the site is for, what we do not do (exam answers, lab records, copied work, work another student has submitted), what we expect from students, that mentors review and teach and do not write submissions, what we do when we find misuse, and the sentence: 'We are not affiliated with VTU or any college.'
- /how-it-works: the three paths in plain steps, with the real details of UPI payment, verification, downloads (use the real default download limit from settings), custom milestones and mentoring slots. No invented speeds or service levels.
- /contact: support email, WhatsApp link, correspondence address and grievance officer from site.config, plus the support form in section 2.
Also write docs/LEGAL_REVIEW_NOTES.md listing each point a lawyer should confirm (age and consent, retention periods, limitation of liability, refund terms, governing law, data processing outside India).
Update src/content/licence.ts to be consistent with the Terms. Add a test that every legal page renders and that no page contains a TODO, a placeholder, a banned word (legal pages are checked for dashes and emoji only), or an unfilled field.

2. SUPPORT TICKETS
- A contact form with name, email, subject (up to 120), message (up to 3000) and an optional order code. It works for guests and signed-in users. Protect it without third-party scripts: a hidden honeypot field, a minimum fill time, and rate limits (3 per hour per hashed IP and 5 per day per email).
- Save to tickets, send ticket_received to the sender and ticket_admin to the support email and admins.
- /admin/tickets: list with status filter (open, answered, closed), a detail view, a 'Reply by email' mail link, a status change and an internal note. Audit rows for status changes. Add Tickets to the admin navigation.

3. VERIFIED REVIEWS
- A student with a paid kit order can write one review per kit (rating 1 to 5, text 20 to 2000 characters) from the order page after they have downloaded at least one file. It is saved as pending and never shown until approved.
- /admin/reviews lists pending reviews. An admin can approve or hide a review with a reason and cannot edit the text. Approved reviews show the reviewer's first name, the date and the label 'Verified buyer' (true by construction) on the kit page. Never create or import reviews any other way, and never fabricate averages.

4. ACCOUNT DATA TOOLS
- On /account: 'Download my data' (a JSON file of the user's own records) and 'Request account deletion' (creates a ticket of kind deletion_request).
- /admin/users/[id]: 'Export data' and 'Anonymise account'. Anonymise follows the retention rules in LEGAL_FACTS.md: remove personal fields from the profile, delete payment proof files and uploaded request files that are past retention, replace message bodies with a removal note where required, delete the sign-in identity, and keep only the order and payment records that the retention rule says to keep. Require a confirmation step and a TOTP code, and write an audit row without personal data.

5. ACCEPTANCE CHECKLIST (report each as PASS or FAIL with evidence)
a. Every policy page renders, is linked in the footer, contains only statements that match the code, and passes lint:copy.
b. The ticket form blocks bots (honeypot and rate limit tests) and shows plain text for any HTML or script string.
c. Review rules: a student without a paid order, or one who has not downloaded, cannot review; a second review of the same kit is refused; a pending or hidden review is invisible to the public; approval shows the label 'Verified buyer'.
d. Data export contains only the requesting user's data; student B cannot export student A's data; anonymise removes the personal fields and files according to the facts and keeps the allowed records.
e. npm run preflight now passes the privacy and terms checks and still fails legalReviewedOn.
f. lint, lint:copy, typecheck, test and build pass.
Finish with the report format from PROJECT_RULES.md section 3.
```

**Your steps after the agent finishes**

1. Read every page on your phone as a student would. If a sentence is wrong for your business, tell the agent exactly which one to fix.
2. Send `docs/LEGAL_REVIEW_NOTES.md` and the pages to your lawyer.
3. When the lawyer has approved the final text, open `site.config.ts` and set `legalReviewedOn` to that date. Do not set it before.

**Test before moving on (Gate 4):** you can run a full order, a request and a booking from the admin panel alone; every policy page is readable and accurate; reviews appear only after a real purchase and your approval.

## Prompt 11: Deployment to projects.vtuadda.com and SEO

This is where the site goes live on your subdomain. Most of the work is your own setup in dashboards, so the steps come first, then a prompt that prepares the code, search settings, the live checks and the deployment guide. Provider screens change, so where a step names a menu, follow the provider's current documentation if the label differs.

**Your steps first**

*A. Production database*

1. In Supabase open `vtuadda-projects-prod`. Run `supabase link --project-ref <prod project reference>` and then `supabase db push` so the production database gets the same migrations. Check afterwards that `supabase link` points where you expect before any later command.
2. Repeat the Auth settings from Prompt 3 on production: Email provider on, the sign-in email template shows `{{ .Token }}`, TOTP multi-factor on.
3. Authentication, URL Configuration: set Site URL to `https://projects.vtuadda.com` and add `https://projects.vtuadda.com/auth/callback` to the redirect URLs.
4. Copy the production URL, anon key and service role key somewhere safe. They go only into Vercel, never into the repository.

*B. Email sending (Resend)*

5. In Resend, Domains, add `projects.vtuadda.com`. Resend shows a few DNS records (for sending authentication). Add them at the DNS provider of vtuadda.com exactly as shown, then press Verify. Set `EMAIL_FROM` to something like `VTU Adda Projects <no-reply@projects.vtuadda.com>`.
6. So that sign-in codes also come from your domain, in Supabase production open Authentication, SMTP Settings and enter Resend's SMTP details (host, port, the username Resend documents and your Resend API key as the password), with the same sender address. Check Resend's current documentation for the exact values.

*C. Google sign-in for production*

7. In Google Cloud Console add the production Supabase callback URL to your OAuth client's authorised redirect URIs (copy it from Supabase, Authentication, Providers, Google, on the production project), and enter the same client ID and secret in the production project.
8. Move the OAuth consent screen from Testing to In production. Google asks for your privacy policy and terms links (`https://projects.vtuadda.com/privacy` and `/terms`) and for domain verification of vtuadda.com, which you do in Google Search Console. This needs Prompt 10 to be live first.

*D. Hosting and domain (Vercel)*

9. In Vercel choose Add New, Project, import your GitHub repository, framework Next.js.
10. Settings, Environment Variables, Production: add the eight variables from the start of this pack with production values. `NEXT_PUBLIC_SITE_URL` is `https://projects.vtuadda.com`. Generate `CRON_SECRET` and `IP_HASH_SALT` as new random strings of 32 or more characters (never reuse the development ones). Add `ALLOW_INDEXING` later, only at launch. Mark secrets as sensitive.
11. For Preview deployments use the development Supabase project's keys, never production keys. Keep Vercel's deployment protection for previews switched on.
12. Settings, Functions: choose a region close to your Supabase region (Mumbai if offered).
13. Settings, Domains: add `projects.vtuadda.com`. Vercel shows the exact DNS record to create (normally a CNAME for the name `projects`). At the DNS provider of vtuadda.com add precisely the record Vercel shows. Do not touch the records of your main site. If the DNS provider is Cloudflare, set the record to DNS only until Vercel shows it as valid. Wait until Vercel reports a valid configuration and issues the HTTPS certificate.
14. Hourly scheduled jobs need a paid Vercel plan, and so does commercial use. Confirm your plan before launch. Vercel sends the `CRON_SECRET` as a bearer token to cron paths by itself when that variable exists.
15. Check Supabase's current plan terms for production: free projects can be paused after inactivity and backups depend on the plan. For a store that takes payments use a plan with daily backups.

*E. First admin on production*

16. Open the live site, sign in once with your email, then run the admin SQL from Prompt 3 in the production SQL Editor, and enrol your authenticator on `/admin/mfa`. Do the same for builders later.

**Prompt**

```text
Read PROJECT_RULES.md in full and follow it for this whole task.

TASK: Prepare the code for production deployment on projects.vtuadda.com, set up search and sharing metadata, and add live-site checks. Do not change the design or the copy.

1. DEPLOYMENT GUIDE
- Write docs/DEPLOY.md with the exact ordered steps to deploy and to roll back, using the real variable names, scripts and routes of this project. Include: the production and preview environment variable lists (names only), which Supabase project each uses, the migration command and the warning to check the linked project first, the domain and DNS steps, the cron jobs and the CRON_SECRET behaviour, and the post-deploy checks. Do not put any secret in it.
- vercel.json: hourly crons for /api/cron/expire-orders and /api/cron/session-reminders, and a daily cron for /api/cron/purge-proofs.
- Image remotePatterns use the Supabase host taken from the environment, not a hard-coded value.

2. INDEXING CONTROL
- Search indexing is off by default. The robots meta tag and an X-Robots-Tag: noindex header apply on every host except production, and in production only until the server variable ALLOW_INDEXING equals 'true'.
- robots.txt (generated): when indexing is allowed, allow / and disallow /admin, /builder, /account, /checkout, /api, and give the sitemap URL. Otherwise disallow everything. State clearly in docs/DEPLOY.md that robots.txt is not a security control.

3. SITEMAP AND METADATA
- sitemap.xml generated from the database: home, /projects, the filter landing pages that have results, every live kit with its last modified date, /mentoring, /request, /how-it-works, /contact, /academic-integrity, /refund, /privacy, /terms. Never include admin, account, checkout or API paths.
- Every public page has a unique title (under 60 characters), a description (under 160), a canonical URL, and Open Graph and Twitter card tags.
- Open Graph image: a generated, text-only image (the page title and the site name in Source Serif on the paper colour, no gradients, no icons, no generated art), using a font file committed under public/fonts. A kit with a cover uses its cover image instead.
- Structured data: Organization (name, url, contact email from site.config; no logo unless one exists), Product and BreadcrumbList (already built), FAQPage for the real FAQ only. No Review or AggregateRating markup unless real approved reviews exist.
- /.well-known/security.txt built from site.config: Contact (mailto of the support email), Expires (one year after the build date), Preferred-Languages en.

4. PERFORMANCE
- Set cache headers: immutable for hashed static assets, no-store for account, admin, checkout and API responses.
- Run Lighthouse (mobile settings) on the home page, /projects, a kit page and /login against a production build. Report the real scores for performance, accessibility, best practices and SEO. The targets are 90 or more for performance and 95 or more for the others. If a target is missed, say so and list the causes. Do not alter the test to pass.

5. LIVE-SITE CHECKS
- Extend npm run preflight with a live mode: npm run preflight -- --launch --url https://projects.vtuadda.com. It checks the deployed site and prints PASS or FAIL for each: HTTPS is valid and http redirects to https; the security headers from Prompt 1 are present; there is no X-Powered-By header; no .map file is reachable for the build's script files; the favicon, apple-touch-icon and Open Graph image return 200; /privacy and /terms return 200 and are not empty; /robots.txt and /sitemap.xml respond correctly; /.well-known/security.txt responds; the HTML contains no generator meta tag and none of these as whole words in visible text or meta tags (case-sensitive): Antigravity, Lovable, Bolt, v0, Cursor, ChatGPT, Claude, Gemini, 'Made with', 'Built with', 'Powered by'; /admin, /builder and /account redirect a signed-out visitor; /.env, /.git/config and /api respond 404; a request with a foreign Origin header receives no Access-Control-Allow-Origin header; the cron paths return 401 without the secret.
- Also add a check that ALLOW_INDEXING is set only in the production environment.

6. ACCEPTANCE CHECKLIST (report each as PASS or FAIL with evidence)
a. A production build succeeds with production-style environment variables, and refuses to start when one is missing.
b. Indexing is off on preview and production until ALLOW_INDEXING is true (test both).
c. The sitemap lists the right URLs and none of the private ones.
d. The Open Graph image is text-only and flat.
e. The live preflight runs against a preview or the production URL and every item is reported.
f. Lighthouse results are reported honestly.
g. lint, lint:copy, typecheck, test and build pass.
Finish with the report format from PROJECT_RULES.md section 3.
```

**Your steps after the agent finishes**

1. Merge to the main branch so Vercel deploys, and open `https://projects.vtuadda.com` on your phone using mobile data, not your home Wi-Fi.
2. Sign in with an email code and with Google. Both must work on the live site.
3. Run `npm run preflight -- --launch --url https://projects.vtuadda.com` and fix every FAIL with the agent.
4. Do not set `ALLOW_INDEXING` yet. That happens after Prompt 12.

**Test before moving on:** the live site loads over HTTPS on your own subdomain, sign-in works, emails arrive from your domain, and the live checks pass except the items that belong to the launch decision.

## Prompt 12: Full security audit and launch gate

This prompt turns the agent into a reviewer that tries to break the site, fixes what it finds, and produces a written audit. Run it in a brand new conversation so it does not defend its own earlier work. Then you complete the launch checklist yourself.

**Your steps first**

1. Rotate every key that has ever been pasted into a chat, a screenshot or a file outside `.env.local`: the Supabase service role key, the Resend API key, `CRON_SECRET` and `IP_HASH_SALT`. Update them in Vercel, redeploy, and confirm the site still works.
2. In the Supabase dashboard for production, open the Advisors section (security and performance) and fix every warning that is marked as a security issue. Keep a copy of what remains.
3. Start a new conversation and paste the prompt below.

**Prompt**

```text
Read PROJECT_RULES.md in full and follow it for this whole task.

You are an independent security reviewer. Assume the existing code is wrong until you have proved otherwise. Do not trust earlier reports or comments. Do not mark any item PASS unless you ran a command or test and can show its output. Mark anything you could not test as NOT TESTED, with the reason.

SCOPE AND SAFETY
- Run destructive tests only on the development Supabase project and local or preview deployments. Against production run only read-only checks (headers, redirects, status codes, file reachability). Never create, change or delete production data.
- Do not print real secrets in your report. If you find one, report its location and type only.

A. AUTOMATED CHECKS
1. npm ci, lint, lint:copy, typecheck, unit tests, end-to-end tests, production build, npm run preflight, and npm run preflight -- --launch --url <the production URL>.
2. npm audit (production and dev dependencies) and a check for unused dependencies (for example depcheck). Remove unused packages and report outdated packages that have known vulnerabilities.
3. gitleaks on the working tree and on the full git history (all branches). If any secret is found, tell me which key to rotate. Do not rewrite history without asking me.
4. Search the code and report every occurrence of: dangerouslySetInnerHTML, eval, new Function, innerHTML, localStorage, sessionStorage, console.log, Access-Control-Allow-Origin, process.env used outside the env modules, any fetch or request made with a user-supplied URL, redirect calls that use user input, string-built SQL, and any use of SUPABASE_SERVICE_ROLE_KEY outside src/server. Explain each one or fix it.

B. DATABASE AND STORAGE
1. List every table in the public schema and show that row level security is enabled and forced where needed. List every policy and compare it with the policy matrix in docs/DATABASE.md and the later prompts. Report any table without a policy and any policy broader than the matrix.
2. List every function with its security mode and search_path, and every grant to anon and authenticated on tables, views and functions. Show that rate_limit_hit, approve_payment, reject_payment, refund_payment, consume_download, hold_slot and the request transition function cannot be called with the anon key or by a signed-in student (try it through the REST API with real tokens).
3. Run npm run test:rls and add any missing cases you found.
4. Check each storage bucket's public flag, size limit and allowed types, and show that a private object cannot be fetched without a signed URL.

C. AUTHORIZATION MATRIX
- Enumerate every route, route handler and server action from the build output. Create docs/AUTHZ_MATRIX.md listing, for each, the expected result for: signed-out visitor, student A (owner), student B (other student), builder assigned, builder not assigned, admin without MFA, and admin with MFA. Write an automated test that exercises the whole matrix and fails when a route is missing from it. Fix every mismatch.

D. WEB AND PLATFORM CHECKS
1. Headers on every kind of route (page, API, file download, error page): CSP with nonces, HSTS, nosniff, referrer policy, permissions policy, frame-ancestors, COOP. Report missing ones. Check cookies for Secure, SameSite and path.
2. Load the main pages in a real browser run and collect console errors and CSP violations. There must be none.
3. Confirm no source maps are served. Search the built JavaScript for secret patterns, for JWTs and decode any you find (a token with the service_role claim is a critical finding), and for the names of server-only variables.
4. Request /.env, /.git/config, /.git/HEAD, /supabase/config.toml, /package.json, /api, /api/cron/expire-orders and /api/cron/purge-proofs (no secret), /admin, /builder: each must be 404, 401 or a login redirect as appropriate and must not reveal internals. Error pages must not show stack traces.
5. CSRF: send forged cross-origin POST requests (with a foreign Origin header and with none) to every state-changing route handler and server action and confirm refusal.
6. CORS: send requests with a foreign Origin and confirm no Access-Control-Allow-Origin header appears anywhere.
7. Open redirects: test the login callback and every redirect with attack values (//evil.example, /\evil.example, https://evil.example, javascript:alert(1), encoded and double-encoded variants).
8. Path traversal and ID guessing on download, slip, preview and file routes.

E. INPUT AND ABUSE TESTS (on dev or preview)
1. Cross-site scripting: submit a set of payloads (script tags, event handler attributes, javascript: URLs, SVG, template strings, HTML entities) in every text field (profile, request title and brief, milestone input, messages, ticket, review, admin fields) and confirm they appear as plain text on every page that shows them, including admin pages and emails.
2. SQL injection strings in search, filters, sort, page and every form field. Confirm only parameterised access is used.
3. Upload fuzzing on every upload point: executable renamed to an allowed type, SVG with a script, HTML renamed to png, zero bytes, oversize files, double extensions, null bytes and unicode tricks in names, an image with extra data appended. Each must be refused or neutralised.
4. Rate limits: hit each limited action over its limit and confirm the block and a clear message.
5. Races: simultaneous double approval, double download, double booking, double quote acceptance, and double order creation. Each must produce exactly one effect.
6. Money: change prices, amounts, coupon values, order ids, user ids and statuses in requests and confirm the server ignores or rejects them. Confirm a UTR cannot pay two orders.
7. Webhook signature verification is not applicable because there is no gateway. Record this and confirm no payment webhook route exists.

F. PRIVACY AND LOGGING
- Run the main flows with log capture and search the logs for email addresses, phone numbers, full UTR numbers, tokens, cookies, signed URLs, file paths and request bodies. There must be none. Confirm IP addresses are stored only as hashes. Test data export and account anonymisation against the retention rules.
- Data minimisation: list every column of every table and every form field, and show that nothing asks for or stores a college, branch, semester or scheme on the account or profile (those three exist only on custom_requests); that phone and the payment screenshot are optional; that proof_retention_days is set and the purge job removes old screenshots while keeping the order and UTR rows; and that builder and mentor pages show only a first name.

G. BRAND AND COPY GATE
- Scan all rendered pages and emails for banned words, dashes and emoji. Scan for tool or AI wording (Antigravity, Lovable, Bolt, v0, Cursor, ChatGPT, Claude, Gemini, Made with, Built with, Powered by) as whole words in visible text, meta tags and headers. List every number on public pages and show that each one comes from the database or site.config and not from the code. Confirm there are no fake reviews, counters, testimonials, logos or stock images, and no purple or gradient styles in the built CSS. List every live project with title and price so that I can confirm they are all real.

H. LAUNCH GATE
- Verify each item of PROJECT_RULES.md section 9 and print PASS or FAIL.

I. REPORT AND FIXES
- Write docs/SECURITY_AUDIT.md: a table of every check above with PASS, FAIL or NOT TESTED and evidence; then a list of findings with severity (Critical, High, Medium, Low), file and line, how to reproduce, and the fix.
- Fix every Critical and High finding, add a test for each, and show the passing re-test. List Medium and Low findings for me and do not hide any.
- Finish with a short statement of what this audit does not cover: it is an automated and manual review by the same kind of tool that wrote the code, it is not a professional penetration test, and an independent human review is still recommended before the site handles large volumes.
```

**Launch checklist (your own)**

Tick each item yourself when it is true. Do not launch until all are ticked.

- [ ] Prompt 12's `docs/SECURITY_AUDIT.md` shows no open Critical or High finding, and I have read the Medium and Low ones.
- [ ] `npm run preflight -- --launch --url https://projects.vtuadda.com` passes every item.
- [ ] A custom domain is connected and the padlock shows on every page.
- [ ] The favicon shows in the browser tab and when the site is added to a phone's home screen.
- [ ] There is no tool, AI or "Made with" wording or badge anywhere (view the page source myself and search it).
- [ ] The Privacy Policy and Terms and Conditions pages are live and linked in the footer and at checkout, and a lawyer has reviewed them (the date is set in `site.config.ts`).
- [ ] Every detail in `site.config.ts` is real, and the UPI ID and payee name in admin settings are real.
- [ ] I chose how many days payment screenshots are kept (after asking my accountant), entered it in admin settings, and ran the purge route once to see an old test screenshot removed.
- [ ] The catalogue shows only real kits with real screenshots and real files, and I opened each one.
- [ ] A real-money test: I paid a real kit's price from another UPI account I own, submitted the UTR, approved it as admin after finding it in my bank record, downloaded the files, then recorded a refund.
- [ ] I tested the whole site on two real phones on mobile data, including sign-in by email and by Google.
- [ ] Production backups are enabled and I restored one into the development project to prove it works.
- [ ] An independent developer has reviewed the database rules, the payment approval function, the download route and the middleware.
- [ ] Uptime monitoring and email alerts are set up (for example a free uptime monitor on the live address).
- [ ] I set `ALLOW_INDEXING` to true in Vercel production, redeployed, and submitted `https://projects.vtuadda.com/sitemap.xml` in Google Search Console.
- [ ] A "Projects" link points from vtuadda.com to the new subdomain.
- [ ] The 30-day pilot from the research report is scheduled, with its success and stop rules written down before the first sale.

**After launch.** Keep the project rules file, run the audit prompt again after every large change, and keep dependency updates flowing through Dependabot.

## Where each of your rules is handled

Every item from your security list, your longer security prompt, and your design and launch rules maps to the prompts below. Where an item does not apply to this build, the table says why.

**Security items**

| Item | Prompts | How it is handled |
| --- | --- | --- |
| SQL injection | 0, 3, 5, 12 | Only parameterised queries and the database client; search and filters use validated allowlists; injection strings are tested |
| Cross-site scripting | 0, 1, 4, 5, 12 | React escaping, a strict nonce-based content policy, no raw HTML anywhere, our own safe text renderer, payload tests on every text field |
| CSRF protection | 1, 12 | Server actions plus a same-origin check on every state-changing route; forged-request tests |
| File upload validation | 4, 6, 8, 12 | Allowlist, size limit, real file signature check, images re-encoded, private buckets, random names, fuzz tests |
| Broken object level authorization | 3, 6, 7, 8, 9, 12 | Database rules plus ownership checks on every record; two-student tests; full role matrix |
| Rate limiting | 1, 3, 6 to 10 | A shared database-backed limiter on every sensitive action |
| Secure JWT secrets | 1, 3, 12 | No custom tokens: sessions are handled by Supabase; the service role key is server-only, scanned for, and rotated before launch |
| Keep API server side | 1, 3 | Server-only modules; secrets never reach the browser; tests enforce it |
| Hash passwords securely | 3 | No passwords exist: email codes and Google sign-in through Supabase Auth |
| Multi-factor authentication | 3, 8, 9 | Admins and builders must pass an authenticator-app check; database rules also require it |
| Tighten CORS | 1, 12 | Same-origin only, no wildcard, no CORS headers; foreign-origin tests |
| No auth token in local storage | 3, 12 | Cookie sessions; a test checks browser storage |
| Enforce permissions server side | 3 to 9, 12 | Every route and action checks the caller; role matrix document and test |
| Row level security | 3, 12 | On every table with explicit policies; automated test and audit |
| Verify webhook signatures | 0, 12 | Not applicable now because there is no payment gateway; the rule forbids adding one without signature checks |
| SSRF | 0, 4, 12 | The server never fetches user-supplied URLs; video links are allowlisted and only embedded in the browser |
| Exposed source maps | 1, 11, 12 | Disabled in the build; checked locally and on the live site |
| Default credentials | 3, 12 | No default admin; first admin promoted by you; all keys rotated before launch |
| Sensitive data in logs | 1, 6, 12 | A redacting logger; UTRs masked; a log-scan test |
| Collect less personal data | 0, 3, 6, 7, 8, 9, 10, 12 | No college, branch, semester or scheme on the account; phone and payment screenshot optional; screenshots deleted after a set number of days; builders and mentors see first names only; privacy page says so |
| Vulnerable dependencies | 1, 12 | Audit in CI, Dependabot, unused packages removed |
| Hide API keys and check environment variables | 1, 11, 12 | Validated environment module, example file only, Vercel dashboard for production |
| Protect admin routes, proper authentication | 3, 4 | Middleware plus per-page checks plus database rules plus MFA |
| Users see only their own data | 3, 6 to 9 | Row level security and tests with two students |
| Sanitise forms | all | zod validation on the server for every input |
| Secure API endpoints | 6, 9 | Cron routes need a secret; others need a session and a same-origin request |
| Security headers | 1, 11, 12 | Set on every response and verified on the live site |
| Turn off debug mode | 0, 1, 12 | No verbose errors or stack traces in production |
| Remove what is not needed | 12 | Unused packages and routes removed |
| Exposed files | 11, 12 | Live checks for .env, .git, source maps and internal paths |
| Secure the database | 3, 12 | Private storage, least privilege grants, security advisors, tests |
| Leaked secrets in git history | 1, 12 | gitleaks in CI and over the full history before launch |
| Full security audit | 12 | Independent-style audit with a written report and fixes |

**Design and launch items**

| Item | Prompts | How it is handled |
| --- | --- | --- |
| No purple, gradients or pill buttons | 0, 2, 12 | Tokens only; forbidden utilities removed from the build and tested; checked in the built CSS |
| No fake reviews or metrics | 0, 5, 10, 12 | Reviews only from paid buyers after approval; numbers come only from the database or config; audit lists every number |
| No vague hero text or AI-style copy | 0, 5, 10 | Exact copy supplied; plain-language rules; banned-word check in the build |
| No emoji icons, no em dashes | 0, 2 | Copy lint fails the build on either; icons only where they carry meaning |
| No scroll animation or cursor effects | 0, 2 | Only 120 ms colour changes on hover and focus; none under reduced-motion settings |
| No AI-generated or stock photos | 0, 2, 4, 5 | Real screenshots only; plain labelled block when none exists |
| No fake customer counters | 0, 5, 12 | Not built; the audit checks for them |
| Custom domain | 11 | projects.vtuadda.com with HTTPS, with exact DNS steps |
| Favicon | 2, 11 | Monogram icon set created in Prompt 2 and checked on the live site |
| No Made with AI tag | 1, 11, 12 | Checked in source, headers and live HTML |
| Privacy Policy and Terms pages | 10, 12 | Drafted from your facts, lawyer-reviewed, dated in the config, enforced by the launch gate |
| Make no mistakes | 0, every prompt, 12 | Plans before code, evidence for every result, tests you run yourself at each gate, an audit, and an independent human review |
