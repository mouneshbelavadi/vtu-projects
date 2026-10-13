"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import {
  uploadScreenshot,
  deleteScreenshot,
  reorderScreenshot,
  type ScreenshotActionState,
} from "./screenshots/actions";
import type { Project, ProjectMedia } from "@/types/database";

interface ProjectScreenshotsManagerProps {
  project: Project;
  media: ProjectMedia[];
  supabaseUrl: string;
}

const initialUploadState: ScreenshotActionState = {
  status: "idle",
};

export function ProjectScreenshotsManager({
  project,
  media,
  supabaseUrl,
}: ProjectScreenshotsManagerProps) {
  const [uploadState, formAction, isUploadPending] = useActionState(
    uploadScreenshot,
    initialUploadState
  );
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = React.useState<string | null>(null);

  const formRef = React.useRef<HTMLFormElement>(null);

  // Clear form on successful upload
  React.useEffect(() => {
    if (uploadState.status === "success") {
      formRef.current?.reset();
    }
  }, [uploadState.status]);

  const handleReorder = (mediaId: string, direction: "up" | "down") => {
    setActionError(null);
    startTransition(async () => {
      const res = await reorderScreenshot(project.id, mediaId, direction);
      if (!res.success) {
        setActionError(res.message || "Failed to reorder screenshot.");
      }
    });
  };

  const handleDelete = (mediaId: string) => {
    if (!confirm("Are you sure you want to delete this screenshot?")) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const res = await deleteScreenshot(project.id, mediaId);
      if (!res.success) {
        setActionError(res.message || "Failed to delete screenshot.");
      }
    });
  };

  return (
    <Card className="p-6 space-y-6 border-rule">
      <div>
        <h2 className="text-lg font-bold text-ink">Project Screenshots ({media.length})</h2>
        <p className="mt-1 text-sm text-ink-2">
          Real screenshots of the project running. Accepts PNG, JPEG, and WebP (up to 4 MB). All images are automatically converted to optimized WebP (max 1600px width) with metadata stripped. At least 3 screenshots with alt text are required for publication. The first screenshot is the catalogue cover.
        </p>
      </div>

      {actionError && (
        <Alert variant="danger" title="Screenshot action error">
          {actionError}
        </Alert>
      )}

      {/* Upload Form */}
      <div className="p-4 bg-paper rounded-md border border-rule space-y-4">
        <h3 className="text-sm font-bold text-ink">Upload New Screenshot</h3>

        {uploadState.status === "error" && uploadState.message && (
          <Alert variant="danger" title="Upload failed">
            {uploadState.message}
          </Alert>
        )}

        {uploadState.status === "success" && uploadState.message && (
          <Alert variant="success" title="Upload successful">
            {uploadState.message}
          </Alert>
        )}

        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="projectId" value={project.id} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="file"
              label="Select Image File"
              helpText="PNG, JPEG, or WebP. Max 4 MB. SVG and GIF are strictly refused."
              required
            >
              {({ id }) => (
                <input
                  id={id}
                  name="file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  required
                  className="block w-full text-sm text-ink file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-surface file:text-ink hover:file:bg-paper cursor-pointer border border-rule rounded-md p-1 bg-surface"
                />
              )}
            </FormField>

            <FormField
              id="altText"
              label="Accessibility Alt Text"
              helpText="Descriptive caption of what the screenshot depicts (up to 300 characters)."
              required
            >
              {({ id }) => (
                <Input
                  id={id}
                  name="altText"
                  placeholder="e.g. Dashboard view displaying live vehicle count and traffic density"
                  required
                  maxLength={300}
                />
              )}
            </FormField>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUploadPending}
              loadingText="Processing WebP image..."
            >
              Upload and Process Screenshot
            </Button>
          </div>
        </form>
      </div>

      {/* Screenshots Grid */}
      {media.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-rule rounded-md text-sm text-ink-2">
          No screenshots uploaded yet. Add at least 3 screenshots to fulfill the go-live criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((item, index) => {
            const imageUrl = `${supabaseUrl}/storage/v1/object/public/public-media/${item.storage_path}`;
            const isCover = index === 0;

            return (
              <div
                key={item.id}
                className="rounded-md border border-rule bg-surface overflow-hidden flex flex-col justify-between"
              >
                <div className="relative aspect-video bg-black/10">
                  <Image
                    src={imageUrl}
                    alt={item.alt_text}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                  {isCover && (
                    <span className="absolute top-2 left-2 bg-accent text-surface text-xs font-semibold px-2 py-0.5 rounded shadow-sm">
                      Catalogue Cover
                    </span>
                  )}
                </div>

                <div className="p-3 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-ink font-medium line-clamp-2">
                      {item.alt_text}
                    </p>
                    <p className="text-[11px] text-ink-2 mt-1">
                      Position #{index + 1}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-rule gap-1">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={index === 0 || isPending}
                        onClick={() => handleReorder(item.id, "up")}
                        title="Move Up"
                        className="px-2 py-1 h-7 text-xs"
                      >
                        ↑ Up
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={index === media.length - 1 || isPending}
                        onClick={() => handleReorder(item.id, "down")}
                        title="Move Down"
                        className="px-2 py-1 h-7 text-xs"
                      >
                        ↓ Down
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleDelete(item.id)}
                      className="px-2 py-1 h-7 text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
