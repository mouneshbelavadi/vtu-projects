import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatInr, formatDate } from "@/lib/format";

export const metadata = {
  title: "Orders | Admin",
};

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string;
    type?: string;
    q?: string;
  }>;
}

export default async function AdminOrdersPage({
  searchParams,
}: OrdersPageProps) {
  await requireAdmin();

  const {
    status: statusFilter = "all",
    type: typeFilter = "all",
    q: searchQuery = "",
  } = await searchParams;

  const adminClient = createAdminClient();

  // If search query looks like an email, lookup user ids first
  let userIdsForSearch: string[] | null = null;
  if (searchQuery.includes("@")) {
    const { data: usersData } = await adminClient.auth.admin.listUsers();
    if (usersData?.users) {
      const matched = usersData.users.filter((u) =>
        u.email?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
      userIdsForSearch = matched.map((u) => u.id);
    }
  }

  let query = adminClient
    .from("orders")
    .select(
      `
      id,
      order_code,
      status,
      type,
      total_inr,
      user_id,
      created_at,
      order_items (
        label
      ),
      profiles (
        display_name
      )
    `
    )
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  if (typeFilter && typeFilter !== "all") {
    query = query.eq("type", typeFilter);
  }

  if (searchQuery.trim()) {
    if (userIdsForSearch && userIdsForSearch.length > 0) {
      query = query.in("user_id", userIdsForSearch);
    } else {
      query = query.ilike("order_code", `%${searchQuery.trim()}%`);
    }
  }

  const { data: rawOrders } = await query.limit(100);
  const orders = rawOrders || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Orders</h1>
          <p className="mt-1 text-sm text-ink-2">
            Overview of student kit orders, payment status, and download access.
          </p>
        </div>

        {/* Filters and search */}
        <form method="GET" className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search code or email..."
            className="h-9 px-3 text-xs rounded-md border border-rule bg-surface text-ink focus:outline-accent w-48"
          />
          <select
            name="status"
            defaultValue={statusFilter}
            className="h-9 px-3 text-xs rounded-md border border-rule bg-surface text-ink focus:outline-accent"
          >
            <option value="all">All statuses</option>
            <option value="pending_verification">Pending verification</option>
            <option value="paid">Paid</option>
            <option value="awaiting_payment">Awaiting payment</option>
            <option value="rejected">Rejected</option>
            <option value="refunded">Refunded</option>
            <option value="expired">Expired</option>
          </select>
          <select
            name="type"
            defaultValue={typeFilter}
            className="h-9 px-3 text-xs rounded-md border border-rule bg-surface text-ink focus:outline-accent"
          >
            <option value="all">All types</option>
            <option value="standard">Standard</option>
            <option value="custom">Custom</option>
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
              <TableHead className="w-[130px]">Order</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Kit</TableHead>
              <TableHead className="w-[100px]">Amount</TableHead>
              <TableHead className="w-[90px]">Type</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[120px]">Placed</TableHead>
              <TableHead className="w-[80px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-sm text-ink-3"
                >
                  No orders found matching the filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o: any) => {
                const studentName = o.profiles?.display_name || "Student";
                const kitLabel = o.order_items?.[0]?.label || "Project Kit";

                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs font-semibold text-ink">
                      {o.order_code}
                    </TableCell>
                    <TableCell className="text-sm text-ink truncate max-w-[150px]">
                      {studentName}
                    </TableCell>
                    <TableCell className="text-xs text-ink-2 truncate max-w-[200px]">
                      {kitLabel}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-ink whitespace-nowrap">
                      {formatInr(o.total_inr)}
                    </TableCell>
                    <TableCell className="font-mono text-xs uppercase text-ink-3">
                      {o.type}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          o.status === "paid"
                            ? "success"
                            : o.status === "rejected"
                              ? "danger"
                              : o.status === "refunded"
                                ? "danger"
                                : o.status === "pending_verification"
                                  ? "warn"
                                  : "default"
                        }
                      >
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap text-ink-3">
                      {formatDate(o.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex h-7 items-center justify-center rounded-md border border-rule px-2.5 text-xs font-semibold text-ink transition-colors hover:bg-paper"
                      >
                        Manage
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
