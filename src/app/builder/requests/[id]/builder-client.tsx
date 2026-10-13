"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateMilestoneStatusAction,
  markDeliveryAction,
} from "@/server/requests/builder-actions";
import { uploadBuilderFile } from "./actions";
import type { MilestoneStatus } from "@/types/database";

export function MilestoneStatusSelector({
  requestId,
  milestoneId,
  currentStatus,
}: {
  requestId: string;
  milestoneId: string;
  currentStatus: MilestoneStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<MilestoneStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = () => {
    setError(null);
    startTransition(async () => {
      try {
        await updateMilestoneStatusAction({
          requestId,
          milestoneId,
          status,
        });
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to update milestone status");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as MilestoneStatus)}
        className="rounded-[4px] border border-[#DDD9D0] bg-[#FFFFFF] px-2 py-1 text-[12px] text-[#17191C] focus:border-[#0B5D4B] focus:outline-none"
      >
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="awaiting_student">Awaiting Student Input</option>
        <option value="done">Completed (Done)</option>
      </select>

      <button
        onClick={handleUpdate}
        disabled={isPending || status === currentStatus}
        className="rounded-[4px] bg-[#0B5D4B] px-3 py-1 text-[12px] font-semibold text-[#FFFFFF] hover:bg-[#084A3C] disabled:opacity-50"
      >
        {isPending ? "Updating..." : "Update"}
      </button>

      {error && <span className="text-[11px] text-[#A12B2B]">{error}</span>}
    </div>
  );
}

export function DeliverableUploadForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("requestId", requestId);
    formData.append("file", file);

    startTransition(async () => {
      const res = await uploadBuilderFile(formData);
      if (res.success) {
        setSuccess(true);
        setFile(null);
        router.refresh();
      } else {
        setError(res.error || "Upload failed");
      }
    });
  };

  return (
    <form onSubmit={handleUpload} className="rounded-[6px] border border-[#DDD9D0] bg-[#FBFAF7] p-4 space-y-3">
      <h3 className="text-[14px] font-bold text-[#17191C]">Upload Milestone Deliverable</h3>
      <p className="text-[12px] text-[#5F6670]">
        Upload source code archives, partial reports, circuit schematics, or simulation models (ZIP, PDF, DOCX, PPTX, PNG, JPEG, TXT; up to 200 MB).
      </p>

      {error && <p className="text-[12px] text-[#A12B2B]">{error}</p>}
      {success && <p className="text-[12px] text-[#1E6B3C]">File uploaded successfully.</p>}

      <input
        type="file"
        required
        accept=".zip,.pdf,.docx,.pptx,.png,.jpg,.jpeg,.txt"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-[13px] text-[#5F6670] file:mr-4 file:rounded-[4px] file:border-0 file:bg-[#FFFFFF] file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-[#0B5D4B]"
      />

      <button
        type="submit"
        disabled={isPending || !file}
        className="rounded-[4px] bg-[#0B5D4B] px-4 py-2 text-[13px] font-semibold text-[#FFFFFF] hover:bg-[#084A3C] disabled:opacity-50"
      >
        {isPending ? "Uploading deliverable..." : "Upload Deliverable"}
      </button>
    </form>
  );
}

export function MarkDeliveryButton({
  requestId,
  canMark,
}: {
  requestId: string;
  canMark: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleMarkDelivery = () => {
    if (!window.confirm("Are you sure you want to mark final delivery? This will lock deliverables as final, transition project status to delivered, generate the student balance order, and notify the student.")) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await markDeliveryAction({ requestId });
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to mark delivery");
      }
    });
  };

  return (
    <div className="rounded-[6px] border border-[#DDD9D0] bg-[#E6F3EA] p-5 space-y-3">
      <div>
        <h3 className="text-[15px] font-bold text-[#1E6B3C]">Mark Project Delivery</h3>
        <p className="text-[13px] text-[#4A5058]">
          When all milestones and files are complete, click below to release the final package. The student will receive a notification to pay the remaining balance.
        </p>
      </div>

      {error && <p className="text-[13px] text-[#A12B2B]">{error}</p>}

      <button
        onClick={handleMarkDelivery}
        disabled={isPending || !canMark}
        className="rounded-[6px] bg-[#0B5D4B] px-5 py-2.5 text-[14px] font-semibold text-[#FFFFFF] hover:bg-[#084A3C] disabled:opacity-50"
      >
        {isPending ? "Finalizing delivery..." : "Mark Delivery and Notify Student"}
      </button>
    </div>
  );
}
