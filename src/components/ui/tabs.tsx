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
 * Tabs component built with Radix Tabs primitive.
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
      <RadixTabs.List className="flex w-full gap-2 border-b border-rule">
        {items.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "-mb-px border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-ink-2",
              "transition-colors duration-120 hover:text-ink",
              "data-[state=active]:border-accent data-[state=active]:text-accent",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
          className="pt-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
};
