import Link from "next/link";
import { requireUser } from "@/server/auth";
import { createClient } from "@/server/supabase/server";
import { formatInr, formatDate } from "@/lib/format";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "My Orders | VTU Adda Projects",
  description: "View and track the status of your project kit orders.",
};
import { ORDER_STATUS_LABELS } from "@/lib/orders";

interface OrdersPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AccountOrdersPage({
  searchParams,
}: OrdersPageProps) {
  const { status: queryStatus } = await searchParams;
  const authUser = await requireUser("/account/orders");

  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_code,
      status,
      total_inr,
      created_at,
      order_items(id, label),
      payments(id, reject_reason, status, created_at)
    `
    )
    .eq("user_id", authUser.user.id)
    .order("created_at", { ascending: false });

  const orderList = orders || [];

  return (
    <div className="mx-auto max-w-4xl py-10 px-4 sm:px-6 space-y-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Account", href: "/account" },
          { label: "My Orders" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-rule pb-6">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-ink sm:text-3xl">
            My Orders
          </h1>
          <p className="text-sm text-ink-2 mt-1">
            Track your manual UPI payments, receipts, and order statuses.
          </p>
        </div>
        <Link
          href="/projects"
          className="inline-flex h-9 items-center justify-center rounded-xl border border-rule px-4 text-xs font-semibold text-ink transition-colors duration-150 hover:bg-paper hover:border-accent/40"
        >
          Browse Catalogue
        </Link>
      </div>

      {queryStatus === "already_paid" && (
        <div className="rounded-2xl border border-rule/80 bg-paper/80 p-4 text-sm text-ink shadow-xs">
          You have already completed payment for this kit. See your active order below.
        </div>
      )}

      {orderList.length === 0 ? (
        <div className="rounded-3xl border border-rule/80 bg-surface/80 p-12 text-center space-y-4 shadow-xs">
          <p className="text-base text-ink font-medium">
            You have not placed any orders yet.
          </p>
          <p className="text-sm text-ink-2 max-w-md mx-auto">
            Browse our verified project kits to learn, customise, and prepare for your college submissions.
          </p>
          <div className="pt-2">
            <Link
              href="/projects"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-accent px-4 text-xs font-semibold text-surface transition-colors duration-150 hover:bg-accent-hover shadow-xs"
            >
              Explore project kits
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orderList.map((order) => {
            const kitTitle =
              order.order_items?.[0]?.label || "VTU Project Kit";
            const statusLabel =
              ORDER_STATUS_LABELS[order.status] || order.status;

            // Latest payment reject reason if rejected
            const latestPayment = Array.isArray(order.payments)
              ? order.payments[order.payments.length - 1]
              : null;
            const rejectReason = latestPayment?.reject_reason;

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-rule/80 bg-surface/80 p-6 space-y-4 transition-colors duration-150 hover:border-rule-strong shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-rule pb-4">
                  <div className="space-y-1">
                    <span className="font-mono text-xs text-ink-2 uppercase tracking-wider">
                      {order.order_code}
                    </span>
                    <h2 className="text-lg font-display font-bold text-ink">
                      {kitTitle}
                    </h2>
                    <span className="text-xs text-ink-2 block">
                      Ordered on {formatDate(order.created_at)}
                    </span>
                  </div>

                  <div className="text-left sm:text-right space-y-2">
                    <div className="font-mono text-lg font-bold text-ink">
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

                {order.status === "rejected" && rejectReason && (
                  <div className="p-3 bg-danger-bg border border-danger rounded-xl text-xs text-danger">
                    Reason: {rejectReason}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      View details and timeline
                    </Link>
                    <span className="text-rule">|</span>
                    <Link
                      href={`/account/orders/${order.id}/slip`}
                      className="text-xs text-ink-2 hover:text-ink hover:underline"
                    >
                      Order slip
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === "awaiting_payment" && (
                      <Link
                        href={`/checkout/${order.id}`}
                        className="inline-flex h-8 items-center justify-center rounded-xl bg-accent px-3 text-xs font-semibold text-surface transition-colors duration-150 hover:bg-accent-hover"
                      >
                        Pay now
                      </Link>
                    )}

                    {order.status === "rejected" && (
                      <Link
                        href={`/checkout/${order.id}`}
                        className="inline-flex h-8 items-center justify-center rounded-xl bg-accent px-3 text-xs font-semibold text-surface transition-colors duration-150 hover:bg-accent-hover"
                      >
                        Submit again
                      </Link>
                    )}

                    {order.status === "paid" && (
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="inline-flex h-8 items-center justify-center rounded-xl border border-rule px-3 text-xs font-semibold text-ink transition-colors duration-150 hover:bg-paper hover:border-accent/40"
                      >
                        Downloads
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
