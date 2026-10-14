"use client";

import { useState } from "react";
import { moderateReviewAction } from "@/server/reviews/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { formatDate } from "@/lib/format";
import type { ReviewStatus } from "@/types/database";

export interface AdminReviewItem {
  id: string;
  project_id: string;
  project_title: string;
  user_id: string;
  student_name: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  admin_reason: string | null;
  created_at: string;
}

interface AdminReviewsClientProps {
  initialReviews: AdminReviewItem[];
}

export function AdminReviewsClient({ initialReviews }: AdminReviewsClientProps) {
  const [reviews, setReviews] = useState<AdminReviewItem[]>(initialReviews);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [hideModal, setHideModal] = useState<AdminReviewItem | null>(null);
  const [hideReason, setHideReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredReviews = reviews.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const handleApprove = async (review: AdminReviewItem) => {
    setIsProcessing(true);
    setFeedback(null);

    try {
      const res = await moderateReviewAction(review.id, "approved");
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === review.id ? { ...r, status: "approved" as ReviewStatus } : r
          )
        );
        setFeedback({ type: "success", text: "Review approved and published with 'Verified buyer' badge." });
      } else {
        setFeedback({ type: "error", text: res.errorMessage || "Failed to approve review." });
      }
    } catch {
      setFeedback({ type: "error", text: "An error occurred while approving review." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmHide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hideModal) return;

    if (!hideReason.trim()) {
      setFeedback({ type: "error", text: "Please enter a reason for hiding this review." });
      return;
    }

    setIsProcessing(true);
    setFeedback(null);

    try {
      const res = await moderateReviewAction(hideModal.id, "hidden", hideReason.trim());
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === hideModal.id
              ? { ...r, status: "hidden" as ReviewStatus, admin_reason: hideReason.trim() }
              : r
          )
        );
        setFeedback({ type: "success", text: "Review has been hidden." });
        setHideModal(null);
        setHideReason("");
      } else {
        setFeedback({ type: "error", text: res.errorMessage || "Failed to hide review." });
      }
    } catch {
      setFeedback({ type: "error", text: "An error occurred while hiding review." });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadgeVariant = (status: ReviewStatus) => {
    switch (status) {
      case "pending":
        return "warn";
      case "approved":
        return "success";
      case "hidden":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <Alert
          variant={feedback.type === "success" ? "success" : "error"}
          title={feedback.type === "success" ? "Success" : "Notice"}
        >
          {feedback.text}
        </Alert>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-rule pb-2">
        {["pending", "all", "approved", "hidden"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              statusFilter === st
                ? "bg-paper text-ink font-semibold border border-rule-strong"
                : "text-ink-2 hover:text-ink hover:bg-paper/50"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {filteredReviews.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-rule rounded-md text-ink-3 text-sm">
          No {statusFilter === "all" ? "" : statusFilter} reviews found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReviews.map((review) => (
            <Card key={review.id} className="p-5 border-rule bg-surface space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-rule pb-3">
                <div>
                  <h3 className="font-semibold text-base text-ink">
                    {review.project_title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-ink-2">
                    <span>Student: {review.student_name}</span>
                    <span>•</span>
                    <span>{formatDate(review.created_at)}</span>
                    <span>•</span>
                    <span className="font-medium text-amber-700">
                      Rating: {review.rating} / 5
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(review.status)}>
                    {review.status}
                  </Badge>
                </div>
              </div>

              {/* Read-only body (Admin cannot edit text) */}
              <div className="bg-paper p-4 rounded-md border border-rule text-sm text-ink leading-relaxed whitespace-pre-wrap">
                {review.body}
              </div>

              {review.admin_reason && (
                <div className="text-xs text-ink-3 bg-paper p-2.5 rounded border border-rule">
                  <strong>Moderation Reason:</strong> {review.admin_reason}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-1">
                {review.status !== "approved" && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => handleApprove(review)}
                  >
                    Approve & publish
                  </Button>
                )}

                {review.status !== "hidden" && (
                  <Button
                    type="button"
                    variant="quiet"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => {
                      setHideModal(review);
                      setHideReason(review.admin_reason || "");
                    }}
                  >
                    Hide review
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Hide Modal */}
      {hideModal && (
        <Dialog
          open={!!hideModal}
          onOpenChange={(open) => !open && setHideModal(null)}
          title="Hide Review"
          className="max-w-md"
        >
          <form onSubmit={handleConfirmHide} className="space-y-4">
            <p className="text-xs text-ink-2">
              Hiding this review will remove it from the public kit page. Please provide a moderation reason for record-keeping.
            </p>
            <FormField id="hide-reason" label="Reason for hiding" helpText="Internal audit reason">
              <Textarea
                id="hide-reason"
                value={hideReason}
                onChange={(e) => setHideReason(e.target.value)}
                placeholder="e.g. Contains offensive language or spam."
                rows={3}
                required
              />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="quiet" size="sm" onClick={() => setHideModal(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm" isLoading={isProcessing}>
                Hide review
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
