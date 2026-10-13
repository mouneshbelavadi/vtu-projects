"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getVisibleAdminNavItems } from "@/content/admin-navigation";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  adminEmail: string;
}

export function AdminSidebar({ adminEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const navItems = getVisibleAdminNavItems();

  return (
    <aside className="w-full md:w-56 md:flex-shrink-0 border-b md:border-b-0 md:border-r border-rule bg-surface p-4">
      <div className="mb-4 pb-4 border-b border-rule hidden md:block">
        <span className="text-xs font-mono uppercase tracking-wider text-ink-3 block">
          Admin Console
        </span>
        <span className="text-xs font-mono text-ink truncate block mt-0.5" title={adminEmail}>
          {adminEmail}
        </span>
      </div>

      <nav aria-label="Admin Navigation" className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors duration-120",
                isActive
                  ? "bg-paper text-accent font-semibold border-l-0 md:border-l-2 md:border-accent"
                  : "text-ink-2 hover:text-ink hover:bg-paper"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
