# VTU Adda Project Hub

Project store for VTU engineering students in Karnataka, India. The platform provides pre-built project kits (including source code, setup instructions, viva questions, and documentation templates), custom project builds delivered in milestone phases, and guided mentoring sessions.

## Local Setup

### Requirements

- Node.js LTS (v20 or higher)
- npm (v10 or higher)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url> vtuadda-projects
   cd vtuadda-projects
   ```

2. Copy the example environment file and configure variables:
   ```bash
   cp .env.example .env.local
   ```

3. Install project dependencies:
   ```bash
   npm install
   ```

4. Start the local development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your web browser.

## Environment Variables

All secrets live in `.env.local` locally and must never be committed to source control. In production, variables are configured in the hosting environment.

| Variable | Description | Target |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL of the website | Public / Browser |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL endpoint | Public / Browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous publishable API key | Public / Browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) | Server only |
| `RESEND_API_KEY` | Resend API key for transactional emails | Server only |
| `EMAIL_FROM` | Verified sender address for system emails | Server only |
| `CRON_SECRET` | Secret token protecting cron endpoints (32+ chars) | Server only |
| `IP_HASH_SALT` | Secret salt for HMAC-SHA256 IP hashing (32+ chars) | Server only |

## Available Scripts

- `npm run dev`: Starts the Next.js development server at localhost:3000.
- `npm run build`: Builds the production bundle.
- `npm run start`: Runs the built production server locally.
- `npm run lint`: Runs ESLint to check code quality and rules.
- `npm run typecheck`: Runs TypeScript compiler in noEmit mode to verify types.
- `npm run format`: Checks code formatting using Prettier.
- `npm run test`: Executes unit tests with Vitest.
- `npm run test:e2e`: Runs end-to-end tests with Playwright.
- `npm run lint:copy`: Scans project files for copy rules, dashes, and disallowed wording.
- `npm run scan:secrets`: Runs Gitleaks secret scanner if installed.
- `npm run audit`: Audits production dependencies for security vulnerabilities.
- `npm run preflight`: Validates launch gate readiness and security criteria.

## Project Structure

```text
├── .github/              # GitHub Actions workflows and Dependabot configuration
├── docs/                 # Architecture notes and operations guides
├── scripts/              # Preflight, copy linter, and maintenance utilities
├── src/
│   ├── app/              # Next.js App Router pages, layouts, and error boundaries
│   ├── components/
│   │   ├── site/         # Header, footer, and shell navigation components
│   │   └── ui/           # Reusable design system primitives
│   ├── content/          # Static content definitions and legal pages
│   ├── lib/              # Client and server shared utility functions
│   └── server/           # Server-only modules (auth, env, payments, security)
│       ├── payments/     # Payment provider interfaces and implementations
│       └── security/     # CSRF checks, IP hashing, rate limiting, validation
├── supabase/
│   └── migrations/       # PostgreSQL schema migrations and RLS policies
└── tests/
    ├── e2e/              # Playwright end-to-end test suites
    └── unit/             # Vitest unit test suites
```
