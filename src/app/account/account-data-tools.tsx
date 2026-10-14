"use client";

import { useState } from "react";
import { requestAccountDeletionAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export function AccountDataTools() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleDeleteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await requestAccountDeletionAction(reason.trim());
      if (res.success) {
        setResult({
          type: "success",
          text: "Your account deletion request has been submitted. Our compliance team will review and process your request within 30 days.",
        });
        setIsModalOpen(false);
        setReason("");
      } else {
        setResult({
          type: "error",
          text: res.errorMessage || "Failed to submit deletion request.",
        });
      }
    } catch {
      setResult({
        type: "error",
        text: "An error occurred while submitting your request.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 border-rule bg-surface space-y-4">
      <div className="border-b border-rule pb-3">
        <h2 className="font-serif text-lg font-bold text-ink">Account Privacy and Data Tools</h2>
        <p className="text-xs text-ink-2 mt-0.5">
          Download a machine-readable archive of your personal records or submit an account deletion request.
        </p>
      </div>

      {result && (
        <Alert
          variant={result.type === "success" ? "success" : "error"}
          title={result.type === "success" ? "Request Submitted" : "Error"}
        >
          {result.text}
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <span className="text-sm font-semibold text-ink block">Export Personal Data</span>
          <span className="text-xs text-ink-3">
            Download your profile, order history, purchase entitlements, and tickets in JSON format.
          </span>
        </div>
        <a
          href="/api/account/export"
          download
          className="inline-flex h-9 items-center justify-center rounded-md border border-rule bg-paper px-4 text-xs font-semibold text-ink hover:bg-paper/80 transition-colors"
        >
          Download my data
        </a>
      </div>

      <div className="border-t border-rule pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-error block">Delete Account</span>
          <span className="text-xs text-ink-3">
            Permanently remove your login identity and personal profile information.
          </span>
        </div>
        <Button
          type="button"
          variant="quiet"
          size="sm"
          className="text-error hover:bg-error/10 hover:text-error border-error/30"
          onClick={() => setIsModalOpen(true)}
        >
          Request account deletion
        </Button>
      </div>

      {/* Deletion Dialog */}
      <Dialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Request Account Deletion"
        className="max-w-md"
      >
        <form onSubmit={handleDeleteRequest} className="space-y-4">
          <p className="text-xs text-ink-2">
            In compliance with Indian data protection regulations, submitting this request will initiate an account review. A 30-day grace period applies. Order and financial transaction records are retained for 7 years to meet statutory tax obligations.
          </p>

          <FormField
            id="deletion-reason"
            label="Reason (Optional)"
            helpText="Briefly share why you are deleting your account."
          >
            <Textarea
              id="deletion-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Completed my final semester and no longer need the platform."
              rows={3}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="quiet"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Confirm deletion request
            </Button>
          </div>
        </form>
      </Dialog>
    </Card>
  );
}
