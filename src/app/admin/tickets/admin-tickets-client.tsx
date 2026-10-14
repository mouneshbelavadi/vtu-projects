"use client";

import { useState } from "react";
import { updateTicketAdminAction } from "@/server/tickets/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/format";
import type { Ticket, TicketStatus } from "@/types/database";

interface AdminTicketsClientProps {
  initialTickets: Ticket[];
}

export function AdminTicketsClient({ initialTickets }: AdminTicketsClientProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    initialTickets[0]?.id || null
  );

  const [internalNoteInput, setInternalNoteInput] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  // Sync internal note when selected ticket changes
  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
    setInternalNoteInput(ticket.internal_note || "");
    setFeedback(null);
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === "all") return true;
    return t.status === statusFilter;
  });

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    setIsUpdating(true);
    setFeedback(null);

    try {
      const res = await updateTicketAdminAction(
        selectedTicket.id,
        newStatus,
        internalNoteInput
      );
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedTicket.id
              ? { ...t, status: newStatus, internal_note: internalNoteInput }
              : t
          )
        );
        setFeedback({ type: "success", text: `Ticket status updated to ${newStatus}.` });
      } else {
        setFeedback({ type: "error", text: res.errorMessage || "Failed to update status." });
      }
    } catch {
      setFeedback({ type: "error", text: "An error occurred while updating status." });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveInternalNote = async () => {
    if (!selectedTicket) return;
    setIsUpdating(true);
    setFeedback(null);

    try {
      const res = await updateTicketAdminAction(
        selectedTicket.id,
        selectedTicket.status,
        internalNoteInput
      );
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedTicket.id
              ? { ...t, internal_note: internalNoteInput }
              : t
          )
        );
        setFeedback({ type: "success", text: "Internal note saved." });
      } else {
        setFeedback({ type: "error", text: res.errorMessage || "Failed to save note." });
      }
    } catch {
      setFeedback({ type: "error", text: "An error occurred while saving note." });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeVariant = (status: TicketStatus) => {
    switch (status) {
      case "open":
        return "warn";
      case "answered":
        return "accent";
      case "closed":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b border-rule pb-2">
        {["all", "open", "answered", "closed"].map((st) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket List Column */}
        <div className="lg:col-span-5 space-y-2">
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-rule rounded-md text-ink-3 text-sm">
              No tickets found for this filter.
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isSelected = ticket.id === selectedTicketId;
              return (
                <div
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className={`p-4 rounded-md border cursor-pointer transition-all ${
                    isSelected
                      ? "border-accent bg-paper shadow-sm"
                      : "border-rule bg-surface hover:border-rule-strong"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-ink truncate block">
                      {ticket.subject}
                    </span>
                    <Badge variant={getStatusBadgeVariant(ticket.status)}>
                      {ticket.status}
                    </Badge>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs text-ink-2">
                    <span>{ticket.name || ticket.email}</span>
                    <span>{formatDate(ticket.created_at)}</span>
                  </div>

                  {ticket.kind === "deletion_request" && (
                    <div className="mt-2">
                      <span className="text-[11px] font-semibold text-error bg-error/10 px-2 py-0.5 rounded">
                        Account Deletion Request
                      </span>
                    </div>
                  )}

                  {ticket.order_code && (
                    <div className="mt-1 font-mono text-[11px] text-ink-3">
                      Order: {ticket.order_code}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Ticket Detail Column */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <Card className="p-6 border-rule bg-surface space-y-6">
              {feedback && (
                <Alert
                  variant={feedback.type === "success" ? "success" : "error"}
                  title={feedback.type === "success" ? "Success" : "Error"}
                >
                  {feedback.text}
                </Alert>
              )}

              {/* Header Info */}
              <div className="border-b border-rule pb-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-ink">
                      {selectedTicket.subject}
                    </h2>
                    <p className="text-xs text-ink-3 font-mono mt-0.5">
                      ID: {selectedTicket.id}
                    </p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(selectedTicket.status)}>
                    {selectedTicket.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                  <div>
                    <span className="text-ink-3 block">From:</span>
                    <span className="font-medium text-ink">
                      {selectedTicket.name || "Guest"} ({selectedTicket.email})
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-3 block">Date:</span>
                    <span className="text-ink font-medium">
                      {formatDate(selectedTicket.created_at)}
                    </span>
                  </div>
                  {selectedTicket.order_code && (
                    <div>
                      <span className="text-ink-3 block">Associated Order:</span>
                      <a
                        href={`/admin/orders/${selectedTicket.order_code}`}
                        className="font-mono text-accent underline font-semibold"
                      >
                        {selectedTicket.order_code}
                      </a>
                    </div>
                  )}
                  {selectedTicket.kind && (
                    <div>
                      <span className="text-ink-3 block">Kind:</span>
                      <span className="text-ink capitalize font-medium">
                        {selectedTicket.kind.replace("_", " ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                  Customer Message
                </h3>
                <div className="bg-paper p-4 rounded-md border border-rule text-sm text-ink leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.body}
                </div>
              </div>

              {/* Action Buttons: Reply by Email & Status */}
              <div className="border-t border-rule pt-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={`mailto:${selectedTicket.email}?subject=${encodeURIComponent(
                      `Re: ${selectedTicket.subject} [Ticket: ${selectedTicket.id.slice(0, 8)}]`
                    )}`}
                    className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
                  >
                    Reply by email
                  </a>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-3">Set Status:</span>
                    {(["open", "answered", "closed"] as TicketStatus[]).map((st) => (
                      <Button
                        key={st}
                        type="button"
                        size="sm"
                        variant={selectedTicket.status === st ? "primary" : "quiet"}
                        disabled={isUpdating || selectedTicket.status === st}
                        onClick={() => handleStatusChange(st)}
                        className="capitalize"
                      >
                        {st}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Internal Admin Note */}
                <div className="space-y-2 pt-2 border-t border-rule">
                  <h3 className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                    Internal Note (Admin only)
                  </h3>
                  <Textarea
                    value={internalNoteInput}
                    onChange={(e) => setInternalNoteInput(e.target.value)}
                    placeholder="Add an internal note or action summary here..."
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="quiet"
                      disabled={isUpdating}
                      onClick={handleSaveInternalNote}
                    >
                      Save note
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="p-12 text-center border border-dashed border-rule rounded-md text-ink-3 text-sm">
              Select a ticket from the left column to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
