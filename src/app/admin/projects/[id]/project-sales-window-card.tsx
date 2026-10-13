"use client";

import * as React from "react";
import { useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { resetSalesWindow } from "../actions";
import type { Project } from "@/types/database";

interface ProjectSalesWindowCardProps {
  project: Project;
  salesCount: number;
}

export function ProjectSalesWindowCard({
  project,
  salesCount,
}: ProjectSalesWindowCardProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const formattedWindowStart = React.useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(project.sales_window_start));
    } catch {
      return project.sales_window_start;
    }
  }, [project.sales_window_start]);

  const handleResetWindow = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await resetSalesWindow(project.id);
      if (!res.success) {
        setErrorMsg(res.message || "Failed to reset sales window.");
      } else {
        setConfirmOpen(false);
      }
    });
  };

  const limitText =
    project.sales_limit !== null && project.sales_limit !== undefined
      ? `${project.sales_limit} orders max`
      : "No limit (unlimited)";

  const isLimitReached =
    project.sales_limit !== null &&
    project.sales_limit !== undefined &&
    salesCount >= project.sales_limit;

  return (
    <Card className="p-6 space-y-4 border-rule">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink">Semester Sales Window & Quota</h2>
          <p className="mt-1 text-sm text-ink-2">
            Tracks kit orders across academic terms to limit duplicate project submissions within the same college zone.
          </p>
        </div>

        <div>
          {!confirmOpen ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmOpen(true)}
            >
              Start a new sales window
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="danger"
                isLoading={isPending}
                loadingText="Resetting..."
                onClick={handleResetWindow}
              >
                Confirm Reset to Now
              </Button>
              <Button
                type="button"
                variant="quiet"
                disabled={isPending}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <Alert variant="danger" title="Sales window error">
          {errorMsg}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="p-3 bg-paper rounded border border-rule">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-2">
            Current Window Started
          </div>
          <div className="mt-1 text-sm font-semibold text-ink">
            {formattedWindowStart} IST
          </div>
        </div>

        <div className="p-3 bg-paper rounded border border-rule">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-2">
            Configured Limit
          </div>
          <div className="mt-1 text-sm font-semibold text-ink">
            {limitText}
          </div>
        </div>

        <div className="p-3 bg-paper rounded border border-rule">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-2">
            Orders in Current Window
          </div>
          <div className="mt-1 text-sm font-semibold text-ink flex items-center gap-2">
            <span>{salesCount} order(s)</span>
            {isLimitReached && (
              <span className="text-xs font-bold text-danger">[CAP REACHED]</span>
            )}
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className="p-3 bg-accent-weak rounded border border-accent text-xs text-ink space-y-1">
          <p className="font-semibold text-accent">Notice: Starting a new sales window</p>
          <p>
            This action resets the sales window start timestamp to current time. Orders placed prior to this moment will no longer count towards the semester quota. An audit log row will be recorded.
          </p>
        </div>
      )}
    </Card>
  );
}
