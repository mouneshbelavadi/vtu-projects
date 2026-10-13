import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatInr, formatDate } from "@/lib/format";
import { getPaymentProofSignedUrl } from "@/server/payments/admin-actions";
import { PaymentReviewActions } from "./payment-review-actions";

export const metadata = {
  title: "Verify Payment | Admin",
};

interface PaymentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminPaymentDetailPage({
  params,
}: PaymentDetailPageProps) {
  await requireAdmin();
  const { id } = await params;

  const adminClient = createAdminClient();

  const { data: payment, error } = await adminClient
    .from("payments")
    .select(
      `
      id,
      order_id,
      method,
      amount_inr,
      status,
      utr,
      proof_path,
      proof_deleted_at,
      attempt,
      submitted_at,
      verified_at,
      reject_reason,
      refund_amount_inr,
      refund_reference,
      refunded_at,
      created_at,
      orders (
        id,
        order_code,
        user_id,
        created_at,
        order_items (
          label
        ),
        profiles (
          display_name,
          phone
        )
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !payment) {
    notFound();
  }

  // Generate 60-second signed URL for screenshot if proof exists and is not purged
  const { signedUrl: proofSignedUrl } = await getPaymentProofSignedUrl(payment.id);

  const orderData: any = payment.orders;
  const profileData = orderData?.profiles;
  const studentDisplayName = profileData?.display_name || "Student";
  const studentPhone = profileData?.phone;
  const kitTitle = orderData?.order_items?.[0]?.label || "VTU Project Kit";
  const orderCode = orderData?.order_code || "-";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Back button and Header */}
      <div>
        <Link
          href="/admin/payments"
          className="text-xs font-mono text-ink-3 hover:text-ink transition-colors block mb-2"
        >
          &larr; Back to verification queue
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="font-mono text-xs text-ink-3 uppercase tracking-wider">
              Payment Verification
            </span>
            <h1 className="text-2xl font-serif font-bold text-ink">
              Order {orderCode}
            </h1>
          </div>
          <div>
            <Badge
              variant={
                payment.status === "paid"
                  ? "success"
                  : payment.status === "rejected"
                    ? "danger"
                    : payment.status === "refunded"
                      ? "danger"
                      : payment.status === "pending_verification"
                        ? "warn"
                        : "default"
              }
            >
              {payment.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Verification Checklist */}
      <div className="rounded-md border border-rule bg-paper p-4 space-y-2">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-ink">
          Verification Checklist
        </h3>
        <p className="text-xs text-ink-2 leading-relaxed">
          Find this UTR in your bank record. The amount must equal the expected amount. The credit must be dated after the order was created.
        </p>
      </div>

      {/* Transaction Details Card */}
      <Card className="p-6 space-y-6">
        <h2 className="text-base font-serif font-bold text-ink border-b border-rule pb-3">
          Submission Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-mono text-ink-3 uppercase block mb-0.5">
              Order Code
            </span>
            <span className="font-mono font-semibold text-ink text-sm">
              {orderCode}
            </span>
          </div>

          <div>
            <span className="font-mono text-ink-3 uppercase block mb-0.5">
              Student Name
            </span>
            <span className="font-medium text-ink text-sm">
              {studentDisplayName}
            </span>
          </div>

          {studentPhone && (
            <div>
              <span className="font-mono text-ink-3 uppercase block mb-0.5">
                Phone Number
              </span>
              <span className="font-mono text-ink text-sm">
                {studentPhone}
              </span>
            </div>
          )}

          <div>
            <span className="font-mono text-ink-3 uppercase block mb-0.5">
              Project Kit
            </span>
            <span className="font-medium text-ink text-sm">
              {kitTitle}
            </span>
          </div>

          <div>
            <span className="font-mono text-ink-3 uppercase block mb-0.5">
              Expected Amount
            </span>
            <span className="font-mono font-bold text-ink text-base">
              {formatInr(payment.amount_inr)}
            </span>
          </div>

          <div>
            <span className="font-mono text-ink-3 uppercase block mb-0.5">
              Full UTR Number
            </span>
            <span className="font-mono font-bold text-accent text-base tracking-wider">
              {payment.utr || "None submitted"}
            </span>
          </div>

          <div>
            <span className="font-mono text-ink-3 uppercase block mb-0.5">
              Payment Method
            </span>
            <span className="font-mono text-ink">
              {payment.method}
            </span>
          </div>

          <div>
            <span className="font-mono text-ink-3 uppercase block mb-0.5">
              Submission Time
            </span>
            <span className="text-ink">
              {payment.submitted_at
                ? formatDate(payment.submitted_at)
                : formatDate(payment.created_at)}
            </span>
          </div>

          <div>
            <span className="font-mono text-ink-3 uppercase block mb-0.5">
              Submission Attempt
            </span>
            <span className="font-mono text-ink">
              Attempt #{payment.attempt}
            </span>
          </div>

          <div>
            <span className="font-mono text-ink-3 uppercase block mb-0.5">
              Order Placed At
            </span>
            <span className="text-ink">
              {orderData?.created_at ? formatDate(orderData.created_at) : "-"}
            </span>
          </div>
        </div>

        {/* Existing Decision Details if already reviewed */}
        {payment.status === "rejected" && payment.reject_reason && (
          <div className="rounded-md border border-danger bg-danger-bg p-4 space-y-1 text-xs text-danger">
            <strong className="block font-semibold">Rejection details:</strong>
            <p>{payment.reject_reason}</p>
          </div>
        )}

        {payment.status === "refunded" && (
          <div className="rounded-md border border-rule bg-paper p-4 space-y-1 text-xs text-ink-2">
            <strong className="block font-semibold text-ink">Refund details:</strong>
            <p>Amount: {formatInr(payment.refund_amount_inr || payment.amount_inr)}</p>
            <p>Reference: {payment.refund_reference || "N/A"}</p>
            {payment.refunded_at && <p>Date: {formatDate(payment.refunded_at)}</p>}
          </div>
        )}

        {/* Screenshot View (Signed URL expires in 60s) */}
        <div className="border-t border-rule pt-6 space-y-3">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-ink">
            Payment Proof Screenshot
          </h3>

          {proofSignedUrl ? (
            <div className="space-y-2">
              <div className="max-w-md overflow-hidden rounded-md border border-rule bg-paper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={proofSignedUrl}
                  alt="Student payment proof screenshot"
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>
              <span className="text-[11px] text-ink-3 font-mono block">
                Signed proof image link expires in 60 seconds from page load.
              </span>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-rule bg-paper p-6 text-center text-xs text-ink-2">
              No screenshot uploaded. Check the UTR and amount in your bank record.
            </div>
          )}
        </div>

        {/* Review Action Buttons */}
        <PaymentReviewActions
          paymentId={payment.id}
          status={payment.status}
          amountInr={payment.amount_inr}
          utr={payment.utr}
        />
      </Card>
    </div>
  );
}
