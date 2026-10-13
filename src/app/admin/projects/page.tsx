import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { LinkButton } from "@/components/ui/button";
import type { Project } from "@/types/database";

export const metadata = {
  title: "Projects | Admin",
};

interface ProjectsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
}

const COURSE_TYPE_LABELS: Record<string, string> = {
  mini_project: "Mini Project",
  project_phase_1: "Project Phase I",
  major_project_phase_2: "Major Project Phase II",
  capstone: "Capstone Project",
  hackathon_project: "Hackathon Project",
  other: "Other Project",
};

export default async function AdminProjectsPage({ searchParams }: ProjectsPageProps) {
  await requireAdmin();

  const { search, status } = await searchParams;
  const adminClient = createAdminClient();

  let query = adminClient
    .from("projects")
    .select(`
      *,
      project_files:project_files(count),
      project_media:project_media(count)
    `)
    .order("updated_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search && search.trim()) {
    query = query.ilike("title", `%${search.trim()}%`);
  }

  const { data: projects } = await query;

  function formatDate(iso: string) {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Project Kits</h1>
          <p className="mt-1 text-sm text-ink-2">
            Catalogue inventory management, file packages, and publication status.
          </p>
        </div>

        <LinkButton href="/admin/projects/new" variant="primary">
          Create new project
        </LinkButton>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-paper">
        <form method="GET" className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="search"
            name="search"
            defaultValue={search || ""}
            placeholder="Search by project title..."
            className="w-full sm:w-64 h-9 px-3 rounded-md border border-rule bg-surface text-sm text-ink focus:outline-accent"
          />

          <select
            name="status"
            defaultValue={status || "all"}
            className="w-full sm:w-40 h-9 px-3 rounded-md border border-rule bg-surface text-sm text-ink focus:outline-accent"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="live">Live</option>
            <option value="hidden">Hidden</option>
          </select>

          <button
            type="submit"
            className="h-9 px-4 text-xs font-medium rounded-md border border-rule bg-surface hover:bg-paper"
          >
            Filter
          </button>
        </form>
      </Card>

      {/* Projects Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-24">Price</TableHead>
              <TableHead className="w-36">Course Type</TableHead>
              <TableHead className="w-20 text-center">Files</TableHead>
              <TableHead className="w-24 text-center">Media</TableHead>
              <TableHead className="w-28">Updated</TableHead>
              <TableHead className="w-20 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!projects || projects.length === 0) ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-ink-3">
                  No projects matching filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((proj: Project & { project_files: [{ count: number }]; project_media: [{ count: number }] }) => (
                <TableRow key={proj.id}>
                  <TableCell>
                    <span className="font-medium text-sm text-ink block line-clamp-1">
                      {proj.title}
                    </span>
                    <span className="font-mono text-xs text-ink-3 block mt-0.5">
                      /{proj.slug}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={proj.status} />
                  </TableCell>
                  <TableCell>
                    <Price amountInr={proj.price_inr} className="text-sm" />
                  </TableCell>
                  <TableCell className="text-xs text-ink-2">
                    {COURSE_TYPE_LABELS[proj.course_type] || proj.course_type}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-ink-2">
                    {proj.project_files?.[0]?.count ?? 0}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-ink-2">
                    {proj.project_media?.[0]?.count ?? 0}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-ink-2 whitespace-nowrap">
                    {formatDate(proj.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <LinkButton
                      href={`/admin/projects/${proj.id}`}
                      variant="quiet"
                      size="sm"
                    >
                      Edit
                    </LinkButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
