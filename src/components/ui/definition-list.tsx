import * as React from "react";
import { cn } from "@/lib/utils";

export interface DefinitionItem {
  term: string;
  description: React.ReactNode;
}

export interface DefinitionListProps {
  items: DefinitionItem[];
  className?: string;
}

/**
 * DefinitionList component for dense, informative technical specifications.
 */
export const DefinitionList: React.FC<DefinitionListProps> = ({ items, className }) => {
  return (
    <dl
      className={cn("divide-y divide-rule border-y border-rule text-sm leading-relaxed", className)}
    >
      {items.map((item) => (
        <div key={item.term} className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="font-medium text-ink-2">{item.term}</dt>
          <dd className="mt-1 text-ink sm:col-span-2 sm:mt-0">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
};
