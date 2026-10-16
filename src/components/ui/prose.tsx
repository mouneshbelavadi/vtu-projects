import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProseProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

/**
 * Prose container enforcing maximum line length (68 characters) and clear technical type scale.
 */
export const Prose: React.FC<ProseProps> = ({
  as: Component = "article",
  className,
  children,
  ...props
}) => {
  return (
    <Component
      className={cn(
        "w-full max-w-[720px] text-base leading-relaxed text-slate-700 dark:text-slate-300",
        // H1 Title
        "[&>h1]:mb-3 [&>h1]:text-3xl [&>h1]:sm:text-4xl [&>h1]:font-extrabold [&>h1]:tracking-tight [&>h1]:text-slate-900 dark:[&>h1]:text-white [&>h1]:leading-[1.18]",
        // Last updated date row styling
        "[&>p.text-ink-3]:inline-flex [&>p.text-ink-3]:items-center [&>p.text-ink-3]:gap-2 [&>p.text-ink-3]:px-3.5 [&>p.text-ink-3]:py-1.5 [&>p.text-ink-3]:rounded-full [&>p.text-ink-3]:bg-slate-100 dark:[&>p.text-ink-3]:bg-slate-800/80 [&>p.text-ink-3]:text-slate-600 dark:[&>p.text-ink-3]:text-slate-300 [&>p.text-ink-3]:border [&>p.text-ink-3]:border-slate-200/80 dark:[&>p.text-ink-3]:border-slate-700/60 [&>p.text-ink-3]:text-xs [&>p.text-ink-3]:font-medium [&>p.text-ink-3]:mb-8 [&>p.text-ink-3]:before:content-[''] [&>p.text-ink-3]:before:inline-block [&>p.text-ink-3]:before:w-2 [&>p.text-ink-3]:before:h-2 [&>p.text-ink-3]:before:rounded-full [&>p.text-ink-3]:before:bg-emerald-500",
        // H2 Section Headings
        "[&>h2]:mb-4 [&>h2]:mt-10 [&>h2]:pt-6 [&>h2]:border-t [&>h2]:border-slate-200/70 dark:[&>h2]:border-slate-800/80 [&>h2]:text-xl [&>h2]:sm:text-2xl [&>h2]:font-bold [&>h2]:tracking-tight [&>h2]:text-slate-900 dark:[&>h2]:text-slate-100 [&>h2]:scroll-mt-24",
        // H3 Subheadings
        "[&>h3]:mb-2 [&>h3]:mt-6 [&>h3]:text-lg [&>h3]:sm:text-xl [&>h3]:font-semibold [&>h3]:tracking-tight [&>h3]:text-slate-900 dark:[&>h3]:text-slate-100 [&>h3]:scroll-mt-24",
        // Paragraphs
        "[&>p]:mb-5 [&>p]:leading-relaxed [&>p]:text-[15px] [&>p]:sm:text-base [&>p]:text-slate-600 dark:[&>p]:text-slate-300",
        // Strong tags
        "[&_strong]:font-semibold [&_strong]:text-slate-900 dark:[&_strong]:text-slate-100",
        // Unordered Lists
        "[&>ul]:mb-6 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-2.5 [&>ul]:text-slate-600 dark:[&>ul]:text-slate-300",
        "[&>ul>li]:pl-1 [&>ul>li]:leading-relaxed [&>ul>li]:marker:text-indigo-500 dark:[&>ul>li]:marker:text-indigo-400",
        // Ordered Lists
        "[&>ol]:mb-6 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-2.5 [&>ol]:text-slate-600 dark:[&>ol]:text-slate-300",
        "[&>ol>li]:pl-1 [&>ol>li]:leading-relaxed [&>ol>li]:marker:text-indigo-600 dark:[&>ol>li]:marker:text-indigo-400 [&>ol>li]:marker:font-semibold",
        // Blockquotes
        "[&>blockquote]:my-6 [&>blockquote]:rounded-r-2xl [&>blockquote]:border-l-4 [&>blockquote]:border-indigo-500 [&>blockquote]:bg-indigo-50/70 dark:[&>blockquote]:bg-indigo-950/30 [&>blockquote]:p-5 [&>blockquote]:sm:p-6 [&>blockquote]:text-slate-700 dark:[&>blockquote]:text-slate-200 [&>blockquote]:italic [&>blockquote]:shadow-2xs",
        // Links inside prose
        "[&_a]:text-indigo-600 dark:[&_a]:text-indigo-400 [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-indigo-300 dark:[&_a]:decoration-indigo-700 hover:[&_a]:decoration-indigo-600 dark:hover:[&_a]:decoration-indigo-400 [&_a]:font-medium [&_a]:transition-colors",
        // Custom boxes (like Grievance box)
        "[&_.bg-paper]:bg-slate-50/80 dark:[&_.bg-paper]:bg-slate-900/60 [&_.bg-paper]:p-5 [&_.bg-paper]:rounded-2xl [&_.bg-paper]:border [&_.bg-paper]:border-slate-200/80 dark:[&_.bg-paper]:border-slate-800 [&_.bg-paper]:text-sm [&_.bg-paper]:shadow-2xs [&_.bg-paper]:space-y-1.5 [&_.bg-paper]:mt-4",
        // Bottom link rows
        "[&_.border-rule]:border-slate-200 dark:[&_.border-rule]:border-slate-800",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
