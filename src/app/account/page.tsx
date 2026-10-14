import Link from "next/link";
import { requireUser } from "@/server/auth";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProfileForm } from "./profile-form";
import { AccountDataTools } from "./account-data-tools";

export const metadata = {
  title: "My Account",
  description: "Manage your profile details and settings.",
};

export default async function AccountPage() {
  const authUser = await requireUser("/account");

  return (
    <div className="mx-auto max-w-2xl py-8 px-4 sm:px-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Account" },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/account/orders"
          className="p-3.5 rounded-md border border-rule bg-surface hover:border-rule-strong hover:bg-paper transition-colors block text-sm"
        >
          <span className="font-semibold text-ink block">My orders</span>
          <span className="text-xs text-ink-3">Project kits & payments</span>
        </Link>
        <Link
          href="/account/requests"
          className="p-3.5 rounded-md border border-rule bg-surface hover:border-rule-strong hover:bg-paper transition-colors block text-sm"
        >
          <span className="font-semibold text-ink block">Custom requests</span>
          <span className="text-xs text-ink-3">Milestones & deliverables</span>
        </Link>
        <Link
          href="/account/bookings"
          className="p-3.5 rounded-md border border-rule bg-surface hover:border-rule-strong hover:bg-paper transition-colors block text-sm"
        >
          <span className="font-semibold text-ink block">Mentoring bookings</span>
          <span className="text-xs text-ink-3">Live sessions & links</span>
        </Link>
      </div>

      <ProfileForm
        email={authUser.user.email || ""}
        initialProfile={authUser.profile}
      />

      <AccountDataTools />
    </div>
  );
}
