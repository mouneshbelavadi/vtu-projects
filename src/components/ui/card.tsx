import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

/**
 * Modern Card component with 20px (rounded-2xl) radius, soft layered shadow,
 * 1px subtle border, and smooth transition.
 */
export const Card: React.FC<CardProps> = ({
  as: Component = "div",
  className,
  children,
  ...props
}) => {
  return (
    <Component
      className={cn(
        "rounded-2xl border border-rule/80 bg-surface p-6 text-ink shadow-sm transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
