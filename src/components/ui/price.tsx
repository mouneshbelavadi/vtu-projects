import * as React from "react";
import { cn } from "@/lib/utils";

export interface PriceProps {
  amountInr: number;
  className?: string;
  originalAmountInr?: number;
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Price component displaying whole rupees formatted with Indian numbering in IBM Plex Mono.
 */
export const Price: React.FC<PriceProps> = ({ amountInr, originalAmountInr, className }) => {
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 font-mono", className)}>
      <span className="font-semibold text-ink">{formatInr(amountInr)}</span>
      {originalAmountInr && originalAmountInr > amountInr && (
        <span className="text-xs text-ink-3 line-through">{formatInr(originalAmountInr)}</span>
      )}
    </span>
  );
};
