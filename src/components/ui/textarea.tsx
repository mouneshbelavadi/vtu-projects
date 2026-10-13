import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

/**
 * Textarea primitive adhering to the 6px radius rule and flat surface tokens.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError = false, disabled, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={cn(
          "w-full rounded-md border bg-surface p-3 text-base text-ink",
          "resize-y transition-colors duration-120",
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
Textarea.displayName = "Textarea";
