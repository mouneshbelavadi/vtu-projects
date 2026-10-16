import Link from "next/link";
import { requireUser } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { formatDate, formatInr } from "@/lib/format";
import type { CustomRequestStatus } from "@/types/database";

export const metadata = {
  title: "My Project Requests | VTU Adda Project Hub",
  description: "View and track the status of your custom engineering project requests.",
};

const STATUS_LABELS: Record<CustomRequestStatus, { label: string; badgeClass: string }> = {
  submitted: { label: "Submitted", badgeClass: "bg-surface text-ink-2 border-rule" },
  under_review: { label: "Under review", badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  quoted: { label: "Quote ready", badgeClass: "bg-accent/10 text-accent border-accent/30" },
  accepted: { label: "Accepted", badgeClass: "bg-accent/10 text-accent border-accent/30" },
  in_progress: { label: "In progress", badgeClass: "bg-accent/10 text-accent border-accent/30" },
  delivered: { label: "Final files ready (balance due)", badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  completed: { label: "Completed", badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  declined: { label: "Declined", badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30" },
  cancelled: { label: "Cancelled", badgeClass: "bg-surface text-ink-2 border-rule" },
};

export default async function AccountRequestsPage() {
  const authUser = await requireUser("/account/requests");
  const adminClient = createAdminClient();

  const { data: requests } = await adminClient
    .from("custom_requests")
    .select(
      "id, title, status, course_type, branch, semester, quote_total_inr, quote_deposit_inr, declined_reason, created_at"
    )
    .eq("user_id", authUser.user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Account", href: "/account" },
          { label: "Project requests" },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">My Project Requests</h1>
          <p className="mt-1 text-sm text-ink-2">
            Track quotes, milestone progress, and deliverables for your custom builds.
          </p>
        </div>
        <Link
          href="/request"
          className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-surface hover:bg-accent-hover transition-colors shadow-xs"
        >
          Submit new request
        </Link>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="rounded-3xl border border-rule/80 bg-surface/80 p-8 text-center shadow-xs">
          <p className="text-sm text-ink-2">
            You have not submitted any custom project requests yet.
          </p>
          <div className="mt-4">
            <Link
              href="/request"
              className="inline-block rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-surface hover:bg-accent-hover transition-colors shadow-xs"
            >
              Request a custom project
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const statusInfo = STATUS_LABELS[req.status as CustomRequestStatus] || {
              label: req.status,
              badgeClass: "bg-surface text-ink-2 border-rule",
            };

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-rule/80 bg-surface/80 p-5 transition-colors hover:border-rule-strong shadow-xs"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-display font-bold text-ink">
                      <Link
                        href={`/account/requests/${req.id}`}
                        className="hover:text-accent hover:underline"
                      >
                        {req.title}
                      </Link>
                    </h2>
                    <p className="mt-1 text-xs text-ink-2">
                      {req.branch} · Semester {req.semester} · Submitted {formatDate(req.created_at)}
                    </p>
                  </div>
                  <span
                    className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusInfo.badgeClass}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                {req.status === "declined" && req.declined_reason && (
                  <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-400">
                    <strong>Reason:</strong> {req.declined_reason}
                  </div>
                )}

                {req.quote_total_inr && (
                  <div className="mt-3 flex items-center gap-4 text-xs text-ink-2">
                    <span>
                      Total: <strong>{formatInr(req.quote_total_inr)}</strong>
                    </span>
                    {req.quote_deposit_inr && (
                      <span>
                        Deposit: <strong>{formatInr(req.quote_deposit_inr)}</strong>
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-end">
                  <Link
                    href={`/account/requests/${req.id}`}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    View details and milestones &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
