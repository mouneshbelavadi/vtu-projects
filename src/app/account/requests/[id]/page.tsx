import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { formatDate, formatInr } from "@/lib/format";
import {
  QuoteActions,
  MilestoneInputForm,
  DownloadFileButton,
  MessageThread,
} from "./client-components";
import type { CustomRequestStatus } from "@/types/database";

const STATUS_LABELS: Record<CustomRequestStatus, { label: string; badgeClass: string }> = {
  submitted: { label: "Submitted", badgeClass: "bg-[#FBFAF7] text-[#5F6670] border-[#DDD9D0]" },
  under_review: { label: "Under review", badgeClass: "bg-[#FFF4D6] text-[#6B4700] border-[#DDD9D0]" },
  quoted: { label: "Quote ready", badgeClass: "bg-[#E6F3EA] text-[#1E6B3C] border-[#DDD9D0]" },
  accepted: { label: "Accepted", badgeClass: "bg-[#E4F0EC] text-[#0B5D4B] border-[#DDD9D0]" },
  in_progress: { label: "In progress", badgeClass: "bg-[#E4F0EC] text-[#0B5D4B] border-[#DDD9D0]" },
  delivered: { label: "Final files ready (balance due)", badgeClass: "bg-[#FFF4D6] text-[#6B4700] border-[#DDD9D0]" },
  completed: { label: "Completed", badgeClass: "bg-[#E6F3EA] text-[#1E6B3C] border-[#DDD9D0]" },
  declined: { label: "Declined", badgeClass: "bg-[#FBE9E7] text-[#A12B2B] border-[#DDD9D0]" },
  cancelled: { label: "Cancelled", badgeClass: "bg-[#FBFAF7] text-[#5F6670] border-[#DDD9D0]" },
};

const MILESTONE_STATUS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  pending: { label: "Pending", badgeClass: "bg-[#FBFAF7] text-[#5F6670] border-[#DDD9D0]" },
  in_progress: { label: "In progress", badgeClass: "bg-[#E4F0EC] text-[#0B5D4B] border-[#DDD9D0]" },
  awaiting_student: { label: "Awaiting your input", badgeClass: "bg-[#FFF4D6] text-[#6B4700] border-[#DDD9D0]" },
  done: { label: "Completed", badgeClass: "bg-[#E6F3EA] text-[#1E6B3C] border-[#DDD9D0]" },
};

