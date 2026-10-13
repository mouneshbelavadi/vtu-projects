import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { CategoryManager } from "./category-manager";
import type { Category } from "@/types/database";

export const metadata = {
  title: "Categories | Admin",
};

export default async function AdminCategoriesPage() {
  await requireAdmin();

  const adminClient = createAdminClient();
  const { data: categories } = await adminClient
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Categories</h1>
        <p className="mt-1 text-sm text-ink-2">
          Manage branches, semesters, schemes, domains, and tech tags used for kit filtering.
        </p>
      </div>

      <CategoryManager categories={(categories as Category[]) || []} />
    </div>
  );
}
