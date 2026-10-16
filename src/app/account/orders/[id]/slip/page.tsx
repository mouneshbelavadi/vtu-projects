import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/server/auth";
import { createClient } from "@/server/supabase/server";
import { siteConfig } from "../../../../../../site.config";
import { formatInr, formatDate } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import { PrintButton } from "./print-button";

export const metadata = {
  title: "Order Slip | VTU Adda Projects",
  description: "Printable receipt slip for your project kit order.",
};

interface OrderSlipPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderSlipPage({ params }: OrderSlipPageProps) {
  const { id } = await params;
  const authUser = await requireUser(`/account/orders/${id}/slip`);

  const supabase = await createClient();

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
      order_items(id, label, price_inr),
      payments(id, utr, submitted_at, verified_at)
    `
    )
    .eq("id", id)
    .eq("user_id", authUser.user.id)
    .maybeSingle();

  if (error || !order) {
    notFound();
  }

  const kitTitle = order.order_items?.[0]?.label || "VTU Project Kit";
  const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;
  const studentName = authUser.profile?.display_name || "Student";

  const latestPayment = Array.isArray(order.payments)
    ? order.payments[order.payments.length - 1]
    : null;

  return (
    <div className="mx-auto max-w-2xl py-10 px-4 sm:px-6">
      {/* Top action bar: hidden when printing */}
      <div className="mb-8 flex items-center justify-between gap-4 print:hidden">
        <Link
          href={`/account/orders/${order.id}`}
          className="text-xs font-semibold text-accent hover:underline"
        >
          &larr; Back to order
        </Link>
        <PrintButton />
      </div>

      {/* Slip Paper Container */}
      <div className="rounded-md border border-rule bg-surface p-8 sm:p-10 space-y-8 text-ink shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Slip Header */}
        <div className="border-b border-rule pb-6 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-serif font-bold text-ink tracking-tight">
              {siteConfig.businessName}
            </h1>
            <p className="text-xs text-ink-2 mt-1">
              {siteConfig.address}
            </p>
            <p className="text-xs text-ink-2">
              Support: {siteConfig.supportEmail}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block text-xs uppercase font-mono tracking-wider text-ink-2 border border-rule px-2 py-1 rounded">
              Order Slip
            </span>
            <div className="font-mono text-sm font-semibold text-ink mt-2">
              {order.order_code}
            </div>
            <div className="text-xs text-ink-2 mt-1">
              Date: {formatDate(order.created_at)}
            </div>
          </div>
        </div>

        {/* Billed To / Student Details */}
        <div className="space-y-1 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-2 block">
            Customer
          </span>
          <div className="font-semibold text-ink">{studentName}</div>
          <div className="text-xs text-ink-2">{authUser.user.email}</div>
        </div>

        {/* Item Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-rule text-xs uppercase tracking-wider text-ink-2">
                <th className="py-2">Item Description</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              <tr>
                <td className="py-3 pr-4">
                  <div className="font-medium text-ink">{kitTitle}</div>
                  <div className="text-xs text-ink-2 mt-0.5">
                    Self-study digital package with guided source code and documentation
                  </div>
                </td>
                <td className="py-3 text-right font-mono text-ink align-top">
                  {formatInr(order.subtotal_inr)}
                </td>
              </tr>
              {order.discount_inr > 0 && (
                <tr>
                  <td className="py-2 text-xs text-ink-2">Discount applied</td>
                  <td className="py-2 text-right font-mono text-xs text-ink-2">
                    - {formatInr(order.discount_inr)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-rule font-bold">
                <td className="pt-3 text-sm text-ink">Total</td>
                <td className="pt-3 text-right font-mono text-base text-ink">
                  {formatInr(order.total_inr)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment & Status Footnote */}
        <div className="border-t border-rule pt-6 space-y-2 text-xs text-ink-2">
          <div className="flex justify-between items-center">
            <span>Payment Status:</span>
            <span className="font-semibold text-ink uppercase tracking-wider">
              {statusLabel}
            </span>
          </div>

          {latestPayment?.utr && (
            <div className="flex justify-between items-center">
              <span>UTR Reference:</span>
              <span className="font-mono text-ink">
                ending in {latestPayment.utr.slice(-4)}
              </span>
            </div>
          )}

          <div className="pt-4 text-center border-t border-rule text-xs text-ink-2">
            This order slip is an acknowledgement of receipt and purchase. It is not a tax invoice.
          </div>
        </div>
      </div>
    </div>
  );
}
