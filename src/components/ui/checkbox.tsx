"use client";

import * as React from "react";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps {
  id: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  name?: string;
  value?: string;
  className?: string;
  required?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

/**
 * Checkbox component built on Radix Checkbox with 44px minimum touch target.
 */
export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      id,
      checked,
      defaultChecked,
      onCheckedChange,
      disabled = false,
      label,
      name,
      value,
      className,
      required,
      "aria-describedby": ariaDescribedby,
      "aria-invalid": ariaInvalid,
    },
    ref
  ) => {
    return (
      <div className={cn("inline-flex min-h-[44px] items-center", className)}>
        <RadixCheckbox.Root
          ref={ref}
          id={id}
          name={name}
          value={value}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          required={required}
          aria-describedby={ariaDescribedby}
          aria-invalid={ariaInvalid}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-sm border bg-surface",
            "transition-colors duration-120",
            "border-rule-strong hover:border-ink-2",
            "data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-surface",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <RadixCheckbox.Indicator className="flex items-center justify-center text-surface">
            <Check className="h-3.5 w-3.5" strokeWidth={2} />
          </RadixCheckbox.Indicator>
        </RadixCheckbox.Root>

        {label && (
          <label
            htmlFor={id}
            className={cn(
              "ml-2.5 cursor-pointer select-none text-sm text-ink",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
