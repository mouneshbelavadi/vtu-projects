import "server-only";
import { z } from "zod";
import { createClient as createServerClient } from "@/server/supabase/server";
import {
  COURSE_TYPES,
  DIFFICULTIES,
  type CourseType,
  type Difficulty,
  type Project,
  type Category,
} from "@/types/database";

export interface ProjectCatalogueItem extends Project {
  categories: {
    id: string;
    kind: string;
    name: string;
    slug: string;
  }[];
  cover_alt: string | null;
  review_stats: {
    count: number;
    average: number | null;
  };
}

export const catalogueFilterSchema = z.object({
  q: z.string().trim().max(100).optional(),
  branch: z.string().trim().max(50).optional(),
  semester: z.string().trim().max(20).optional(),
  scheme: z.string().trim().max(20).optional(),
  type: z.enum(COURSE_TYPES).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  tech: z.string().trim().max(50).optional(),
  price_min: z.coerce.number().int().min(0).max(1000000).optional(),
  price_max: z.coerce.number().int().min(0).max(1000000).optional(),
  sort: z.enum(["newest", "price_low", "price_high", "title"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
});

export type CatalogueFilters = z.infer<typeof catalogueFilterSchema>;

const PAGE_SIZE = 12;

export async function getLiveProjects(filters: CatalogueFilters): Promise<{
  projects: ProjectCatalogueItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  isCatalogueEmpty: boolean;
}> {
  const supabase = await createServerClient();

  // Check if catalogue has any live projects at all
  const { count: globalLiveCount } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("status", "live");

  const isCatalogueEmpty = (globalLiveCount ?? 0) === 0;

  if (isCatalogueEmpty) {
    return {
      projects: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      isCatalogueEmpty: true,
    };
  }

  // Base query on live projects
  let query = supabase
    .from("projects")
    .select(
      `
      *,
      project_categories!inner (
        category_id,
        category:categories (
          id,
          kind,
          name,
          slug
        )
      ),
      project_media (
        storage_path,
        alt_text,
        sort_order
      ),
      reviews (
        rating,
        status
      )
    `,
      { count: "exact" }
    )
    .eq("status", "live");

  // Search filter using full-text search
  if (filters.q && filters.q.trim()) {
    query = query.textSearch("search", filters.q.trim(), {
      type: "websearch",
      config: "english",
    });
  }

  // Course type filter
  if (filters.type) {
    query = query.eq("course_type", filters.type);
  }

  // Difficulty filter
  if (filters.difficulty) {
    query = query.eq("difficulty", filters.difficulty);
  }

  // Price range filters
  if (filters.price_min !== undefined) {
    query = query.gte("price_inr", filters.price_min);
  }
  if (filters.price_max !== undefined) {
    query = query.lte("price_inr", filters.price_max);
  }

  // Tech stack filter (array contains)
  if (filters.tech && filters.tech.trim()) {
    query = query.contains("tech_stack", [filters.tech.trim()]);
  }

  // Category filters (branch, semester, scheme)
  if (filters.branch) {
    query = query.eq("project_categories.category.slug", filters.branch);
  }
  if (filters.semester) {
    const semSlug = filters.semester.startsWith("sem-")
      ? filters.semester
      : `sem-${filters.semester}`;
    query = query.eq("project_categories.category.slug", semSlug);
  }
  if (filters.scheme) {
    query = query.eq("project_categories.category.slug", filters.scheme);
  }

  // Sorting
  switch (filters.sort) {
    case "price_low":
      query = query.order("price_inr", { ascending: true });
      break;
    case "price_high":
      query = query.order("price_inr", { ascending: false });
      break;
    case "title":
      query = query.order("title", { ascending: true });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // Pagination
  const from = (filters.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error || !data) {
    return {
      projects: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: filters.page,
      isCatalogueEmpty: false,
    };
  }

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Transform and aggregate reviews and cover alt
  const projects: ProjectCatalogueItem[] = data.map((row: any) => {
    // Extract categories
    const categories = (row.project_categories || [])
      .map((pc: any) => pc.category)
      .filter(Boolean);

    // Find cover alt
    const coverMedia = (row.project_media || []).find(
      (m: any) => m.storage_path === row.cover_path
    ) || (row.project_media || [])[0];

    // Compute approved review statistics
    const approvedReviews = (row.reviews || []).filter(
      (r: any) => r.status === "approved"
    );
    const reviewCount = approvedReviews.length;
    const averageRating =
      reviewCount > 0
        ? Number(
            (
              approvedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
              reviewCount
            ).toFixed(1)
          )
        : null;

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      description: row.description,
      course_type: row.course_type,
      difficulty: row.difficulty,
      tech_stack: row.tech_stack || [],
      price_inr: row.price_inr,
      sales_limit: row.sales_limit,
      sales_window_start: row.sales_window_start,
      status: row.status,
      cover_path: row.cover_path,
      demo_video_url: row.demo_video_url,
      syllabus_note: row.syllabus_note,
      published_at: row.published_at,
      updated_at: row.updated_at,
      created_at: row.created_at,
      categories,
      cover_alt: coverMedia?.alt_text || null,
      review_stats: {
        count: reviewCount,
        average: averageRating,
      },
    };
  });

  return {
    projects,
    totalCount,
    totalPages,
    currentPage: filters.page,
    isCatalogueEmpty: false,
  };
}

export interface FilterOptionCounts {
  branches: { slug: string; name: string; count: number }[];
  semesters: { slug: string; name: string; count: number }[];
  schemes: { slug: string; name: string; count: number }[];
  types: { value: CourseType; label: string; count: number }[];
  difficulties: { value: Difficulty; label: string; count: number }[];
}

export async function getCatalogueFilterCounts(): Promise<FilterOptionCounts> {
  const supabase = await createServerClient();

  const [categoriesRes, projectsRes] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("projects")
      .select("id, course_type, difficulty, project_categories(category_id)")
      .eq("status", "live"),
  ]);

  const categories = (categoriesRes.data || []) as Category[];
  const liveProjects = projectsRes.data || [];

  // Count projects per category id
  const catCountMap = new Map<string, number>();
  // Count projects per course type
  const typeCountMap = new Map<CourseType, number>();
  // Count projects per difficulty
  const diffCountMap = new Map<Difficulty, number>();

  for (const proj of liveProjects) {
    if (proj.course_type) {
      typeCountMap.set(
        proj.course_type as CourseType,
        (typeCountMap.get(proj.course_type as CourseType) || 0) + 1
      );
    }
    if (proj.difficulty) {
      diffCountMap.set(
        proj.difficulty as Difficulty,
        (diffCountMap.get(proj.difficulty as Difficulty) || 0) + 1
      );
    }
    const pcList = (proj as any).project_categories || [];
    for (const pc of pcList) {
      if (pc.category_id) {
        catCountMap.set(pc.category_id, (catCountMap.get(pc.category_id) || 0) + 1);
      }
    }
  }

  const branches = categories
    .filter((c) => c.kind === "branch")
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      count: catCountMap.get(c.id) || 0,
    }));

  const semesters = categories
    .filter((c) => c.kind === "semester")
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      count: catCountMap.get(c.id) || 0,
    }));

  const schemes = categories
    .filter((c) => c.kind === "scheme")
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      count: catCountMap.get(c.id) || 0,
    }));

  const COURSE_TYPE_LABELS: Record<CourseType, string> = {
    mini_project: "Mini Project",
    project_phase_1: "Project Phase I",
    major_project_phase_2: "Major Project Phase II",
    capstone: "Capstone Project",
    hackathon_project: "Hackathon Project",
    other: "Other Project",
  };

  const types = COURSE_TYPES.map((ct) => ({
    value: ct,
    label: COURSE_TYPE_LABELS[ct],
    count: typeCountMap.get(ct) || 0,
  }));

  const DIFFICULTY_LABELS: Record<Difficulty, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };

  const difficulties = DIFFICULTIES.map((diff) => ({
    value: diff,
    label: DIFFICULTY_LABELS[diff],
    count: diffCountMap.get(diff) || 0,
  }));

  return {
    branches,
    semesters,
    schemes,
    types,
    difficulties,
  };
}
