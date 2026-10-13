import "server-only";
import { z } from "zod";

export function createServerEnvSchema(nodeEnv: string = process.env.NODE_ENV || "development") {
  return z.object({
    NEXT_PUBLIC_SITE_URL: z
      .string()
      .url()
      .refine(
        (url) => {
          if (nodeEnv === "production") {
            return url.startsWith("https://");
          }
          return true;
        },
        {
          message: "NEXT_PUBLIC_SITE_URL must start with https in production",
        }
      ),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
    RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
    EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email address"),
    CRON_SECRET: z.string().min(32, "CRON_SECRET must be at least 32 characters"),
    IP_HASH_SALT: z.string().min(32, "IP_HASH_SALT must be at least 32 characters"),
  });
}

export const serverEnvSchema = createServerEnvSchema();

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function validateServerEnv(
  envInput: Record<string, string | undefined> = process.env,
  nodeEnv: string = process.env.NODE_ENV || "development"
): ServerEnv {
  const schema = createServerEnvSchema(nodeEnv);
  const result = schema.safeParse(envInput);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Environment validation failed: ${errorDetails}`);
  }
  return result.data;
}

export const env = validateServerEnv(process.env, process.env.NODE_ENV);
