import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth";
import { createClient } from "@/server/supabase/server";
import { AppError } from "@/server/errors";
import { MfaScreen } from "./mfa-screen";

export const metadata = {
  title: "Admin Two-Factor Authentication",
};

export default async function AdminMfaPage() {
  const authUser = await requireUser("/admin/mfa");

  if (!authUser.roles.includes("admin")) {
    throw new AppError("Access denied: administrator role required", "FORBIDDEN", 403);
  }

  const supabase = await createClient();
  const { data: aalData } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aalData?.currentLevel === "aal2") {
    redirect("/admin");
  }

  return (
    <div className="mx-auto max-w-md py-12 px-4 sm:px-6">
      <MfaScreen />
    </div>
  );
}
