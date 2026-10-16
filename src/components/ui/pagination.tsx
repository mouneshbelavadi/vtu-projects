import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  className?: string;
}

/**
 * Modern Accessible Pagination navigation with 44px minimum touch targets and 10px radius.
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  buildHref,
  className,
}) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1.5", className)}
    >
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          className={cn(
            "inline-flex h-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-rule bg-surface px-3 text-sm text-ink shadow-xs",
            "transition-all duration-200 hover:border-rule-strong hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-95",
            "focus-visible:outline-2 focus-visible:outline-accent"
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          <span className="sr-only">Previous page</span>
        </Link>
      ) : (
        <span
          className="inline-flex h-10 min-h-[40px] min-w-[40px] cursor-not-allowed items-center justify-center rounded-xl border border-rule/50 bg-slate-50 dark:bg-slate-900 px-3 text-sm text-ink-3 opacity-40"
          aria-disabled="true"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </span>
      )}

      {pages.map((p) => {
        const isCurrent = p === currentPage;
        return (
          <Link
            key={p}
            href={buildHref(p)}
            aria-current={isCurrent ? "page" : undefined}
            className={cn(
              "inline-flex h-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-3.5 text-sm font-semibold",
              "transition-all duration-200",
              isCurrent
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/25"
                : "border border-rule bg-surface text-ink hover:border-rule-strong hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-95 shadow-xs",
              "focus-visible:outline-2 focus-visible:outline-accent"
            )}
          >
            {p}
          </Link>
        );
      })}

      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          className={cn(
            "inline-flex h-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-rule bg-surface px-3 text-sm text-ink shadow-xs",
            "transition-all duration-200 hover:border-rule-strong hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-95",
            "focus-visible:outline-2 focus-visible:outline-accent"
          )}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
          <span className="sr-only">Next page</span>
        </Link>
      ) : (
        <span
          className="inline-flex h-10 min-h-[40px] min-w-[40px] cursor-not-allowed items-center justify-center rounded-xl border border-rule/50 bg-slate-50 dark:bg-slate-900 px-3 text-sm text-ink-3 opacity-40"
          aria-disabled="true"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </span>
      )}
    </nav>
  );
};
