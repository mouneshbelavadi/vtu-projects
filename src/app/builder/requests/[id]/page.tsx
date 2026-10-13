import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBuilder } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { formatDate } from "@/lib/format";
import {
  MilestoneStatusSelector,
  DeliverableUploadForm,
  MarkDeliveryButton,
} from "./builder-client";
import { MessageThread } from "@/app/account/requests/[id]/client-components";
import type { CustomRequestStatus } from "@/types/database";

export const metadata = {
  title: "Build Workspace | Builder",
  description: "Assigned project milestones, deliverables, and collaboration thread.",
};

const STATUS_BADGES: Record<string, string> = {
  submitted: "bg-[#FBFAF7] text-[#5F6670] border-[#DDD9D0]",
  under_review: "bg-[#FFF4D6] text-[#6B4700] border-[#DDD9D0]",
  quoted: "bg-[#E6F3EA] text-[#1E6B3C] border-[#DDD9D0]",
  accepted: "bg-[#E4F0EC] text-[#0B5D4B] border-[#DDD9D0]",
  in_progress: "bg-[#E4F0EC] text-[#0B5D4B] border-[#DDD9D0]",
  delivered: "bg-[#FFF4D6] text-[#6B4700] border-[#DDD9D0]",
  completed: "bg-[#E6F3EA] text-[#1E6B3C] border-[#DDD9D0]",
  declined: "bg-[#FBE9E7] text-[#A12B2B] border-[#DDD9D0]",
  cancelled: "bg-[#FBFAF7] text-[#5F6670] border-[#DDD9D0]",
};

