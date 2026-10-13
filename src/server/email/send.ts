import "server-only";
import fs from "node:fs";
import path from "node:path";
import { env } from "@/server/env";
import { logger } from "@/server/log";
import { rateLimit } from "@/server/security/rate-limit";
import {
  paymentSubmittedAdminTemplate,
  paymentReceivedStudentTemplate,
  orderExpiredStudentTemplate,
  paymentApprovedStudentTemplate,
  paymentRejectedStudentTemplate,
  refundRecordedStudentTemplate,
  requestReceivedTemplate,
  quoteSentTemplate,
  requestDeclinedTemplate,
  milestoneInputNeededTemplate,
  newMessageTemplate,
  finalFilesReadyTemplate,
  requestCompletedTemplate,
  type PaymentSubmittedAdminData,
  type PaymentReceivedStudentData,
  type OrderExpiredStudentData,
  type PaymentApprovedStudentData,
  type PaymentRejectedStudentData,
  type RefundRecordedStudentData,
  type RequestReceivedData,
  type QuoteSentData,
  type RequestDeclinedData,
  type MilestoneInputNeededData,
  type NewMessageData,
  type FinalFilesReadyData,
  type RequestCompletedData,
  type EmailRenderResult,
} from "./templates";

export type EmailTemplateName =
  | "payment_submitted_admin"
  | "payment_received_student"
  | "order_expired_student"
  | "payment_approved_student"
  | "payment_rejected_student"
  | "refund_recorded_student"
  | "request_received"
  | "quote_sent"
  | "request_declined"
  | "milestone_input_needed"
  | "new_message"
  | "final_files_ready"
  | "request_completed";

export interface TemplateDataMap {
  payment_submitted_admin: PaymentSubmittedAdminData;
  payment_received_student: PaymentReceivedStudentData;
  order_expired_student: OrderExpiredStudentData;
  payment_approved_student: PaymentApprovedStudentData;
  payment_rejected_student: PaymentRejectedStudentData;
  refund_recorded_student: RefundRecordedStudentData;
  request_received: RequestReceivedData;
  quote_sent: QuoteSentData;
  request_declined: RequestDeclinedData;
  milestone_input_needed: MilestoneInputNeededData;
  new_message: NewMessageData;
  final_files_ready: FinalFilesReadyData;
  request_completed: RequestCompletedData;
}

export async function sendEmail<T extends EmailTemplateName>(
  template: T,
  to: string | string[],
  data: TemplateDataMap[T],
  userId?: string
): Promise<boolean> {
  try {
    // Rate limit: 20 sends per user/hour
    const rateKey = userId ? `email_send_${userId}` : "email_send_system";
    const rateCheck = await rateLimit(rateKey, 20, 3600);
    if (!rateCheck.allowed) {
      logger.warn("Email dispatch rate limit reached", { template });
      return false;
    }

    let rendered: EmailRenderResult;
    switch (template) {
      case "payment_submitted_admin":
        rendered = paymentSubmittedAdminTemplate(data as PaymentSubmittedAdminData);
        break;
      case "payment_received_student":
        rendered = paymentReceivedStudentTemplate(data as PaymentReceivedStudentData);
        break;
      case "order_expired_student":
        rendered = orderExpiredStudentTemplate(data as OrderExpiredStudentData);
        break;
      case "payment_approved_student":
        rendered = paymentApprovedStudentTemplate(data as PaymentApprovedStudentData);
        break;
      case "payment_rejected_student":
        rendered = paymentRejectedStudentTemplate(data as PaymentRejectedStudentData);
        break;
      case "refund_recorded_student":
        rendered = refundRecordedStudentTemplate(data as RefundRecordedStudentData);
        break;
      case "request_received":
        rendered = requestReceivedTemplate(data as RequestReceivedData);
        break;
      case "quote_sent":
        rendered = quoteSentTemplate(data as QuoteSentData);
        break;
      case "request_declined":
        rendered = requestDeclinedTemplate(data as RequestDeclinedData);
        break;
      case "milestone_input_needed":
        rendered = milestoneInputNeededTemplate(data as MilestoneInputNeededData);
        break;
      case "new_message":
        rendered = newMessageTemplate(data as NewMessageData);
        break;
      case "final_files_ready":
        rendered = finalFilesReadyTemplate(data as FinalFilesReadyData);
        break;
      case "request_completed":
        rendered = requestCompletedTemplate(data as RequestCompletedData);
        break;
      default:
        logger.warn("Unknown email template requested", { template });
        return false;
    }

    const recipients = Array.isArray(to) ? to : [to];
    if (recipients.length === 0) {
      return false;
    }

    // Fallback in development or when RESEND_API_KEY is empty: write to .dev-mail
    if (!env.RESEND_API_KEY) {
      const devMailDir = path.resolve(process.cwd(), ".dev-mail");
      if (!fs.existsSync(devMailDir)) {
        fs.mkdirSync(devMailDir, { recursive: true });
      }

      const fileTimestamp = Date.now();
      const mailFile = path.join(
        devMailDir,
        `${fileTimestamp}-${template}.json`
      );

      const payload = {
        timestamp: new Date().toISOString(),
        template,
        to: recipients,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      };

      fs.writeFileSync(mailFile, JSON.stringify(payload, null, 2), "utf-8");
      logger.info("Email written to .dev-mail folder", { template });
      return true;
    }

    // Live send via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || "onboarding@resend.dev",
        to: recipients,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      }),
    });

    if (!response.ok) {
      logger.warn("Resend API rejected message dispatch", {
        template,
        status: response.status,
      });
      return false;
    }

    return true;
  } catch {
    // Failure never breaks the order
    logger.warn("Email dispatch failed", { template });
    return false;
  }
}

export const dispatchEmail = sendEmail;
