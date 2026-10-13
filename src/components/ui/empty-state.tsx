import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  message: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState component: strictly one factual sentence and one optional action.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ message, action, className }) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-rule bg-surface p-8 text-center",
        className
      )}
    >
      <p className="max-w-sm text-sm text-ink-2">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
