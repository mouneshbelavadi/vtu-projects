import * as React from "react";
import { cn } from "@/lib/utils";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  stackedOnMobile?: boolean;
}

/**
 * Responsive Table component with 0px corner radius on cells and responsive layout.
 */
export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, stackedOnMobile = true, children, ...props }, ref) => {
    return (
      <div className="w-full overflow-x-auto">
        <table
          ref={ref}
          className={cn(
            "w-full border-collapse rounded-none text-left text-sm text-ink",
            stackedOnMobile && "block sm:table",
            className
          )}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);
Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "hidden border-b border-rule bg-paper text-xs font-medium uppercase text-ink-2 sm:table-header-group",
      className
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("block divide-y divide-rule sm:table-row-group", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "block border-b border-rule py-3 transition-colors duration-120 hover:bg-paper sm:table-row sm:border-0 sm:py-0",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn("rounded-none px-4 py-3 font-semibold tracking-normal text-ink-2", className)}
    {...props}
  />
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & { label?: string }
>(({ className, label, children, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "block rounded-none px-4 py-2 text-sm sm:table-cell sm:py-3.5",
      "before:block before:font-medium before:text-ink-3 before:content-[attr(data-label)] before:sm:hidden",
      className
    )}
    data-label={label}
    {...props}
  >
    {children}
  </td>
));
TableCell.displayName = "TableCell";
