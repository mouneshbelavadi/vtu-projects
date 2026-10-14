import Link from "next/link";
import { requireBuilder } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { formatDate } from "@/lib/format";
import type { CustomRequestStatus } from "@/types/database";

export const metadata = {
  title: "Builder Workspace | VTU Adda Project Hub",
  description: "Assigned engineering builds and milestone progress.",
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

export default async function BuilderDashboardPage() {
  const authUser = await requireBuilder("/builder");
  const adminClient = createAdminClient();

  // Load only requests assigned strictly to this builder
  const { data: requests } = await adminClient
    .from("custom_requests")
    .select(
      "id, title, status, course_type, branch, semester, scheme, deadline, created_at"
    )
    .eq("assigned_builder_id", authUser.user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#DDD9D0] pb-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#17191C]">Builder Workspace</h1>
          <p className="mt-1 text-[13px] text-[#5F6670]">
            Manage your assigned custom engineering projects, milestone tasks, and deliverable releases.
          </p>
        </div>
        <div>
          <Link
            href="/builder/sessions"
            className="inline-flex items-center text-[13px] font-semibold text-[#0B5D4B] hover:underline"
          >
            Mentoring Sessions &rarr;
          </Link>
        </div>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-8 text-center text-[14px] text-[#5F6670]">
          You have no active project builds assigned right now.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const badge = STATUS_BADGES[r.status] || "bg-[#FBFAF7] text-[#5F6670] border-[#DDD9D0]";

            return (
              <div
                key={r.id}
                className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-5 transition-colors hover:border-[#B9B4A8]"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-[16px] font-bold text-[#17191C]">
                      <Link
                        href={`/builder/requests/${r.id}`}
                        className="hover:text-[#0B5D4B] hover:underline"
                      >
                        {r.title}
                      </Link>
                    </h2>
                    <p className="mt-1 text-[13px] text-[#5F6670]">
                      {r.branch} · Semester {r.semester} ({r.scheme} Scheme) · Target Delivery: {formatDate(r.deadline)}
                    </p>
                  </div>
                  <span
                    className={`inline-block whitespace-nowrap rounded-[4px] border px-2.5 py-1 text-[12px] font-semibold capitalize ${badge}`}
                  >
                    {r.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <Link
                    href={`/builder/requests/${r.id}`}
                    className="rounded-[4px] bg-[#0B5D4B] px-3.5 py-1.5 text-[13px] font-semibold text-[#FFFFFF] hover:bg-[#084A3C]"
                  >
                    Open project workspace &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
