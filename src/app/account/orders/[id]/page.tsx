import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/server/auth";
import { createClient } from "@/server/supabase/server";
import { formatInr, formatDate } from "@/lib/format";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "../page";

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
      order_items(id, label, price_inr),
      payments(id, status, utr, attempt, submitted_at, verified_at, reject_reason, created_at)
    `
    )
    .eq("id", id)
    .eq("user_id", authUser.user.id)
    .maybeSingle();

  if (error || !order) {
    notFound();
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
        <div className="rounded-md border border-danger bg-danger-bg p-4 space-y-2 text-sm text-danger">
          <strong className="block font-semibold">Payment verification rejected:</strong>
          <p>{latestPayment.reject_reason}</p>
        </div>
      )}

      {/* Dated Status Timeline */}
      <div className="rounded-md border border-rule bg-surface p-6 space-y-6">
        <h2 className="text-base font-serif font-bold text-ink">
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
          className="inline-flex h-9 items-center justify-center rounded-md border border-rule px-4 text-xs font-semibold text-ink transition-colors duration-120 hover:bg-paper"
        >
          View printable order slip
        </Link>

        <div className="flex items-center gap-3">
          {order.status === "awaiting_payment" && (
            <Link
              href={`/checkout/${order.id}`}
              className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-4 text-xs font-semibold text-surface transition-colors duration-120 hover:bg-accent-hover"
            >
              Pay now
            </Link>
          )}

          {order.status === "rejected" && (
            <Link
              href={`/checkout/${order.id}`}
              className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-4 text-xs font-semibold text-surface transition-colors duration-120 hover:bg-accent-hover"
            >
              Submit again
            </Link>
          )}

          {order.status === "paid" && (
            <div className="text-xs text-ink-2 font-medium">
              Deliverable files will unlock here once file downloads are activated.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
