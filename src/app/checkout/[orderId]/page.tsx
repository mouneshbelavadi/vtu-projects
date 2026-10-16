import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/server/auth";
import { createClient } from "@/server/supabase/server";
import { getProvider } from "@/server/payments";
import { getSystemSettings } from "@/server/settings";
import { formatInr } from "@/lib/format";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PaymentForm } from "./payment-form";

export const metadata = {
  title: "Pay by UPI: Checkout | VTU Adda Projects",
  description: "Complete your kit order by scanning the UPI QR code and submitting your UTR reference number.",
};

interface PaymentPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { orderId } = await params;
  const authUser = await requireUser(`/checkout/${orderId}`);

  const supabase = await createClient();

  // Load order scoped to authenticated owner (returns 404 for anyone else)
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_code, user_id, status, total_inr, expires_at, order_items(id, label)")
    .eq("id", orderId)
    .eq("user_id", authUser.user.id)
    .maybeSingle();

  if (error || !order) {
    notFound();
  }

  // Handle expired orders
  const isExpired =
    order.status === "expired" || new Date(order.expires_at) <= new Date();

  if (isExpired) {
    return (
      <div className="mx-auto max-w-xl py-12 px-4 sm:px-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Checkout", href: "/checkout/start" },
            { label: "Expired" },
          ]}
        />
        <div className="rounded-2xl border border-rule/80 bg-surface shadow-xs p-8 text-center space-y-4">
          <h1 className="text-xl font-display font-bold text-ink">
            This order has expired.
          </h1>
          <p className="text-sm text-ink-2 max-w-md mx-auto leading-relaxed">
            The payment window has passed. You can start a new order for this kit from the catalogue.
          </p>
          <div className="pt-2">
            <Link
              href="/projects"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:shadow-indigo-500/25 transition-all"
            >
              Browse kits to start again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If already paid or pending verification, redirect to the account orders timeline
  if (order.status === "paid" || order.status === "pending_verification") {
    redirect(`/account/orders/${order.id}`);
  }

  // Generate UPI instructions and QR SVG
  const provider = getProvider("manual_upi");
  const instructions = await provider.preparePayment(order.id, order.total_inr);

  const kitTitle =
    order.order_items?.[0]?.label || "VTU Project Kit Deliverables";

  const settings = await getSystemSettings();
  const proofRetentionDays = settings.proof_retention_days ?? 90;
  const verificationTimeText = settings.verification_time_text;

  // Convert SVG string to safe data URI for rendering in <img> without innerHTML
  const qrDataUri = instructions.qrPayload
    ? `data:image/svg+xml;utf8,${encodeURIComponent(instructions.qrPayload)}`
    : null;

  return (
    <div className="mx-auto max-w-xl py-10 px-4 sm:px-6 space-y-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Checkout" },
          { label: order.order_code },
        ]}
      />

      {/* Header Summary */}
      <div className="border-b border-rule pb-6 space-y-2">
        <span className="text-xs font-mono uppercase tracking-wider text-ink-2">
          Order Code: {order.order_code}
        </span>
        <h1 className="text-2xl font-display font-extrabold tracking-tight text-ink sm:text-3xl">
          {kitTitle}
        </h1>
      </div>

      {/* Amount and QR Box */}
      <div className="rounded-3xl border border-rule/80 bg-surface shadow-xs p-6 sm:p-8 text-center space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-2 block">
            Exact Amount to Pay
          </span>
          <div className="mt-2 font-mono text-3xl sm:text-4xl font-extrabold text-ink">
            {formatInr(order.total_inr)}
          </div>
        </div>

        {/* QR Code */}
        {qrDataUri && (
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-rule/80 max-w-[280px] mx-auto shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUri}
              alt={`UPI QR code for order ${order.order_code}`}
              width={240}
              height={240}
              className="rounded-xl"
            />
            <span className="text-xs text-ink-2 mt-2.5 font-medium">
              Scan with any UPI application
            </span>
          </div>
        )}

        {/* Payee Info */}
        <div className="text-xs text-ink-2 space-y-1">
          <div>
            Payee: <strong className="text-ink">{instructions.payeeName}</strong>
          </div>
        </div>

        {/* Mobile Deep Link */}
        {instructions.notes && (
          <div className="block sm:hidden pt-2">
            <a
              href={instructions.notes}
              className="inline-flex w-full h-11 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:shadow-indigo-500/25 active:scale-[0.98] transition-all"
            >
              Open in your UPI app
            </a>
          </div>
        )}
      </div>

      {/* Payment Form with Instructions and UTR Input */}
      <PaymentForm
        orderId={order.id}
        vpa={instructions.vpa}
        payeeName={instructions.payeeName}
        orderCode={order.order_code}
        proofRetentionDays={proofRetentionDays}
        verificationTimeText={verificationTimeText}
      />
    </div>
  );
}
