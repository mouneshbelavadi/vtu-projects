import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient as createServerClient } from "@/server/supabase/server";
import { createAdminClient } from "@/server/supabase/admin";
import { publicEnv } from "@/lib/public-env";
import { siteConfig } from "../../../../site.config";
import { KitDetailView } from "@/components/catalogue/kit-detail-view";
import { getLiveProjects } from "@/server/projects/catalogue";
import type {
  Project,
  ProjectMedia,
  ProjectFileSummary,
  Category,
} from "@/types/database";

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerClient();

  const { data: project } = await supabase
    .from("projects")
    .select("title, summary, cover_path")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (!project) {
    return { title: "Project Not Found | VTU Adda Projects" };
  }

  const coverUrl =
    project.cover_path && publicEnv.NEXT_PUBLIC_SUPABASE_URL
      ? `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${project.cover_path}`
      : undefined;

  return {
    title: `${project.title} | VTU Adda Projects`,
    description: project.summary,
    alternates: {
      canonical: `${publicEnv.NEXT_PUBLIC_SITE_URL}/projects/${slug}`,
    },
    openGraph: {
      title: project.title,
      description: project.summary,
      url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/projects/${slug}`,
      images: coverUrl ? [{ url: coverUrl }] : undefined,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const supabase = await createServerClient();

  // Strict check: only status = 'live' projects are accessible
  const { data: projectRes } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (!projectRes) {
    notFound();
  }

  const project = projectRes as Project;
  const adminClient = createAdminClient();

  const [categoriesRes, mediaRes, filesRes, reviewsRes, orderCountRes] =
    await Promise.all([
      supabase
        .from("project_categories")
        .select("category:categories(*)")
        .eq("project_id", project.id),
      supabase
        .from("project_media")
        .select("*")
        .eq("project_id", project.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("project_file_summaries")
        .select("*")
        .eq("project_id", project.id),
      supabase
        .from("reviews")
        .select("id, rating, body, created_at, user_id")
        .eq("project_id", project.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
      adminClient
        .from("order_items")
        .select("id, orders!inner(status, created_at)", { count: "exact", head: true })
        .eq("project_id", project.id)
        .gte("orders.created_at", project.sales_window_start)
        .in("orders.status", ["paid", "pending_verification", "awaiting_payment"]),
    ]);

  const categories = (categoriesRes.data || [])
    .map((pc: any) => pc.category)
    .filter(Boolean) as Category[];

  const media = (mediaRes.data || []) as ProjectMedia[];
  const fileSummaries = (filesRes.data || []) as ProjectFileSummary[];

  // Fetch reviewer first names from profiles
  const rawReviews = reviewsRes.data || [];
  const reviewsWithNames = await Promise.all(
    rawReviews.map(async (rev: any) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", rev.user_id)
        .maybeSingle();

      const fullName = profile?.display_name || "Student";
      const firstName = fullName.split(" ")[0] || "Student";

      return {
        id: rev.id,
        rating: rev.rating,
        body: rev.body,
        created_at: rev.created_at,
        reviewer_first_name: firstName,
      };
    })
  );

  const salesCount = orderCountRes.count ?? 0;
  const isLimitReached =
    project.sales_limit !== null &&
    project.sales_limit !== undefined &&
    salesCount >= project.sales_limit;

  // Up to three related kits (same branch or semester)
  const branchCat = categories.find((c) => c.kind === "branch");
  let relatedProjects: any[] = [];
  if (branchCat) {
    const { projects: matchingRelated } = await getLiveProjects({
      branch: branchCat.slug,
      sort: "newest",
      page: 1,
    });
    relatedProjects = matchingRelated.filter((p) => p.id !== project.id).slice(0, 3);
  }

  const pageUrl = `${publicEnv.NEXT_PUBLIC_SITE_URL}/projects/${project.slug}`;
  const coverUrl =
    project.cover_path && publicEnv.NEXT_PUBLIC_SUPABASE_URL
      ? `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${project.cover_path}`
      : undefined;

  // Safe JSON-LD Schema
  const approvedReviewCount = reviewsWithNames.length;
  const averageRating =
    approvedReviewCount > 0
      ? Number(
          (
            reviewsWithNames.reduce((acc, r) => acc + r.rating, 0) /
            approvedReviewCount
          ).toFixed(1)
        )
      : null;

  const productJsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: project.title,
    description: project.summary,
    image: coverUrl,
    offers: {
      "@type": "Offer",
      price: project.price_inr,
      priceCurrency: "INR",
      availability: isLimitReached
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      url: pageUrl,
    },
  };

  // Add aggregateRating only when at least one approved review exists
  if (approvedReviewCount > 0 && averageRating !== null) {
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: averageRating,
      reviewCount: approvedReviewCount,
    };
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: publicEnv.NEXT_PUBLIC_SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Projects",
        item: `${publicEnv.NEXT_PUBLIC_SITE_URL}/projects`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: project.title,
        item: pageUrl,
      },
    ],
  };

  const safeProductJsonLd = JSON.stringify(productJsonLd).replace(/</g, "\\u003c");
  const safeBreadcrumbJsonLd = JSON.stringify(breadcrumbJsonLd).replace(
    /</g,
    "\\u003c"
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeProductJsonLd }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeBreadcrumbJsonLd }}
      />

      <KitDetailView
        project={project}
        categories={categories}
        media={media}
        fileSummaries={fileSummaries}
        reviews={reviewsWithNames}
        relatedProjects={relatedProjects}
        isLimitReached={isLimitReached}
        pageUrl={pageUrl}
        whatsappNumber={siteConfig.whatsappNumber || "919876543210"}
        supabaseUrl={publicEnv.NEXT_PUBLIC_SUPABASE_URL || ""}
      />
    </>
  );
}
