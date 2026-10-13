"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  resendAccessEmailAction,
  resetDownloadCountAction,
  revokeGrantAction,
} from "@/server/orders/admin-actions";

interface ResendEmailButtonProps {
  orderId: string;
  isPaid: boolean;
}

export function ResendEmailButton({ orderId, isPaid }: ResendEmailButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  if (!isPaid) return null;

  function handleResend() {
    setMessage(null);
    startTransition(async () => {
      const res = await resendAccessEmailAction(orderId);
      if (!res.success) {
        setIsError(true);
        setMessage(res.errorMessage || "Failed to resend access email.");
      } else {
        setIsError(false);
        setMessage("Access email resent successfully.");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={handleResend}
        className="inline-flex h-8 items-center justify-center rounded-md border border-rule px-3 text-xs font-semibold text-ink hover:bg-paper transition-colors disabled:opacity-50 cursor-pointer"
      >
        {isPending ? "Sending..." : "Resend access email"}
      </button>
      {message && (
        <span
          className={`text-[11px] font-mono ${
            isError ? "text-danger" : "text-success"
          }`}
        >
          {message}
        </span>
      )}
    </div>
  );
}

interface GrantActionButtonsProps {
  grantId: string;
  isRevoked: boolean;
}

export function GrantActionButtons({
  grantId,
  isRevoked,
}: GrantActionButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleReset() {
    setError(null);
    startTransition(async () => {
      const res = await resetDownloadCountAction(grantId);
      if (!res.success) {
        setError(res.errorMessage || "Failed to reset count.");
      } else {
        router.refresh();
      }
    });
  }

  function handleRevoke() {
    if (!confirm("Are you sure you want to revoke this download grant immediately?")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await revokeGrantAction(grantId);
      if (!res.success) {
        setError(res.errorMessage || "Failed to revoke grant.");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={handleReset}
          className="inline-flex h-7 items-center justify-center rounded-md border border-rule px-2.5 text-xs font-medium text-ink hover:bg-paper transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Updating..." : "Reset count"}
        </button>

        {!isRevoked && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleRevoke}
            className="inline-flex h-7 items-center justify-center rounded-md border border-danger text-danger px-2.5 text-xs font-medium hover:bg-danger-bg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Revoking..." : "Revoke grant"}
          </button>
        )}
      </div>

      {error && (
        <span className="text-[11px] font-mono text-danger">{error}</span>
      )}
    </div>
  );
}
