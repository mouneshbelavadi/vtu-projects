import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { openRequestForReviewAction } from "@/server/requests/admin-actions";
import { formatDate, formatInr } from "@/lib/format";
import {
  QuoteBuilderForm,
  AdminDeclineDialog,
  AdminCancelDialog,
  type BuilderOption,
} from "./admin-request-client";
import { MessageThread } from "@/app/account/requests/[id]/client-components";

export const metadata = {
  title: "Review Custom Request | Admin",
  description: "Review request, manage milestone quotes, and assign builders.",
};

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const adminClient = createAdminClient();

  // 1. Fetch request
  const { data: req, error: reqErr } = await adminClient
    .from("custom_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (reqErr || !req) {
    notFound();
  }

  // Auto-advance submitted -> under_review on opening
  if (req.status === "submitted") {
    await openRequestForReviewAction(req.id);
    req.status = "under_review";
  }

  // 2. Fetch student profile and email
  const { data: studentUser } = await adminClient.auth.admin.getUserById(req.user_id);
  const { data: studentProfile } = await adminClient
    .from("profiles")
    .select("display_name, phone")
    .eq("id", req.user_id)
    .single();

  // 3. Fetch registered builders
  const { data: builderRoles } = await adminClient
    .from("user_roles")
    .select("user_id")
    .eq("role", "builder");

  const builderUserIds = (builderRoles || []).map((r) => r.user_id);
  const { data: builderProfiles } = await adminClient
    .from("profiles")
    .select("id, display_name")
    .in("id", builderUserIds.length > 0 ? builderUserIds : ["00000000-0000-0000-0000-000000000000"]);

  const { data: allAuthUsers } = await adminClient.auth.admin.listUsers();
  const authUserMap = new Map((allAuthUsers?.users || []).map((u) => [u.id, u.email || ""]));

  const builders: BuilderOption[] = (builderProfiles || []).map((bp) => ({
    id: bp.id,
    name: bp.display_name,
    email: authUserMap.get(bp.id) || "",
  }));

  // 4. Fetch milestones, files, messages, audit
  const { data: milestones } = await adminClient
    .from("milestones")
    .select("*")
    .eq("request_id", id)
    .order("position", { ascending: true });

  const { data: files } = await adminClient
    .from("request_files")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  const { data: messages } = await adminClient
    .from("messages")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  const isTerminal = ["completed", "declined", "cancelled"].includes(req.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDD9D0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/requests"
              className="text-[12px] font-semibold text-[#0B5D4B] hover:underline"
            >
              &larr; Back to queue
            </Link>
            <span className="text-[12px] text-[#5F6670]">/</span>
            <span className="text-[12px] uppercase font-bold text-[#5F6670]">{req.status}</span>
          </div>
          <h1 className="mt-1 text-[22px] font-bold text-[#17191C]">{req.title}</h1>
        </div>

        {!isTerminal && (
          <div className="flex items-center gap-3">
            <AdminDeclineDialog requestId={req.id} />
            <AdminCancelDialog requestId={req.id} />
          </div>
        )}
      </div>

      {/* Student Contact Info (Admin Only) */}
      <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-4 text-[13px] grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <span className="text-[#5F6670] block">Student Name</span>
          <span className="font-semibold text-[#17191C]">{studentProfile?.display_name || "Student"}</span>
        </div>
        <div>
          <span className="text-[#5F6670] block">Email</span>
          <span className="font-semibold text-[#17191C]">{studentUser?.user?.email || "-"}</span>
        </div>
        <div>
          <span className="text-[#5F6670] block">Phone</span>
          <span className="font-semibold text-[#17191C]">{studentProfile?.phone || "-"}</span>
        </div>
      </div>

      {/* Problem Brief & Student Requirements */}
      <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-5 space-y-3">
        <h2 className="text-[15px] font-bold text-[#17191C]">Student Brief & Context</h2>
        <div className="text-[13px] leading-relaxed text-[#4A5058] whitespace-pre-wrap rounded-[4px] bg-[#FBFAF7] p-3 border border-[#DDD9D0]">
          {req.brief}
        </div>

        <div className="grid grid-cols-2 gap-4 text-[13px] sm:grid-cols-4 pt-1">
          <div>
            <span className="text-[#5F6670] block">Branch & Sem</span>
            <span className="font-semibold text-[#17191C]">{req.branch} (Sem {req.semester})</span>
          </div>
          <div>
            <span className="text-[#5F6670] block">Scheme</span>
            <span className="font-semibold text-[#17191C]">{req.scheme} Scheme</span>
          </div>
          <div>
            <span className="text-[#5F6670] block">Deadline</span>
            <span className="font-semibold text-[#17191C]">{formatDate(req.deadline)}</span>
          </div>
          <div>
            <span className="text-[#5F6670] block">Budget Target</span>
            <span className="font-semibold text-[#17191C]">{req.budget_inr ? formatInr(req.budget_inr) : "Open"}</span>
          </div>
        </div>

        {files && files.filter((f) => f.kind === "student_reference").length > 0 && (
          <div className="pt-2 border-t border-[#DDD9D0]">
            <span className="text-[12px] font-semibold text-[#5F6670] block mb-1">Reference Files:</span>
            <ul className="space-y-1 text-[13px] text-[#0B5D4B]">
              {files
                .filter((f) => f.kind === "student_reference")
                .map((f) => (
                  <li key={f.id}>• {f.original_name} ({(f.size_bytes / 1024).toFixed(0)} KB)</li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {/* Quote Builder Form */}
      <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-5 space-y-4">
        <h2 className="text-[16px] font-bold text-[#17191C]">Scope & Quote Management</h2>
        <QuoteBuilderForm
          requestId={req.id}
          builders={builders}
          initialScope={req.quote_note}
          initialTotal={req.quote_total_inr}
          initialDeposit={req.quote_deposit_inr}
          initialValidUntil={req.quote_valid_until}
          initialDelivery={req.deadline}
          initialBuilderId={req.assigned_builder_id}
          initialMilestones={milestones || []}
        />
      </div>

      {/* Message Thread (Admin support & dispute oversight) */}
      <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-5">
        <h2 className="mb-4 text-[16px] font-bold text-[#17191C]">Conversation Thread</h2>
        <MessageThread
          requestId={req.id}
          messages={messages || []}
          currentUserId={admin.user.id}
        />
      </div>
    </div>
  );
}
