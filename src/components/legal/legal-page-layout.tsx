import * as React from "react";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { TableOfContents, TableOfContentsMobile, type TocItem } from "@/components/legal/table-of-contents";

export interface LegalPageLayoutProps {
  breadcrumbItems: BreadcrumbItem[];
  tocItems: TocItem[];
  children: React.ReactNode;
}

/**
 * Shared page shell for legal & policy articles.
 * Enforces ~720px readable article layout, breadcrumb trail, and sticky desktop TOC sidebar.
 */
export function LegalPageLayout({
  breadcrumbItems,
  tocItems,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50/50 dark:bg-slate-950/60">
      {/* Subtle top ambient glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-96 opacity-40 dark:opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200 via-transparent to-transparent dark:from-indigo-900"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main article container: max-width ~720px */}
          <div className="lg:col-span-8 flex justify-center lg:justify-start">
            <div className="w-full max-w-[720px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-10 lg:p-12 shadow-xs">
              <TableOfContentsMobile items={tocItems} />
              {children}
            </div>
          </div>

          {/* Sticky desktop sidebar */}
          <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24">
            <TableOfContents items={tocItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
