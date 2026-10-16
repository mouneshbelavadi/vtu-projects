"use client";

import { useActionState, useState } from "react";
import { submitPaymentProofAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";

interface PaymentFormProps {
  orderId: string;
  vpa: string;
  payeeName: string;
  orderCode: string;
  proofRetentionDays: number;
  verificationTimeText?: string | null;
}

export function PaymentForm({
  orderId,
  vpa,
  orderCode: _orderCode,
  proofRetentionDays,
  verificationTimeText,
}: PaymentFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitPaymentProofAction,
    { status: "idle" }
  );

  const [copied, setCopied] = useState(false);

  async function handleCopyVpa() {
    try {
      await navigator.clipboard.writeText(vpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <div className="space-y-8">
      {/* Numbered Plain Instructions */}
      <div className="rounded-2xl border border-rule/80 bg-paper/80 p-6 space-y-4 shadow-xs">
        <h2 className="text-base font-display font-bold text-ink">
          Payment Instructions
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-ink-2 leading-relaxed">
          <li>
            Pay exactly the amount shown, and put the order code in the payment note if your app allows it.
          </li>
          <li>
            Enter the 12-digit UTR number (also called the UPI reference number) from your payment details.
          </li>
          <li>
            If you want to, upload a screenshot of the successful payment. It is optional.
          </li>
          <li>
            We check the payment against our bank record and release your files.
          </li>
        </ol>

        {verificationTimeText && (
          <div className="pt-3 border-t border-rule text-sm text-ink font-medium">
            {verificationTimeText}
          </div>
        )}
      </div>

      {/* UPI ID Copy Action */}
      <div className="rounded-2xl border border-rule/80 bg-surface/80 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
        <div>
          <span className="text-xs uppercase tracking-wider text-ink-2 font-medium block">
            UPI ID (VPA)
          </span>
          <span className="font-mono text-base font-semibold text-ink break-all">
            {vpa}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopyVpa}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-rule px-4 text-xs font-semibold text-ink transition-colors duration-150 hover:bg-paper hover:border-accent/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40 shrink-0"
        >
          {copied ? "Copied" : "Copy UPI ID"}
        </button>
      </div>

      {/* Submission Form */}
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="orderId" value={orderId} />

        {state.status === "error" && (
          <Alert variant="error" title="Submission error">
            {state.message}
          </Alert>
        )}

        <FormField
          id="utr"
          label="12-digit UTR number"
          helpText="Found in your UPI app payment receipt (e.g. 123456789012)."
          errorText={state.fieldErrors?.utr}
        >
          <Input
            id="utr"
            name="utr"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{12}"
            maxLength={12}
            required
            placeholder="123456789012"
            className="font-mono tracking-wider max-w-sm"
          />
        </FormField>

        <FormField
          id="paidVia"
          label="Paid via (optional)"
          helpText="For example: Google Pay, PhonePe, Paytm, or BHIM."
          errorText={state.fieldErrors?.paidVia}
        >
          <Input
            id="paidVia"
            name="paidVia"
            type="text"
            maxLength={30}
            placeholder="e.g. Google Pay"
            className="max-w-sm"
          />
        </FormField>

        <FormField
          id="screenshot"
          label="Payment screenshot (optional)"
          helpText={`Optional. We check your UTR number and the amount against our bank record. If you upload a screenshot, we delete it ${proofRetentionDays} days after your payment is checked.`}
          errorText={state.fieldErrors?.screenshot}
        >
          <input
            id="screenshot"
            name="screenshot"
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="block w-full text-xs text-ink-2 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border file:border-rule file:text-xs file:font-semibold file:bg-surface file:text-ink hover:file:bg-paper hover:file:border-accent/40 file:transition-colors"
          />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          isLoading={isPending}
        >
          Submit payment details
        </Button>
      </form>
    </div>
  );
}
