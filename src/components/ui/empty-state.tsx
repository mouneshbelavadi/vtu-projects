import * as React from "react";
import { FolderSearch } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  message: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Modern EmptyState component with subtle gradient circular icon container and clean action slot.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  action,
  icon,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-rule/80 bg-surface/60 p-10 text-center shadow-xs",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 shadow-xs border border-brand-100 dark:border-brand-900/40">
        {icon || <FolderSearch className="h-7 w-7" strokeWidth={1.75} />}
      </div>
      <p className="max-w-sm text-sm text-ink-2 leading-relaxed font-medium">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
