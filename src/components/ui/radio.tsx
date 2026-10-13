"use client";

import * as React from "react";
import * as RadixRadioGroup from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  id?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: RadioOption[];
  disabled?: boolean;
  className?: string;
  orientation?: "horizontal" | "vertical";
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

/**
 * RadioGroup component built with Radix RadioGroup.
 * Note: rounded-full is permitted exclusively in this file for standard circular radio semantics.
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  defaultValue,
  onValueChange,
  options,
  disabled = false,
  className,
  orientation = "vertical",
  "aria-describedby": ariaDescribedby,
  "aria-invalid": ariaInvalid,
}) => {
  return (
    <RadixRadioGroup.Root
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      aria-describedby={ariaDescribedby}
      aria-invalid={ariaInvalid}
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-row flex-wrap gap-4" : "flex-col gap-2",
        className
      )}
    >
      {options.map((option) => {
        const optionId = option.id || `radio-${name || "opt"}-${option.value}`;
        return (
          <div key={option.value} className="inline-flex min-h-[44px] items-center">
            <RadixRadioGroup.Item
              id={optionId}
              value={option.value}
              disabled={disabled || option.disabled}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border bg-surface",
                "transition-colors duration-120",
                "border-rule-strong hover:border-ink-2",
                "data-[state=checked]:border-accent",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              <RadixRadioGroup.Indicator className="flex items-center justify-center">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              </RadixRadioGroup.Indicator>
            </RadixRadioGroup.Item>

            <label
              htmlFor={optionId}
              className={cn(
                "ml-2.5 cursor-pointer select-none text-sm text-ink",
                (disabled || option.disabled) && "cursor-not-allowed opacity-50"
              )}
            >
              {option.label}
            </label>
          </div>
        );
      })}
    </RadixRadioGroup.Root>
  );
};
