import * as React from "react";
import Link, { type LinkProps } from "next/link";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "quiet"
  | "danger"
  | "outline"
  | "ghost"
  | "destructive";

export type ButtonSize = "md" | "sm" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white border border-transparent shadow-sm hover:shadow-md hover:shadow-indigo-500/25 hover:brightness-105 active:scale-[0.98]",
  secondary:
    "bg-surface text-ink border border-rule hover:border-rule-strong hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-xs active:scale-[0.98]",
  quiet:
    "bg-transparent text-ink border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-accent active:scale-[0.98]",
  ghost:
    "bg-transparent text-ink border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-accent active:scale-[0.98]",
  outline:
    "bg-transparent text-ink border border-rule-strong hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-ink-2 active:scale-[0.98]",
  danger:
    "bg-danger text-white border border-danger hover:bg-red-700 active:scale-[0.98] shadow-xs",
  destructive:
    "bg-danger text-white border border-danger hover:bg-red-700 active:scale-[0.98] shadow-xs",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 min-h-[36px] px-3.5 text-xs font-semibold rounded-lg gap-1.5",
  md: "h-11 min-h-[44px] px-5 text-sm font-semibold rounded-xl gap-2",
  lg: "h-12 min-h-[48px] px-6 text-base font-semibold rounded-xl gap-2.5",
};

/**
 * Modern Button component with indigo-violet gradient, layered hover shadows,
 * micro-lift transition, and accessible loading spinner.
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
          "inline-flex items-center justify-center font-medium cursor-pointer select-none",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin text-current shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span>{isLoading ? loadingText : children}</span>
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
        "inline-flex items-center justify-center font-medium cursor-pointer select-none",
        "transition-all duration-200 ease-out",
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
