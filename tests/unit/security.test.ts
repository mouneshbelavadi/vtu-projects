import { describe, it, expect, beforeEach } from "vitest";
import { assertSameOrigin } from "@/server/security/same-origin";
import { hashIp, getClientIp } from "@/server/security/ip";
import { redactSensitiveData } from "@/server/log";
import { validateInput } from "@/server/security/validate";
import { rateLimit, resetRateLimitStoreForTesting } from "@/server/security/rate-limit";
import { z } from "zod";

describe("Security Utilities", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.IP_HASH_SALT = "test_salt_must_be_at_least_32_characters_long_123456";
    resetRateLimitStoreForTesting();
  });

  describe("assertSameOrigin", () => {
    it("allows safe GET requests without origin header", () => {
      const req = new Request("http://localhost:3000/api/test", { method: "GET" });
      expect(() => assertSameOrigin(req)).not.toThrow();
    });

    it("allows POST with matching Origin header", () => {
      const req = new Request("http://localhost:3000/api/test", {
        method: "POST",
        headers: { origin: "http://localhost:3000" },
      });
      expect(() => assertSameOrigin(req)).not.toThrow();
    });

    it("rejects POST with mismatched Origin header", () => {
      const req = new Request("http://localhost:3000/api/test", {
        method: "POST",
        headers: { origin: "http://malicious-site.com" },
      });
      expect(() => assertSameOrigin(req)).toThrowError(/Cross-site request forgery/);
    });

    it("rejects POST with missing Origin and Referer", () => {
      const req = new Request("http://localhost:3000/api/test", {
        method: "POST",
      });
      expect(() => assertSameOrigin(req)).toThrowError(/Cross-site request forgery/);
    });

    it("allows POST with matching Referer when Origin is absent", () => {
      const req = new Request("http://localhost:3000/api/test", {
        method: "POST",
        headers: { referer: "http://localhost:3000/checkout" },
      });
      expect(() => assertSameOrigin(req)).not.toThrow();
    });
  });

  describe("hashIp and getClientIp", () => {
    it("hashes IP consistently using HMAC-SHA256", () => {
      const hash1 = hashIp("192.168.1.1");
      const hash2 = hashIp("192.168.1.1");
      const hashDiff = hashIp("192.168.1.2");

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hashDiff);
      expect(hash1).toHaveLength(64);
    });

    it("extracts client IP from x-forwarded-for header", () => {
      const headers = new Headers();
      headers.set("x-forwarded-for", "203.0.113.195, 70.41.3.18");
      expect(getClientIp(headers)).toBe("203.0.113.195");
    });
  });

  describe("Sensitive Data Redaction in Logger", () => {
    it("redacts sensitive fields like passwords, tokens, keys and emails", () => {
      const payload = {
        username: "testuser",
        password: "SuperSecretPassword123",
        api_key: "key_xyz",
        email: "student@example.com",
        nested: {
          token: "jwt_token_here",
          phone: "+919876543210",
          safeNote: "Hello world",
        },
      };

      const redacted = redactSensitiveData(payload) as Record<string, unknown>;

      expect(redacted.username).toBe("testuser");
      expect(redacted.password).toBe("[REDACTED]");
      expect(redacted.api_key).toBe("[REDACTED]");
      expect(redacted.email).toBe("[REDACTED]");
      const nested = redacted.nested as Record<string, unknown>;
      expect(nested.token).toBe("[REDACTED]");
      expect(nested.phone).toBe("[REDACTED]");
      expect(nested.safeNote).toBe("Hello world");
    });
  });

  describe("validateInput", () => {
    const testSchema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      amount: z.number().positive("Amount must be positive"),
    });

    it("returns typed data on valid input", () => {
      const result = validateInput(testSchema, { name: "VTU Student", amount: 4999 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("VTU Student");
        expect(result.data.amount).toBe(4999);
      }
    });

    it("returns safe field errors on invalid input without internal traces", () => {
      const result = validateInput(testSchema, { name: "A", amount: -10 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.name).toBe("Name must be at least 2 characters");
        expect(result.errors.amount).toBe("Amount must be positive");
      }
    });
  });

  describe("rateLimit", () => {
    it("allows calls up to limit and blocks further calls", async () => {
      const key = "test_action_user_1";
      const res1 = await rateLimit(key, 2, 60);
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(1);

      const res2 = await rateLimit(key, 2, 60);
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(0);

      const res3 = await rateLimit(key, 2, 60);
      expect(res3.allowed).toBe(false);
      expect(res3.remaining).toBe(0);
    });

    it("blocks the sixth code request in an hour (5 per hour limit)", async () => {
      const email = "student@vtuadda.com";
      const key = `auth_email_${email}`;
      const limit = 5;
      const windowSeconds = 3600;

      for (let i = 1; i <= 5; i++) {
        const res = await rateLimit(key, limit, windowSeconds);
        expect(res.allowed).toBe(true);
      }

      // Sixth attempt must be blocked
      const res6 = await rateLimit(key, limit, windowSeconds);
      expect(res6.allowed).toBe(false);
      expect(res6.remaining).toBe(0);
    });
  });
});
