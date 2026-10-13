import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

/**
 * Accessible Input primitive with 6px radius, flat border, and visible focus.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", hasError = false, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        disabled={disabled}
        className={cn(
          "h-11 min-h-[44px] w-full rounded-md border bg-surface px-3 text-base text-ink",
          "transition-colors duration-120",
          hasError ? "border-danger" : "border-rule-strong hover:border-ink-2",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "disabled:cursor-not-allowed disabled:bg-paper disabled:opacity-50",
          "placeholder:text-ink-3",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
