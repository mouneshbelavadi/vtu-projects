import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  validatePaymentProofBuffer,
  validateCustomReferenceFile,
} from "@/server/storage/file-signatures";

describe("Prompt 12: Input Abuse & Penetration Security Tests", () => {
  describe("1. File Upload Fuzzing & Magic Byte Validation", () => {
    it("rejects zero-byte file buffers", async () => {
      const emptyBuffer = Buffer.alloc(0);
      const proofRes = await validatePaymentProofBuffer(emptyBuffer, "test.png", "image/png");
      expect(proofRes.valid).toBe(false);
      expect(proofRes.errorMessage).toContain("empty");

      const fileRes = await validateCustomReferenceFile(emptyBuffer, "test.pdf", "application/pdf");
      expect(fileRes.valid).toBe(false);
      expect(fileRes.errorMessage).toContain("empty");
    });

    it("rejects executable or script disguised as a PNG image (fake mime/extension)", async () => {
      // Disguised shell script with .png extension
      const maliciousScriptBuffer = Buffer.from("#!/bin/bash\nrm -rf /");
      const res = await validatePaymentProofBuffer(
        maliciousScriptBuffer,
        "avatar.png",
        "image/png"
      );
      expect(res.valid).toBe(false);
      expect(res.errorMessage).toContain("corrupted or unsupported");
    });

    it("rejects HTML / SVG script payload disguised as a PDF document", async () => {
      const htmlPayload = Buffer.from("<script>alert('xss')</script>");
      const res = await validateCustomReferenceFile(
        htmlPayload,
        "document.pdf",
        "application/pdf"
      );
      expect(res.valid).toBe(false);
      expect(res.errorMessage).toContain("signature verification failed");
    });

    it("accepts authentic PNG image matching magic header bytes (89 50 4E 47)", async () => {
      // Valid PNG header bytes
      const validPngHeader = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48,
        0x44, 0x52,
      ]);
      const res = await validatePaymentProofBuffer(
        validPngHeader,
        "receipt.png",
        "image/png"
      );
      expect(res.valid).toBe(true);
    });

    it("accepts authentic PDF matching magic header bytes (%PDF-)", async () => {
      const validPdfHeader = Buffer.from("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj");
      const res = await validateCustomReferenceFile(
        validPdfHeader,
        "proposal.pdf",
        "application/pdf"
      );
      expect(res.valid).toBe(true);
    });
  });

  describe("2. Architecture & Webhook Invariants", () => {
    it("confirms zero payment gateway webhook routes exist (manual UPI architecture)", () => {
      const apiDir = path.resolve(__dirname, "../../src/app/api");
      function findWebhooks(dir: string): string[] {
        let hits: string[] = [];
        if (!fs.existsSync(dir)) return hits;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            hits.push(...findWebhooks(full));
          } else if (
            entry.name.toLowerCase().includes("webhook") ||
            entry.name.toLowerCase().includes("callback")
          ) {
            hits.push(full);
          }
        }
        return hits;
      }

      const webhooks = findWebhooks(apiDir);
      // No payment gateway webhooks (only standard auth/callback if any)
      const paymentWebhooks = webhooks.filter(
        (w) => !w.toLowerCase().includes("auth")
      );
      expect(paymentWebhooks).toEqual([]);
    });

    it("confirms zero string-built raw SQL queries exist in src/server", () => {
      const serverDir = path.resolve(__dirname, "../../src/server");
      function scanDirForRawSql(dir: string): string[] {
        let violations: string[] = [];
        if (!fs.existsSync(dir)) return violations;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            violations.push(...scanDirForRawSql(full));
          } else if (entry.isFile() && entry.name.endsWith(".ts")) {
            const content = fs.readFileSync(full, "utf-8");
            // Check for raw SQL interpolation patterns like `SELECT ... FROM ... ${...}`, `INSERT INTO ... ${...}`, etc.
            if (/`\s*(SELECT\s+[\s\S]*?\s+FROM\s+|INSERT\s+INTO\s+|UPDATE\s+\w+\s+SET\s+|DELETE\s+FROM\s+)[^`]*?\$\{/i.test(content)) {
              violations.push(full);
            }
          }
        }
        return violations;
      }

      const rawSqlOccurrences = scanDirForRawSql(serverDir);
      expect(rawSqlOccurrences).toEqual([]);
    });
  });
});
