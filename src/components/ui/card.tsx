import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

/**
 * Card component adhering to flat surface styling, 1px border rule, 6px radius, and zero shadows.
 */
export const Card: React.FC<CardProps> = ({
  as: Component = "div",
  className,
  children,
  ...props
}) => {
  return (
    <Component
      className={cn("rounded-md border border-rule bg-surface p-6 text-ink shadow-none", className)}
      {...props}
    >
      {children}
    </Component>
  );
};
