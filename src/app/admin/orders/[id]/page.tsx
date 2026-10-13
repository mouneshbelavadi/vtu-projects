import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { formatInr, formatDate } from "@/lib/format";
import {
  ResendEmailButton,
  GrantActionButtons,
} from "./order-admin-actions";

export const metadata = {
  title: "Order Detail | Admin",
};

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  await requireAdmin();
  const { id } = await params;

  const adminClient = createAdminClient();

  const { data: order, error } = await adminClient
    .from("orders")
    .select(
      `
      id,
      order_code,
      status,
      type,
      subtotal_inr,
      discount_inr,
      total_inr,
      created_at,
      updated_at,
      expires_at,
      user_id,
      profiles (
        display_name,
        phone
      ),
      order_items (
        id,
        project_id,
        label,
        price_inr
      ),
      payments (
        id,
        method,
        amount_inr,
        status,
        utr,
        attempt,
        submitted_at,
        verified_at,
        reject_reason,
        created_at
      ),
      download_grants (
        id,
        project_id,
        max_downloads,
        download_count,
        expires_at,
        revoked_at,
        created_at
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !order) {
    notFound();
  }

  // Fetch student email safely
  const { data: userData } = await adminClient.auth.admin.getUserById(order.user_id);
  const studentEmail = userData?.user?.email || "Unknown";
  const profileData: any = order.profiles;
  const studentDisplayName = profileData?.display_name || "Student";
  const studentPhone = profileData?.phone;

  const payments = Array.isArray(order.payments) ? order.payments : [];
  const grants = Array.isArray(order.download_grants) ? order.download_grants : [];
  const items = Array.isArray(order.order_items) ? order.order_items : [];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Back button and Header */}
      <div>
        <Link
          href="/admin/orders"
          className="text-xs font-mono text-ink-3 hover:text-ink transition-colors block mb-2"
        >
          &larr; Back to orders list
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="font-mono text-xs text-ink-3 uppercase tracking-wider">
              Order Management
            </span>
            <h1 className="text-2xl font-serif font-bold text-ink">
              {order.order_code}
            </h1>
            <span className="text-xs text-ink-2 block mt-0.5">
              Placed on {formatDate(order.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant={
                order.status === "paid"
                  ? "success"
                  : order.status === "rejected"
                    ? "danger"
                    : order.status === "refunded"
                      ? "danger"
                      : order.status === "pending_verification"
                        ? "warn"
                        : "default"
              }
            >
              {order.status}
            </Badge>

            <ResendEmailButton
              orderId={order.id}
              isPaid={order.status === "paid"}
            />
          </div>
        </div>
      </div>

      {/* Buyer & Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-ink-3 border-b border-rule pb-2">
            Student Buyer
          </h3>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-ink-2">Name:</span>
              <span className="font-medium text-ink">{studentDisplayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-2">Email:</span>
              <span className="font-mono text-ink">{studentEmail}</span>
            </div>
            {studentPhone && (
              <div className="flex justify-between">
                <span className="text-ink-2">Phone:</span>
                <span className="font-mono text-ink">{studentPhone}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-ink-3 border-b border-rule pb-2">
            Payment Total
          </h3>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-ink-2">Subtotal:</span>
              <span className="font-mono text-ink">{formatInr(order.subtotal_inr)}</span>
            </div>
            {order.discount_inr > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount:</span>
                <span className="font-mono">-{formatInr(order.discount_inr)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm border-t border-rule pt-1 mt-1">
              <span className="text-ink">Total:</span>
              <span className="font-mono text-ink">{formatInr(order.total_inr)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Order Items */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-serif font-bold text-ink">
          Purchased Items
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="w-[120px] text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it: any) => (
              <TableRow key={it.id}>
                <TableCell className="text-sm font-medium text-ink">
                  {it.label}
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-ink text-right">
                  {formatInr(it.price_inr)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Payment Attempts */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-serif font-bold text-ink">
          Payment Attempts
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Attempt</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[140px]">UTR</TableHead>
              <TableHead className="w-[100px]">Amount</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-[80px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-4 text-center text-xs text-ink-3">
                  No payment attempts recorded for this order yet.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs text-ink">
                    #{p.attempt}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.status === "paid"
                          ? "success"
                          : p.status === "rejected"
                            ? "danger"
                            : p.status === "pending_verification"
                              ? "warn"
                              : "default"
                      }
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-ink-2">
                    {p.utr || "None"}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-ink">
                    {formatInr(p.amount_inr)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-ink-3">
                    {p.submitted_at ? formatDate(p.submitted_at) : formatDate(p.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/payments/${p.id}`}
                      className="inline-flex h-7 items-center justify-center rounded-md border border-rule px-2 text-xs font-semibold text-ink hover:bg-paper"
                    >
                      Review
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Download Grants and Quotas */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-serif font-bold text-ink">
          Download Grants & Access Control
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grant ID</TableHead>
              <TableHead className="w-[140px]">Downloads Used</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[140px]">Created</TableHead>
              <TableHead className="w-[180px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-4 text-center text-xs text-ink-3">
                  No download grants created yet. Grants are automatically provisioned upon payment verification.
                </TableCell>
              </TableRow>
            ) : (
              grants.map((g: any) => {
                const isRevoked = !!g.revoked_at;
                const isExpired = !!g.expires_at && new Date(g.expires_at) <= new Date();

                return (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono text-xs text-ink-2 truncate max-w-[120px]">
                      {g.id}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-ink">
                      {g.download_count} of {g.max_downloads}
                    </TableCell>
                    <TableCell>
                      {isRevoked ? (
                        <Badge variant="danger">Revoked</Badge>
                      ) : isExpired ? (
                        <Badge variant="warn">Expired</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-ink-3">
                      {formatDate(g.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <GrantActionButtons
                        grantId={g.id}
                        isRevoked={isRevoked}
                      />
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
