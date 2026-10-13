import { requireUser } from "@/server/auth";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProfileForm } from "./profile-form";

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

      <ProfileForm
        email={authUser.user.email || ""}
        initialProfile={authUser.profile}
      />
    </div>
  );
}
