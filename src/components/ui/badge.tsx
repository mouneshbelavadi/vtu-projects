import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "accent" | "warn" | "danger" | "success";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-paper text-ink-2 border-rule",
  accent: "bg-accent-weak text-accent border-accent-weak",
  warn: "bg-warn-bg text-warn-text border-warn-bg",
  danger: "bg-danger-bg text-danger border-danger-bg",
  success: "bg-success-bg text-success border-success-bg",
};

/**
 * Badge primitive with strictly 4px radius and 1px border.
 */
export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
