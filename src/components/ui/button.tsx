import * as React from "react";
import Link, { type LinkProps } from "next/link";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "md" | "sm";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-surface border border-accent hover:bg-accent-hover active:bg-accent-hover",
  secondary:
    "bg-surface text-ink border border-rule hover:border-rule-strong hover:bg-paper active:bg-paper",
  quiet: "bg-transparent text-ink border border-transparent hover:bg-accent-weak hover:text-accent",
  danger: "bg-danger text-surface border border-danger hover:opacity-90 active:opacity-90",
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "h-11 min-h-[44px] px-4 text-base",
  sm: "h-9 min-h-[36px] px-3 text-sm",
};

/**
 * Button component designed to strict tokens: 6px corner radius, 120ms transitions,
 * text-only loading state (no animated spinners).
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText = "Please wait...",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium",
          "transition-colors duration-120",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? loadingText : children}
      </button>
    );
  }
);
Button.displayName = "Button";

export interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

/**
 * LinkButton component for accessible navigation links styled as buttons.
 */
export const LinkButton: React.FC<LinkButtonProps> = ({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}) => {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium",
        "transition-colors duration-120",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
};
