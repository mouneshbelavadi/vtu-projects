"use client";

import { useActionState } from "react";
import Link from "next/link";
import { handleCreateOrder } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { Price } from "@/components/ui/price";

interface CheckoutStartFormProps {
  projectSlug: string;
  projectTitle: string;
  projectSummary: string;
  priceInr: number;
  needsDisplayName: boolean;
}

export function CheckoutStartForm({
  projectSlug,
  projectTitle,
  projectSummary,
  priceInr,
  needsDisplayName,
}: CheckoutStartFormProps) {
  const [state, formAction, isPending] = useActionState(handleCreateOrder, {
    status: "idle",
  });

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="projectSlug" value={projectSlug} />

      {state.status === "error" && (
        <Alert variant="error" title="Could not create order">
          {state.message}
        </Alert>
      )}

      {/* Kit Summary Card */}
      <div className="rounded-md border border-rule bg-surface p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-rule pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-2">
              Selected Kit
            </span>
            <h2 className="text-xl font-serif font-bold text-ink mt-1">
              {projectTitle}
            </h2>
          </div>
          <Price amountInr={priceInr} className="text-2xl font-bold text-ink" />
        </div>

        <p className="text-sm text-ink-2 leading-relaxed">
          {projectSummary}
        </p>
      </div>

      {/* Optional Display Name (shown only if missing from profile) */}
      {needsDisplayName && (
        <div className="rounded-md border border-rule bg-surface p-6 space-y-4">
          <FormField
            id="displayName"
            label="Your name or nickname"
            helpText="Used to address you on the printable order slip and emails."
          >
            <Input
              id="displayName"
              name="displayName"
              type="text"
              required
              maxLength={60}
              placeholder="e.g. Ramesh K"
            />
          </FormField>
        </div>
      )}

      {/* Optional Coupon Code */}
      <div className="rounded-md border border-rule bg-surface p-6 space-y-4">
        <FormField
          id="couponCode"
          label="Coupon code (optional)"
          helpText="Enter a promotional discount code if you have one."
        >
          <Input
            id="couponCode"
            name="couponCode"
            type="text"
            maxLength={50}
            placeholder="e.g. VTU10"
            className="uppercase font-mono max-w-xs"
          />
        </FormField>
      </div>

      {/* Academic Integrity Acknowledgement */}
      <div className="rounded-md border border-rule bg-paper p-6 space-y-4">
        <div className="flex items-start gap-3">
          <input
            id="ackIntegrity"
            name="ackIntegrity"
            type="checkbox"
            required
            className="mt-1 h-4 w-4 rounded border-rule text-accent focus:ring-accent"
          />
          <label htmlFor="ackIntegrity" className="text-sm text-ink leading-relaxed">
            I will follow my college and VTU rules, I will use this kit to learn and customise it, and I will be able to explain the project myself.
          </label>
        </div>

        <p className="text-xs text-ink-2 pt-2 border-t border-rule">
          By creating an order, you agree to our{" "}
          <Link href="/terms" className="text-accent underline hover:text-accent-hover">
            Terms and Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-accent underline hover:text-accent-hover">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="w-full"
        isLoading={isPending}
      >
        Create order
      </Button>
    </form>
  );
}
