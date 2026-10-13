"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

interface DemoVideoPlayerProps {
  embedUrl: string;
}

export function DemoVideoPlayer({ embedUrl }: DemoVideoPlayerProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);

  if (!isLoaded) {
    return (
      <div className="aspect-video w-full rounded-md border border-rule bg-paper flex flex-col items-center justify-center p-6 text-center space-y-3">
        <p className="text-sm text-ink-2 max-w-md">
          A video demonstration of this project is available. Click below to load the video player from YouTube.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setIsLoaded(true)}
        >
          Load video
        </Button>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-md border border-rule bg-black">
      <iframe
        src={embedUrl}
        title="Project demonstration video"
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
