"use client";

import { useState } from "react";
import { updateMentorMeetingLinkAction } from "@/server/mentoring/mentor-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog } from "@/components/ui/dialog";
import { formatISTSlotRange, formatDate } from "@/lib/format";
import type { BookingStatus } from "@/types/database";

export interface MentorSessionItem {
  bookingId: string;
  status: BookingStatus;
  meetUrl: string | null;
  studentFirstName: string;
  tierName: string;
  startsAt: string;
  endsAt: string;
  isUpcoming: boolean;
}

interface BuilderSessionsClientProps {
  sessions: MentorSessionItem[];
}

export function BuilderSessionsClient({ sessions }: BuilderSessionsClientProps) {
  const [meetModal, setMeetModal] = useState<{ bookingId: string; currentUrl: string } | null>(null);
  const [meetUrlInput, setMeetUrlInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleOpenMeetModal = (bookingId: string, currentUrl: string | null) => {
    setMeetModal({ bookingId, currentUrl: currentUrl || "" });
    setMeetUrlInput(currentUrl || "");
    setFeedback(null);
  };

  const handleSaveMeetUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetModal) return;
    setFeedback(null);
    setIsSaving(true);

    try {
      const res = await updateMentorMeetingLinkAction(meetModal.bookingId, meetUrlInput);
      if (!res.success) {
        setFeedback({ type: "error", text: res.errorMessage || "Failed to update link." });
      } else {
        setFeedback({ type: "success", text: "Meeting link updated successfully." });
        setMeetModal(null);
      }
    } catch {
      setFeedback({ type: "error", text: "An error occurred while updating the meeting link." });
    } finally {
      setIsSaving(false);
    }
  };

  const upcomingSessions = sessions.filter((s) => s.isUpcoming);
  const pastSessions = sessions.filter((s) => !s.isUpcoming);

  return (
    <div className="space-y-8">
      {feedback && (
        <Alert
          variant={feedback.type === "success" ? "success" : "error"}
          title={feedback.type === "success" ? "Success" : "Error"}
        >
          {feedback.text}
        </Alert>
      )}

      {/* Upcoming sessions */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-bold text-ink">
          Upcoming Sessions ({upcomingSessions.length})
        </h2>

        {upcomingSessions.length === 0 ? (
          <Card className="p-6 text-center bg-paper border border-rule">
            <p className="text-sm text-ink-2">You have no upcoming sessions scheduled.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingSessions.map((s) => {
              const datePart = formatDate(s.startsAt);
              const timeRange = formatISTSlotRange(s.startsAt, s.endsAt);

              return (
                <Card key={s.bookingId} className="p-5 border border-rule bg-surface space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-serif font-bold text-ink">
                        {s.tierName}
                      </h3>
                      <p className="text-sm text-ink-2 mt-0.5">
                        Student: <span className="font-semibold text-ink">{s.studentFirstName}</span>
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>

                  <div className="rounded bg-paper border border-rule p-3 font-mono text-xs text-ink space-y-1">
                    <div>
                      <strong>Date:</strong> {datePart}
                    </div>
                    <div>
                      <strong>Time:</strong> {timeRange}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-ink-2 block">
                      Meeting Link:
                    </span>
                    {s.meetUrl ? (
                      <p className="font-mono text-xs text-accent break-all">
                        {s.meetUrl}
                      </p>
                    ) : (
                      <p className="text-xs text-warn-text">
                        No meeting link set yet. Please add a Google Meet or Zoom link before the session.
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-rule flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenMeetModal(s.bookingId, s.meetUrl)}
                    >
                      {s.meetUrl ? "Change meeting link" : "Add meeting link"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Past sessions */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-bold text-ink">
          Past Sessions ({pastSessions.length})
        </h2>

        {pastSessions.length === 0 ? (
          <Card className="p-6 text-center bg-paper border border-rule">
            <p className="text-sm text-ink-2">No past sessions.</p>
          </Card>
        ) : (
          <div className="border border-rule rounded-md overflow-hidden bg-surface">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-rule bg-paper text-xs uppercase font-semibold text-ink-2">
                  <th className="p-3">Student</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Date and Time (IST)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Meeting Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {pastSessions.map((s) => (
                  <tr key={s.bookingId} className="hover:bg-paper/50">
                    <td className="p-3 font-medium text-ink">{s.studentFirstName}</td>
                    <td className="p-3 text-ink-2">{s.tierName}</td>
                    <td className="p-3 font-mono text-xs text-ink">
                      {formatDate(s.startsAt)}, {formatISTSlotRange(s.startsAt, s.endsAt)}
                    </td>
                    <td className="p-3"><StatusBadge status={s.status} /></td>
                    <td className="p-3 font-mono text-xs text-ink-2 max-w-[200px] truncate">
                      {s.meetUrl || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Meet URL Modal */}
      <Dialog
        open={!!meetModal}
        onOpenChange={(open) => !open && setMeetModal(null)}
        title="Set Session Meeting Link"
        className="max-w-md"
      >
        <form onSubmit={handleSaveMeetUrl} className="space-y-4">
          <p className="text-xs text-ink-2">
            Enter an HTTPS meeting link (e.g. Google Meet, Zoom, Microsoft Teams). Links are never fetched by the server.
          </p>
          <FormField id="mentor-meet-url" label="Meeting URL (HTTPS)">
            <Input
              id="mentor-meet-url"
              value={meetUrlInput}
              onChange={(e) => setMeetUrlInput(e.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij"
              required
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="quiet" size="sm" onClick={() => setMeetModal(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save meeting link
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
