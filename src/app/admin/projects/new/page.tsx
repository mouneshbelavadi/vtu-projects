import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { ProjectCreateForm } from "./project-create-form";
import type { Category } from "@/types/database";

export const metadata = {
  title: "New Project Kit | Admin",
};

export default async function NewProjectPage() {
  await requireAdmin();

  const adminClient = createAdminClient();
  const { data: categories } = await adminClient
    .from("categories")
    .select("*")
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Create New Project Kit</h1>
        <p className="mt-1 text-sm text-ink-2">
          Add a new engineering project kit to the catalogue as a draft. Files and screenshots are uploaded after creation.
        </p>
      </div>

      <ProjectCreateForm categories={(categories || []) as Category[]} />
    </div>
  );
}
