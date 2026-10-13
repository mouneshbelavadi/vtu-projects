export interface NavItem {
  label: string;
  href: string;
  status: "live" | "planned";
}

export const navigationItems: NavItem[] = [
  { label: "Projects", href: "/projects", status: "planned" },
  { label: "Request a project", href: "/request", status: "planned" },
  { label: "Mentoring", href: "/mentoring", status: "planned" },
  { label: "How it works", href: "/how-it-works", status: "planned" },
  { label: "Contact", href: "/contact", status: "planned" },
];

export function getVisibleNavItems(
  isProduction = process.env.NODE_ENV === "production"
): NavItem[] {
  if (isProduction) {
    return navigationItems.filter((item) => item.status === "live");
  }
  return navigationItems;
}
