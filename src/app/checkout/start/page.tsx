import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/server/auth";
import { createClient } from "@/server/supabase/server";
import { createAdminClient } from "@/server/supabase/admin";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CheckoutStartForm } from "./checkout-start-form";

export const metadata = {
  title: "Checkout: Create Order | VTU Adda Projects",
  description: "Review your selected kit and start an order.",
};

interface CheckoutStartPageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function CheckoutStartPage({
  searchParams,
}: CheckoutStartPageProps) {
  const { project: slug } = await searchParams;

  if (!slug) {
    redirect("/projects");
  }

  // Requires login; redirects to /login with safe next value
  const authUser = await requireUser(`/checkout/start?project=${encodeURIComponent(slug)}`);

  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, slug, title, summary, price_inr, status, sales_limit, sales_window_start")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !project || project.status !== "live") {
    notFound();
  }

  // Check sales quota
  const adminClient = createAdminClient();
  if (project.sales_limit) {
    const { count } = await adminClient
      .from("order_items")
      .select("id, orders!inner(status, created_at)", { count: "exact", head: true })
      .eq("project_id", project.id)
      .gte("orders.created_at", project.sales_window_start)
      .in("orders.status", ["paid", "pending_verification", "awaiting_payment"]);

    if (count !== null && count >= project.sales_limit) {
      return (
        <div className="mx-auto max-w-xl py-12 px-4 sm:px-6 space-y-6">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Projects", href: "/projects" },
              { label: project.title, href: `/projects/${project.slug}` },
              { label: "Checkout" },
            ]}
          />
          <div className="rounded-md border border-rule bg-paper p-8 text-center space-y-4">
            <h1 className="text-xl font-serif font-bold text-ink">
              Kit Not Available
            </h1>
            <p className="text-sm text-ink-2 max-w-md mx-auto leading-relaxed">
              This kit is not available right now. You can ask for a custom version, or check again next semester.
            </p>
          </div>
        </div>
      );
    }
  }

  const needsDisplayName =
    !authUser.profile?.display_name || authUser.profile.display_name === "Student";

  return (
    <div className="mx-auto max-w-xl py-10 px-4 sm:px-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: project.title, href: `/projects/${project.slug}` },
          { label: "Checkout" },
        ]}
      />

      <div className="space-y-1">
        <h1 className="text-2xl font-serif font-bold tracking-tight text-ink sm:text-3xl">
          Order Checkout
        </h1>
        <p className="text-sm text-ink-2">
          Verify your kit details and create your order to proceed to manual UPI payment.
        </p>
      </div>

      <CheckoutStartForm
        projectSlug={project.slug}
        projectTitle={project.title}
        projectSummary={project.summary}
        priceInr={project.price_inr}
        needsDisplayName={needsDisplayName}
      />
    </div>
  );
}
