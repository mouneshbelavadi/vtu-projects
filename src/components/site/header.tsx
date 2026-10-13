"use client";

import * as React from "react";
import Link from "next/link";
import { getVisibleNavItems } from "@/content/navigation";
import { cn } from "@/lib/utils";

export interface HeaderUser {
  email: string;
  displayName: string | null;
}

interface HeaderProps {
  user?: HeaderUser | null;
}

/**
 * Site Header component with plain text wordmark, accessible navigation disclosure,
 * live account links, and POST-based Sign out form.
 */
export const Header: React.FC<HeaderProps> = ({ user = null }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const navItems = getVisibleNavItems();

  return (
    <>
      <a
        href="#main-content"
        className={cn(
          "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50",
          "rounded-md bg-accent px-4 py-2 font-medium text-surface",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        )}
      >
        Skip to content
      </a>

      <header className="border-b border-rule bg-surface">
        <div className="mx-auto flex max-w-container items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="font-serif text-xl font-bold tracking-tight text-ink hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
            >
              VTU Adda Projects
            </Link>

            {navItems.length > 0 && (
              <nav aria-label="Main Navigation" className="hidden items-center gap-6 md:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm font-medium text-ink-2 transition-colors duration-120 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/account"
                  className={cn(
                    "inline-flex h-9 min-h-[36px] max-w-[150px] sm:max-w-[200px] truncate items-center justify-center rounded-md border border-rule px-3 text-sm font-medium text-ink",
                    "transition-colors duration-120 hover:border-ink-2 hover:bg-paper",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  )}
                  title={user.displayName || user.email}
                >
                  <span className="truncate">{user.displayName || user.email}</span>
                </Link>

                <form action="/logout" method="POST" className="inline">
                  <button
                    type="submit"
                    className={cn(
                      "inline-flex h-9 min-h-[36px] items-center justify-center rounded-md border border-rule px-3 text-sm font-medium text-ink-2",
                      "transition-colors duration-120 hover:border-danger hover:text-danger hover:bg-danger-bg",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    )}
                  >
                    Sign out
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className={cn(
                  "inline-flex h-9 min-h-[36px] items-center justify-center rounded-md border border-rule px-3 text-sm font-medium text-ink",
                  "transition-colors duration-120 hover:border-ink-2 hover:bg-paper",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                )}
              >
                Sign in
              </Link>
            )}

            {navItems.length > 0 && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
                className={cn(
                  "inline-flex h-9 min-h-[36px] items-center justify-center rounded-md border border-rule px-3 text-sm font-medium text-ink md:hidden",
                  "transition-colors duration-120 hover:bg-paper",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                )}
              >
                Menu
              </button>
            )}
          </div>
        </div>

        {/* Mobile simple disclosure list */}
        {mobileMenuOpen && navItems.length > 0 && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile Navigation"
            className="border-t border-rule bg-paper px-4 py-3 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-2 py-2 text-base font-medium text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>
    </>
  );
};
