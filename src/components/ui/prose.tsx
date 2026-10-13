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
        "max-w-prose text-base leading-relaxed text-ink",
        "[&>h1]:mb-4 [&>h1]:mt-8 [&>h1]:font-serif [&>h1]:text-3xl [&>h1]:font-bold",
        "[&>h2]:mb-3 [&>h2]:mt-6 [&>h2]:font-serif [&>h2]:text-2xl [&>h2]:font-semibold",
        "[&>h3]:mb-2 [&>h3]:mt-5 [&>h3]:font-serif [&>h3]:text-xl [&>h3]:font-semibold",
        "[&>p]:mb-4 [&>p]:leading-7",
        "[&>ul>li]:mb-1 [&>ul]:mb-4 [&>ul]:list-disc [&>ul]:pl-5",
        "[&>ol>li]:mb-1 [&>ol]:mb-4 [&>ol]:list-decimal [&>ol]:pl-5",
        "[&>blockquote]:mb-4 [&>blockquote]:border-l-2 [&>blockquote]:border-rule-strong [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-ink-2",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
