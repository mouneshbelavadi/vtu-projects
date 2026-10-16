"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles, User, ShoppingBag, LogOut } from "lucide-react";
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
 * Modern sticky Site Header featuring:
 * - Glassmorphic backdrop blur with dynamic scroll elevation
 * - Geometric wordmark with vibrant gradient mark
 * - Active route indicator
 * - Prominent gradient Sign In button
 * - Animated mobile slide-in drawer with hamburger toggle
 */
export const Header: React.FC<HeaderProps> = ({ user = null }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const pathname = usePathname();
  const navItems = getVisibleNavItems();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on route navigation
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <a
        href="#main-content"
        className={cn(
          "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50",
          "rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        )}
      >
        Skip to content
      </a>

      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-200 border-b border-rule",
          "bg-white/98 dark:bg-slate-950/98 backdrop-blur-md",
          isScrolled ? "shadow-sm shadow-slate-900/5" : ""
        )}
      >
        <div className="mx-auto flex max-w-container items-center justify-between px-3.5 py-3 sm:px-6 sm:py-3.5">
          <div className="flex items-center gap-4 lg:gap-8 min-w-0">
            {/* Logo with Gradient Mark */}
            <Link
              href="/"
              className="group flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-accent shrink-0"
            >
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/30 group-hover:shadow-indigo-500/50 group-hover:scale-105 transition-all duration-200 shrink-0">
                <Sparkles className="h-4 w-4 sm:h-4.5 sm:w-4.5" strokeWidth={2.25} />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-base sm:text-xl font-extrabold tracking-tight text-ink whitespace-nowrap">
                  VTU Adda{" "}
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    Projects
                  </span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            {navItems.length > 0 && (
              <nav aria-label="Main Navigation" className="hidden items-center gap-1 xl:gap-1.5 lg:flex">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap",
                        isActive
                          ? "text-brand-600 dark:text-brand-400 font-semibold bg-brand-50/80 dark:bg-brand-950/50"
                          : "text-ink-2 hover:text-ink hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                      )}
                    >
                      {item.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-brand-600 dark:bg-brand-400" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <Link
                  href="/account/orders"
                  className={cn(
                    "hidden sm:inline-flex h-9 items-center gap-1.5 rounded-xl border border-rule bg-surface px-3 text-xs font-semibold text-ink shadow-xs",
                    "transition-all duration-200 hover:border-rule-strong hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-98"
                  )}
                >
                  <ShoppingBag className="h-3.5 w-3.5 text-accent" />
                  <span>My orders</span>
                </Link>

                <Link
                  href="/account"
                  className={cn(
                    "inline-flex h-8 sm:h-9 max-w-[105px] xs:max-w-[130px] sm:max-w-[160px] items-center gap-1.5 rounded-xl border border-rule bg-surface px-2.5 sm:px-3 text-xs font-semibold text-ink shadow-xs truncate",
                    "transition-all duration-200 hover:border-rule-strong hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-98"
                  )}
                  title={user.displayName || user.email}
                >
                  <User className="h-3.5 w-3.5 text-ink-3 shrink-0" />
                  <span className="truncate">{user.displayName || user.email}</span>
                </Link>

                <form action="/logout" method="POST" className="inline">
                  <button
                    type="submit"
                    className={cn(
                      "inline-flex h-8 sm:h-9 items-center gap-1 rounded-xl border border-rule bg-surface px-2 sm:px-2.5 text-xs font-semibold text-ink-2 shadow-xs cursor-pointer",
                      "transition-all duration-200 hover:border-danger hover:text-danger hover:bg-danger-bg active:scale-98"
                    )}
                    title="Sign out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Sign out</span>
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className={cn(
                  "inline-flex h-8.5 sm:h-9 min-h-[34px] items-center justify-center rounded-xl font-semibold text-xs sm:text-sm text-white px-3.5 sm:px-5",
                  "bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 shadow-sm shadow-indigo-500/25",
                  "transition-all duration-200 hover:shadow-md hover:shadow-indigo-500/35 hover:brightness-105 active:scale-98"
                )}
              >
                Sign in
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            {navItems.length > 0 && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
                className={cn(
                  "inline-flex h-8.5 w-8.5 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-rule bg-surface text-ink lg:hidden shadow-xs cursor-pointer",
                  "transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-rule-strong"
                )}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2} />
                ) : (
                  <Menu className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Animated Slide-in Drawer */}
        {mobileMenuOpen && navItems.length > 0 && (
          <div className="fixed inset-0 top-[54px] sm:top-[57px] z-50 lg:hidden animate-fade-in">
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 top-[54px] sm:top-[57px] bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer Content */}
            <nav
              id="mobile-navigation"
              aria-label="Mobile Navigation"
              className="relative border-b border-rule bg-surface p-5 shadow-xl space-y-4 max-h-[calc(100vh-60px)] overflow-y-auto"
            >
              <div className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-4 py-2.5 text-base font-semibold transition-all duration-150",
                        isActive
                          ? "bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400"
                          : "text-ink hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <span>{item.label}</span>
                      <span className="text-xs text-ink-3">&rarr;</span>
                    </Link>
                  );
                })}
              </div>

              {user && (
                <div className="pt-3 border-t border-rule space-y-2">
                  <Link
                    href="/account/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold text-ink hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span>My orders</span>
                    <span className="text-xs text-ink-3">&rarr;</span>
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold text-ink hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="truncate">{user.displayName || user.email}</span>
                    <span className="text-xs text-ink-3">&rarr;</span>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
};
