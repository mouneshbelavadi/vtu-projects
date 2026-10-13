"use client";

import { useState, useActionState } from "react";
import { addCategory, renameCategory, moveCategory, deleteCategory } from "./actions";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Category, CategoryKind } from "@/types/database";

interface CategoryManagerProps {
  categories: Category[];
}

const KIND_LABELS: Record<CategoryKind, string> = {
  branch: "Branches",
  semester: "Semesters",
  scheme: "Schemes",
  domain: "Domains",
  tech: "Tech Stack",
};

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [activeKind, setActiveKind] = useState<CategoryKind>("branch");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [addState, addAction, isAddPending] = useActionState(addCategory, {
    status: "idle",
  });

  const [renameState, renameAction, isRenamePending] = useActionState(renameCategory, {
    status: "idle",
  });

  const currentCategories = categories
    .filter((c) => c.kind === activeKind)
    .sort((a, b) => a.sort_order - b.sort_order);

  async function handleMove(id: string, dir: "up" | "down") {
    setActionError(null);
    const res = await moveCategory(id, dir);
    if (!res.success && res.message) {
      setActionError(res.message);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      return;
    }
    setActionError(null);
    const res = await deleteCategory(id);
    if (!res.success && res.message) {
      setActionError(res.message);
    }
  }

  function handleAutoSlug(name: string, targetInputId: string) {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const target = document.getElementById(targetInputId) as HTMLInputElement | null;
    if (target && !target.dataset.manual) {
      target.value = slug;
    }
  }

  return (
    <div className="space-y-6">
      {actionError && (
        <Alert variant="error" title="Action failed">
          {actionError}
        </Alert>
      )}

      <div>
        <div className="flex flex-wrap border-b border-rule gap-2">
          {(Object.keys(KIND_LABELS) as CategoryKind[]).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setActiveKind(kind)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-120",
                activeKind === kind
                  ? "border-accent text-accent font-semibold"
                  : "border-transparent text-ink-2 hover:text-ink"
              )}
            >
              {KIND_LABELS[kind]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
          {/* Categories List */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-32">Slug</TableHead>
                    <TableHead className="w-44 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-sm text-ink-2">
                        No categories found in this section. Add one on the right.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentCategories.map((cat, idx) => (
                      <TableRow key={cat.id}>
                        <TableCell className="text-center font-mono text-xs text-ink-2">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-medium text-ink">
                          {cat.name}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-ink-2">
                          {cat.slug}
                        </TableCell>
                        <TableCell className="text-right space-x-1 whitespace-nowrap">
                          {/* Reorder Buttons: Move Up / Down without animations */}
                          <Button
                            type="button"
                            variant="quiet"
                            size="sm"
                            disabled={idx === 0}
                            onClick={() => handleMove(cat.id, "up")}
                            title="Move Up"
                            className="px-2 h-7 text-xs"
                          >
                            &uarr;
                          </Button>
                          <Button
                            type="button"
                            variant="quiet"
                            size="sm"
                            disabled={idx === currentCategories.length - 1}
                            onClick={() => handleMove(cat.id, "down")}
                            title="Move Down"
                            className="px-2 h-7 text-xs"
                          >
                            &darr;
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingCategory(cat)}
                            className="px-2 h-7 text-xs"
                          >
                            Rename
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="px-2 h-7 text-xs"
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Add Category Form */}
          <div>
            <Card className="p-5 space-y-4">
              <h2 className="text-base font-semibold text-ink">
                Add {KIND_LABELS[activeKind].slice(0, -1)}
              </h2>

              {addState.status === "error" && (
                <Alert variant="error" title="Could not add category">
                  {addState.message}
                </Alert>
              )}

              {addState.status === "success" && (
                <Alert variant="success" title="Success">
                  Category created successfully.
                </Alert>
              )}

              <form action={addAction} className="space-y-4">
                <input type="hidden" name="kind" value={activeKind} />

                <FormField
                  id="category-name"
                  label="Category Name"
                  helpText="Displayed to students in catalogue navigation."
                  required
                >
                  <Input
                    id="category-name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Artificial Intelligence"
                    onChange={(e) => handleAutoSlug(e.target.value, "category-slug")}
                  />
                </FormField>

                <FormField
                  id="category-slug"
                  label="Slug"
                  helpText="URL parameter (lowercase, alphanumeric, hyphens)."
                  required
                >
                  <Input
                    id="category-slug"
                    name="slug"
                    type="text"
                    required
                    placeholder="e.g. artificial-intelligence"
                    pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
                    onChange={(e) => {
                      e.target.dataset.manual = "true";
                    }}
                  />
                </FormField>

                <Button type="submit" variant="primary" className="w-full" isLoading={isAddPending}>
                  Add Category
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Category Dialog */}
      {editingCategory && (
        <Dialog
          open={true}
          onOpenChange={(open) => !open && setEditingCategory(null)}
          title={`Edit Category: ${editingCategory.name}`}
        >
          <form
            action={async (formData) => {
              await renameAction(formData);
              setEditingCategory(null);
            }}
            className="space-y-4 py-2"
          >
            {renameState.status === "error" && (
              <Alert variant="error" title="Failed">
                {renameState.message}
              </Alert>
            )}

            <input type="hidden" name="id" value={editingCategory.id} />

            <FormField id="edit-category-name" label="Category Name">
              <Input
                id="edit-category-name"
                name="name"
                type="text"
                required
                defaultValue={editingCategory.name}
              />
            </FormField>

            <FormField id="edit-category-slug" label="Slug">
              <Input
                id="edit-category-slug"
                name="slug"
                type="text"
                required
                defaultValue={editingCategory.slug}
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingCategory(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isRenamePending}>
                Save changes
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