export default async function BuilderRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const builder = await requireBuilder(`/builder/requests/${id}`);
  const adminClient = createAdminClient();

  // 1. Load request strictly assigned to this builder
  const { data: req, error: reqErr } = await adminClient
    .from("custom_requests")
    .select(
      "id, title, brief, status, branch, semester, scheme, course_type, tech_pref, deadline, team_size, assigned_builder_id, user_id, created_at"
    )
    .eq("id", id)
    .eq("assigned_builder_id", builder.user.id)
    .single();

  if (reqErr || !req) {
    notFound();
  }

  // 2. Fetch student's FIRST NAME ONLY (never email, phone, surname, or college)
  const { data: studentProfile } = await adminClient
    .from("profiles")
    .select("display_name")
    .eq("id", req.user_id)
    .single();

  const rawName = studentProfile?.display_name?.trim() || "Student";
  const studentFirstName = rawName.split(/\s+/)[0];

  // 3. Fetch milestones
  const { data: milestones } = await adminClient
    .from("milestones")
    .select("*")
    .eq("request_id", id)
    .order("position", { ascending: true });

  // 4. Fetch files
  const { data: files } = await adminClient
    .from("request_files")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  // 5. Fetch messages
  const { data: messages } = await adminClient
    .from("messages")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  const refFiles = (files || []).filter((f) => f.kind === "student_reference");
  const deliverableFiles = (files || []).filter((f) => f.kind === "deliverable");

  const badge = STATUS_BADGES[req.status] || "bg-[#FBFAF7] text-[#5F6670] border-[#DDD9D0]";
  const canMarkDelivery = req.status === "in_progress" && deliverableFiles.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="border-b border-[#DDD9D0] pb-4">
        <div className="flex items-center gap-2">
          <Link
            href="/builder"
            className="text-[12px] font-semibold text-[#0B5D4B] hover:underline"
          >
            &larr; Back to assigned builds
          </Link>
          <span className="text-[12px] text-[#5F6670]">/</span>
          <span className={`rounded-[4px] border px-2 py-0.5 text-[11px] font-semibold uppercase ${badge}`}>
            {req.status.replace(/_/g, " ")}
          </span>
        </div>
        <h1 className="mt-2 text-[22px] font-bold text-[#17191C]">{req.title}</h1>
        <p className="mt-1 text-[13px] text-[#5F6670]">
          Student: <strong>{studentFirstName}</strong> · Branch: {req.branch} · Semester {req.semester} ({req.scheme} Scheme)
        </p>
      </div>

      {/* Project Brief & Requirements Card */}
      <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-5 space-y-3">
        <h2 className="text-[15px] font-bold text-[#17191C]">Technical Brief & Scope</h2>
        <div className="text-[13px] leading-relaxed text-[#4A5058] whitespace-pre-wrap rounded-[4px] bg-[#FBFAF7] p-3 border border-[#DDD9D0]">
          {req.brief}
        </div>

        <div className="grid grid-cols-2 gap-4 text-[13px] sm:grid-cols-4 pt-1">
          <div>
            <span className="text-[#5F6670] block">Delivery Due</span>
            <span className="font-semibold text-[#17191C]">{formatDate(req.deadline)}</span>
          </div>
          <div>
            <span className="text-[#5F6670] block">Course Type</span>
            <span className="font-semibold text-[#17191C]">{req.course_type.replace(/_/g, " ")}</span>
          </div>
          <div>
            <span className="text-[#5F6670] block">Tech Preference</span>
            <span className="font-semibold text-[#17191C]">{req.tech_pref || "Open"}</span>
          </div>
          <div>
            <span className="text-[#5F6670] block">Team Size</span>
            <span className="font-semibold text-[#17191C]">{req.team_size} Student(s)</span>
          </div>
        </div>

        {refFiles.length > 0 && (
          <div className="pt-2 border-t border-[#DDD9D0]">
            <span className="text-[12px] font-semibold text-[#5F6670] block mb-1">
              Student Reference Files:
            </span>
            <ul className="space-y-1 text-[13px] text-[#0B5D4B]">
              {refFiles.map((rf) => (
                <li key={rf.id}>
                  • {rf.original_name} ({(rf.size_bytes / 1024).toFixed(0)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Milestones Management */}
      <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-5 space-y-4">
        <h2 className="text-[16px] font-bold text-[#17191C]">Milestones Schedule</h2>
        {!milestones || milestones.length === 0 ? (
          <p className="text-[13px] text-[#5F6670]">No milestones defined yet.</p>
        ) : (
          <div className="space-y-4">
            {milestones.map((m) => (
              <div
                key={m.id}
                className="rounded-[6px] border border-[#DDD9D0] bg-[#FBFAF7] p-4 space-y-2"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-[12px] font-bold text-[#0B5D4B]">
                      Milestone {m.position}
                    </span>
                    <h3 className="text-[15px] font-bold text-[#17191C]">{m.title}</h3>
                  </div>
                  <MilestoneStatusSelector
                    requestId={req.id}
                    milestoneId={m.id}
                    currentStatus={m.status}
                  />
                </div>

                {m.description && (
                  <p className="text-[13px] text-[#4A5058]">{m.description}</p>
                )}

                {m.needs_student_input && (
                  <div className="rounded-[4px] border border-[#DDD9D0] bg-[#FFFFFF] p-3 text-[12px]">
                    <span className="font-semibold text-[#5F6670] block">
                      Student Input / Feedback:
                    </span>
                    <p className="mt-1 text-[#17191C] whitespace-pre-wrap">
                      {m.student_input_text || "Waiting for student submission..."}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deliverable Files & Upload */}
      <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-5 space-y-4">
        <h2 className="text-[16px] font-bold text-[#17191C]">Project Deliverables</h2>

        {deliverableFiles.length > 0 ? (
          <ul className="divide-y divide-[#DDD9D0]">
            {deliverableFiles.map((df) => (
              <li key={df.id} className="py-2.5 flex items-center justify-between text-[13px]">
                <div>
                  <span className="font-semibold text-[#17191C]">{df.original_name}</span>
                  <span className="ml-2 text-[12px] text-[#5F6670]">
                    ({(df.size_bytes / 1024).toFixed(0)} KB) · Uploaded {formatDate(df.created_at)}
                  </span>
                </div>
                {df.is_final ? (
                  <span className="rounded-[4px] bg-[#E6F3EA] px-2 py-0.5 text-[11px] font-semibold text-[#1E6B3C]">
                    Final Delivery
                  </span>
                ) : (
                  <span className="rounded-[4px] bg-[#FBFAF7] px-2 py-0.5 text-[11px] font-semibold text-[#5F6670] border border-[#DDD9D0]">
                    Draft Release
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-[#5F6670]">No deliverable files uploaded yet.</p>
        )}

        {req.status === "in_progress" && (
          <DeliverableUploadForm requestId={req.id} />
        )}
      </div>

      {/* Mark Delivery Action */}
      {req.status === "in_progress" && (
        <MarkDeliveryButton
          requestId={req.id}
          canMark={canMarkDelivery}
        />
      )}

      {/* Message Thread */}
      <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-5">
        <h2 className="mb-4 text-[16px] font-bold text-[#17191C]">Discussion with {studentFirstName}</h2>
        <MessageThread
          requestId={req.id}
          messages={messages || []}
          currentUserId={builder.user.id}
        />
      </div>
    </div>
  );
}
