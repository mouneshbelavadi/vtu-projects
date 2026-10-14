import "server-only";

import { createAdminClient } from "@/server/supabase/admin";
import { rateLimit } from "@/server/security/rate-limit";
import { hashIp } from "@/server/security/ip";
import { sendEmail } from "@/server/email/send";
import { siteConfig } from "../../../site.config";
import { logger } from "@/server/log";
import type { Ticket, TicketStatus, TicketKind } from "@/types/database";

export interface CreateTicketParams {
  name: string;
  email: string;
  subject: string;
  message: string;
  orderCode?: string | null;
  kind?: TicketKind;
  userId?: string | null;
  ip: string;
  renderedAt: number;
  honeypot?: string | null;
}

export interface CreateTicketResult {
  success: boolean;
  ticketId?: string;
  errorMessage?: string;
}

/**
 * Creates a support or deletion request ticket with anti-bot protections:
 * - Hidden honeypot validation
 * - Minimum submission duration (>= 3 seconds)
 * - Rate limiting: 3 per hour per hashed IP, 5 per day per email
 */
export async function createSupportTicket(
  params: CreateTicketParams
): Promise<CreateTicketResult> {
  const {
    name,
    email,
    subject,
    message,
    orderCode,
    kind = "support",
    userId = null,
    ip,
    renderedAt,
    honeypot,
  } = params;

  // 1. Honeypot check (must be empty)
  if (honeypot && honeypot.trim().length > 0) {
    logger.warn("Support ticket rejected by honeypot", { email });
    return { success: false, errorMessage: "Invalid submission detected." };
  }

  // 2. Minimum fill time check (at least 3 seconds)
  const now = Date.now();
  if (renderedAt && now - renderedAt < 3000) {
    logger.warn("Support ticket rejected due to rapid submission (bot)", { email, elapsedMs: now - renderedAt });
    return { success: false, errorMessage: "Please take your time to complete the form." };
  }

  // 3. Input sanitation and length validations
  const cleanName = (name || "").trim().slice(0, 100);
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanSubject = (subject || "").trim().slice(0, 120);
  const cleanMessage = (message || "").trim().slice(0, 3000);
  const cleanOrderCode = orderCode ? orderCode.trim().toUpperCase().slice(0, 50) : null;

  if (!cleanEmail || !/^.+@.+\..+$/.test(cleanEmail)) {
    return { success: false, errorMessage: "Please provide a valid email address." };
  }

  if (cleanSubject.length < 3) {
    return { success: false, errorMessage: "Subject must be at least 3 characters long." };
  }

  if (cleanMessage.length < 10) {
    return { success: false, errorMessage: "Message must be at least 10 characters long." };
  }

  // 4. Rate limiting: 3/hour per hashed IP
  const hashedIp = hashIp(ip || "127.0.0.1");
  const ipLimit = await rateLimit(`ticket_ip:${hashedIp}`, 3, 3600);
  if (!ipLimit.allowed) {
    return {
      success: false,
      errorMessage: "You have submitted too many requests recently. Please wait an hour before submitting again.",
    };
  }

  // 5. Rate limiting: 5/day per email address
  const emailLimit = await rateLimit(`ticket_email:${cleanEmail}`, 5, 86400);
  if (!emailLimit.allowed) {
    return {
      success: false,
      errorMessage: "Too many messages from this email today. Please contact us again tomorrow.",
    };
  }

  // 6. Insert into database
  const adminClient = createAdminClient();
  const { data: ticket, error: insertError } = await adminClient
    .from("tickets")
    .insert({
      user_id: userId,
      email: cleanEmail,
      name: cleanName,
      subject: cleanSubject,
      body: cleanMessage,
      order_code: cleanOrderCode,
      kind,
      status: "open",
    })
    .select("id")
    .single();

  if (insertError || !ticket) {
    logger.error("Failed to insert support ticket", { error: insertError });
    return { success: false, errorMessage: "Failed to record your support ticket. Please try again." };
  }

  const ticketId = ticket.id;

  // 7. Send confirmation email to user
  try {
    await sendEmail("ticket_received", cleanEmail, {
      recipientName: cleanName || "there",
      ticketId,
      subject: cleanSubject,
      messageSnippet: cleanMessage.slice(0, 300),
      orderCode: cleanOrderCode,
    });
  } catch (err) {
    logger.warn("Failed to send ticket_received email", { ticketId, error: err });
  }

  // 8. Send notification email to admin support
  try {
    const adminEmail = siteConfig.supportEmail || "support@vtuadda.com";
    await sendEmail("ticket_admin", adminEmail, {
      ticketId,
      senderName: cleanName || "Guest",
      senderEmail: cleanEmail,
      subject: cleanSubject,
      messageSnippet: cleanMessage.slice(0, 500),
      orderCode: cleanOrderCode,
      ticketUrl: `${siteConfig.siteUrl || "http://localhost:3000"}/admin/tickets`,
    });
  } catch (err) {
    logger.warn("Failed to send ticket_admin email", { ticketId, error: err });
  }

  return { success: true, ticketId };
}

/**
 * Updates a ticket status and saves internal administrator notes.
 */
export async function updateTicketStatusAndNote(params: {
  ticketId: string;
  status: TicketStatus;
  internalNote?: string | null;
  adminUserId: string;
}): Promise<{ success: boolean; errorMessage?: string }> {
  const { ticketId, status, internalNote, adminUserId } = params;
  const adminClient = createAdminClient();

  // Get current ticket for audit comparison
  const { data: currentTicket, error: fetchErr } = await adminClient
    .from("tickets")
    .select("status, internal_note")
    .eq("id", ticketId)
    .single();

  if (fetchErr || !currentTicket) {
    return { success: false, errorMessage: "Ticket not found." };
  }

  const { error: updateErr } = await adminClient
    .from("tickets")
    .update({
      status,
      internal_note: internalNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  if (updateErr) {
    return { success: false, errorMessage: "Failed to update ticket." };
  }

  // Write audit row
  if (currentTicket.status !== status) {
    await adminClient.from("audit_log").insert({
      actor_id: adminUserId,
      action: "ticket_status_change",
      entity: "ticket",
      entity_id: ticketId,
      details: {
        old_status: currentTicket.status,
        new_status: status,
      },
    });
  }

  return { success: true };
}
