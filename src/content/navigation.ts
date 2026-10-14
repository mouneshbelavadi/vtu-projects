export interface NavItem {
  label: string;
  href: string;
  status: "live" | "planned";
}

export const navigationItems: NavItem[] = [
  { label: "Projects", href: "/projects", status: "live" },
  { label: "Request a project", href: "/request", status: "live" },
  { label: "Mentoring", href: "/mentoring", status: "live" },
  { label: "How it works", href: "/how-it-works", status: "live" },
  { label: "Contact", href: "/contact", status: "live" },
];

export function getVisibleNavItems(
  isProduction = process.env.NODE_ENV === "production"
): NavItem[] {
  if (isProduction) {
    return navigationItems.filter((item) => item.status === "live");
  }
  return navigationItems;
}
