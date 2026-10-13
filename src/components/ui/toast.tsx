import * as React from "react";
import { CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Accessible confirmation Toast container adhering to role="status" and token aesthetics.
 */
export const Toast: React.FC<ToastProps> = ({ message, onDismiss, className }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-md border border-rule bg-surface p-4 text-sm text-ink shadow-none",
        className
      )}
    >
      <CheckCircle className="h-5 w-5 shrink-0 text-success" strokeWidth={1.5} />
      <span className="font-medium">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-2 rounded-sm p-1 text-ink-3 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
};
