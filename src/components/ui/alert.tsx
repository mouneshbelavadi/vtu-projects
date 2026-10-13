import * as React from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "warning" | "error" | "success";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
}

const variantStyles: Record<AlertVariant, { container: string; icon: React.ElementType }> = {
  info: {
    container: "bg-accent-weak border-accent-weak text-accent",
    icon: Info,
  },
  warning: {
    container: "bg-warn-bg border-warn-bg text-warn-text",
    icon: AlertTriangle,
  },
  error: {
    container: "bg-danger-bg border-danger-bg text-danger",
    icon: AlertCircle,
  },
  success: {
    container: "bg-success-bg border-success-bg text-success",
    icon: CheckCircle,
  },
};

/**
 * Flat Alert banner adhering to 6px radius and token palette.
 */
export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  className,
  children,
  ...props
}) => {
  const { container, icon: IconComponent } = variantStyles[variant];

  return (
    <div
      role="alert"
      className={cn("flex gap-3 rounded-md border p-4 text-sm", container, className)}
      {...props}
    >
      <IconComponent className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} />
      <div className="flex flex-col gap-0.5">
        {title && <h5 className="font-semibold leading-none tracking-tight">{title}</h5>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
};
