import Link from "next/link";
import { requireUser } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { formatDate, formatInr } from "@/lib/format";
import type { CustomRequestStatus } from "@/types/database";

export const metadata = {
  title: "My Project Requests | VTU Adda Project Hub",
  description: "View and track the status of your custom engineering project requests.",
};

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

export default async function AccountRequestsPage() {
  const authUser = await requireUser("/account/requests");
  const adminClient = createAdminClient();

  const { data: requests } = await adminClient
    .from("custom_requests")
    .select(
      "id, title, status, course_type, branch, semester, quote_total_inr, quote_deposit_inr, declined_reason, created_at"
    )
    .eq("user_id", authUser.user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Account", href: "/account" },
          { label: "Project requests" },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDD9D0] pb-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#17191C]">My Project Requests</h1>
          <p className="mt-1 text-[13px] text-[#5F6670]">
            Track quotes, milestone progress, and deliverables for your custom builds.
          </p>
        </div>
        <Link
          href="/request"
          className="inline-flex items-center justify-center rounded-[6px] bg-[#0B5D4B] px-4 py-2 text-[14px] font-semibold text-[#FFFFFF] hover:bg-[#084A3C]"
        >
          Submit new request
        </Link>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-8 text-center">
          <p className="text-[14px] text-[#5F6670]">
            You have not submitted any custom project requests yet.
          </p>
          <div className="mt-4">
            <Link
              href="/request"
              className="inline-block rounded-[6px] bg-[#0B5D4B] px-4 py-2 text-[14px] font-semibold text-[#FFFFFF] hover:bg-[#084A3C]"
            >
              Request a custom project
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const statusInfo = STATUS_LABELS[req.status as CustomRequestStatus] || {
              label: req.status,
              badgeClass: "bg-[#FBFAF7] text-[#5F6670] border-[#DDD9D0]",
            };

            return (
              <div
                key={req.id}
                className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-5 transition-colors hover:border-[#B9B4A8]"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-[16px] font-bold text-[#17191C]">
                      <Link
                        href={`/account/requests/${req.id}`}
                        className="hover:text-[#0B5D4B] hover:underline"
                      >
                        {req.title}
                      </Link>
                    </h2>
                    <p className="mt-1 text-[13px] text-[#5F6670]">
                      {req.branch} · Semester {req.semester} · Submitted {formatDate(req.created_at)}
                    </p>
                  </div>
                  <span
                    className={`inline-block whitespace-nowrap rounded-[4px] border px-2.5 py-1 text-[12px] font-semibold ${statusInfo.badgeClass}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                {req.status === "declined" && req.declined_reason && (
                  <div className="mt-3 rounded-[4px] border border-[#DDD9D0] bg-[#FBE9E7] p-2.5 text-[13px] text-[#A12B2B]">
                    <strong>Reason:</strong> {req.declined_reason}
                  </div>
                )}

                {req.quote_total_inr && (
                  <div className="mt-3 flex items-center gap-4 text-[13px] text-[#4A5058]">
                    <span>
                      Total: <strong>{formatInr(req.quote_total_inr)}</strong>
                    </span>
                    {req.quote_deposit_inr && (
                      <span>
                        Deposit: <strong>{formatInr(req.quote_deposit_inr)}</strong>
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-end">
                  <Link
                    href={`/account/requests/${req.id}`}
                    className="text-[13px] font-semibold text-[#0B5D4B] hover:underline"
                  >
                    View details and milestones &rarr;
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
