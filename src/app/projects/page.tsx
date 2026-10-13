import type { Metadata } from "next";
import Link from "next/link";
import {
  catalogueFilterSchema,
  getLiveProjects,
  getCatalogueFilterCounts,
  type CatalogueFilters,
} from "@/server/projects/catalogue";
import { ProjectCard } from "@/components/catalogue/project-card";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = {
  title: "Projects | VTU Adda",
  description:
    "Curated VTU mini project and major project kits with source code, setup guide, report template and viva questions.",
  robots: {
    index: false,
    follow: false,
  },
};

interface ProjectsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const rawParams = await searchParams;

  // Flatten single values and validate
  const flattened: Record<string, any> = {};
  for (const [key, val] of Object.entries(rawParams)) {
    if (typeof val === "string") {
      flattened[key] = val;
    } else if (Array.isArray(val) && val.length > 0) {
      flattened[key] = val[0];
    }
  }

  const parseResult = catalogueFilterSchema.safeParse(flattened);
  const filters: CatalogueFilters = parseResult.success
    ? parseResult.data
    : { sort: "newest", page: 1 };

  const [{ projects, totalCount, totalPages, currentPage, isCatalogueEmpty }, filterCounts] =
    await Promise.all([getLiveProjects(filters), getCatalogueFilterCounts()]);

  // Build helper for pagination URLs keeping current query params
  function buildHrefWithPage(pageNum: number) {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.branch) params.set("branch", filters.branch);
    if (filters.semester) params.set("semester", filters.semester);
    if (filters.scheme) params.set("scheme", filters.scheme);
    if (filters.type) params.set("type", filters.type);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.tech) params.set("tech", filters.tech);
    if (filters.price_min !== undefined) params.set("price_min", String(filters.price_min));
    if (filters.price_max !== undefined) params.set("price_max", String(filters.price_max));
    if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
    params.set("page", String(pageNum));
    return `/projects?${params.toString()}`;
  }

  const hasActiveFilters = Boolean(
    filters.q ||
      filters.branch ||
      filters.semester ||
      filters.scheme ||
      filters.type ||
      filters.difficulty ||
      filters.tech ||
      filters.price_min !== undefined ||
      filters.price_max !== undefined
  );

  return (
    <div className="mx-auto max-w-container px-4 py-8 sm:px-6 sm:py-12 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Project Kits
        </h1>
        <p className="mt-1 text-sm text-ink-2">
          Verified academic projects for VTU engineering curriculum. Includes runnable source code, step-by-step setup guide, report template, and viva questions.
        </p>
      </div>

      {isCatalogueEmpty ? (
        <div className="rounded-md border border-dashed border-rule p-12 text-center bg-paper">
          <p className="text-base text-ink font-medium">
            No projects are listed yet. You can request a project, or check again soon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Mobile Filter Disclosure & Desktop Sidebar Form */}
          <aside className="lg:col-span-1">
            <details className="lg:hidden rounded-md border border-rule bg-surface p-4 group">
              <summary className="font-semibold text-sm text-ink cursor-pointer flex items-center justify-between">
                <span>Filters</span>
                <span className="text-xs text-ink-2 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="pt-4 border-t border-rule mt-3">
                <FilterForm
                  filters={filters}
                  filterCounts={filterCounts}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>
            </details>

            <div className="hidden lg:block rounded-md border border-rule bg-surface p-5">
              <FilterForm
                filters={filters}
                filterCounts={filterCounts}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </aside>

          {/* Results Column */}
          <main className="lg:col-span-3 space-y-6">
            {/* Top Toolbar: Result count and Sort Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-rule">
              <div className="text-sm font-medium text-ink">
                {totalCount} {totalCount === 1 ? "project" : "projects"}
              </div>

              {/* Sort form (GET) */}
              <form method="GET" className="flex items-center gap-2">
                {filters.q && <input type="hidden" name="q" value={filters.q} />}
                {filters.branch && <input type="hidden" name="branch" value={filters.branch} />}
                {filters.semester && <input type="hidden" name="semester" value={filters.semester} />}
                {filters.scheme && <input type="hidden" name="scheme" value={filters.scheme} />}
                {filters.type && <input type="hidden" name="type" value={filters.type} />}
                {filters.difficulty && <input type="hidden" name="difficulty" value={filters.difficulty} />}
                {filters.tech && <input type="hidden" name="tech" value={filters.tech} />}
                {filters.price_min !== undefined && (
                  <input type="hidden" name="price_min" value={filters.price_min} />
                )}
                {filters.price_max !== undefined && (
                  <input type="hidden" name="price_max" value={filters.price_max} />
                )}

                <label htmlFor="sort-select" className="text-xs text-ink-2 whitespace-nowrap">
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  name="sort"
                  defaultValue={filters.sort}
                  className="h-9 rounded-md border border-rule bg-surface px-2.5 text-xs text-ink focus:outline-accent"
                >
                  <option value="newest">Newest first</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="title">Title: A to Z</option>
                </select>
                <noscript>
                  <button
                    type="submit"
                    className="h-9 px-2 text-xs border border-rule rounded-md bg-paper text-ink"
                  >
                    Sort
                  </button>
                </noscript>
              </form>
            </div>

            {/* Project Cards Grid */}
            {projects.length === 0 ? (
              <div className="rounded-md border border-dashed border-rule p-12 text-center bg-paper space-y-3">
                <p className="text-base text-ink font-medium">
                  No projects match these filters.
                </p>
                <p>
                  <Link
                    href="/projects"
                    className="text-sm font-semibold text-accent hover:underline"
                  >
                    Clear filters
                  </Link>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  buildHref={buildHrefWithPage}
                />
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

interface FilterFormProps {
  filters: CatalogueFilters;
  filterCounts: any;
  hasActiveFilters: boolean;
}

function FilterForm({ filters, filterCounts, hasActiveFilters }: FilterFormProps) {
  return (
    <form method="GET" action="/projects" className="space-y-6">
      {/* Preserve Sort in GET submission */}
      {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}

      {/* Search Input */}
      <div className="space-y-1.5">
        <label htmlFor="q-filter" className="block text-xs font-bold uppercase tracking-wider text-ink-2">
          Search
        </label>
        <input
          id="q-filter"
          type="search"
          name="q"
          defaultValue={filters.q || ""}
          placeholder="Keywords, titles, topics..."
          className="w-full h-9 px-3 rounded-md border border-rule bg-surface text-sm text-ink placeholder:text-ink-3 focus:outline-accent"
        />
      </div>

      {/* Course Type Filter */}
      <div className="space-y-2">
        <label htmlFor="type-filter" className="block text-xs font-bold uppercase tracking-wider text-ink-2">
          Course Type
        </label>
        <select
          id="type-filter"
          name="type"
          defaultValue={filters.type || ""}
          className="w-full h-9 px-2.5 rounded-md border border-rule bg-surface text-sm text-ink focus:outline-accent"
        >
          <option value="">All course types</option>
          {filterCounts.types.map((t: any) => (
            <option key={t.value} value={t.value}>
              {t.label} ({t.count})
            </option>
          ))}
        </select>
      </div>

      {/* Branch Filter */}
      <div className="space-y-2">
        <label htmlFor="branch-filter" className="block text-xs font-bold uppercase tracking-wider text-ink-2">
          Branch
        </label>
        <select
          id="branch-filter"
          name="branch"
          defaultValue={filters.branch || ""}
          className="w-full h-9 px-2.5 rounded-md border border-rule bg-surface text-sm text-ink focus:outline-accent"
        >
          <option value="">All engineering branches</option>
          {filterCounts.branches.map((b: any) => (
            <option key={b.slug} value={b.slug}>
              {b.name} ({b.count})
            </option>
          ))}
        </select>
      </div>

      {/* Semester Filter */}
      <div className="space-y-2">
        <label htmlFor="semester-filter" className="block text-xs font-bold uppercase tracking-wider text-ink-2">
          Semester
        </label>
        <select
          id="semester-filter"
          name="semester"
          defaultValue={filters.semester || ""}
          className="w-full h-9 px-2.5 rounded-md border border-rule bg-surface text-sm text-ink focus:outline-accent"
        >
          <option value="">All semesters</option>
          {filterCounts.semesters.map((s: any) => (
            <option key={s.slug} value={s.slug}>
              {s.name} ({s.count})
            </option>
          ))}
        </select>
      </div>

      {/* Scheme Filter */}
      <div className="space-y-2">
        <label htmlFor="scheme-filter" className="block text-xs font-bold uppercase tracking-wider text-ink-2">
          Scheme
        </label>
        <select
          id="scheme-filter"
          name="scheme"
          defaultValue={filters.scheme || ""}
          className="w-full h-9 px-2.5 rounded-md border border-rule bg-surface text-sm text-ink focus:outline-accent"
        >
          <option value="">All schemes</option>
          {filterCounts.schemes.map((sch: any) => (
            <option key={sch.slug} value={sch.slug}>
              {sch.name} ({sch.count})
            </option>
          ))}
        </select>
      </div>

      {/* Difficulty Filter */}
      <div className="space-y-2">
        <label htmlFor="difficulty-filter" className="block text-xs font-bold uppercase tracking-wider text-ink-2">
          Difficulty
        </label>
        <select
          id="difficulty-filter"
          name="difficulty"
          defaultValue={filters.difficulty || ""}
          className="w-full h-9 px-2.5 rounded-md border border-rule bg-surface text-sm text-ink focus:outline-accent"
        >
          <option value="">All difficulty levels</option>
          {filterCounts.difficulties.map((d: any) => (
            <option key={d.value} value={d.value}>
              {d.label} ({d.count})
            </option>
          ))}
        </select>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-2">
          Price Range (₹)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            name="price_min"
            placeholder="Min"
            min="0"
            defaultValue={filters.price_min ?? ""}
            className="w-full h-9 px-2.5 rounded-md border border-rule bg-surface text-xs text-ink focus:outline-accent"
          />
          <input
            type="number"
            name="price_max"
            placeholder="Max"
            min="0"
            defaultValue={filters.price_max ?? ""}
            className="w-full h-9 px-2.5 rounded-md border border-rule bg-surface text-xs text-ink focus:outline-accent"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 space-y-2">
        <button
          type="submit"
          className="w-full h-10 rounded-md bg-accent text-surface text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          Apply Filters
        </button>

        {hasActiveFilters && (
          <Link
            href="/projects"
            className="block text-center text-xs font-medium text-ink-2 hover:text-ink pt-1"
          >
            Clear all filters
          </Link>
        )}
      </div>
    </form>
  );
}
