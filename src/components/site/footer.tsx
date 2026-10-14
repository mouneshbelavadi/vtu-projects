import * as React from "react";
import Link from "next/link";
import { siteConfig } from "../../../site.config";

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
 * Site Footer organized into four plain text columns.
 * Planned navigation links are omitted in production.
 */
export const Footer: React.FC = () => {
  const isProd = process.env.NODE_ENV === "production";
  const currentYear = new Date().getFullYear();
  const businessName = siteConfig.businessName || "VTU Adda Projects";

  const visibleStore = filterLinks(storeLinks, isProd);
  const visibleHelp = filterLinks(helpLinks, isProd);
  const visibleLegal = filterLinks(legalLinks, isProd);
  const visibleVTU = filterLinks(vtuAddaLinks, isProd);

  return (
    <footer className="mt-auto border-t border-rule bg-surface">
      <div className="mx-auto max-w-container px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Store Column */}
          <div>
            <h4 className="mb-3 font-serif text-sm font-semibold text-ink">Store</h4>
            {visibleStore.length > 0 ? (
              <ul className="space-y-2 text-sm text-ink-2">
                {visibleStore.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors duration-120 hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink-3">Catalogue opening soon</p>
            )}
          </div>

          {/* Help Column */}
          <div>
            <h4 className="mb-3 font-serif text-sm font-semibold text-ink">Help</h4>
            {visibleHelp.length > 0 ? (
              <ul className="space-y-2 text-sm text-ink-2">
                {visibleHelp.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors duration-120 hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink-3">Help resources in setup</p>
            )}
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="mb-3 font-serif text-sm font-semibold text-ink">Legal</h4>
            {visibleLegal.length > 0 ? (
              <ul className="space-y-2 text-sm text-ink-2">
                {visibleLegal.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors duration-120 hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink-3">Legal policies in review</p>
            )}
          </div>

          {/* VTU Adda Column */}
          <div>
            <h4 className="mb-3 font-serif text-sm font-semibold text-ink">VTU Adda</h4>
            <ul className="space-y-2 text-sm text-ink-2">
              {visibleVTU.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="transition-colors duration-120 hover:text-ink">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-rule pt-6 text-xs text-ink-3">
          <p>
            © {currentYear} {businessName}
          </p>
        </div>
      </div>
    </footer>
  );
};
