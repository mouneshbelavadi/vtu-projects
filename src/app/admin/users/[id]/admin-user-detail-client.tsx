"use client";

import { useState } from "react";
import { exportUserDataAdminAction, anonymiseUserAdminAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

interface AdminUserDetailClientProps {
  user: {
    id: string;
    email: string | null;
    displayName: string;
    phone: string | null;
    createdAt: string;
    roles: string[];
    isAnonymised: boolean;
  };
}

export function AdminUserDetailClient({ user }: AdminUserDetailClientProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isAnonymiseModalOpen, setIsAnonymiseModalOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [isAnonymising, setIsAnonymising] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isAnonymisedState, setIsAnonymisedState] = useState(user.isAnonymised);

  const handleExport = async () => {
    setIsExporting(true);
    setFeedback(null);
    try {
      const res = await exportUserDataAdminAction(user.id);
      if (res.success && res.data) {
        const jsonStr = JSON.stringify(res.data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `user-export-${user.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setFeedback({ type: "success", text: "User data export downloaded successfully." });
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to export user data." });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAnonymise = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnonymising(true);
    setFeedback(null);

    if (confirmationText !== "ANONYMISE") {
      setFeedback({ type: "error", text: 'Please type "ANONYMISE" exactly to confirm.' });
      setIsAnonymising(false);
      return;
    }

    if (!/^\d{6}$/.test(totpCode.trim())) {
      setFeedback({ type: "error", text: "Please enter your 6-digit TOTP authentication code." });
      setIsAnonymising(false);
      return;
    }

    try {
      const res = await anonymiseUserAdminAction({
        targetUserId: user.id,
        totpCode: totpCode.trim(),
        confirmationText: confirmationText.trim(),
      });

      if (res.success) {
        setIsAnonymisedState(true);
        setIsAnonymiseModalOpen(false);
        setFeedback({
          type: "success",
          text: "Account has been anonymised. Personal fields cleared, files purged, and auth identity removed. Financial records retained for compliance.",
        });
      } else {
        setFeedback({ type: "error", text: res.errorMessage || "Anonymisation failed." });
      }
    } catch {
      setFeedback({ type: "error", text: "An error occurred during account anonymisation." });
    } finally {
      setIsAnonymising(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <Alert
          variant={feedback.type === "success" ? "success" : "error"}
          title={feedback.type === "success" ? "Success" : "Error"}
        >
          {feedback.text}
        </Alert>
      )}

      {isAnonymisedState && (
        <Alert variant="info" title="Anonymised Account">
          This user account has been anonymised. Personal identity fields and auth credentials have been removed. Financial ledger items are preserved for the statutory 7-year accounting period.
        </Alert>
      )}

      {/* User Details Card */}
      <Card className="p-6 border-rule bg-surface space-y-4">
        <div className="border-b border-rule pb-3">
          <h2 className="font-serif text-lg font-bold text-ink">User Profile Overview</h2>
          <span className="font-mono text-xs text-ink-3">ID: {user.id}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-ink-3 block">Display Name</span>
            <span className="font-medium text-ink">{user.displayName}</span>
          </div>

          <div>
            <span className="text-xs text-ink-3 block">Email Address</span>
            <span className="font-medium text-ink">{user.email || "Removed / Anonymised"}</span>
          </div>

          <div>
            <span className="text-xs text-ink-3 block">Phone Number</span>
            <span className="font-medium text-ink">{user.phone || "None / Removed"}</span>
          </div>

          <div>
            <span className="text-xs text-ink-3 block">Registered On</span>
            <span className="font-medium text-ink">{formatDate(user.createdAt)}</span>
          </div>

          <div>
            <span className="text-xs text-ink-3 block">Roles</span>
            <span className="font-medium text-ink capitalize">
              {user.roles.join(", ") || "student"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-rule pt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="quiet"
            size="sm"
            isLoading={isExporting}
            disabled={isExporting}
            onClick={handleExport}
          >
            Export data (JSON)
          </Button>

          {!isAnonymisedState && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setIsAnonymiseModalOpen(true)}
            >
              Anonymise account
            </Button>
          )}
        </div>
      </Card>

      {/* Anonymise Confirmation Dialog */}
      {isAnonymiseModalOpen && (
        <Dialog
          open={isAnonymiseModalOpen}
          onOpenChange={setIsAnonymiseModalOpen}
          title="Anonymise User Account"
          className="max-w-lg"
        >
          <form onSubmit={handleAnonymise} className="space-y-4">
            <div className="bg-paper p-3 rounded-md border border-rule text-xs text-ink-2 space-y-1.5">
              <p className="font-semibold text-error">Warning: This action cannot be reversed.</p>
              <ul className="list-disc pl-4 space-y-1 text-ink-2">
                <li>Personal name and phone number will be scrubbed from profiles.</li>
                <li>Payment receipt screenshots in storage will be permanently deleted.</li>
                <li>Uploaded custom request files will be removed.</li>
                <li>In-app request messages will be replaced with anonymisation notices.</li>
                <li>The Supabase auth user identity will be deleted.</li>
                <li>Order and payment UTR records will be preserved for 7-year statutory tax compliance.</li>
              </ul>
            </div>

            <FormField
              id="confirm-anonymise"
              label='Type "ANONYMISE" to confirm'
              helpText="Case-sensitive confirmation requirement"
            >
              <Input
                id="confirm-anonymise"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="ANONYMISE"
                required
              />
            </FormField>

            <FormField
              id="admin-totp"
              label="Admin 6-digit TOTP Code"
              helpText="Enter the 6-digit code from your authenticator app"
            >
              <Input
                id="admin-totp"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="quiet"
                size="sm"
                disabled={isAnonymising}
                onClick={() => setIsAnonymiseModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                isLoading={isAnonymising}
                disabled={isAnonymising || confirmationText !== "ANONYMISE" || totpCode.trim().length !== 6}
              >
                Anonymise account
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