export default async function StudentRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const authUser = await requireUser(`/account/requests/${id}`);
  const adminClient = createAdminClient();

  // Load request strictly scoped to user_id
  const { data: req, error: reqErr } = await adminClient
    .from("custom_requests")
    .select("*")
    .eq("id", id)
    .eq("user_id", authUser.user.id)
    .single();

  if (reqErr || !req) {
    notFound();
  }

  // Load milestones
  const { data: milestones } = await adminClient
    .from("milestones")
    .select("*")
    .eq("request_id", id)
    .order("position", { ascending: true });

  // Load request files
  const { data: files } = await adminClient
    .from("request_files")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  // Load messages
  const { data: messages } = await adminClient
    .from("messages")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  // Check for orders associated with this request (Deposit and Balance)
  const { data: orderItems } = await adminClient
    .from("order_items")
    .select("order_id, label, price_inr, orders (id, status, order_code)")
    .eq("request_id", id);

  const depositItem = orderItems?.find((item) => item.label === "Deposit");
  const balanceItem = orderItems?.find((item) => item.label === "Balance");

  const depositOrder = depositItem?.orders as any;
  const balanceOrder = balanceItem?.orders as any;

  const statusInfo = STATUS_LABELS[req.status as CustomRequestStatus] || {
    label: req.status,
    badgeClass: "bg-[#FBFAF7] text-[#5F6670] border-[#DDD9D0]",
  };

  const isCompleted = req.status === "completed";
  const refFiles = (files || []).filter((f) => f.kind === "student_reference");
  const deliverableFiles = (files || []).filter((f) => f.kind === "deliverable");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Account", href: "/account" },
          { label: "Project requests", href: "/account/requests" },
          { label: req.title },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-[#DDD9D0] pb-5">
        <div>
          <span
            className={`inline-block mb-2 rounded-[4px] border px-2.5 py-0.5 text-[12px] font-semibold ${statusInfo.badgeClass}`}
          >
            {statusInfo.label}
          </span>
          <h1 className="text-[22px] font-bold text-[#17191C]">{req.title}</h1>
          <p className="mt-1 text-[13px] text-[#5F6670]">
            {req.branch} · Semester {req.semester} · {req.scheme} Scheme · Submitted {formatDate(req.created_at)}
          </p>
        </div>
      </div>

      {/* Declined Alert */}
      {req.status === "declined" && req.declined_reason && (
        <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FBE9E7] p-4 text-[14px] text-[#A12B2B]">
          <strong>Request Declined:</strong> {req.declined_reason}
        </div>
      )}

      {/* Quote Banner when quoted */}
      {req.status === "quoted" && req.quote_total_inr && req.quote_deposit_inr && (
        <QuoteActions
          requestId={req.id}
          totalInr={req.quote_total_inr}
          depositInr={req.quote_deposit_inr}
          validUntil={req.quote_valid_until}
        />
      )}

      {/* Deposit Pending Notice */}
      {req.status === "accepted" && depositOrder && depositOrder.status !== "paid" && (
        <div className="rounded-[6px] border border-[#DDD9D0] bg-[#E4F0EC] p-4 text-[14px] text-[#0B5D4B] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <strong>Deposit Payment Required:</strong> Quote accepted. Complete deposit payment to start milestone build.
          </div>
          <Link
            href={`/checkout/${depositOrder.id}`}
            className="inline-block whitespace-nowrap rounded-[4px] bg-[#0B5D4B] px-4 py-2 text-[13px] font-semibold text-[#FFFFFF] hover:bg-[#084A3C]"
          >
            Pay Deposit ({formatInr(req.quote_deposit_inr || 0)})
          </Link>
        </div>
      )}

      {/* Balance Payment Notice */}
      {req.status === "delivered" && balanceOrder && balanceOrder.status !== "paid" && (
        <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FFF4D6] p-4 text-[14px] text-[#6B4700] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <strong>Deliverables Completed:</strong> All milestone files are ready. Pay the remaining balance to unlock downloads.
          </div>
          <Link
            href={`/checkout/${balanceOrder.id}`}
            className="inline-block whitespace-nowrap rounded-[4px] bg-[#0B5D4B] px-4 py-2 text-[13px] font-semibold text-[#FFFFFF] hover:bg-[#084A3C]"
          >
            Pay Balance ({formatInr((req.quote_total_inr || 0) - (req.quote_deposit_inr || 0))})
          </Link>
        </div>
      )}

      {/* Project Specifications Card */}
      <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-5 space-y-4">
        <h2 className="text-[16px] font-bold text-[#17191C]">Project Details</h2>
        <div className="text-[14px] leading-relaxed text-[#4A5058] whitespace-pre-wrap rounded-[4px] bg-[#FBFAF7] p-3 border border-[#DDD9D0]">
          {req.brief}
        </div>

        <div className="grid grid-cols-2 gap-4 text-[13px] sm:grid-cols-4 pt-2">
          <div>
            <span className="text-[#5F6670] block">Target Deadline</span>
            <span className="font-semibold text-[#17191C]">{formatDate(req.deadline)}</span>
          </div>
          <div>
            <span className="text-[#5F6670] block">Team Size</span>
            <span className="font-semibold text-[#17191C]">{req.team_size} Student(s)</span>
          </div>
          <div>
            <span className="text-[#5F6670] block">Course Type</span>
            <span className="font-semibold text-[#17191C]">{req.course_type.replace(/_/g, " ")}</span>
          </div>
          <div>
            <span className="text-[#5F6670] block">Tech Preference</span>
            <span className="font-semibold text-[#17191C]">{req.tech_pref || "Open"}</span>
          </div>
        </div>

        {refFiles.length > 0 && (
          <div className="pt-2 border-t border-[#DDD9D0]">
            <span className="text-[12px] font-semibold text-[#5F6670] block mb-2">
              Attached Reference Files:
            </span>
            <ul className="space-y-1">
              {refFiles.map((rf) => (
                <li key={rf.id} className="text-[13px] text-[#0B5D4B]">
                  • {rf.original_name} ({(rf.size_bytes / 1024).toFixed(0)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Milestones Card */}
      <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-5 space-y-4">
        <h2 className="text-[16px] font-bold text-[#17191C]">Milestones Schedule</h2>
        {!milestones || milestones.length === 0 ? (
          <p className="text-[13px] text-[#5F6670]">
            Milestones will be outlined once your request is reviewed and quoted by engineering.
          </p>
        ) : (
          <div className="space-y-4">
            {milestones.map((m) => {
              const mStatus = MILESTONE_STATUS_LABELS[m.status] || {
                label: m.status,
                badgeClass: "bg-[#FBFAF7] text-[#5F6670] border-[#DDD9D0]",
              };

              return (
                <div
                  key={m.id}
                  className="rounded-[6px] border border-[#DDD9D0] bg-[#FBFAF7] p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="text-[12px] font-bold text-[#0B5D4B]">
                        Milestone {m.position}
                      </span>
                      <h3 className="text-[15px] font-bold text-[#17191C]">{m.title}</h3>
                    </div>
                    <span
                      className={`inline-block self-start rounded-[4px] border px-2 py-0.5 text-[11px] font-semibold ${mStatus.badgeClass}`}
                    >
                      {mStatus.label}
                    </span>
                  </div>

                  {m.description && (
                    <p className="mt-2 text-[13px] text-[#4A5058]">{m.description}</p>
                  )}

                  {m.due_date && (
                    <p className="mt-1 text-[12px] text-[#5F6670]">
                      Target date: {formatDate(m.due_date)}
                    </p>
                  )}

                  {m.needs_student_input && (
                    <MilestoneInputForm
                      requestId={req.id}
                      milestoneId={m.id}
                      initialText={m.student_input_text}
                      instructions={m.description}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deliverables and Final Files */}
      {deliverableFiles.length > 0 && (
        <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-5 space-y-4">
          <h2 className="text-[16px] font-bold text-[#17191C]">Project Deliverables</h2>
          <div className="divide-y divide-[#DDD9D0]">
            {deliverableFiles.map((df) => (
              <div
                key={df.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <div className="text-[14px] font-semibold text-[#17191C]">
                    {df.original_name}
                  </div>
                  <div className="text-[12px] text-[#5F6670]">
                    {(df.size_bytes / 1024).toFixed(0)} KB · Uploaded {formatDate(df.created_at)}
                    {df.is_final && <span className="ml-2 font-semibold text-[#0B5D4B]">· Final Release</span>}
                  </div>
                </div>

                <DownloadFileButton
                  requestId={req.id}
                  fileId={df.id}
                  filename={df.original_name}
                  isFinal={df.is_final}
                  isUnlocked={isCompleted}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Thread */}
      <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-5">
        <MessageThread
          requestId={req.id}
          messages={messages || []}
          currentUserId={authUser.user.id}
        />
      </div>
    </div>
  );
}
