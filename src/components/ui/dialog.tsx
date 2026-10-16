"use client";

import * as React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Modern accessible modal Dialog built on Radix Dialog primitive.
 * Features glassmorphic backdrop-blur overlay, 20px rounded-2xl card, and smooth elevation.
 */
export const Dialog: React.FC<DialogProps> = ({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  className,
}) => {
  return (
    <RadixDialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}

      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm animate-fade-in" />
        <RadixDialog.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
            "rounded-2xl border border-rule/80 bg-surface p-6 shadow-xl animate-fade-in",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            className
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <RadixDialog.Title className="font-display text-xl font-bold tracking-tight text-ink">
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-1.5 text-sm text-ink-2 leading-relaxed">
                  {description}
                </RadixDialog.Description>
              )}
            </div>

            <RadixDialog.Close
              className={cn(
                "rounded-lg p-1.5 text-ink-3 transition-colors duration-150",
                "hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink cursor-pointer",
                "focus-visible:outline-2 focus-visible:outline-accent"
              )}
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </RadixDialog.Close>
          </div>

          <div className="mt-5">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};
