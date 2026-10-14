"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getUserOrNull, requireAdmin } from "@/server/auth";
import { getClientIp } from "@/server/security/ip";
import { createSupportTicket, updateTicketStatusAndNote } from "./service";
import type { TicketStatus, TicketKind } from "@/types/database";

export interface SubmitTicketInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  orderCode?: string;
  kind?: TicketKind;
  renderedAt: number;
  honeypot?: string;
}

export async function submitSupportTicketAction(input: SubmitTicketInput) {
  const reqHeaders = await headers();
  const clientIp = getClientIp(reqHeaders);
  const authUser = await getUserOrNull();

  const result = await createSupportTicket({
    name: input.name,
    email: input.email,
    subject: input.subject,
    message: input.message,
    orderCode: input.orderCode,
    kind: input.kind || "support",
    userId: authUser?.user.id || null,
    ip: clientIp,
    renderedAt: input.renderedAt,
    honeypot: input.honeypot,
  });

  return result;
}

export async function updateTicketAdminAction(
  ticketId: string,
  status: TicketStatus,
  internalNote?: string | null
) {
  const admin = await requireAdmin();

  const result = await updateTicketStatusAndNote({
    ticketId,
    status,
    internalNote,
    adminUserId: admin.user.id,
  });

  if (result.success) {
    revalidatePath("/admin/tickets");
  }

  return result;
}
