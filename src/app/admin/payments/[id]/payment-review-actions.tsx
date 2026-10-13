"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approvePaymentAction,
  rejectPaymentAction,
  refundPaymentAction,
} from "@/server/payments/admin-actions";
import { formatInr } from "@/lib/format";

interface PaymentReviewActionsProps {
  paymentId: string;
  status: string;
  amountInr: number;
  utr?: string | null;
}

const REJECT_REASONS = [
  "Amount does not match",
  "UTR not found in bank record",
  "Screenshot unclear",
  "Duplicate payment",
  "Other",
] as const;

export function PaymentReviewActions({
  paymentId,
  status,
  amountInr,
}: PaymentReviewActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Approve dialog state
  const [approveOpen, setApproveOpen] = useState(false);
  const [last4Input, setLast4Input] = useState("");
  const [approveError, setApproveError] = useState<string | null>(null);

  // Reject dialog state
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState<(typeof REJECT_REASONS)[number]>(
    "UTR not found in bank record"
  );
  const [rejectNote, setRejectNote] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Refund dialog state
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState(amountInr.toString());
  const [refundRef, setRefundRef] = useState("");
  const [refundError, setRefundError] = useState<string | null>(null);

  function handleApproveSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApproveError(null);

    if (last4Input.trim().length !== 4) {
      setApproveError("Please enter exactly 4 digits.");
      return;
    }

    startTransition(async () => {
      const res = await approvePaymentAction({
        paymentId,
        last4Utr: last4Input.trim(),
      });

      if (!res.success) {
        setApproveError(res.errorMessage || "Approval failed.");
      } else {
        setApproveOpen(false);
        router.refresh();
      }
    });
  }

  function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRejectError(null);

    startTransition(async () => {
      const res = await rejectPaymentAction({
        paymentId,
        reason: rejectReason,
        note: rejectNote.trim() || undefined,
      });

      if (!res.success) {
        setRejectError(res.errorMessage || "Rejection failed.");
      } else {
        setRejectOpen(false);
        router.refresh();
      }
    });
  }

  function handleRefundSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRefundError(null);

    const parsedAmount = parseInt(refundAmount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setRefundError("Please enter a valid refund amount.");
      return;
    }

    if (!refundRef.trim()) {
      setRefundError("Please provide a refund transaction reference.");
      return;
    }

    startTransition(async () => {
      const res = await refundPaymentAction({
        paymentId,
        amountInr: parsedAmount,
        reference: refundRef.trim(),
      });

      if (!res.success) {
        setRefundError(res.errorMessage || "Refund failed.");
      } else {
        setRefundOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-rule">
      {status === "pending_verification" && (
        <>
          <button
            type="button"
            onClick={() => {
              setApproveError(null);
              setLast4Input("");
              setApproveOpen(true);
            }}
            className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-4 text-xs font-semibold text-surface transition-colors hover:bg-accent-hover cursor-pointer"
          >
            Approve payment
          </button>

          <button
            type="button"
            onClick={() => {
              setRejectError(null);
              setRejectOpen(true);
            }}
            className="inline-flex h-9 items-center justify-center rounded-md border border-danger text-danger px-4 text-xs font-semibold hover:bg-danger-bg transition-colors cursor-pointer"
          >
            Reject payment
          </button>
        </>
      )}

      {status === "paid" && (
        <button
          type="button"
          onClick={() => {
            setRefundError(null);
            setRefundOpen(true);
          }}
          className="inline-flex h-9 items-center justify-center rounded-md border border-rule px-4 text-xs font-semibold text-ink hover:bg-paper transition-colors cursor-pointer"
        >
          Mark refunded
        </button>
      )}

      {/* Approve Dialog */}
      {approveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-rule bg-surface p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-serif font-bold text-ink">
              Approve Payment ({formatInr(amountInr)})
            </h3>
            <p className="text-xs text-ink-2">
              Confirm bank credit by typing the last 4 digits of the UTR exactly as they appear in your bank or UPI transaction record.
            </p>

            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-ink-2 mb-1">
                  Last 4 digits of UTR
                </label>
                <input
                  type="text"
                  maxLength={4}
                  autoFocus
                  value={last4Input}
                  onChange={(e) => setLast4Input(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 5678"
                  className="w-full h-10 px-3 font-mono text-base tracking-widest rounded-md border border-rule bg-surface text-ink focus:outline-accent"
                />
              </div>

              {approveError && (
                <div className="p-3 text-xs text-danger bg-danger-bg border border-danger rounded-md">
                  {approveError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setApproveOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-rule hover:bg-paper"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || last4Input.length !== 4}
                  className="px-4 py-1.5 text-xs font-semibold rounded-md bg-accent text-surface hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Verifying..." : "Confirm & Unlock Files"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-rule bg-surface p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-serif font-bold text-ink">
              Reject Payment
            </h3>
            <p className="text-xs text-ink-2">
              Select the reason for rejection. The student will see this reason on their order page and in an automated email notification.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-ink-2 mb-1">
                  Reason
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) =>
                    setRejectReason(e.target.value as (typeof REJECT_REASONS)[number])
                  }
                  className="w-full h-9 px-3 text-xs rounded-md border border-rule bg-surface text-ink focus:outline-accent"
                >
                  {REJECT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-ink-2 mb-1">
                  Reviewer Note (optional, max 300 chars)
                </label>
                <textarea
                  maxLength={300}
                  rows={3}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Explain what needs to be corrected..."
                  className="w-full p-2 text-xs rounded-md border border-rule bg-surface text-ink focus:outline-accent resize-none"
                />
                <span className="text-[10px] text-ink-3 block text-right">
                  {rejectNote.length}/300
                </span>
              </div>

              {rejectError && (
                <div className="p-3 text-xs text-danger bg-danger-bg border border-danger rounded-md">
                  {rejectError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setRejectOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-rule hover:bg-paper"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 text-xs font-semibold rounded-md bg-danger text-surface hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Rejecting..." : "Reject Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Dialog */}
      {refundOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-rule bg-surface p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-serif font-bold text-ink">
              Record External Refund
            </h3>
            <p className="text-xs text-ink-2">
              The refund money must be returned by you outside the site (via your UPI or bank app). Recording it here will revoke all student download grants immediately.
            </p>

            <form onSubmit={handleRefundSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-ink-2 mb-1">
                  Refund Amount (INR)
                </label>
                <input
                  type="number"
                  max={amountInr}
                  min={1}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full h-9 px-3 font-mono text-sm rounded-md border border-rule bg-surface text-ink focus:outline-accent"
                />
                <span className="text-[10px] text-ink-3 block mt-0.5">
                  Maximum allowable: {formatInr(amountInr)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-ink-2 mb-1">
                  Refund Reference (e.g. Bank/UPI Transaction ID)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={refundRef}
                  onChange={(e) => setRefundRef(e.target.value)}
                  placeholder="e.g. UPI-REF-99887766"
                  className="w-full h-9 px-3 text-xs rounded-md border border-rule bg-surface text-ink focus:outline-accent"
                />
              </div>

              {refundError && (
                <div className="p-3 text-xs text-danger bg-danger-bg border border-danger rounded-md">
                  {refundError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setRefundOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-rule hover:bg-paper"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !refundRef.trim()}
                  className="px-4 py-1.5 text-xs font-semibold rounded-md bg-ink text-surface hover:bg-ink-2 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Recording..." : "Record Refund & Revoke Grants"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
