import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/server/auth";
import { createClient } from "@/server/supabase/server";
import { formatInr, formatDate, formatBytes } from "@/lib/format";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import { OrderReviewForm } from "./order-review-form";

export const metadata = {
  title: "Order Details | VTU Adda Projects",
  description: "View order details and verification timeline.",
};

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;
  const authUser = await requireUser(`/account/orders/${id}`);

  const supabase = await createClient();

  // Scoped to owner (returns 404 for any other user)
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_code,
      status,
      subtotal_inr,
      discount_inr,
      total_inr,
      created_at,
      expires_at,
      order_items(id, project_id, label, price_inr),
      payments(id, status, utr, attempt, submitted_at, verified_at, reject_reason, created_at)
    `
    )
    .eq("id", id)
    .eq("user_id", authUser.user.id)
    .maybeSingle();

  if (error || !order) {
    notFound();
  }

  // If paid, load download grants and deliverable files
  let grantsWithFiles: Array<{
    grant: {
      id: string;
      project_id: string;
      max_downloads: number;
      download_count: number;
      expires_at: string | null;
      revoked_at: string | null;
    };
    files: Array<{
      id: string;
      original_name: string;
      kind: string;
      size_bytes: number;
    }>;
  }> = [];

  let reviewsByProjectId = new Map<string, { id: string; rating: number; body: string; status: string }>();

  if (order.status === "paid") {
    const { data: userReviews } = await supabase
      .from("reviews")
      .select("id, project_id, rating, body, status")
      .eq("user_id", authUser.user.id)
      .eq("order_id", order.id);

    if (userReviews) {
      for (const r of userReviews) {
        reviewsByProjectId.set(r.project_id, r);
      }
    }

    const { data: grants } = await supabase
      .from("download_grants")
      .select("id, project_id, max_downloads, download_count, expires_at, revoked_at")
      .eq("order_id", order.id)
      .eq("user_id", authUser.user.id);

    if (grants && grants.length > 0) {
      for (const grant of grants) {
        const { data: files } = await supabase
          .from("project_files")
          .select("id, original_name, kind, size_bytes")
          .eq("project_id", grant.project_id)
          .eq("kind", "deliverable");

        grantsWithFiles.push({
          grant,
          files: files || [],
        });
      }
    }
  }

  const kitTitle = order.order_items?.[0]?.label || "VTU Project Kit Deliverables";
  const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;

  const payments = Array.isArray(order.payments) ? order.payments : [];
  const latestPayment = payments[payments.length - 1];

  return (
    <div className="mx-auto max-w-3xl py-10 px-4 sm:px-6 space-y-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Account", href: "/account" },
          { label: "Orders", href: "/account/orders" },
          { label: order.order_code },
        ]}
      />

      {/* Header and Status */}
      <div className="border-b border-rule pb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="font-mono text-xs text-ink-2 uppercase tracking-wider">
            Order: {order.order_code}
          </span>
          <h1 className="text-2xl font-serif font-bold text-ink sm:text-3xl">
            {kitTitle}
          </h1>
          <span className="text-xs text-ink-2 block">
            Placed on {formatDate(order.created_at)}
          </span>
        </div>

        <div className="space-y-2 text-left sm:text-right">
          <div className="font-mono text-2xl font-bold text-ink">
            {formatInr(order.total_inr)}
          </div>
          <div>
            <Badge
              variant={
                order.status === "paid"
                  ? "success"
                  : order.status === "rejected"
                    ? "danger"
                    : order.status === "pending_verification"
                      ? "warn"
                      : "default"
              }
            >
              {statusLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* Rejection notice if present */}
      {order.status === "rejected" && latestPayment?.reject_reason && (
        <div className="rounded-xl border border-danger bg-danger-bg p-4 space-y-2 text-sm text-danger">
          <strong className="block font-semibold">Payment verification rejected:</strong>
          <p>{latestPayment.reject_reason}</p>
        </div>
      )}

      {/* Dated Status Timeline */}
      <div className="rounded-2xl border border-rule/80 bg-surface/80 p-6 space-y-6 shadow-xs">
        <h2 className="text-base font-display font-bold text-ink">
          Order Timeline
        </h2>

        <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-rule">
          {/* Step 1: Created */}
          <div className="relative space-y-1">
            <span className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-sm bg-ink ring-4 ring-surface" />
            <div className="text-sm font-semibold text-ink">Order created</div>
            <div className="text-xs text-ink-2">{formatDate(order.created_at)}</div>
          </div>

          {/* Step 2: Proof Submitted */}
          <div className="relative space-y-1">
            <span
              className={`absolute -left-6 top-1 h-2.5 w-2.5 rounded-sm ring-4 ring-surface ${
                latestPayment?.submitted_at ? "bg-ink" : "bg-rule"
              }`}
            />
            <div className="text-sm font-semibold text-ink">
              {latestPayment?.submitted_at
                ? "Payment proof submitted"
                : "Payment proof pending"}
            </div>
            {latestPayment?.submitted_at ? (
              <div className="text-xs text-ink-2">
                {formatDate(latestPayment.submitted_at)}
                {latestPayment.utr && (
                  <span className="block font-mono mt-0.5">
                    UTR: ending in {latestPayment.utr.slice(-4)}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-xs text-ink-2">
                Awaiting your 12-digit UTR submission.
              </div>
            )}
          </div>

          {/* Step 3: Bank Verification */}
          <div className="relative space-y-1">
            <span
              className={`absolute -left-6 top-1 h-2.5 w-2.5 rounded-sm ring-4 ring-surface ${
                order.status === "paid"
                  ? "bg-success"
                  : order.status === "rejected"
                    ? "bg-danger"
                    : "bg-rule"
              }`}
            />
            <div className="text-sm font-semibold text-ink">
              {order.status === "paid"
                ? "Payment verified"
                : order.status === "rejected"
                  ? "Payment rejected"
                  : "Bank verification"}
            </div>
            {latestPayment?.verified_at ? (
              <div className="text-xs text-ink-2">
                {formatDate(latestPayment.verified_at)}
              </div>
            ) : (
              <div className="text-xs text-ink-2">
                {order.status === "pending_verification"
                  ? "We are verifying your payment against our bank records."
                  : "Begins once payment details are submitted."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions and Slip link */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-rule">
        <Link
          href={`/account/orders/${order.id}/slip`}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-rule px-4 text-xs font-semibold text-ink transition-colors duration-150 hover:bg-paper hover:border-accent/40"
        >
          View printable order slip
        </Link>

        <div className="flex items-center gap-3">
          {order.status === "awaiting_payment" && (
            <Link
              href={`/checkout/${order.id}`}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-accent px-4 text-xs font-semibold text-surface transition-colors duration-150 hover:bg-accent-hover shadow-xs"
            >
              Pay now
            </Link>
          )}

          {order.status === "rejected" && (
            <Link
              href={`/checkout/${order.id}`}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-accent px-4 text-xs font-semibold text-surface transition-colors duration-150 hover:bg-accent-hover shadow-xs"
            >
              Submit again
            </Link>
          )}

          {order.status === "paid" && (
            <div className="flex items-center gap-2">
              <form method="POST" action={`/api/orders/${order.id}/licence`}>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-rule px-4 text-xs font-semibold text-ink transition-colors duration-150 hover:bg-paper hover:border-accent/40"
                >
                  Download licence slip
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Deliverable Downloads Section for Paid Orders */}
      {order.status === "paid" && (
        <div className="space-y-6 pt-4 border-t border-rule">
          <div>
            <h2 className="text-lg font-display font-bold text-ink">
              Project Deliverables
            </h2>
            <p className="text-xs text-ink-2 mt-1">
              Download your verified code repository, documentation, and report files. Downloads are tracked per project kit.
            </p>
          </div>

          {grantsWithFiles.length === 0 ? (
            <div className="rounded-2xl border border-rule/80 bg-surface/80 p-6 text-sm text-ink-2 shadow-xs">
              Your deliverables are being prepared. If your files do not appear shortly, please contact support.
            </div>
          ) : (
            grantsWithFiles.map(({ grant, files }, idx) => {
              const isRevoked = !!grant.revoked_at;
              const isExpired = !!grant.expires_at && new Date(grant.expires_at) <= new Date();
              const downloadsLeft = Math.max(0, grant.max_downloads - grant.download_count);
              const isExhausted = downloadsLeft <= 0;
              const canDownload = !isRevoked && !isExpired && !isExhausted;

              return (
                <div
                  key={grant.id}
                  className="rounded-2xl border border-rule/80 bg-surface/80 p-6 space-y-4 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-rule pb-4">
                    <div>
                      <span className="font-mono text-xs uppercase tracking-wider text-ink-3">
                        Kit Package #{idx + 1}
                      </span>
                      <h3 className="text-base font-semibold text-ink">
                        {order.order_items?.[idx]?.label || "Academic Deliverables"}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      {isRevoked ? (
                        <Badge variant="danger">Access Revoked</Badge>
                      ) : isExpired ? (
                        <Badge variant="warn">Access Expired</Badge>
                      ) : (
                        <span className="font-mono text-xs font-semibold text-ink-2 bg-paper px-2.5 py-1 rounded-lg border border-rule">
                          Downloads left: {downloadsLeft} of {grant.max_downloads}
                        </span>
                      )}
                    </div>
                  </div>

                  {files.length === 0 ? (
                    <div className="py-4 text-xs text-ink-2">
                      No files are currently attached to this project package.
                    </div>
                  ) : (
                    <div className="divide-y divide-rule">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-medium text-ink truncate">
                                {file.original_name}
                              </span>
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-paper text-ink-3 border border-rule">
                                {file.kind}
                              </span>
                            </div>
                            <div className="text-xs text-ink-3 font-mono">
                              {formatBytes(file.size_bytes)}
                            </div>
                          </div>

                          <div>
                            <form
                              method="POST"
                              action={`/api/orders/${order.id}/download/${file.id}`}
                            >
                              <button
                                type="submit"
                                disabled={!canDownload}
                                className={`inline-flex h-8 items-center justify-center rounded-xl px-3 text-xs font-semibold transition-colors duration-150 ${
                                  canDownload
                                    ? "bg-accent text-surface hover:bg-accent-hover cursor-pointer shadow-xs"
                                    : "bg-paper text-ink-3 border border-rule cursor-not-allowed"
                                }`}
                              >
                                {isRevoked
                                  ? "Revoked"
                                  : isExpired
                                    ? "Expired"
                                    : isExhausted
                                      ? "Limit reached"
                                      : "Download file"}
                              </button>
                            </form>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 text-[11px] text-ink-3 font-mono">
                    Signed download links expire after 60 seconds. Each file download consumes 1 of your allocated download credits.
                  </div>

                  {/* Verified Review Section */}
                  {(() => {
                    const existingReview = reviewsByProjectId.get(grant.project_id);
                    const hasDownloaded = grant.download_count > 0;

                    if (existingReview) {
                      return (
                        <div className="pt-3 border-t border-rule mt-4 space-y-1 bg-paper/80 p-3.5 rounded-xl border border-rule">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-ink">Your Review</span>
                            <Badge variant={existingReview.status === "approved" ? "success" : "warn"}>
                              {existingReview.status === "approved" ? "Approved & Verified" : "Pending Moderation"}
                            </Badge>
                          </div>
                          <div className="text-xs text-amber-700">Rating: {existingReview.rating} of 5</div>
                          <p className="text-xs text-ink-2 italic">&quot;{existingReview.body}&quot;</p>
                        </div>
                      );
                    }

                    if (hasDownloaded) {
                      return (
                        <OrderReviewForm
                          orderId={order.id}
                          projectId={grant.project_id}
                          kitTitle={order.order_items?.[idx]?.label || "Academic Deliverables"}
                        />
                      );
                    }

                    return (
                      <div className="pt-3 border-t border-rule mt-4 text-[11px] text-ink-3">
                        Download at least one deliverable file above to unlock verified review submission.
                      </div>
                    );
                  })()}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
