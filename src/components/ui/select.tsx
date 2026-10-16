"use client";

import * as React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

/**
 * Accessible Select built on Radix Select primitive with 12px radius, focus glow, and clean popover.
 */
export const Select: React.FC<SelectProps> = ({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select an option",
  options,
  hasError = false,
  disabled = false,
  className,
  "aria-describedby": ariaDescribedby,
  "aria-invalid": ariaInvalid,
}) => {
  return (
    <RadixSelect.Root
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        id={id}
        aria-describedby={ariaDescribedby}
        aria-invalid={ariaInvalid}
        className={cn(
          "flex h-11 min-h-[44px] w-full items-center justify-between rounded-xl border bg-surface px-4 text-sm text-ink",
          "transition-all duration-200 shadow-xs",
          hasError
            ? "border-danger focus:border-danger focus:ring-4 focus:ring-danger/10"
            : "border-rule hover:border-rule-strong focus:border-accent focus:ring-4 focus:ring-accent/10",
          "focus:outline-none",
          "disabled:cursor-not-allowed disabled:bg-slate-100/60 dark:disabled:bg-slate-800/40 disabled:opacity-60",
          className
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon asChild>
          <ChevronDown className="h-4 w-4 text-ink-3 transition-transform duration-200" strokeWidth={1.75} />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="z-50 min-w-[8rem] overflow-hidden rounded-xl border border-rule bg-surface p-1.5 shadow-lg animate-fade-in backdrop-blur-md bg-white/95 dark:bg-slate-900/95"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-lg py-2.5 pl-8 pr-3 text-sm text-ink outline-none",
                  "transition-colors duration-150",
                  "data-[highlighted]:bg-accent-weak data-[highlighted]:text-accent font-medium",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                )}
              >
                <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
                  <RadixSelect.ItemIndicator>
                    <Check className="h-4 w-4 text-accent" strokeWidth={2} />
                  </RadixSelect.ItemIndicator>
                </span>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
};
