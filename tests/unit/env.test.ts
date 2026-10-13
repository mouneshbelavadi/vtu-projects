import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { validateServerEnv } from "@/server/env";

const SECRET_VARIABLES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "CRON_SECRET",
  "IP_HASH_SALT",
];

function getSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getSourceFiles(full));
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      files.push(full);
    }
  }
  return files;
}

describe("Environment Secrets Isolation", () => {
  it("ensures no file outside src/server references server secrets", () => {
    const srcDir = path.resolve(__dirname, "../../src");
    const allFiles = getSourceFiles(srcDir);
    const violations: { file: string; secret: string }[] = [];

    for (const file of allFiles) {
      const normalizedPath = file.replace(/\\/g, "/");
      const isInsideServer = normalizedPath.includes("/src/server/");
      if (isInsideServer) continue;

      const content = fs.readFileSync(file, "utf-8");
      for (const secret of SECRET_VARIABLES) {
        if (content.includes(secret)) {
          violations.push({ file, secret });
        }
      }
    }

    expect(
      violations,
      `Secrets detected in client or shared code: ${JSON.stringify(violations)}`
    ).toEqual([]);
  });

  describe("Server Environment Validation Rules", () => {
    const validConfig = {
      NEXT_PUBLIC_SITE_URL: "https://projects.vtuadda.com",
      NEXT_PUBLIC_SUPABASE_URL: "https://xyz.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "mock_anon_key",
      SUPABASE_SERVICE_ROLE_KEY: "mock_service_key",
      RESEND_API_KEY: "re_mock_key",
      EMAIL_FROM: "no-reply@projects.vtuadda.com",
      CRON_SECRET: "a_very_long_cron_secret_minimum_32_characters_123",
      IP_HASH_SALT: "a_very_long_ip_hash_salt_minimum_32_characters_123",
    };

    it("accepts valid production configuration", () => {
      const validated = validateServerEnv(validConfig, "production");
      expect(validated.NEXT_PUBLIC_SITE_URL).toBe("https://projects.vtuadda.com");
    });

    it("refuses to start in production if NEXT_PUBLIC_SITE_URL lacks https", () => {
      const badUrl = { ...validConfig, NEXT_PUBLIC_SITE_URL: "http://projects.vtuadda.com" };
      expect(() => validateServerEnv(badUrl, "production")).toThrowError(
        /NEXT_PUBLIC_SITE_URL must start with https in production/
      );
    });

    it("refuses if CRON_SECRET or IP_HASH_SALT is under 32 characters", () => {
      const shortCron = { ...validConfig, CRON_SECRET: "short_secret" };
      expect(() => validateServerEnv(shortCron, "development")).toThrowError(
        /CRON_SECRET must be at least 32 characters/
      );

      const shortSalt = { ...validConfig, IP_HASH_SALT: "short_salt" };
      expect(() => validateServerEnv(shortSalt, "development")).toThrowError(
        /IP_HASH_SALT must be at least 32 characters/
      );
    });

    it("refuses if required variables are missing", () => {
      expect(() => validateServerEnv({}, "production")).toThrowError(
        /Environment validation failed/
      );
    });
  });
});
