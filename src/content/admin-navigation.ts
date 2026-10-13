export interface AdminNavItem {
  label: string;
  href: string;
  status: "live" | "planned";
}

export const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", status: "live" },
  { label: "Payments", href: "/admin/payments", status: "live" },
  { label: "Orders", href: "/admin/orders", status: "live" },
  { label: "Projects", href: "/admin/projects", status: "live" },
  { label: "Categories", href: "/admin/categories", status: "live" },
  { label: "Settings", href: "/admin/settings", status: "live" },
  { label: "Audit log", href: "/admin/audit", status: "live" },
  { label: "Requests", href: "/admin/requests", status: "planned" },
  { label: "Mentoring", href: "/admin/mentoring", status: "planned" },
  { label: "Reviews", href: "/admin/reviews", status: "planned" },
  { label: "Tickets", href: "/admin/tickets", status: "planned" },
];

export function getVisibleAdminNavItems(): AdminNavItem[] {
  // In admin shell, show live items. Planned items appear when their respective prompt is completed.
  return adminNavItems.filter((item) => item.status === "live");
}
