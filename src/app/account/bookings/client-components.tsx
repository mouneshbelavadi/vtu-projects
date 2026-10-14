"use client";

import { useState } from "react";
import { requestBookingCancellationAction } from "@/server/mentoring/student-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { Dialog } from "@/components/ui/dialog";

interface RequestCancellationDialogProps {
  bookingId: string;
  tierName: string;
  sessionTimeIst: string;
}

export function RequestCancellationButton({
  bookingId,
  tierName,
  sessionTimeIst,
}: RequestCancellationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (reason.trim().length < 5) {
      setErrorMessage("Please provide a reason with at least 5 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestBookingCancellationAction(bookingId, reason);
      if (!result.success) {
        setErrorMessage(result.errorMessage || "Failed to submit request.");
      } else {
        setSuccessMessage("Cancellation request submitted. Our team will review and process your request.");
        setTimeout(() => {
          setIsOpen(false);
        }, 2000);
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="quiet"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        Request cancellation
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Request session cancellation"
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-paper p-3 rounded-md border border-rule text-xs text-ink-2 space-y-1">
            <div>
              <strong>Session:</strong> {tierName}
            </div>
            <div>
              <strong>Timing:</strong> {sessionTimeIst}
            </div>
            <div className="pt-2 border-t border-rule text-ink-3">
              <strong>Policy:</strong> Cancellation requests must be submitted at least 24 hours before your scheduled session time. Confirmed sessions cancelled within 24 hours are non-refundable.
            </div>
          </div>

          {errorMessage && (
            <Alert variant="error" title="Error">
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success" title="Success">
              {successMessage}
            </Alert>
          )}

          <FormField
            id="cancellation-reason"
            label="Reason for cancellation"
            helpText="Briefly explain why you need to cancel this session."
          >
            <Textarea
              id="cancellation-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Schedule conflict with college exam."
              rows={3}
              required
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="quiet"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              disabled={isSubmitting || !reason.trim()}
            >
              Submit request
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
