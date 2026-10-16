import * as React from "react";
import { CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Modern confirmation Toast container adhering to role="status" with glassmorphism and soft shadows.
 */
export const Toast: React.FC<ToastProps> = ({ message, onDismiss, className }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border border-rule/80",
        "bg-surface/95 backdrop-blur-md p-4 text-sm text-ink shadow-lg animate-fade-in",
        className
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
        <CheckCircle className="h-5 w-5" strokeWidth={2} />
      </div>
      <span className="font-medium text-ink pr-2">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-auto rounded-lg p-1.5 text-ink-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-accent"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
};
