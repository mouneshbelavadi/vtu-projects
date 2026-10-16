"use client";

import * as React from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  items: TabItem[];
  className?: string;
}

/**
 * Modern Tabs component built with Radix Tabs primitive.
 * Features pill style or sleek underline indicator with smooth transition.
 */
export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  items,
  className,
}) => {
  return (
    <RadixTabs.Root
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={cn("flex w-full flex-col", className)}
    >
      <RadixTabs.List className="flex w-full gap-1 border-b border-rule pb-px">
        {items.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "relative px-4 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer",
              "text-ink-2 hover:text-ink",
              "data-[state=active]:text-accent data-[state=active]:font-bold",
              "after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-transparent",
              "data-[state=active]:after:bg-accent",
              "focus-visible:outline-2 focus-visible:outline-accent rounded-t-md"
            )}
          >
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {items.map((tab) => (
        <RadixTabs.Content
          key={tab.value}
          value={tab.value}
          className="pt-5 outline-none animate-fade-in"
        >
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
};
