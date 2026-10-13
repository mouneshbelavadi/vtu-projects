import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { formatDate, formatInr } from "@/lib/format";
import type { CustomRequestStatus } from "@/types/database";

export const metadata = {
  title: "Custom Project Requests | Admin",
  description: "Review custom project requests, prepare milestone quotes, and assign builders.",
};

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Submitted", value: "submitted" },
  { label: "Under review", value: "under_review" },
  { label: "Quoted", value: "quoted" },
  { label: "Accepted", value: "accepted" },
  { label: "In progress", value: "in_progress" },
  { label: "Delivered", value: "delivered" },
  { label: "Completed", value: "completed" },
  { label: "Declined", value: "declined" },
  { label: "Cancelled", value: "cancelled" },
];

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

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status: filterStatus = "all" } = await searchParams;
  const adminClient = createAdminClient();

  let query = adminClient
    .from("custom_requests")
    .select("id, title, status, course_type, branch, semester, user_id, quote_total_inr, quote_deposit_inr, created_at")
    .order("created_at", { ascending: false });

  if (filterStatus && filterStatus !== "all") {
    query = query.eq("status", filterStatus);
  }

  const { data: requests, error } = await query;

  // Load profiles for students
  const userIds = Array.from(new Set((requests || []).map((r) => r.user_id)));
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p.display_name]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#17191C]">Custom Project Requests</h1>
          <p className="mt-1 text-[13px] text-[#5F6670]">
            Review student applications, prepare quotes with milestones, and assign builders.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-[#DDD9D0] pb-3">
        {STATUS_FILTERS.map((tab) => {
          const isActive = (tab.value === "all" && !filterStatus) || filterStatus === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/admin/requests${tab.value === "all" ? "" : `?status=${tab.value}`}`}
              className={`rounded-[4px] px-3 py-1.5 text-[12px] font-medium transition-colors ${
                isActive
                  ? "bg-[#0B5D4B] text-[#FFFFFF]"
                  : "bg-[#FBFAF7] text-[#5F6670] hover:bg-[#FBFAF7] hover:text-[#17191C]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF]">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-[#DDD9D0] bg-[#FBFAF7] text-[12px] font-semibold text-[#5F6670]">
            <tr>
              <th className="px-4 py-3">Project Title</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Branch & Sem</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Quote</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DDD9D0]">
            {!requests || requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#5F6670]">
                  No requests found for this filter.
                </td>
              </tr>
            ) : (
              requests.map((r) => {
                const badge = STATUS_BADGES[r.status] || "bg-[#FBFAF7] text-[#5F6670] border-[#DDD9D0]";
                const studentName = profileMap.get(r.user_id) || "Student";

                return (
                  <tr key={r.id} className="hover:bg-[#FBFAF7]">
                    <td className="px-4 py-3 font-semibold text-[#17191C]">
                      <Link
                        href={`/admin/requests/${r.id}`}
                        className="hover:text-[#0B5D4B] hover:underline"
                      >
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#4A5058]">{studentName}</td>
                    <td className="px-4 py-3 text-[#5F6670]">
                      {r.branch} (Sem {r.semester})
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-[4px] border px-2 py-0.5 text-[11px] font-semibold capitalize ${badge}`}
                      >
                        {r.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#17191C]">
                      {r.quote_total_inr ? formatInr(r.quote_total_inr) : "-"}
                    </td>
                    <td className="px-4 py-3 text-[#5F6670]">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/requests/${r.id}`}
                        className="rounded-[4px] border border-[#DDD9D0] bg-[#FFFFFF] px-2.5 py-1 text-[12px] font-semibold text-[#0B5D4B] hover:bg-[#FBFAF7]"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
