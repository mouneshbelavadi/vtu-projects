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
 * Accessible Select built on Radix Select primitive with 6px radius and flat tokens.
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
          "flex h-11 min-h-[44px] w-full items-center justify-between rounded-md border bg-surface px-3 text-base text-ink",
          "transition-colors duration-120",
          hasError ? "border-danger" : "border-rule-strong hover:border-ink-2",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "disabled:cursor-not-allowed disabled:bg-paper disabled:opacity-50",
          className
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon asChild>
          <ChevronDown className="h-4 w-4 text-ink-3" strokeWidth={1.5} />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className="z-50 min-w-[8rem] overflow-hidden rounded-md border border-rule bg-surface p-1 shadow-none"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-3 text-sm text-ink outline-none",
                  "data-[highlighted]:bg-accent-weak data-[highlighted]:text-accent",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                )}
              >
                <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                  <RadixSelect.ItemIndicator>
                    <Check className="h-4 w-4 text-accent" strokeWidth={1.5} />
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
