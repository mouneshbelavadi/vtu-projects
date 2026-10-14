import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/auth";
import { createClient } from "@/server/supabase/server";
import { formatISTSlotRange, formatDate } from "@/lib/format";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { RequestCancellationButton } from "./client-components";
import type { BookingStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "My Mentoring Bookings | VTU Adda Project Hub",
  description: "View and manage your scheduled one-to-one mentoring sessions.",
};

const plainStatusMap: Record<BookingStatus, { label: string; variant: BadgeVariant }> = {
  awaiting_payment: { label: "Waiting for payment", variant: "warn" },
  pending_verification: { label: "We are checking your payment", variant: "warn" },
  confirmed: { label: "Confirmed", variant: "success" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "default" },
  refunded: { label: "Refunded", variant: "danger" },
};

export default async function AccountBookingsPage() {
  const authUser = await requireUser("/account/bookings");
  const supabase = await createClient();

  const { data: rawBookings } = await supabase
    .from("bookings")
    .select(`
      id,
      status,
      meet_url,
      notes,
      created_at,
      cancelled_reason,
      order_id,
      orders ( id, order_code, status, total_inr ),
      mentoring_tiers ( name, session_minutes ),
      mentor_slots ( starts_at, ends_at )
    `)
    .eq("user_id", authUser.user.id)
    .order("created_at", { ascending: false });

  const bookings = rawBookings || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-rule pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            My Mentoring Bookings
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            View your upcoming and past one-to-one mentoring sessions.
          </p>
        </div>
        <div>
          <LinkButton href="/mentoring" variant="primary" size="sm">
            Book another session
          </LinkButton>
        </div>
      </div>

      {bookings.length === 0 ? (
        <Card className="p-8 text-center bg-paper border border-rule">
          <p className="text-sm text-ink-2 mb-4">
            You do not have any mentoring bookings yet.
          </p>
          <LinkButton href="/mentoring" variant="primary" size="sm">
            View available sessions
          </LinkButton>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const tier = b.mentoring_tiers as unknown as { name?: string; session_minutes?: number } | null;
            const slot = b.mentor_slots as unknown as { starts_at?: string; ends_at?: string } | null;
            const order = b.orders as unknown as { id?: string; order_code?: string; status?: string } | null;

            const tierName = tier?.name || "Mentoring Session";
            const sessionDate = slot?.starts_at ? formatDate(slot.starts_at) : "";
            const timeRange = slot?.starts_at && slot?.ends_at
              ? formatISTSlotRange(slot.starts_at, slot.ends_at)
              : "IST";
            const fullDateTime = `${sessionDate}, ${timeRange}`;

            const statusConfig = plainStatusMap[b.status as BookingStatus] || {
              label: b.status,
              variant: "default" as BadgeVariant,
            };

            const isConfirmed = b.status === "confirmed";
            const isAwaitingPayment = b.status === "awaiting_payment";
            const isCanCancel = b.status === "confirmed" || b.status === "pending_verification" || b.status === "awaiting_payment";

            return (
              <Card key={b.id} className="p-5 border border-rule bg-surface space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <h2 className="text-base font-serif font-bold text-ink">
                      {tierName}
                    </h2>
                    <p className="text-sm font-mono text-ink-2 mt-0.5">
                      {fullDateTime}
                    </p>
                    {order?.order_code && (
                      <p className="text-xs text-ink-3 mt-0.5">
                        Order reference: {order.order_code}
                      </p>
                    )}
                  </div>
                  <div>
                    <Badge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>

                {/* Meeting Link: Display ONLY when booking is confirmed */}
                {isConfirmed && (
                  <div className="rounded-md border border-rule bg-paper p-3 text-sm">
                    <span className="font-semibold text-ink block mb-1">
                      Meeting link:
                    </span>
                    {b.meet_url ? (
                      <a
                        href={b.meet_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="font-mono text-accent hover:underline break-all"
                      >
                        {b.meet_url}
                      </a>
                    ) : (
                      <span className="text-ink-2">
                        Your mentor will post the meeting link here before the session starts.
                      </span>
                    )}
                  </div>
                )}

                {!isConfirmed && isAwaitingPayment && (
                  <div className="flex items-center justify-between border-t border-rule pt-3">
                    <p className="text-xs text-ink-3">
                      Complete payment to lock in your session reservation.
                    </p>
                    <LinkButton
                      href={`/checkout/${order?.id || b.order_id}`}
                      variant="primary"
                      size="sm"
                    >
                      Pay now
                    </LinkButton>
                  </div>
                )}

                {b.cancelled_reason && (
                  <div className="text-xs text-ink-3">
                    <strong>Cancellation reason:</strong> {b.cancelled_reason}
                  </div>
                )}

                {/* Actions */}
                {isCanCancel && (
                  <div className="flex justify-end border-t border-rule pt-3">
                    <RequestCancellationButton
                      bookingId={b.id}
                      tierName={tierName}
                      sessionTimeIst={fullDateTime}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
