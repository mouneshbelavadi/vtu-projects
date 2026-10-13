import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatInr, formatDate } from "@/lib/format";

export const metadata = {
  title: "Payment Verification Queue | Admin",
};

interface PaymentsPageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
}

function formatAge(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const diffMs = Date.now() - date.getTime();
  if (diffMs <= 0) return "Just now";
  const mins = Math.floor(diffMs / (60 * 1000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function AdminPaymentsQueuePage({
  searchParams,
}: PaymentsPageProps) {
  await requireAdmin();

  const { status: statusFilter = "pending_verification", q: searchQuery = "" } =
    await searchParams;

  const adminClient = createAdminClient();

  // Build query
  let query = adminClient
    .from("payments")
    .select(
      `
      id,
      order_id,
      status,
      amount_inr,
      utr,
      submitted_at,
      created_at,
      attempt,
      orders!inner (
        id,
        order_code,
        user_id,
        profiles (
          display_name
        )
      )
    `
    );

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  if (searchQuery.trim()) {
    query = query.ilike("orders.order_code", `%${searchQuery.trim()}%`);
  }

  // Sort: Oldest first for pending_verification queue
  if (statusFilter === "pending_verification") {
    query = query.order("submitted_at", { ascending: true, nullsFirst: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: rawPayments } = await query.limit(100);
  const payments = rawPayments || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">
            Payment Verification Queue
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            Verify student UPI submissions against bank credits before releasing access.
          </p>
        </div>

        {/* Filter & search controls */}
        <form method="GET" className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search order code..."
            className="h-9 px-3 text-xs rounded-md border border-rule bg-surface text-ink focus:outline-accent w-44"
          />
          <select
            name="status"
            defaultValue={statusFilter}
            className="h-9 px-3 text-xs rounded-md border border-rule bg-surface text-ink focus:outline-accent"
          >
            <option value="pending_verification">Pending verification</option>
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
            <option value="refunded">Refunded</option>
            <option value="awaiting_payment">Awaiting payment</option>
          </select>
          <button
            type="submit"
            className="h-9 px-3 text-xs font-medium rounded-md border border-rule bg-surface hover:bg-paper"
          >
            Filter
          </button>
        </form>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Age</TableHead>
              <TableHead className="w-[130px]">Order</TableHead>
              <TableHead>Student</TableHead>
              <TableHead className="w-[100px]">Amount</TableHead>
              <TableHead className="w-[140px]">UTR</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[90px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-ink-3"
                >
                  {statusFilter === "pending_verification"
                    ? "Verification queue is empty. No payments awaiting check."
                    : "No payment records found matching the criteria."}
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p: any) => {
                const submissionDate = p.submitted_at || p.created_at;
                const ageText = formatAge(submissionDate);
                const orderData = p.orders;
                const studentName =
                  orderData?.profiles?.display_name || "Student";

                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap text-ink-2 font-medium">
                      {ageText}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-ink">
                      {orderData?.order_code || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-ink truncate max-w-[160px]">
                      {studentName}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-ink whitespace-nowrap">
                      {formatInr(p.amount_inr)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-ink-2">
                      {p.utr ? `...${p.utr.slice(-4)}` : "None"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === "paid"
                            ? "success"
                            : p.status === "rejected"
                              ? "danger"
                              : p.status === "refunded"
                                ? "danger"
                                : p.status === "pending_verification"
                                  ? "warn"
                                  : "default"
                        }
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/payments/${p.id}`}
                        className="inline-flex h-7 items-center justify-center rounded-md border border-rule px-2.5 text-xs font-semibold text-ink transition-colors hover:bg-paper"
                      >
                        Review
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
