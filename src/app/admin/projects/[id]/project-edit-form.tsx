"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { updateProject, deleteProject, type ProjectActionState } from "../actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { PlainDescription } from "@/components/ui/plain-description";
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from "@/lib/youtube";
import {
  COURSE_TYPES,
  DIFFICULTIES,
  type Category,
  type CourseType,
  type Difficulty,
  type Project,
} from "@/types/database";

interface ProjectEditFormProps {
  project: Project;
  categories: Category[];
  selectedCategoryIds: string[];
}

const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  mini_project: "Mini Project",
  project_phase_1: "Project Phase I",
  major_project_phase_2: "Major Project Phase II",
  capstone: "Capstone Project",
  hackathon_project: "Hackathon Project",
  other: "Other Project",
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const initialActionState: ProjectActionState = {
  status: "idle",
};

export function ProjectEditForm({
  project,
  categories,
  selectedCategoryIds,
}: ProjectEditFormProps) {
  const [state, formAction, isPending] = useActionState(updateProject, initialActionState);
  const [deletePending, startDeleteTransition] = useTransition();

  const [title, setTitle] = React.useState(project.title);
  const [slug, setSlug] = React.useState(project.slug);
  const [summary, setSummary] = React.useState(project.summary);
  const [description, setDescription] = React.useState(project.description);
  const [demoVideoUrl, setDemoVideoUrl] = React.useState(project.demo_video_url || "");
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Group categories
  const branches = categories.filter((c) => c.kind === "branch");
  const semesters = categories.filter((c) => c.kind === "semester");
  const schemes = categories.filter((c) => c.kind === "scheme");
  const domains = categories.filter((c) => c.kind === "domain");

  const youtubeId = extractYouTubeVideoId(demoVideoUrl);
  const embedUrl = youtubeId ? getYouTubeEmbedUrl(youtubeId) : null;

  const handleDelete = () => {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const res = await deleteProject(project.id);
      if (res && !res.success) {
        setDeleteError(res.message || "Failed to delete project.");
      }
    });
  };

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-8 max-w-4xl">
        <input type="hidden" name="projectId" value={project.id} />

        {state.status === "error" && state.message && (
          <Alert variant="danger" title="Update failed">
            {state.message}
          </Alert>
        )}

        {state.status === "success" && state.message && (
          <Alert variant="success" title="Success">
            {state.message}
          </Alert>
        )}

        {/* Identity */}
        <Card className="p-6 space-y-6">
          <h2 className="text-lg font-bold text-ink">Project Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              id="title"
              label="Project Title"
              helpText="Descriptive academic title."
              required
            >
              {({ id }) => (
                <Input
                  id={id}
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={200}
                />
              )}
            </FormField>

            <FormField
              id="slug"
              label="URL Slug"
              helpText="Lowercase letters, numbers, and hyphens only."
              required
            >
              {({ id }) => (
                <Input
                  id={id}
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
                  maxLength={120}
                />
              )}
            </FormField>
          </div>

          <FormField
            id="summary"
            label="Short Summary"
            helpText={`Brief description for cards (${summary.length}/300 characters).`}
            required
          >
            {({ id }) => (
              <Textarea
                id={id}
                name="summary"
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
                maxLength={300}
              />
            )}
          </FormField>

          <div className="space-y-3">
            <FormField
              id="description"
              label="Project Description"
              helpText="Plain text only: separate paragraphs with blank lines, start lines with '- ' for bullets. HTML is refused. Minimum 300 characters for live publication."
              required
            >
              {({ id }) => (
                <Textarea
                  id={id}
                  name="description"
                  rows={12}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  minLength={10}
                />
              )}
            </FormField>

            {description.trim().length > 0 && (
              <div className="border border-rule rounded-md p-4 bg-paper space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-ink-2">
                  Live Plain Text Preview ({description.trim().length} characters)
                </div>
                <div className="p-3 bg-surface rounded border border-rule-subtle">
                  <PlainDescription content={description} />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Classification */}
        <Card className="p-6 space-y-6">
          <h2 className="text-lg font-bold text-ink">Academic and Technical Attributes</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              id="course_type"
              label="Course Type"
              helpText="Relevant VTU curriculum milestone."
              required
            >
              {({ id }) => (
                <select
                  id={id}
                  name="course_type"
                  required
                  defaultValue={project.course_type}
                  className="flex h-11 min-h-[44px] w-full rounded-md border border-rule-strong bg-surface px-3 text-base text-ink focus:outline-accent"
                >
                  {COURSE_TYPES.map((ct) => (
                    <option key={ct} value={ct}>
                      {COURSE_TYPE_LABELS[ct]}
                    </option>
                  ))}
                </select>
              )}
            </FormField>

            <FormField
              id="difficulty"
              label="Difficulty Level"
              helpText="Indicates required programming and setup depth."
              required
            >
              {({ id }) => (
                <select
                  id={id}
                  name="difficulty"
                  required
                  defaultValue={project.difficulty}
                  className="flex h-11 min-h-[44px] w-full rounded-md border border-rule-strong bg-surface px-3 text-base text-ink focus:outline-accent"
                >
                  {DIFFICULTIES.map((diff) => (
                    <option key={diff} value={diff}>
                      {DIFFICULTY_LABELS[diff]}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          </div>

          <FormField
            id="tech_stack"
            label="Tech Stack Tags"
            helpText="Comma-separated list (up to 12 tags, e.g. React, Node.js, MongoDB)."
            required
          >
            {({ id }) => (
              <Input
                id={id}
                name="tech_stack"
                defaultValue={project.tech_stack?.join(", ") || ""}
                required
              />
            )}
          </FormField>

          <FormField
            id="syllabus_note"
            label="Syllabus Note (Optional)"
            helpText="Reference to specific VTU subject code or course guidelines."
          >
            {({ id }) => (
              <Input
                id={id}
                name="syllabus_note"
                defaultValue={project.syllabus_note || ""}
              />
            )}
          </FormField>

          {/* Categories */}
          <div className="space-y-4 pt-2 border-t border-rule">
            <h3 className="text-sm font-semibold text-ink">Associated Categories</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {branches.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-ink-2">Branches</div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-paper rounded border border-rule">
                    {branches.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          name="category_ids"
                          value={cat.id}
                          defaultChecked={selectedCategoryIds.includes(cat.id)}
                          className="rounded border-rule text-accent focus:ring-accent"
                        />
                        <span>{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {domains.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-ink-2">Domains</div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-paper rounded border border-rule">
                    {domains.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          name="category_ids"
                          value={cat.id}
                          defaultChecked={selectedCategoryIds.includes(cat.id)}
                          className="rounded border-rule text-accent focus:ring-accent"
                        />
                        <span>{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {schemes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-ink-2">Schemes</div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-paper rounded border border-rule">
                    {schemes.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          name="category_ids"
                          value={cat.id}
                          defaultChecked={selectedCategoryIds.includes(cat.id)}
                          className="rounded border-rule text-accent focus:ring-accent"
                        />
                        <span>{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {semesters.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-ink-2">Semesters</div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-paper rounded border border-rule">
                    {semesters.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          name="category_ids"
                          value={cat.id}
                          defaultChecked={selectedCategoryIds.includes(cat.id)}
                          className="rounded border-rule text-accent focus:ring-accent"
                        />
                        <span>{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Commercial & Video */}
        <Card className="p-6 space-y-6">
          <h2 className="text-lg font-bold text-ink">Commercial Terms and Video</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              id="price_inr"
              label="Kit Price (₹ INR)"
              helpText="Whole rupee amount. Must be greater than 0 for live publication."
              required
            >
              {({ id }) => (
                <Input
                  id={id}
                  name="price_inr"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={project.price_inr}
                  required
                />
              )}
            </FormField>

            <FormField
              id="sales_limit"
              label="Sales Limit (Optional)"
              helpText="Maximum paid orders per sales window (leave empty for unlimited)."
            >
              {({ id }) => (
                <Input
                  id={id}
                  name="sales_limit"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={project.sales_limit ?? ""}
                />
              )}
            </FormField>
          </div>

          <FormField
            id="demo_video_url"
            label="Demo Video Link (Optional)"
            helpText="YouTube link (youtube.com or youtu.be). Rendered via youtube-nocookie.com."
          >
            {({ id }) => (
              <Input
                id={id}
                name="demo_video_url"
                type="url"
                value={demoVideoUrl}
                onChange={(e) => setDemoVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            )}
          </FormField>

          {demoVideoUrl.trim().length > 0 && (
            <div className="border border-rule rounded-md p-4 bg-paper space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-2">
                Video Verification Preview
              </div>
              {embedUrl ? (
                <div className="aspect-video w-full max-w-lg overflow-hidden rounded border border-rule bg-black">
                  <iframe
                    src={embedUrl}
                    title="Demo Video Preview"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <p className="text-xs text-danger">
                  Invalid YouTube URL. Please provide a valid youtube.com or youtu.be link.
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Submit Save */}
        <div className="flex items-center justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isPending}
            loadingText="Saving changes..."
          >
            Save Project Details
          </Button>
        </div>
      </form>

      {/* Danger Zone: Delete Project */}
      <Card className="p-6 border-danger/40 space-y-4 max-w-4xl">
        <h3 className="text-base font-bold text-danger">Danger Zone: Delete Project</h3>
        <p className="text-xs text-ink-2">
          Projects can only be permanently deleted if no orders reference them. If students have ordered this kit, the project must be hidden instead of deleted to protect order history.
        </p>

        {deleteError && (
          <Alert variant="danger" title="Cannot delete project">
            {deleteError}
          </Alert>
        )}

        {!confirmDelete ? (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setConfirmDelete(true)}
          >
            Delete Project Kit
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={deletePending}
              loadingText="Deleting..."
              onClick={handleDelete}
            >
              Confirm Permanent Deletion
            </Button>
            <Button
              type="button"
              variant="quiet"
              size="sm"
              disabled={deletePending}
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
