import * as React from "react";
import { cn } from "@/lib/utils";

interface PlainDescriptionProps {
  content: string;
  className?: string;
}

/**
 * Plain text description renderer.
 * Formats paragraphs on blank lines and bullet lists on lines starting with '- '.
 * Absolutely no HTML parsing and no dangerouslySetInnerHTML.
 */
export function PlainDescription({ content, className }: PlainDescriptionProps) {
  if (!content || !content.trim()) {
    return null;
  }

  // Split into paragraph/list blocks on blank lines
  const blocks = content.split(/\n\s*\n/);

  return (
    <div className={cn("space-y-4 text-sm text-ink leading-relaxed", className)}>
      {blocks.map((block, blockIndex) => {
        const trimmedBlock = block.trim();
        if (!trimmedBlock) return null;

        const lines = trimmedBlock.split("\n");
        const isBulletList = lines.every((line) => line.trim().startsWith("- "));

        if (isBulletList) {
          return (
            <ul key={blockIndex} className="list-disc pl-5 space-y-1">
              {lines.map((line, lineIndex) => {
                const bulletText = line.trim().replace(/^- \s*/, "");
                return <li key={lineIndex}>{bulletText}</li>;
              })}
            </ul>
          );
        }

        return (
          <p key={blockIndex}>
            {lines.map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {line}
                {lineIndex < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
