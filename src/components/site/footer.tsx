import * as React from "react";
import Link from "next/link";

function SparklesIcon({
  className = "h-4.5 w-4.5",
  strokeWidth = 2.25,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

function MessageSquareIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
  status: "live" | "planned";
}

const storeLinks: FooterLink[] = [
  { label: "Projects", href: "/projects", status: "live" },
  { label: "Request a project", href: "/request", status: "live" },
  { label: "Mentoring", href: "/mentoring", status: "live" },
];

const helpLinks: FooterLink[] = [
  { label: "How it works", href: "/how-it-works", status: "live" },
  { label: "Contact", href: "/contact", status: "live" },
  { label: "Refund policy", href: "/refund", status: "live" },
  { label: "Academic integrity", href: "/academic-integrity", status: "live" },
];

const legalLinks: FooterLink[] = [
  { label: "Privacy policy", href: "/privacy", status: "live" },
  { label: "Terms and conditions", href: "/terms", status: "live" },
];

const vtuAddaLinks: FooterLink[] = [
  {
    label: "Notes and question papers",
    href: "https://vtuadda.com",
    isExternal: true,
    status: "live",
  },
];

function filterLinks(links: FooterLink[], isProd: boolean): FooterLink[] {
  if (isProd) {
    return links.filter((l) => l.status === "live");
  }
  return links;
}

/**
 * Modern Site Footer featuring:
 * - Dark slate/indigo background with subtle ambient gradient glow
 * - Brand block with mission tagline and social icon placeholders
 * - 4-column organized navigation links with micro-hover interactions
 * - Divider and copyright status row
 */
export function Footer() {
  const isProd = process.env.NODE_ENV === "production";
  const currentYear = new Date().getFullYear();
  const businessName =
    process.env.NEXT_PUBLIC_BUSINESS_NAME || "VTU Adda Projects";

  const visibleStore = filterLinks(storeLinks, isProd);
  const visibleHelp = filterLinks(helpLinks, isProd);
  const visibleLegal = filterLinks(legalLinks, isProd);
  const visibleVTU = filterLinks(vtuAddaLinks, isProd);

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-slate-800 bg-slate-950 text-slate-300">
      {/* Subtle Ambient Gradient Glow at Top */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-container px-4 py-16 sm:px-6">
        {/* Top Brand Block & 4-Column Navigation */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Brand & Mission Tagline (5 columns) */}
          <div className="space-y-4 lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/30">
                <SparklesIcon className="h-4.5 w-4.5" strokeWidth={2.25} />
              </div>
              <span className="font-display text-lg font-extrabold tracking-tight text-white">
                VTU Adda <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Projects</span>
              </span>
            </Link>
            <p className="max-w-sm text-sm text-slate-400 leading-relaxed">
              Verified engineering project kits, runnable source code, report templates and viva question banks built specifically for VTU students.
            </p>

            {/* Social Icon Row (Decorative Placeholders) */}
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 transition-colors hover:border-slate-700 hover:text-white"
                aria-label="GitHub repository"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 transition-colors hover:border-slate-700 hover:text-white"
                aria-label="LinkedIn profile"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 transition-colors hover:border-slate-700 hover:text-white"
                aria-label="Twitter/X profile"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 transition-colors hover:border-slate-700 hover:text-white"
                aria-label="Community discussion"
              >
                <MessageSquareIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* 4 Navigation Columns (8 columns) */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            {/* Store Column */}
            <div className="space-y-3">
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-200">
                Store
              </h4>
              {visibleStore.length > 0 ? (
                <ul className="space-y-2.5 text-sm text-slate-400">
                  {visibleStore.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="inline-block transition-all duration-150 hover:text-white hover:translate-x-0.5"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Catalogue opening soon</p>
              )}
            </div>

            {/* Help Column */}
            <div className="space-y-3">
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-200">
                Help
              </h4>
              {visibleHelp.length > 0 ? (
                <ul className="space-y-2.5 text-sm text-slate-400">
                  {visibleHelp.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="inline-block transition-all duration-150 hover:text-white hover:translate-x-0.5"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Help resources in setup</p>
              )}
            </div>

            {/* Legal Column */}
            <div className="space-y-3">
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-200">
                Legal
              </h4>
              {visibleLegal.length > 0 ? (
                <ul className="space-y-2.5 text-sm text-slate-400">
                  {visibleLegal.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="inline-block transition-all duration-150 hover:text-white hover:translate-x-0.5"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Legal policies in review</p>
              )}
            </div>

            {/* VTU Adda Column */}
            <div className="space-y-3">
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-200">
                VTU Adda
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                {visibleVTU.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block transition-all duration-150 hover:text-white hover:translate-x-0.5"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Divider and Copyright Row */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800/80 pt-8 sm:flex-row text-xs text-slate-500">
          <p>© {currentYear} {businessName}. Built for VTU engineering students.</p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Systems operational • Fast UPI manual verification</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
