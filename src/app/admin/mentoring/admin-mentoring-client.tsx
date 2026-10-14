"use client";

import { useState } from "react";
import {
  createTierAction,
  updateTierAction,
  toggleTierActiveAction,
  generateSlotsAction,
  deleteSlotAction,
  updateBookingMeetingLinkAction,
  markBookingCompletedAction,
  cancelBookingAdminAction,
} from "@/server/mentoring/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog } from "@/components/ui/dialog";
import { formatInr, formatISTSlotRange, formatDate } from "@/lib/format";
import type { MentoringTier, MentorSlot, Booking, BookingStatus } from "@/types/database";

export interface MentorOption {
  id: string;
  displayName: string;
}

export interface AdminBookingItem {
  id: string;
  status: BookingStatus;
  meet_url: string | null;
  cancelled_reason: string | null;
  studentFirstName: string;
  tierName: string;
  slotStartTime: string;
  slotEndTime: string;
}

interface AdminMentoringClientProps {
  initialTiers: MentoringTier[];
  initialSlots: (MentorSlot & { mentorName: string })[];
  initialBookings: AdminBookingItem[];
  mentors: MentorOption[];
}

export function AdminMentoringClient({
  initialTiers,
  initialSlots,
  initialBookings,
  mentors,
}: AdminMentoringClientProps) {
  const [activeTab, setActiveTab] = useState<"tiers" | "slots" | "bookings">("bookings");

  // State for messages
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Slot generation form state
  const [selectedMentor, setSelectedMentor] = useState(mentors[0]?.id || "");
  const [slotDate, setSlotDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("13:00");
  const [slotMinutes, setSlotMinutes] = useState<"30" | "45" | "60">("60");
  const [isGeneratingSlots, setIsGeneratingSlots] = useState(false);

  // Tier form state
  const [isCreatingTier, setIsCreatingTier] = useState(false);
  const [tierName, setTierName] = useState("");
  const [tierDescription, setTierDescription] = useState("");
  const [tierPrice, setTierPrice] = useState("1499");
  const [tierMinutes, setTierMinutes] = useState("45");
  const [isSavingTier, setIsSavingTier] = useState(false);

  // Edit tier modal
  const [editingTier, setEditingTier] = useState<MentoringTier | null>(null);
  const [isUpdatingTier, setIsUpdatingTier] = useState(false);

  // Bookings state & modals
  const [meetLinkModal, setMeetLinkModal] = useState<{ bookingId: string; currentUrl: string } | null>(null);
  const [meetUrlInput, setMeetUrlInput] = useState("");
  const [isSavingMeetUrl, setIsSavingMeetUrl] = useState(false);

  const [cancelModal, setCancelModal] = useState<{ bookingId: string; studentName: string } | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);

  // Filters for bookings
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredBookings = initialBookings.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    return true;
  });

  const handleGenerateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsGeneratingSlots(true);

    const formData = new FormData();
    formData.append("mentorId", selectedMentor);
    formData.append("date", slotDate);
    formData.append("startTime", startTime);
    formData.append("endTime", endTime);
    formData.append("slotMinutes", slotMinutes);

    try {
      const res = await generateSlotsAction(formData);
      if (!res.success) {
        setFeedback({ type: "error", text: res.errorMessage || "Failed to generate slots." });
      } else {
        setFeedback({ type: "success", text: "Slots created successfully." });
      }
    } catch {
      setFeedback({ type: "error", text: "An error occurred while creating slots." });
    } finally {
      setIsGeneratingSlots(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to delete this open slot?")) return;
    setFeedback(null);
    const res = await deleteSlotAction(slotId);
    if (!res.success) {
      setFeedback({ type: "error", text: res.errorMessage || "Failed to delete slot." });
    } else {
      setFeedback({ type: "success", text: "Slot deleted." });
    }
  };

  const handleCreateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSavingTier(true);

    const formData = new FormData();
    formData.append("name", tierName);
    formData.append("description", tierDescription);
    formData.append("price_inr", tierPrice);
    formData.append("session_minutes", tierMinutes);
    formData.append("active", "true");

    try {
      const res = await createTierAction(formData);
      if (!res.success) {
        setFeedback({ type: "error", text: res.errorMessage || "Failed to create tier." });
      } else {
        setFeedback({ type: "success", text: "Mentoring tier created." });
        setIsCreatingTier(false);
        setTierName("");
        setTierDescription("");
      }
    } finally {
      setIsSavingTier(false);
    }
  };

  const handleUpdateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;
    setFeedback(null);
    setIsUpdatingTier(true);

    const formData = new FormData();
    formData.append("name", editingTier.name);
    formData.append("description", editingTier.description || "");
    formData.append("price_inr", String(editingTier.price_inr));
    formData.append("session_minutes", String(editingTier.session_minutes));
    formData.append("active", editingTier.active ? "true" : "false");

    try {
      const res = await updateTierAction(editingTier.id, formData);
      if (!res.success) {
        setFeedback({ type: "error", text: res.errorMessage || "Failed to update tier." });
      } else {
        setFeedback({ type: "success", text: "Tier updated." });
        setEditingTier(null);
      }
    } finally {
      setIsUpdatingTier(false);
    }
  };

  const handleToggleTier = async (tierId: string, currentActive: boolean) => {
    setFeedback(null);
    const res = await toggleTierActiveAction(tierId, !currentActive);
    if (!res.success) {
      setFeedback({ type: "error", text: res.errorMessage || "Failed to toggle status." });
    } else {
      setFeedback({ type: "success", text: "Tier status updated." });
    }
  };

  const handleSaveMeetUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetLinkModal) return;
    setFeedback(null);
    setIsSavingMeetUrl(true);

    try {
      const res = await updateBookingMeetingLinkAction(meetLinkModal.bookingId, meetUrlInput);
      if (!res.success) {
        setFeedback({ type: "error", text: res.errorMessage || "Failed to update meeting link." });
      } else {
        setFeedback({ type: "success", text: "Meeting link updated." });
        setMeetLinkModal(null);
      }
    } finally {
      setIsSavingMeetUrl(false);
    }
  };

  const handleMarkCompleted = async (bookingId: string) => {
    if (!confirm("Mark this mentoring session as completed?")) return;
    setFeedback(null);
    const res = await markBookingCompletedAction(bookingId);
    if (!res.success) {
      setFeedback({ type: "error", text: res.errorMessage || "Failed to mark completed." });
    } else {
      setFeedback({ type: "success", text: "Session marked as completed." });
    }
  };

  const handleCancelBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModal) return;
    setFeedback(null);
    setIsCancellingBooking(true);

    try {
      const res = await cancelBookingAdminAction(cancelModal.bookingId, cancelReasonInput);
      if (!res.success) {
        setFeedback({ type: "error", text: res.errorMessage || "Failed to cancel booking." });
      } else {
        setFeedback({ type: "success", text: "Booking cancelled and slot freed." });
        setCancelModal(null);
        setCancelReasonInput("");
      }
    } finally {
      setIsCancellingBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-rule space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab("bookings")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "bookings"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-ink-2 hover:text-ink"
          }`}
        >
          Bookings ({initialBookings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("slots")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "slots"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-ink-2 hover:text-ink"
          }`}
        >
          Slots ({initialSlots.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tiers")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "tiers"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-ink-2 hover:text-ink"
          }`}
        >
          Tiers ({initialTiers.length})
        </button>
      </div>

      {feedback && (
        <Alert variant={feedback.type === "success" ? "success" : "error"} title={feedback.type === "success" ? "Success" : "Notice"}>
          {feedback.text}
        </Alert>
      )}

      {/* TAB 1: BOOKINGS */}
      {activeTab === "bookings" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-ink">
                Student Session Bookings
              </h2>
              <p className="text-xs text-ink-2 mt-0.5">
                Displays student first name only to minimize data exposure.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="text-xs text-ink-2">Status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-rule rounded px-2.5 py-1.5 bg-surface text-ink"
              >
                <option value="all">All statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending_verification">Pending verification</option>
                <option value="awaiting_payment">Awaiting payment</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <Card className="p-8 text-center bg-paper border border-rule">
              <p className="text-sm text-ink-2">No bookings matching filter.</p>
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
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {filteredBookings.map((b) => {
                    const timeRange = formatISTSlotRange(b.slotStartTime, b.slotEndTime);
                    const datePart = formatDate(b.slotStartTime);

                    return (
                      <tr key={b.id} className="hover:bg-paper/50 transition-colors">
                        <td className="p-3 font-medium text-ink">
                          {b.studentFirstName}
                        </td>
                        <td className="p-3 text-ink-2">
                          {b.tierName}
                        </td>
                        <td className="p-3 font-mono text-xs text-ink">
                          {datePart}, {timeRange}
                        </td>
                        <td className="p-3">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="p-3 max-w-[200px] truncate">
                          {b.meet_url ? (
                            <span className="font-mono text-xs text-accent" title={b.meet_url}>
                              {b.meet_url}
                            </span>
                          ) : (
                            <span className="text-xs text-ink-3">Not set</span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <Button
                            variant="quiet"
                            size="sm"
                            onClick={() => {
                              setMeetLinkModal({ bookingId: b.id, currentUrl: b.meet_url || "" });
                              setMeetUrlInput(b.meet_url || "");
                            }}
                          >
                            Set link
                          </Button>

                          {b.status === "confirmed" && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleMarkCompleted(b.id)}
                            >
                              Complete
                            </Button>
                          )}

                          {b.status !== "cancelled" && b.status !== "refunded" && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setCancelModal({ bookingId: b.id, studentName: b.studentFirstName });
                                setCancelReasonInput("");
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SLOTS */}
      {activeTab === "slots" && (
        <div className="space-y-8">
          {/* Create slots form */}
          <Card className="p-6 bg-paper border border-rule space-y-4">
            <h2 className="text-base font-serif font-bold text-ink">
              Generate Consecutive Slots
            </h2>
            <p className="text-xs text-ink-2">
              All timings are entered in Indian Standard Time (IST) and stored in UTC. The database prevents any overlapping slots for the same mentor.
            </p>

            <form onSubmit={handleGenerateSlots} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1">Mentor</label>
                <select
                  value={selectedMentor}
                  onChange={(e) => setSelectedMentor(e.target.value)}
                  className="w-full text-xs border border-rule rounded p-2 bg-surface text-ink"
                  required
                >
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>{m.displayName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1">Date (IST)</label>
                <Input
                  type="date"
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1">Start Time (IST)</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1">End Time (IST)</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1">Slot Duration</label>
                <select
                  value={slotMinutes}
                  onChange={(e) => setSlotMinutes(e.target.value as "30" | "45" | "60")}
                  className="w-full text-xs border border-rule rounded p-2 bg-surface text-ink"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>

              <div className="sm:col-span-2 md:col-span-5 flex justify-end pt-2">
                <Button type="submit" variant="primary" size="sm" isLoading={isGeneratingSlots}>
                  Generate consecutive slots
                </Button>
              </div>
            </form>
          </Card>

          {/* Slots list */}
          <div className="space-y-4">
            <h3 className="text-base font-serif font-bold text-ink">
              All Slots ({initialSlots.length})
            </h3>

            {initialSlots.length === 0 ? (
              <Card className="p-8 text-center bg-paper border border-rule">
                <p className="text-sm text-ink-2">No slots created yet.</p>
              </Card>
            ) : (
              <div className="border border-rule rounded-md overflow-hidden bg-surface">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-rule bg-paper text-xs uppercase font-semibold text-ink-2">
                      <th className="p-3">Mentor</th>
                      <th className="p-3">Date (IST)</th>
                      <th className="p-3">Time Range (IST)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {initialSlots.map((s) => {
                      const datePart = formatDate(s.starts_at);
                      const timeRange = formatISTSlotRange(s.starts_at, s.ends_at);

                      return (
                        <tr key={s.id} className="hover:bg-paper/50 transition-colors">
                          <td className="p-3 font-medium text-ink">{s.mentorName}</td>
                          <td className="p-3 text-ink-2">{datePart}</td>
                          <td className="p-3 font-mono text-xs text-ink">{timeRange}</td>
                          <td className="p-3"><StatusBadge status={s.status} /></td>
                          <td className="p-3 text-right">
                            {s.status === "open" ? (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteSlot(s.id)}
                              >
                                Delete
                              </Button>
                            ) : (
                              <span className="text-xs text-ink-3">Locked ({s.status})</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TIERS */}
      {activeTab === "tiers" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-ink">
              Mentoring Tiers
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreatingTier(!isCreatingTier)}
            >
              {isCreatingTier ? "Close form" : "Add new tier"}
            </Button>
          </div>

          {isCreatingTier && (
            <Card className="p-6 bg-paper border border-rule space-y-4">
              <h3 className="text-base font-serif font-bold text-ink">Create Mentoring Tier</h3>
              <form onSubmit={handleCreateTier} className="space-y-4">
                <FormField id="tier-name" label="Tier Name" helpText="Up to 80 characters.">
                  <Input
                    id="tier-name"
                    value={tierName}
                    onChange={(e) => setTierName(e.target.value)}
                    placeholder="e.g. Code Review and Walkthrough"
                    maxLength={80}
                    required
                  />
                </FormField>

                <FormField id="tier-desc" label="Description" helpText="Up to 500 characters.">
                  <Textarea
                    id="tier-desc"
                    value={tierDescription}
                    onChange={(e) => setTierDescription(e.target.value)}
                    placeholder="Explain what the session covers..."
                    maxLength={500}
                    rows={2}
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField id="tier-price" label="Price (INR)">
                    <Input
                      id="tier-price"
                      type="number"
                      min={0}
                      value={tierPrice}
                      onChange={(e) => setTierPrice(e.target.value)}
                      required
                    />
                  </FormField>

                  <FormField id="tier-mins" label="Duration (Minutes)">
                    <Input
                      id="tier-mins"
                      type="number"
                      min={15}
                      max={120}
                      value={tierMinutes}
                      onChange={(e) => setTierMinutes(e.target.value)}
                      required
                    />
                  </FormField>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="quiet" size="sm" onClick={() => setIsCreatingTier(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isSavingTier}>
                    Save tier
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="border border-rule rounded-md overflow-hidden bg-surface">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-rule bg-paper text-xs uppercase font-semibold text-ink-2">
                  <th className="p-3">Name</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Duration</th>
                  <th className="p-3 text-right">Price</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {initialTiers.map((t) => (
                  <tr key={t.id} className="hover:bg-paper/50 transition-colors">
                    <td className="p-3 font-medium text-ink">{t.name}</td>
                    <td className="p-3 text-xs text-ink-2 max-w-[300px]">{t.description || "-"}</td>
                    <td className="p-3 text-right font-mono text-xs">{t.session_minutes}m</td>
                    <td className="p-3 text-right font-mono font-medium">{formatInr(t.price_inr)}</td>
                    <td className="p-3">
                      <Badge variant={t.active ? "success" : "default"}>
                        {t.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <Button
                        variant="quiet"
                        size="sm"
                        onClick={() => setEditingTier(t)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant={t.active ? "danger" : "secondary"}
                        size="sm"
                        onClick={() => handleToggleTier(t.id, t.active)}
                      >
                        {t.active ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Set Meeting Link Dialog */}
      <Dialog
        open={!!meetLinkModal}
        onOpenChange={(open) => !open && setMeetLinkModal(null)}
        title="Set Session Meeting Link"
        className="max-w-md"
      >
        <form onSubmit={handleSaveMeetUrl} className="space-y-4">
          <p className="text-xs text-ink-2">
            Must start with https://. Meeting links are displayed as plain text and never fetched by the server.
          </p>
          <FormField id="meet-url" label="Meeting URL (HTTPS)">
            <Input
              id="meet-url"
              value={meetUrlInput}
              onChange={(e) => setMeetUrlInput(e.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij"
              required
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="quiet" size="sm" onClick={() => setMeetLinkModal(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSavingMeetUrl}>
              Save link
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Cancel Booking Dialog */}
      <Dialog
        open={!!cancelModal}
        onOpenChange={(open) => !open && setCancelModal(null)}
        title="Cancel Booking"
        className="max-w-md"
      >
        <form onSubmit={handleCancelBooking} className="space-y-4">
          <p className="text-xs text-ink-2">
            Cancelling this booking will immediately free the slot back to open for student {cancelModal?.studentName}.
          </p>
          <FormField id="cancel-reason" label="Cancellation reason" helpText="Sent to the student in their cancellation notice email.">
            <Textarea
              id="cancel-reason"
              value={cancelReasonInput}
              onChange={(e) => setCancelReasonInput(e.target.value)}
              placeholder="e.g. Mentor unavailable; slot rescheduled."
              rows={3}
              required
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="quiet" size="sm" onClick={() => setCancelModal(null)}>
              Close
            </Button>
            <Button type="submit" variant="danger" size="sm" isLoading={isCancellingBooking}>
              Cancel booking & free slot
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Tier Dialog */}
      {editingTier && (
        <Dialog
          open={!!editingTier}
          onOpenChange={(open) => !open && setEditingTier(null)}
          title="Edit Mentoring Tier"
          className="max-w-md"
        >
          <form onSubmit={handleUpdateTier} className="space-y-4">
            <FormField id="edit-name" label="Tier Name">
              <Input
                id="edit-name"
                value={editingTier.name}
                onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                maxLength={80}
                required
              />
            </FormField>

            <FormField id="edit-desc" label="Description">
              <Textarea
                id="edit-desc"
                value={editingTier.description || ""}
                onChange={(e) => setEditingTier({ ...editingTier, description: e.target.value })}
                maxLength={500}
                rows={2}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField id="edit-price" label="Price (INR)">
                <Input
                  id="edit-price"
                  type="number"
                  min={0}
                  value={editingTier.price_inr}
                  onChange={(e) => setEditingTier({ ...editingTier, price_inr: Number(e.target.value) })}
                  required
                />
              </FormField>

              <FormField id="edit-mins" label="Duration (Minutes)">
                <Input
                  id="edit-mins"
                  type="number"
                  min={15}
                  max={120}
                  value={editingTier.session_minutes}
                  onChange={(e) => setEditingTier({ ...editingTier, session_minutes: Number(e.target.value) })}
                  required
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="quiet" size="sm" onClick={() => setEditingTier(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isUpdatingTier}>
                Save changes
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
