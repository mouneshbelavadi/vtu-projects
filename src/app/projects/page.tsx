import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  Code2,
  BookOpen,
  FileText,
  HelpCircle,
  SlidersHorizontal,
  Search,
  RotateCcw,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  catalogueFilterSchema,
  getLiveProjects,
  getCatalogueFilterCounts,
  type CatalogueFilters,
} from "@/server/projects/catalogue";
import { ProjectCard } from "@/components/catalogue/project-card";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = {
  title: "Engineering Project Kits | VTU Adda",
  description:
    "Browse verified engineering project kits for VTU students with source code, report templates and viva questions.",
  alternates: {
    canonical: "https://projects.vtuadda.com/projects",
  },
  openGraph: {
    title: "Engineering Project Kits | VTU Adda",
    description:
      "Browse verified engineering project kits for VTU students with source code, report templates and viva questions.",
    url: "https://projects.vtuadda.com/projects",
  },
  twitter: {
    card: "summary_large_image",
    title: "Engineering Project Kits | VTU Adda",
    description:
      "Browse verified engineering project kits for VTU students with source code, report templates and viva questions.",
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
    <div className="mx-auto max-w-container px-4 py-8 sm:px-6 sm:py-12 space-y-10">
      {/* Dramatic Hero / Page Header Section */}
      <section className="relative overflow-hidden rounded-3xl border border-rule/80 bg-gradient-to-b from-indigo-50/70 via-surface to-surface dark:from-slate-900/60 dark:via-surface dark:to-surface p-6 sm:p-10 shadow-xs">
        {/* Subtle ambient background glow and grid */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative space-y-4 max-w-3xl">
          {/* Small Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/90 dark:bg-slate-900/90 dark:border-indigo-900/60 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 shadow-xs backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Verified Academic Projects</span>
          </div>

          {/* Large Heading with Gradient Highlight */}
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl lg:text-5xl leading-tight">
            Engineering{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Project Kits
            </span>
          </h1>

          {/* Existing Description */}
          <p className="text-sm sm:text-base text-ink-2 leading-relaxed">
            Verified academic projects for VTU engineering curriculum. Includes runnable source code, step-by-step setup guide, report template, and viva questions.
          </p>

          {/* Row of Trust Indicators styled as Chips */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-rule/80 bg-surface px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs">
              <Code2 className="h-4 w-4 text-brand-600" />
              <span>Runnable source code</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-rule/80 bg-surface px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs">
              <BookOpen className="h-4 w-4 text-cyan-500" />
              <span>Setup guide</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-rule/80 bg-surface px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs">
              <FileText className="h-4 w-4 text-amber-500" />
              <span>Report template</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-rule/80 bg-surface px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs">
              <HelpCircle className="h-4 w-4 text-emerald-500" />
              <span>Viva questions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Catalogue Content Area */}
      {isCatalogueEmpty ? (
        /* Empty State (Empty Catalogue) */
        <div className="relative overflow-hidden rounded-3xl border border-dashed border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/50 to-surface p-12 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 border border-brand-200/60 shadow-xs mb-4">
            <Layers className="h-8 w-8" />
          </div>
          <p className="mx-auto max-w-md text-base font-semibold text-ink leading-relaxed">
            No projects are listed yet. You can request a project, or check again soon.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/request"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-indigo-500/25 transition-all"
            >
              <span>Request a project</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50 transition-all"
            >
              <RotateCcw className="h-4 w-4 text-ink-3" />
              <span>Check again</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Filter Sidebar (Desktop Sticky Glass Card & Mobile Disclosure) */}
          <aside className="lg:col-span-1 lg:sticky lg:top-20 z-20">
            {/* Mobile Filter Disclosure */}
            <details className="lg:hidden rounded-2xl border border-rule bg-surface p-4.5 group shadow-xs">
              <summary className="font-display font-bold text-sm text-ink cursor-pointer flex items-center justify-between list-none">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-brand-600" />
                  <span>Filters &amp; Search</span>
                </span>
                <span className="text-xs text-ink-3 group-open:rotate-180 transition-transform duration-200">
                  ▼
                </span>
              </summary>
              <div className="pt-4 border-t border-rule mt-3.5">
                <FilterForm
                  filters={filters}
                  filterCounts={filterCounts}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>
            </details>

            {/* Desktop Sticky Sidebar */}
            <div className="hidden lg:block rounded-2xl border border-rule/80 bg-surface/90 backdrop-blur-md p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-rule pb-3.5">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-ink">
                  <SlidersHorizontal className="h-4 w-4 text-brand-600" />
                  <span>Filters</span>
                </div>
                {hasActiveFilters && (
                  <Link
                    href="/projects"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    Reset all
                  </Link>
                )}
              </div>

              <FilterForm
                filters={filters}
                filterCounts={filterCounts}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </aside>

          {/* Results Main Column */}
          <main className="lg:col-span-3 space-y-6">
            {/* Sticky/Glass Top Results Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl border border-rule/80 bg-surface/80 backdrop-blur-md shadow-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-ink">
                  {totalCount} {totalCount === 1 ? "project kit available" : "project kits available"}
                </span>
              </div>

              {/* Sort form (GET) */}
              <form method="GET" className="flex items-center gap-2 text-xs">
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

                <label htmlFor="sort-select" className="text-ink-2 font-medium whitespace-nowrap">
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  name="sort"
                  defaultValue={filters.sort}
                  className="h-9 rounded-xl border border-rule bg-surface px-3 text-xs font-semibold text-ink shadow-xs focus:border-accent focus:outline-none"
                >
                  <option value="newest">Newest first</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="title">Title: A to Z</option>
                </select>
                <noscript>
                  <button
                    type="submit"
                    className="h-9 px-3 text-xs border border-rule rounded-xl bg-surface text-ink font-semibold"
                  >
                    Sort
                  </button>
                </noscript>
              </form>
            </div>

            {/* Active Filter Pills Bar */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
                <span className="text-xs font-semibold text-ink-3">Active filters:</span>
                {filters.q && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    Search: &ldquo;{filters.q}&rdquo;
                  </span>
                )}
                {filters.branch && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-rule bg-surface px-2.5 py-0.5 text-xs font-medium text-ink">
                    Branch: {filters.branch}
                  </span>
                )}
                {filters.type && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-rule bg-surface px-2.5 py-0.5 text-xs font-medium text-ink">
                    Type: {filters.type}
                  </span>
                )}
                {filters.semester && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-rule bg-surface px-2.5 py-0.5 text-xs font-medium text-ink">
                    Semester: {filters.semester}
                  </span>
                )}
                <Link
                  href="/projects"
                  className="text-xs font-semibold text-brand-600 hover:underline pl-1"
                >
                  Clear all
                </Link>
              </div>
            )}

            {/* Project Cards Grid (1 col mobile, 2 col tablet, 3 col desktop) */}
            {projects.length === 0 ? (
              /* Empty State (No Filter Matches) */
              <div className="relative overflow-hidden rounded-3xl border border-dashed border-rule bg-surface p-12 text-center shadow-xs space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                  <Search className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-lg text-ink">
                    No projects match these filters.
                  </h3>
                  <p className="text-xs text-ink-2 max-w-sm mx-auto leading-relaxed">
                    Try broadening your search keywords or resetting your branch and semester criteria.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/projects"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:shadow-indigo-500/25 transition-all"
                  >
                    <span>Clear all filters</span>
                  </Link>
                  <Link
                    href="/request"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-surface px-4 py-2 text-xs font-semibold text-ink hover:bg-slate-50 transition-all"
                  >
                    <span>Request a custom project</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-8 flex justify-center">
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
    <form method="GET" action="/projects" className="space-y-5">
      {/* Preserve Sort in GET submission */}
      {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}

      {/* Search Input */}
      <div className="space-y-1.5">
        <label htmlFor="q-filter" className="block text-xs font-bold uppercase tracking-wider text-ink-2">
          Search
        </label>
        <div className="relative">
          <input
            id="q-filter"
            type="search"
            name="q"
            defaultValue={filters.q || ""}
            placeholder="Keywords, topics, tech..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-rule bg-surface text-xs font-medium text-ink placeholder:text-ink-3 focus:border-accent focus:ring-2 focus:ring-accent/10 focus:outline-none transition-all shadow-xs"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-ink-3 pointer-events-none" />
        </div>
      </div>

      {/* Course Type Filter */}
      <div className="space-y-1.5">
        <label htmlFor="type-filter" className="block text-xs font-bold uppercase tracking-wider text-ink-2">
          Course Type
        </label>
        <select
          id="type-filter"
          name="type"
          defaultValue={filters.type || ""}
          className="w-full h-10 px-3 rounded-xl border border-rule bg-surface text-xs font-medium text-ink focus:border-accent focus:outline-none transition-all shadow-xs"
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
      <div className="space-y-1.5">
        <label htmlFor="branch-filter" className="block text-xs font-bold uppercase tracking-wider text-ink-2">
          Branch
        </label>
        <select
          id="branch-filter"
          name="branch"
          defaultValue={filters.branch || ""}
          className="w-full h-10 px-3 rounded-xl border border-rule bg-surface text-xs font-medium text-ink focus:border-accent focus:outline-none transition-all shadow-xs"
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
      <div className="space-y-1.5">
        <label htmlFor="semester-filter" className="block text-xs font-bold uppercase tracking-wider text-ink-2">
          Semester
        </label>
        <select
          id="semester-filter"
          name="semester"
          defaultValue={filters.semester || ""}
          className="w-full h-10 px-3 rounded-xl border border-rule bg-surface text-xs font-medium text-ink focus:border-accent focus:outline-none transition-all shadow-xs"
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
      <div className="space-y-1.5">
        <label htmlFor="scheme-filter" className="block text-xs font-bold uppercase tracking-wider text-ink-2">
          Scheme
        </label>
        <select
          id="scheme-filter"
          name="scheme"
          defaultValue={filters.scheme || ""}
          className="w-full h-10 px-3 rounded-xl border border-rule bg-surface text-xs font-medium text-ink focus:border-accent focus:outline-none transition-all shadow-xs"
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
      <div className="space-y-1.5">
        <label htmlFor="difficulty-filter" className="block text-xs font-bold uppercase tracking-wider text-ink-2">
          Difficulty
        </label>
        <select
          id="difficulty-filter"
          name="difficulty"
          defaultValue={filters.difficulty || ""}
          className="w-full h-10 px-3 rounded-xl border border-rule bg-surface text-xs font-medium text-ink focus:border-accent focus:outline-none transition-all shadow-xs"
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
      <div className="space-y-1.5">
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
            className="w-full h-10 px-3 rounded-xl border border-rule bg-surface text-xs font-medium text-ink focus:border-accent focus:outline-none shadow-xs"
          />
          <input
            type="number"
            name="price_max"
            placeholder="Max"
            min="0"
            defaultValue={filters.price_max ?? ""}
            className="w-full h-10 px-3 rounded-xl border border-rule bg-surface text-xs font-medium text-ink focus:border-accent focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 space-y-2">
        <button
          type="submit"
          className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow-indigo-500/25 hover:brightness-105 active:scale-98 transition-all cursor-pointer"
        >
          Apply Filters
        </button>

        {hasActiveFilters && (
          <Link
            href="/projects"
            className="block text-center text-xs font-semibold text-brand-600 hover:underline pt-1"
          >
            Clear all filters
          </Link>
        )}
      </div>
    </form>
  );
}
