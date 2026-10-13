"use client";

import * as React from "react";
import Image from "next/image";
import type { ProjectMedia } from "@/types/database";

interface ScreenshotGalleryProps {
  media: ProjectMedia[];
  supabaseUrl: string;
  projectTitle: string;
}

export function ScreenshotGallery({
  media,
  supabaseUrl,
  projectTitle,
}: ScreenshotGalleryProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  if (media.length === 0) {
    return (
      <div className="aspect-video w-full rounded-md border border-rule bg-paper flex items-center justify-center text-xs font-semibold text-ink-3 uppercase tracking-wider">
        Project kit preview
      </div>
    );
  }

  const activeMedia = media[selectedIndex] ?? media[0];
  if (!activeMedia) return null;

  const activeUrl = `${supabaseUrl}/storage/v1/object/public/public-media/${activeMedia.storage_path}`;

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-md border border-rule bg-black">
        <Image
          src={activeUrl}
          alt={activeMedia.alt_text || projectTitle}
          width={1280}
          height={720}
          priority={selectedIndex === 0}
          className="object-contain w-full h-full"
          sizes="(max-width: 1024px) 100vw, 66vw"
        />
        {activeMedia.alt_text && (
          <div className="absolute bottom-0 inset-x-0 bg-ink/75 px-3 py-1.5 text-xs text-surface">
            {activeMedia.alt_text}
          </div>
        )}
      </div>

      {/* Thumbnails (keyboard operable, no carousel animation) */}
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Screenshots">
          {media.map((item, idx) => {
            const thumbUrl = `${supabaseUrl}/storage/v1/object/public/public-media/${item.storage_path}`;
            const isSelected = idx === selectedIndex;

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={item.alt_text || `Screenshot ${idx + 1}`}
                onClick={() => setSelectedIndex(idx)}
                className={`relative aspect-video w-20 flex-shrink-0 overflow-hidden rounded border transition-colors ${
                  isSelected
                    ? "border-accent ring-2 ring-accent"
                    : "border-rule hover:border-rule-strong opacity-75 hover:opacity-100"
                }`}
              >
                <Image
                  src={thumbUrl}
                  alt={item.alt_text || `Thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
