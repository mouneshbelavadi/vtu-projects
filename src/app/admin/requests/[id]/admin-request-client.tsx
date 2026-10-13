"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  sendQuoteAction,
  declineRequestAction,
  cancelRequestAdminAction,
} from "@/server/requests/admin-actions";

export interface BuilderOption {
  id: string;
  name: string;
  email: string;
}

interface MilestoneInput {
  title: string;
  description: string;
  dueDate: string;
  needsStudentInput: boolean;
  instructions: string;
}

export function QuoteBuilderForm({
  requestId,
  builders,
  initialScope,
  initialTotal,
  initialDeposit,
  initialValidUntil,
  initialDelivery,
  initialBuilderId,
  initialMilestones,
}: {
  requestId: string;
  builders: BuilderOption[];
  initialScope?: string | null;
  initialTotal?: number | null;
  initialDeposit?: number | null;
  initialValidUntil?: string | null;
  initialDelivery?: string | null;
  initialBuilderId?: string | null;
  initialMilestones?: Array<{
    title: string;
    description: string | null;
    due_date: string | null;
    needs_student_input: boolean;
    student_input_text: string | null;
  }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [scope, setScope] = useState(initialScope || "");
  const [totalPrice, setTotalPrice] = useState<number | "">(initialTotal || "");
  const [depositAmount, setDepositAmount] = useState<number | "">(initialDeposit || "");
  const [validUntil, setValidUntil] = useState<string>(
    (initialValidUntil
      ? new Date(initialValidUntil).toISOString().split("T")[0]
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]) || ""
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(
    (initialDelivery
      ? new Date(initialDelivery).toISOString().split("T")[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]) || ""
  );
  const [assignedBuilderId, setAssignedBuilderId] = useState<string>(
    initialBuilderId || (builders[0]?.id || "")
  );

  const [milestones, setMilestones] = useState<MilestoneInput[]>(() => {
    if (initialMilestones && initialMilestones.length >= 2) {
      return initialMilestones.map((m) => ({
        title: m.title,
        description: m.description || "",
        dueDate: (m.due_date ? new Date(m.due_date).toISOString().split("T")[0] : "") || "",
        needsStudentInput: m.needs_student_input,
        instructions: m.student_input_text || "",
      }));
    }
    return [
      {
        title: "Architecture & System Design",
        description: "System block diagram, requirements document, database schema",
        dueDate: "",
        needsStudentInput: true,
        instructions: "Confirm hardware/software tool preferences and base paper selection",
      },
      {
        title: "Core Implementation & Testing",
        description: "Primary modules build, source code, unit testing",
        dueDate: "",
        needsStudentInput: false,
        instructions: "",
      },
      {
        title: "Final Documentation & Deliverables",
        description: "Project report, PPT, setup guide, viva questions and final code archive",
        dueDate: "",
        needsStudentInput: false,
        instructions: "",
      },
    ];
  });

  const addMilestone = () => {
    if (milestones.length >= 8) return;
    setMilestones([
      ...milestones,
      {
        title: `Milestone ${milestones.length + 1}`,
        description: "",
        dueDate: "",
        needsStudentInput: false,
        instructions: "",
      },
    ]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length <= 2) return;
    setMilestones(milestones.filter((_, idx) => idx !== index));
  };

  const updateMilestone = (index: number, patch: Partial<MilestoneInput>) => {
    setMilestones(
      milestones.map((m, idx) => (idx === index ? { ...m, ...patch } : m))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!scope.trim()) {
      setError("Scope description is required.");
      return;
    }
    if (typeof totalPrice !== "number" || totalPrice < 1) {
      setError("Total price must be at least ₹1.");
      return;
    }
    if (typeof depositAmount !== "number" || depositAmount < 1) {
      setError("Deposit amount must be at least ₹1.");
      return;
    }
    if (depositAmount > totalPrice) {
      setError("Deposit amount cannot exceed total price.");
      return;
    }
    if (!assignedBuilderId) {
      setError("Please assign a builder.");
      return;
    }
    if (milestones.length < 2 || milestones.length > 8) {
      setError("Quote must contain between 2 and 8 milestones.");
      return;
    }

    startTransition(async () => {
      try {
        await sendQuoteAction({
          requestId,
          scope,
          totalPriceInr: totalPrice,
          depositAmountInr: depositAmount,
          validUntil,
          expectedDeliveryDate: deliveryDate,
          assignedBuilderId,
          milestones: milestones.map((m) => ({
            title: m.title,
            description: m.description || null,
            dueDate: m.dueDate || null,
            needsStudentInput: m.needsStudentInput,
            instructions: m.instructions || null,
          })),
        });
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to send quote");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-[4px] border border-[#DDD9D0] bg-[#FBE9E7] p-3 text-[13px] text-[#A12B2B]">
          {error}
        </div>
      )}

      {/* Scope */}
      <div>
        <label htmlFor="scope" className="block text-[13px] font-semibold text-[#17191C]">
          Scope of Work <span className="text-[#A12B2B]">*</span>
        </label>
        <p className="mt-0.5 text-[12px] text-[#5F6670]">
          Detailed technical specifications, modules, and deliverables included in this quote.
        </p>
        <textarea
          id="scope"
          rows={5}
          required
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          placeholder="Describe all modules, features, hardware components (if any), and documentation to be delivered..."
          className="mt-1.5 w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-2.5 text-[13px] text-[#17191C] focus:border-[#0B5D4B] focus:outline-none"
        />
      </div>

      {/* Pricing & Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label htmlFor="totalPrice" className="block text-[13px] font-semibold text-[#17191C]">
            Total Price (₹) <span className="text-[#A12B2B]">*</span>
          </label>
          <input
            id="totalPrice"
            type="number"
            min={1}
            required
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
            placeholder="e.g. 5999"
            className="mt-1.5 w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-2 text-[13px] text-[#17191C] focus:border-[#0B5D4B] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="depositAmount" className="block text-[13px] font-semibold text-[#17191C]">
            Deposit Amount (₹) <span className="text-[#A12B2B]">*</span>
          </label>
          <input
            id="depositAmount"
            type="number"
            min={1}
            required
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
            placeholder="e.g. 2000"
            className="mt-1.5 w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-2 text-[13px] text-[#17191C] focus:border-[#0B5D4B] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="validUntil" className="block text-[13px] font-semibold text-[#17191C]">
            Quote Valid Until <span className="text-[#A12B2B]">*</span>
          </label>
          <input
            id="validUntil"
            type="date"
            required
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="mt-1.5 w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-2 text-[13px] text-[#17191C] focus:border-[#0B5D4B] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="deliveryDate" className="block text-[13px] font-semibold text-[#17191C]">
            Expected Delivery Date <span className="text-[#A12B2B]">*</span>
          </label>
          <input
            id="deliveryDate"
            type="date"
            required
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="mt-1.5 w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-2 text-[13px] text-[#17191C] focus:border-[#0B5D4B] focus:outline-none"
          />
        </div>
      </div>

      {/* Assigned Builder */}
      <div>
        <label htmlFor="assignedBuilder" className="block text-[13px] font-semibold text-[#17191C]">
          Assigned Builder <span className="text-[#A12B2B]">*</span>
        </label>
        <p className="mt-0.5 text-[12px] text-[#5F6670]">
          Choose from registered users with the builder role.
        </p>
        <select
          id="assignedBuilder"
          required
          value={assignedBuilderId}
          onChange={(e) => setAssignedBuilderId(e.target.value)}
          className="mt-1.5 w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-2 text-[13px] text-[#17191C] focus:border-[#0B5D4B] focus:outline-none"
        >
          {builders.length === 0 ? (
            <option value="">No builders registered</option>
          ) : (
            builders.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.email})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Milestones List (2 to 8) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-[14px] font-bold text-[#17191C]">Milestones (2 to 8)</h4>
            <p className="text-[12px] text-[#5F6670]">Break down project delivery into trackable stages.</p>
          </div>
          <button
            type="button"
            onClick={addMilestone}
            disabled={milestones.length >= 8}
            className="rounded-[4px] border border-[#DDD9D0] bg-[#FFFFFF] px-3 py-1 text-[12px] font-semibold text-[#0B5D4B] hover:bg-[#FBFAF7] disabled:opacity-50"
          >
            + Add Milestone
          </button>
        </div>

        {milestones.map((m, idx) => (
          <div key={idx} className="rounded-[6px] border border-[#DDD9D0] bg-[#FBFAF7] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#0B5D4B]">Milestone {idx + 1}</span>
              {milestones.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeMilestone(idx)}
                  className="text-[12px] text-[#A12B2B] hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[12px] font-semibold text-[#17191C]">Title</label>
                <input
                  type="text"
                  required
                  value={m.title}
                  onChange={(e) => updateMilestone(idx, { title: e.target.value })}
                  className="mt-1 w-full rounded-[4px] border border-[#DDD9D0] bg-[#FFFFFF] p-1.5 text-[12px] text-[#17191C]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#17191C]">Target Due Date (Optional)</label>
                <input
                  type="date"
                  value={m.dueDate}
                  onChange={(e) => updateMilestone(idx, { dueDate: e.target.value })}
                  className="mt-1 w-full rounded-[4px] border border-[#DDD9D0] bg-[#FFFFFF] p-1.5 text-[12px] text-[#17191C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#17191C]">Description</label>
              <input
                type="text"
                value={m.description}
                onChange={(e) => updateMilestone(idx, { description: e.target.value })}
                placeholder="What will be accomplished in this stage"
                className="mt-1 w-full rounded-[4px] border border-[#DDD9D0] bg-[#FFFFFF] p-1.5 text-[12px] text-[#17191C]"
              />
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={m.needsStudentInput}
                  onChange={(e) => updateMilestone(idx, { needsStudentInput: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-[#DDD9D0] text-[#0B5D4B]"
                />
                <span className="text-[12px] text-[#17191C]">Needs student input</span>
              </label>

              {m.needsStudentInput && (
                <div className="mt-2">
                  <label className="block text-[11px] font-semibold text-[#5F6670]">
                    Required Input Instructions for Student
                  </label>
                  <input
                    type="text"
                    required={m.needsStudentInput}
                    value={m.instructions}
                    onChange={(e) => updateMilestone(idx, { instructions: e.target.value })}
                    placeholder="e.g. Provide chosen base paper or hardware model details"
                    className="mt-1 w-full rounded-[4px] border border-[#DDD9D0] bg-[#FFFFFF] p-1.5 text-[12px] text-[#17191C]"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-[6px] bg-[#0B5D4B] px-5 py-2.5 text-[14px] font-semibold text-[#FFFFFF] hover:bg-[#084A3C] disabled:opacity-50"
        >
          {isPending ? "Sending quote..." : "Save and Send Quote to Student"}
        </button>
      </div>
    </form>
  );
}

export function AdminDeclineDialog({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDecline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        await declineRequestAction({ requestId, reason });
        setOpen(false);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to decline request");
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-[4px] border border-[#DDD9D0] bg-[#FFFFFF] px-3 py-1.5 text-[12px] font-semibold text-[#A12B2B] hover:bg-[#FBE9E7]"
      >
        Decline Request
      </button>
    );
  }

  return (
    <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FBE9E7] p-4 space-y-3">
      <h4 className="text-[14px] font-bold text-[#A12B2B]">Decline Request</h4>
      <p className="text-[12px] text-[#5F6670]">
        This reason will be displayed to the student and sent in the notification email.
      </p>

      {error && <p className="text-[12px] text-[#A12B2B]">{error}</p>}

      <form onSubmit={handleDecline} className="space-y-3">
        <textarea
          rows={3}
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="State reason: e.g. Domain outside our engineering scope, project deadline too short, etc."
          className="w-full rounded-[4px] border border-[#DDD9D0] bg-[#FFFFFF] p-2 text-[12px] text-[#17191C]"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending || !reason.trim()}
            className="rounded-[4px] bg-[#A12B2B] px-3 py-1.5 text-[12px] font-semibold text-[#FFFFFF] hover:bg-[#A12B2B] disabled:opacity-50"
          >
            {isPending ? "Declining..." : "Confirm Decline"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-[4px] border border-[#DDD9D0] bg-[#FFFFFF] px-3 py-1.5 text-[12px] font-semibold text-[#5F6670]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export function AdminCancelDialog({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        await cancelRequestAdminAction({ requestId, note });
        setOpen(false);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to cancel request");
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-[4px] border border-[#DDD9D0] bg-[#FFFFFF] px-3 py-1.5 text-[12px] font-semibold text-[#5F6670] hover:bg-[#FBFAF7]"
      >
        Cancel Request
      </button>
    );
  }

  return (
    <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FBFAF7] p-4 space-y-3">
      <h4 className="text-[14px] font-bold text-[#17191C]">Cancel Request (Admin Action)</h4>
      <p className="text-[12px] text-[#5F6670]">
        Admins can cancel any non-final request with an internal audit note.
      </p>

      {error && <p className="text-[12px] text-[#A12B2B]">{error}</p>}

      <form onSubmit={handleCancel} className="space-y-3">
        <input
          type="text"
          required
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for administrative cancellation"
          className="w-full rounded-[4px] border border-[#DDD9D0] bg-[#FFFFFF] p-2 text-[12px] text-[#17191C]"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending || !note.trim()}
            className="rounded-[4px] bg-[#5F6670] px-3 py-1.5 text-[12px] font-semibold text-[#FFFFFF] hover:bg-[#4A5058] disabled:opacity-50"
          >
            {isPending ? "Cancelling..." : "Confirm Cancellation"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-[4px] border border-[#DDD9D0] bg-[#FFFFFF] px-3 py-1.5 text-[12px] font-semibold text-[#5F6670]"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
