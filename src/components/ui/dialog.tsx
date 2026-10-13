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
 * Accessible modal Dialog built on Radix Dialog primitive.
 * Restyled with 6px corner radius, no blur/backdrop filters, and reliable keyboard trap.
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
        <RadixDialog.Overlay className="bg-ink/50 fixed inset-0 z-50" />
        <RadixDialog.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
            "rounded-md border border-rule bg-surface p-6 shadow-none",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            className
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <RadixDialog.Title className="font-serif text-xl font-semibold text-ink">
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-1 text-sm text-ink-2">
                  {description}
                </RadixDialog.Description>
              )}
            </div>

            <RadixDialog.Close
              className={cn(
                "rounded-md p-1.5 text-ink-3 transition-colors duration-120",
                "hover:bg-paper hover:text-ink",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              )}
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </RadixDialog.Close>
          </div>

          <div className="mt-4">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};
