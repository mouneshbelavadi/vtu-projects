"use client";

import * as React from "react";
import { useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { publishProject, unpublishProject } from "../actions";
import type { Project } from "@/types/database";
import type { ProjectReadiness } from "@/server/projects/readiness";

interface ProjectReadinessCardProps {
  project: Project;
  readiness: ProjectReadiness;
}

export function ProjectReadinessCard({ project, readiness }: ProjectReadinessCardProps) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = React.useState<string | null>(null);

  const isLive = project.status === "live";

  const handlePublish = () => {
    setActionError(null);
    startTransition(async () => {
      const res = await publishProject(project.id);
      if (!res.success) {
        setActionError(res.message || "Failed to publish project.");
      }
    });
  };

  const handleUnpublish = () => {
    setActionError(null);
    startTransition(async () => {
      const res = await unpublishProject(project.id);
      if (!res.success) {
        setActionError(res.message || "Failed to hide project.");
      }
    });
  };

  return (
    <Card className="p-6 space-y-6 border-rule">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-ink">Go-Live Readiness Checklist</h2>
            <StatusBadge status={project.status} />
          </div>
          <p className="mt-1 text-sm text-ink-2">
            Projects can only be published when all mandatory syllabus files, screenshots, and commercial terms are fulfilled.
          </p>
        </div>

        <div>
          {isLive ? (
            <Button
              type="button"
              variant="secondary"
              isLoading={isPending}
              loadingText="Hiding..."
              onClick={handleUnpublish}
            >
              Hide from Catalogue
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              disabled={!readiness.canPublish || isPending}
              isLoading={isPending}
              loadingText="Publishing..."
              onClick={handlePublish}
            >
              Publish to Catalogue
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <Alert variant="danger" title="Status update error">
          {actionError}
        </Alert>
      )}

      {/* Mandatory Criteria */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-2">
          Mandatory Publication Criteria
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <li className="flex items-start gap-2.5 p-3 rounded-md bg-paper border border-rule">
            <span className={readiness.criteria.hasThreeScreenshots ? "text-accent font-bold" : "text-danger font-bold"}>
              {readiness.criteria.hasThreeScreenshots ? "[OK]" : "[MISSING]"}
            </span>
            <div>
              <span className="font-medium text-ink">At least 3 screenshots with alt text</span>
              <p className="text-xs text-ink-2">
                Currently {readiness.criteria.screenshotsCount} valid screenshot(s) uploaded.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-2.5 p-3 rounded-md bg-paper border border-rule">
            <span className={readiness.criteria.hasCodeFile ? "text-accent font-bold" : "text-danger font-bold"}>
              {readiness.criteria.hasCodeFile ? "[OK]" : "[MISSING]"}
            </span>
            <div>
              <span className="font-medium text-ink">Source code package (.zip)</span>
              <p className="text-xs text-ink-2">
                Complete runnable project source code with documentation.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-2.5 p-3 rounded-md bg-paper border border-rule">
            <span className={readiness.criteria.hasSetupGuide ? "text-accent font-bold" : "text-danger font-bold"}>
              {readiness.criteria.hasSetupGuide ? "[OK]" : "[MISSING]"}
            </span>
            <div>
              <span className="font-medium text-ink">Setup & execution guide</span>
              <p className="text-xs text-ink-2">
                Step-by-step installation instructions (.pdf or .docx).
              </p>
            </div>
          </li>

          <li className="flex items-start gap-2.5 p-3 rounded-md bg-paper border border-rule">
            <span className={readiness.criteria.hasVivaQuestions ? "text-accent font-bold" : "text-danger font-bold"}>
              {readiness.criteria.hasVivaQuestions ? "[OK]" : "[MISSING]"}
            </span>
            <div>
              <span className="font-medium text-ink">Viva examination Q&A file</span>
              <p className="text-xs text-ink-2">
                Subject-specific viva preparation questions (.pdf or .docx).
              </p>
            </div>
          </li>

          <li className="flex items-start gap-2.5 p-3 rounded-md bg-paper border border-rule">
            <span className={readiness.criteria.hasPriceAboveZero ? "text-accent font-bold" : "text-danger font-bold"}>
              {readiness.criteria.hasPriceAboveZero ? "[OK]" : "[MISSING]"}
            </span>
            <div>
              <span className="font-medium text-ink">Price above zero (₹)</span>
              <p className="text-xs text-ink-2">
                Current price: ₹{project.price_inr.toLocaleString("en-IN")}.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-2.5 p-3 rounded-md bg-paper border border-rule">
            <span className={readiness.criteria.hasLongDescription ? "text-accent font-bold" : "text-danger font-bold"}>
              {readiness.criteria.hasLongDescription ? "[OK]" : "[MISSING]"}
            </span>
            <div>
              <span className="font-medium text-ink">Description length (&ge; 300 characters)</span>
              <p className="text-xs text-ink-2">
                Currently {readiness.criteria.descriptionLength} character(s).
              </p>
            </div>
          </li>
        </ul>
      </div>

      {/* Recommended Items */}
      <div className="space-y-3 pt-2 border-t border-rule">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-2">
          Recommended Deliverables
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <li className="flex items-start gap-2.5 p-3 rounded-md bg-paper border border-rule">
            <span className={readiness.recommendations.hasReportTemplate ? "text-accent font-bold" : "text-ink-2 font-bold"}>
              {readiness.recommendations.hasReportTemplate ? "[OK]" : "[NOTE]"}
            </span>
            <div>
              <span className="font-medium text-ink">Project report template</span>
              <p className="text-xs text-ink-2">
                VTU standard report format (.pdf or .docx) recommended for students.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-2.5 p-3 rounded-md bg-paper border border-rule">
            <span className={readiness.recommendations.hasPptTemplate ? "text-accent font-bold" : "text-ink-2 font-bold"}>
              {readiness.recommendations.hasPptTemplate ? "[OK]" : "[NOTE]"}
            </span>
            <div>
              <span className="font-medium text-ink">Presentation slides template (.pptx)</span>
              <p className="text-xs text-ink-2">
                Project viva seminar presentation slide deck.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </Card>
  );
}
