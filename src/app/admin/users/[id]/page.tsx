import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AdminUserDetailClient } from "./admin-user-detail-client";

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "User Management | Admin | VTU Adda Projects",
  description: "View user details, export account data, and perform GDPR/DPDP compliant anonymisation.",
};

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  await requireAdmin();
  const { id } = await params;
  const adminClient = createAdminClient();

  const [authRes, profileRes, rolesRes] = await Promise.all([
    adminClient.auth.admin.getUserById(id),
    adminClient.from("profiles").select("*").eq("id", id).maybeSingle(),
    adminClient.from("user_roles").select("role").eq("user_id", id),
  ]);

  const authUser = authRes.data?.user;
  const profile = profileRes.data;

  if (!authUser && !profile) {
    notFound();
  }

  const isAnonymised =
    !authUser ||
    profile?.display_name === "Anonymised User" ||
    (profile?.display_name || "").startsWith("Anonymised");

  const roles = (rolesRes.data || []).map((r) => r.role);

  const userData = {
    id,
    email: authUser?.email || null,
    displayName: profile?.display_name || authUser?.user_metadata?.full_name || "Student",
    phone: profile?.phone || null,
    createdAt: authUser?.created_at || profile?.created_at || new Date().toISOString(),
    roles,
    isAnonymised,
  };

  return (
    <div className="mx-auto max-w-4xl py-8 px-4 sm:px-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Users" },
          { label: id.slice(0, 8) },
        ]}
      />

      <div className="border-b border-rule pb-4">
        <h1 className="font-serif text-2xl font-bold text-ink">User Account Details</h1>
        <p className="text-sm text-ink-2">
          Manage user account data, export personal archives, and process account anonymisation.
        </p>
      </div>

      <AdminUserDetailClient user={userData} />
    </div>
  );
}
