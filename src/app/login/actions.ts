"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/server/supabase/server";
import { rateLimit } from "@/server/security/rate-limit";
import { getClientIp, hashIp } from "@/server/security/ip";
import { validateSafeRedirect } from "@/server/security/redirect";

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
});

const verifyCodeSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
  code: z
    .string()
    .trim()
    .length(6, "Enter the 6-digit code sent to your email"),
  next: z.string().optional(),
});

export type RequestCodeState = {
  status: "idle" | "success" | "error";
  message?: string;
  email?: string;
};

export async function requestLoginCode(
  _prevState: RequestCodeState,
  formData: FormData
): Promise<RequestCodeState> {
  const parse = emailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parse.success) {
    return {
      status: "error",
      message: parse.error.issues[0]?.message || "Enter a valid email address",
    };
  }

  const email = parse.data.email;
  const headerList = await headers();
  const rawIp = getClientIp(headerList);
  const ipHash = hashIp(rawIp);

  // Rate limits: 5 code requests per email per hour, 20 per hashed IP per hour
  const [emailRate, ipRate] = await Promise.all([
    rateLimit(`auth_email_${email}`, 5, 3600),
    rateLimit(`auth_ip_${ipHash}`, 20, 3600),
  ]);

  if (!emailRate.allowed || !ipRate.allowed) {
    const resetTime = Math.max(emailRate.resetAt, ipRate.resetAt);
    const minutesLeft = Math.max(1, Math.ceil((resetTime - Date.now()) / 60000));
    return {
      status: "error",
      message: `Too many sign-in code requests. Please wait ${minutesLeft} minutes before trying again.`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    return {
      status: "error",
      message: "Could not send the sign-in code. Please try again shortly.",
    };
  }

  return {
    status: "success",
    email,
    message: "A 6-digit code has been sent to your email. Check your inbox.",
  };
}

export type VerifyCodeState = {
  status: "idle" | "error";
  message?: string;
};

export async function verifyLoginCode(
  _prevState: VerifyCodeState,
  formData: FormData
): Promise<VerifyCodeState> {
  const parse = verifyCodeSchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
    next: formData.get("next"),
  });

  if (!parse.success) {
    return {
      status: "error",
      message: parse.error.issues[0]?.message || "Invalid submission",
    };
  }

  const { email, code, next: rawNext } = parse.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (error) {
    return {
      status: "error",
      message: "The code is incorrect or has expired. Please request a new code.",
    };
  }

  const safeTarget = validateSafeRedirect(rawNext, "/");
  redirect(safeTarget);
}
