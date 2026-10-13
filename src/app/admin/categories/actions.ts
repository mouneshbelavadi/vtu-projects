"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { rateLimit } from "@/server/security/rate-limit";
import { logAdminAction } from "@/server/audit";
import { CATEGORY_KINDS, type CategoryKind } from "@/types/database";

const addCategorySchema = z.object({
  kind: z.enum(CATEGORY_KINDS),
  name: z.string().trim().min(1, "Name is required").max(100),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
});

const renameCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(100),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
});

export type CategoryActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function addCategory(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const authUser = await requireAdmin();

  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { status: "error", message: "Rate limit exceeded. Please wait a minute." };
  }

  const parse = addCategorySchema.safeParse({
    kind: formData.get("kind"),
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parse.success) {
    return { status: "error", message: parse.error.issues[0]?.message || "Validation failed" };
  }

  const { kind, name, slug } = parse.data;
  const adminClient = createAdminClient();

  // Find highest sort order for this kind
  const { data: existing } = await adminClient
    .from("categories")
    .select("sort_order")
    .eq("kind", kind)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { data: newCat, error } = await adminClient
    .from("categories")
    .insert({
      kind,
      name,
      slug,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    return { status: "error", message: `Could not create category: ${error.message}` };
  }

  await logAdminAction({
    actorId: authUser.user.id,
    action: "create_category",
    entity: "categories",
    entityId: newCat.id,
    details: { kind, name, slug },
  });

  revalidatePath("/admin/categories");
  return { status: "success", message: `Category "${name}" added successfully.` };
}

export async function renameCategory(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const authUser = await requireAdmin();

  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { status: "error", message: "Rate limit exceeded. Please wait a minute." };
  }

  const parse = renameCategorySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parse.success) {
    return { status: "error", message: parse.error.issues[0]?.message || "Validation failed" };
  }

  const { id, name, slug } = parse.data;
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("categories")
    .update({ name, slug })
    .eq("id", id);

  if (error) {
    return { status: "error", message: `Could not update category: ${error.message}` };
  }

  await logAdminAction({
    actorId: authUser.user.id,
    action: "rename_category",
    entity: "categories",
    entityId: id,
    details: { name, slug },
  });

  revalidatePath("/admin/categories");
  return { status: "success", message: "Category updated successfully." };
}

export async function moveCategory(
  id: string,
  direction: "up" | "down"
): Promise<{ success: boolean; message?: string }> {
  const authUser = await requireAdmin();

  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { success: false, message: "Rate limit exceeded." };
  }

  const adminClient = createAdminClient();

  const { data: current } = await adminClient
    .from("categories")
    .select("id, kind, sort_order")
    .eq("id", id)
    .single();

  if (!current) {
    return { success: false, message: "Category not found." };
  }

  // Get neighboring category
  const orderOp = direction === "up" ? "lt" : "gt";
  const ascending = direction !== "up";

  let query = adminClient
    .from("categories")
    .select("id, sort_order")
    .eq("kind", current.kind);

  query = direction === "up"
    ? query.lt("sort_order", current.sort_order).order("sort_order", { ascending: false })
    : query.gt("sort_order", current.sort_order).order("sort_order", { ascending: true });

  const { data: neighbor } = await query.limit(1).maybeSingle();

  if (!neighbor) {
    return { success: true }; // Already at top or bottom
  }

  // Swap sort_order
  await Promise.all([
    adminClient.from("categories").update({ sort_order: neighbor.sort_order }).eq("id", current.id),
    adminClient.from("categories").update({ sort_order: current.sort_order }).eq("id", neighbor.id),
  ]);

  await logAdminAction({
    actorId: authUser.user.id,
    action: "reorder_category",
    entity: "categories",
    entityId: id,
    details: { direction, from: current.sort_order, to: neighbor.sort_order },
  });

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
  const authUser = await requireAdmin();

  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { success: false, message: "Rate limit exceeded." };
  }

  const adminClient = createAdminClient();

  // Check if any projects are linked to this category
  const { count } = await adminClient
    .from("project_categories")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);

  if (count && count > 0) {
    return {
      success: false,
      message: `Cannot delete: category is currently attached to ${count} projects. Remove the category from those projects first.`,
    };
  }

  const { error } = await adminClient.from("categories").delete().eq("id", id);
  if (error) {
    return { success: false, message: error.message };
  }

  await logAdminAction({
    actorId: authUser.user.id,
    action: "delete_category",
    entity: "categories",
    entityId: id,
  });

  revalidatePath("/admin/categories");
  return { success: true };
}
