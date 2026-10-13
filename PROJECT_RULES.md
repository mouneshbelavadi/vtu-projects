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
