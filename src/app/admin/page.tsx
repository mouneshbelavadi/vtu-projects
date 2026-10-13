import { requireAdmin } from "@/server/auth";
import { createClient } from "@/server/supabase/server";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";

export const metadata = {
  title: "Admin Dashboard",
};

function formatAge(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const diffMs = Date.now() - date.getTime();
  if (diffMs <= 0) return "Just now";
  const mins = Math.floor(diffMs / (60 * 1000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  const supabase = await createClient();

  // Read real database counts (never show invented numbers)
  const [projectsRes, pendingPaymentsRes] = await Promise.all([
    supabase.from("projects").select("status"),
    supabase
      .from("payments")
      .select("id, submitted_at, created_at")
      .eq("status", "pending_verification")
      .order("submitted_at", { ascending: true, nullsFirst: false }),
  ]);

  const projects = projectsRes.data || [];
  const totalProjects = projects.length;
  const liveProjects = projects.filter((p) => p.status === "live").length;
  const draftProjects = projects.filter((p) => p.status === "draft").length;
  const hiddenProjects = projects.filter((p) => p.status === "hidden").length;

  const pendingPayments = pendingPaymentsRes.data || [];
  const paymentsWaiting = pendingPayments.length;
  const oldestPayment = pendingPayments[0];
  const oldestAgeText = oldestPayment
    ? `Oldest: ${formatAge(oldestPayment.submitted_at || oldestPayment.created_at)}`
    : "Queue clear";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-2">
          Overview of catalogue inventory and orders awaiting verification.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-paper">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-3">
            Live Projects
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-serif font-bold text-accent">
              {liveProjects}
            </span>
            <span className="text-xs text-ink-3 font-mono">Published</span>
          </div>
        </Card>

        <Card className="p-4 bg-paper">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-3">
            Draft Projects
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-serif font-bold text-ink">
              {draftProjects}
            </span>
            <span className="text-xs text-ink-3 font-mono">In preparation</span>
          </div>
        </Card>

        <Card className="p-4 bg-paper">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-3">
            Payments Waiting
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-serif font-bold text-accent">
              {paymentsWaiting}
            </span>
            <span className="text-xs text-ink-3 font-mono">{oldestAgeText}</span>
          </div>
        </Card>

        <Card className="p-4 bg-paper">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-3">
            Hidden Projects
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-serif font-bold text-ink-2">
              {hiddenProjects}
            </span>
            <span className="text-xs text-ink-3 font-mono">Archived</span>
          </div>
        </Card>
      </div>

      <div className="border-t border-rule pt-6">
        <h2 className="text-base font-serif font-semibold text-ink mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/admin/payments" variant="primary">
            Verification queue ({paymentsWaiting})
          </LinkButton>
          <LinkButton href="/admin/orders" variant="secondary">
            Manage orders
          </LinkButton>
          <LinkButton href="/admin/projects/new" variant="secondary">
            Create new project
          </LinkButton>
          <LinkButton href="/admin/projects" variant="secondary">
            Manage projects ({totalProjects})
          </LinkButton>
          <LinkButton href="/admin/categories" variant="secondary">
            Manage categories
          </LinkButton>
          <LinkButton href="/admin/settings" variant="secondary">
            Payment & site settings
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
