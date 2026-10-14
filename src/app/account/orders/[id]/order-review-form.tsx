"use client";

import { useState } from "react";
import { submitReviewAction } from "@/server/reviews/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

interface OrderReviewFormProps {
  orderId: string;
  projectId: string;
  kitTitle: string;
}

export function OrderReviewForm({ orderId, projectId, kitTitle }: OrderReviewFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (body.trim().length < 20) {
      setErrorMessage("Review must be at least 20 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitReviewAction({
        orderId,
        projectId,
        rating,
        body: body.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.errorMessage || "Failed to submit review.");
      } else {
        setSuccess(true);
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-paper p-4 rounded-md border border-rule mt-4">
        <Alert variant="success" title="Review Submitted">
          Thank you for your feedback. Your review is pending moderation and will be published with the &quot;Verified buyer&quot; badge once verified.
        </Alert>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="pt-3 border-t border-rule mt-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-ink block">Have you studied this kit?</span>
          <span className="text-[11px] text-ink-3">Share your verified feedback to help fellow students.</span>
        </div>
        <Button
          type="button"
          variant="quiet"
          size="sm"
          onClick={() => setIsOpen(true)}
        >
          Write a review
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-4 border-rule bg-paper mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-ink">Write a review for {kitTitle}</h4>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs text-ink-3 hover:text-ink"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {errorMessage && (
          <Alert variant="error" title="Could not submit review">
            {errorMessage}
          </Alert>
        )}

        <div>
          <label className="block text-xs font-medium text-ink mb-1">
            Your Rating
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setRating(score)}
                className={`h-8 w-8 rounded-md text-xs font-semibold border transition-colors ${
                  score === rating
                    ? "bg-accent text-white border-accent"
                    : "bg-paper text-ink border-rule hover:border-rule-strong"
                }`}
              >
                {score}
              </button>
            ))}
            <span className="text-xs text-ink-2 font-mono ml-2">
              {rating} of 5 rating
            </span>
          </div>
        </div>

        <FormField
          id={`review-${projectId}`}
          label="Your Review"
          helpText="Minimum 20 characters, maximum 2000 characters."
        >
          <Textarea
            id={`review-${projectId}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe your experience with the source code, reports, viva preparation, and installation..."
            rows={3}
            maxLength={2000}
            required
          />
        </FormField>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-ink-3">
            {body.length} / 2000 characters
          </span>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={isSubmitting || body.trim().length < 20}
          >
            Submit review
          </Button>
        </div>
      </form>
    </Card>
  );
}
