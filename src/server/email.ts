import "server-only";
import { env } from "@/server/env";

export * from "./email/index";

export interface SendSecurityEmailParams {
  to: string[];
  subject: string;
  text: string;
}

/**
 * Server-only email dispatcher for administrative and security notifications.
 * Uses Resend API when RESEND_API_KEY and EMAIL_FROM are configured.
 */
export async function sendSecurityEmail({
  to,
  subject,
  text,
}: SendSecurityEmailParams): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || to.length === 0) {
    return;
  }

  try {
    const emailEndpoint = "https://api.resend.com/emails";
    await fetch(emailEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to,
        subject,
        text,
      }),
    });
  } catch {
    // Non-fatal in development/test environments
  }
}
