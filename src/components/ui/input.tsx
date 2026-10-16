import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

/**
 * Modern Input primitive with 12px corner radius, focus glow, and error state.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", hasError = false, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        disabled={disabled}
        className={cn(
          "h-11 min-h-[44px] w-full rounded-xl border bg-surface px-4 text-sm text-ink",
          "placeholder:text-ink-3 transition-all duration-200 shadow-xs",
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
Input.displayName = "Input";
