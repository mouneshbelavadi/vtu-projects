import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

/**
 * Modern Textarea primitive with 12px corner radius, focus glow, and error state.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError = false, disabled, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={cn(
          "w-full rounded-xl border bg-surface p-3.5 text-sm text-ink",
          "placeholder:text-ink-3 resize-y transition-all duration-200 shadow-xs",
          hasError
            ? "border-danger focus:border-danger focus:ring-4 focus:ring-danger/10"
            : "border-rule hover:border-rule-strong focus:border-accent focus:ring-4 focus:ring-accent/10",
          "focus:outline-none",
          "disabled:cursor-not-allowed disabled:bg-slate-100/60 dark:disabled:bg-slate-800/40 disabled:opacity-60",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
