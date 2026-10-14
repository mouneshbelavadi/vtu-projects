import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { AdminReviewsClient, type AdminReviewItem } from "./admin-reviews-client";

export const metadata: Metadata = {
  title: "Reviews Moderation | Admin | VTU Adda Projects",
  description: "Moderate verified buyer reviews for project kits.",
};

export default async function AdminReviewsPage() {
  await requireAdmin();
  const adminClient = createAdminClient();

  // Fetch reviews with project details and profile display name
  const { data: reviewsData } = await adminClient
    .from("reviews")
    .select(`
      id,
      project_id,
      user_id,
      rating,
      body,
      status,
      admin_reason,
      created_at,
      projects ( title ),
      profiles ( display_name )
    `)
    .order("created_at", { ascending: false });

  const reviews: AdminReviewItem[] = (reviewsData || []).map((row: any) => ({
    id: row.id,
    project_id: row.project_id,
    project_title: row.projects?.title || "Unknown Project",
    user_id: row.user_id,
    student_name: row.profiles?.display_name || "Student",
    rating: row.rating,
    body: row.body,
    status: row.status,
    admin_reason: row.admin_reason,
    created_at: row.created_at,
  }));

  return (
    <div className="mx-auto max-w-7xl py-8 px-4 sm:px-6 space-y-6">
      <div className="border-b border-rule pb-4">
        <h1 className="font-serif text-2xl font-bold text-ink">Reviews Moderation</h1>
        <p className="text-sm text-ink-2">
          Review authentic feedback from verified kit buyers. Approved reviews display on the product page with the Verified Buyer label.
        </p>
      </div>

      <AdminReviewsClient initialReviews={reviews} />
    </div>
  );
}
