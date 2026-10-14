import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { AdminTicketsClient } from "./admin-tickets-client";
import type { Ticket } from "@/types/database";

export const metadata: Metadata = {
  title: "Support Tickets | Admin | VTU Adda Projects",
  description: "View and manage customer support requests and account deletion requests.",
};

export default async function AdminTicketsPage() {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { data: ticketsData, error } = await adminClient
    .from("tickets")
    .select("id, user_id, email, name, subject, body, order_code, kind, status, internal_note, updated_at, created_at")
    .order("created_at", { ascending: false });

  const tickets: Ticket[] = (ticketsData as Ticket[]) || [];

  return (
    <div className="mx-auto max-w-7xl py-8 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-rule pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">Support Tickets</h1>
          <p className="text-sm text-ink-2">
            Review enquiries, answer student support requests, and process deletion requests.
          </p>
        </div>
      </div>

      <AdminTicketsClient initialTickets={tickets} />
    </div>
  );
}
