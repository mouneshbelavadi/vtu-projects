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
 * Accessible Pagination navigation with 44px minimum touch targets and 6px radius.
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
            "inline-flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-rule bg-surface px-3 text-sm text-ink",
            "transition-colors duration-120 hover:border-ink-2 hover:bg-paper",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          <span className="sr-only">Previous page</span>
        </Link>
      ) : (
        <span
          className="inline-flex h-11 min-h-[44px] min-w-[44px] cursor-not-allowed items-center justify-center rounded-md border border-rule bg-paper px-3 text-sm text-ink-3 opacity-50"
          aria-disabled="true"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
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
              "inline-flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md border px-3 text-sm font-medium",
              "transition-colors duration-120",
              isCurrent
                ? "border-accent bg-accent text-surface"
                : "border-rule bg-surface text-ink hover:border-ink-2 hover:bg-paper",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
            "inline-flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-rule bg-surface px-3 text-sm text-ink",
            "transition-colors duration-120 hover:border-ink-2 hover:bg-paper",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          )}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          <span className="sr-only">Next page</span>
        </Link>
      ) : (
        <span
          className="inline-flex h-11 min-h-[44px] min-w-[44px] cursor-not-allowed items-center justify-center rounded-md border border-rule bg-paper px-3 text-sm text-ink-3 opacity-50"
          aria-disabled="true"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
        </span>
      )}
    </nav>
  );
};
