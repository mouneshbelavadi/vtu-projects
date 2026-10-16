"use client";

import * as React from "react";
import Link from "next/link";
import { ListTree, ArrowUp, ChevronDown, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  label: string;
}

export interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
}

/**
 * Sticky Table of Contents sidebar for desktop legal and documentation pages.
 * Includes IntersectionObserver scroll spy to highlight the active section.
 */
export function TableOfContents({ items, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = React.useState<string>(items[0]?.id || "");

  React.useEffect(() => {
    if (typeof window === "undefined" || items.length === 0) return;

    // Set initial active id if url hash matches
    const currentHash = window.location.hash.replace("#", "");
    if (currentHash && items.some((item) => item.id === currentHash)) {
      setActiveId(currentHash);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-80px 0px -70% 0px",
        threshold: 0,
      }
    );

    // Observe each heading by ID
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${id}`);
      setActiveId(id);
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <aside
      aria-label="Table of contents"
      className={cn("w-full space-y-4", className)}
    >
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 shadow-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <ListTree className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider">
              On this page
            </span>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {items.length} sections
          </span>
        </div>

        {/* Links list */}
        <nav className="max-h-[calc(100vh-280px)] overflow-y-auto pr-1 space-y-1 text-xs">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleScrollTo(e, item.id)}
                className={cn(
                  "block py-1.5 pl-3 pr-2 rounded-r-lg border-l-2 transition-all leading-snug",
                  isActive
                    ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/70 dark:bg-indigo-950/40"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40"
                )}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Back to top action */}
        <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors w-full"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Back to top</span>
          </button>
        </div>
      </div>

      {/* Support / Quick Help Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-4 text-xs space-y-2">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
          <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
          <span>Need clarification?</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
          If you have questions about our policies or orders, contact our support team.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors pt-1"
        >
          <span>Contact support &rarr;</span>
        </Link>
      </div>
    </aside>
  );
}

/**
 * Mobile-friendly collapsible Table of Contents for small screens.
 */
export function TableOfContentsMobile({ items, className }: TableOfContentsProps) {
  if (!items || items.length === 0) return null;

  const handleMobileScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${id}`);
    }
  };

  return (
    <details
      className={cn(
        "lg:hidden mb-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm p-4 shadow-xs group",
        className
      )}
    >
      <summary className="flex items-center justify-between cursor-pointer font-medium text-sm text-slate-900 dark:text-white select-none">
        <span className="flex items-center gap-2">
          <ListTree className="w-4 h-4 text-indigo-500" />
          <span>Jump to section</span>
          <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {items.length} sections
          </span>
        </span>
        <ChevronDown className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform duration-200" />
      </summary>
      <nav className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 space-y-1">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => handleMobileScrollTo(e, item.id)}
            className="block px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </details>
  );
}
