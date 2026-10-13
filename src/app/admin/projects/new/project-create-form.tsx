"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { createProject, type ProjectActionState } from "../actions";
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
} from "@/types/database";

interface ProjectCreateFormProps {
  categories: Category[];
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

const initialState: ProjectActionState = {
  status: "idle",
};

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProjectCreateForm({ categories }: ProjectCreateFormProps) {
  const [state, formAction, isPending] = useActionState(createProject, initialState);

  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [isSlugTouched, setIsSlugTouched] = React.useState(false);
  const [summary, setSummary] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [demoVideoUrl, setDemoVideoUrl] = React.useState("");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!isSlugTouched) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugTouched(true);
    setSlug(e.target.value);
  };

  // Group categories by kind
  const branches = categories.filter((c) => c.kind === "branch");
  const semesters = categories.filter((c) => c.kind === "semester");
  const schemes = categories.filter((c) => c.kind === "scheme");
  const domains = categories.filter((c) => c.kind === "domain");

  const youtubeId = extractYouTubeVideoId(demoVideoUrl);
  const embedUrl = youtubeId ? getYouTubeEmbedUrl(youtubeId) : null;

  return (
    <form action={formAction} className="space-y-8 max-w-4xl">
      {state.status === "error" && state.message && (
        <Alert variant="danger" title="Creation failed">
          {state.message}
        </Alert>
      )}

      {/* Basic information */}
      <Card className="p-6 space-y-6">
        <h2 className="text-lg font-bold text-ink">Project Identity</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            id="title"
            label="Project Title"
            helpText="Clear, descriptive title matching syllabus or domain terminology."
            required
          >
            {({ id }) => (
              <Input
                id={id}
                name="title"
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. Smart Traffic Management System using Computer Vision"
                required
                maxLength={200}
              />
            )}
          </FormField>

          <FormField
            id="slug"
            label="URL Slug"
            helpText="Lowercase letters, numbers, and hyphens only (e.g. smart-traffic-management)."
            required
          >
            {({ id }) => (
              <Input
                id={id}
                name="slug"
                value={slug}
                onChange={handleSlugChange}
                placeholder="smart-traffic-management"
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
          helpText={`Concise overview for catalogue preview cards (${summary.length}/300 characters).`}
          required
        >
          {({ id }) => (
            <Textarea
              id={id}
              name="summary"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A brief overview of the project scope, algorithms used, and practical applications."
              required
              maxLength={300}
            />
          )}
        </FormField>

        <div className="space-y-3">
          <FormField
            id="description"
            label="Project Description"
            helpText="Plain text only: separate paragraphs with a blank line, and start lines with '- ' for bullet points. HTML is refused. Minimum 300 characters for live publication."
            required
          >
            {({ id }) => (
              <Textarea
                id={id}
                name="description"
                rows={10}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={"Overview of the system architecture.\n\nKey features include:\n- Real-time video processing pipeline\n- Density estimation algorithm\n- Adaptive signal timing controller\n\nPrerequisites and required hardware..."}
                required
                minLength={10}
              />
            )}
          </FormField>

          {/* Live Plain Description Preview */}
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

      {/* Academic and Technical Classifications */}
      <Card className="p-6 space-y-6">
        <h2 className="text-lg font-bold text-ink">Academic and Technical Attributes</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            id="course_type"
            label="Course Type"
            helpText="Select the relevant VTU curriculum milestone."
            required
          >
            {({ id }) => (
              <select
                id={id}
                name="course_type"
                required
                defaultValue="mini_project"
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
                defaultValue="intermediate"
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
          helpText="Comma-separated list (up to 12 tags, e.g. Python, OpenCV, React, Flask)."
          required
        >
          {({ id }) => (
            <Input
              id={id}
              name="tech_stack"
              placeholder="Python, OpenCV, NumPy, Flask, SQLite"
              required
            />
          )}
        </FormField>

        <FormField
          id="syllabus_note"
          label="Syllabus Note (Optional)"
          helpText="Reference to specific VTU subject code or course guidelines (e.g. Prescribed for 21CS62 / 21CS72)."
        >
          {({ id }) => (
            <Input
              id={id}
              name="syllabus_note"
              placeholder="e.g. Aligned with VTU 2021/2022 Scheme requirements"
            />
          )}
        </FormField>

        {/* Categories Grouping */}
        <div className="space-y-4 pt-2 border-t border-rule">
          <h3 className="text-sm font-semibold text-ink">Associated Categories</h3>
          <p className="text-xs text-ink-2">
            Assign the branches, semesters, schemes, and domains relevant to this project.
          </p>

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

      {/* Commercial Details */}
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
                placeholder="2499"
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
                placeholder="e.g. 5"
              />
            )}
          </FormField>
        </div>

        <FormField
          id="demo_video_url"
          label="Demo Video Link (Optional)"
          helpText="YouTube link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...). Rendered via youtube-nocookie.com."
        >
          {({ id }) => (
            <Input
              id={id}
              name="demo_video_url"
              type="url"
              value={demoVideoUrl}
              onChange={(e) => setDemoVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
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

      {/* Form Submission */}
      <div className="flex items-center justify-between pt-4">
        <Link
          href="/admin/projects"
          className="text-sm font-medium text-ink-2 hover:text-ink transition-colors"
        >
          Cancel and return to catalogue
        </Link>

        <Button
          type="submit"
          variant="primary"
          isLoading={isPending}
          loadingText="Creating project..."
        >
          Create Project Kit (Draft)
        </Button>
      </div>
    </form>
  );
}
