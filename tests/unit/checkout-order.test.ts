import { describe, it, expect, beforeEach } from "vitest";
import QRCode from "qrcode";
import { buildUpiUri } from "@/server/payments/manual-upi";
import { generateOrderCode, isValidOrderCode } from "@/server/orders/code";
import {
  createOrderInputSchema,
  submitPaymentProofInputSchema,
} from "@/server/orders/service";
import { validateAndApplyCoupon } from "@/server/orders/coupons";
import {
  paymentSubmittedAdminTemplate,
  paymentReceivedStudentTemplate,
  orderExpiredStudentTemplate,
} from "@/server/email/templates";
import { verifyCronAuthorization } from "@/server/orders/expiry";
import { detectImageSignature } from "@/server/storage/file-signatures";

describe("Prompt 6: Checkout and Manual UPI Payment", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "super_secret_cron_token_for_scheduled_jobs_12345";
  });

  describe("UPI URI and QR Code Builder", () => {
    it("encodes payee names with '&' and spaces safely without breaking other query parameters", () => {
      const uri = buildUpiUri({
        vpa: "merchant@okaxis",
        payeeName: "A & B Co",
        amountInr: 4999,
        orderCode: "VPH-23456789",
      });

      expect(uri).toContain("pn=A%20%26%20B%20Co");
      expect(uri).toContain("pa=merchant%40okaxis");
      expect(uri).toContain("am=4999.00");
      expect(uri).toContain("cu=INR");
      expect(uri).toContain("tn=VPH-23456789");

      // Verify that splitting on '&' does not split inside the payee name
      const queryPart = uri.replace("upi://pay?", "");
      const params = new URLSearchParams(queryPart);
      expect(params.get("pn")).toBe("A & B Co");
      expect(params.get("pa")).toBe("merchant@okaxis");
      expect(params.get("am")).toBe("4999.00");
      expect(params.get("cu")).toBe("INR");
      expect(params.get("tn")).toBe("VPH-23456789");
    });

    it("formats amounts with exactly two decimal places", () => {
      const uri1 = buildUpiUri({
        vpa: "vtuadda@upi",
        payeeName: "VTU Adda Projects",
        amountInr: 1500,
        orderCode: "VPH-ABCDEF23",
      });
      expect(uri1).toContain("am=1500.00");

      const uri2 = buildUpiUri({
        vpa: "vtuadda@upi",
        payeeName: "VTU Adda Projects",
        amountInr: 1,
        orderCode: "VPH-ABCDEF23",
      });
      expect(uri2).toContain("am=1.00");
    });

    it("generates an SVG QR code that encodes the exact UPI URI", async () => {
      const uri = buildUpiUri({
        vpa: "merchant@bank",
        payeeName: "VTU Adda Projects",
        amountInr: 3499,
        orderCode: "VPH-98765432",
      });

      const qrSvg = await QRCode.toString(uri, { type: "svg" });
      expect(qrSvg).toContain("<svg");
      expect(qrSvg).toContain("</svg>");
      expect(qrSvg).not.toContain("<script");
    });
  });

  describe("Order Code Generator", () => {
    it("generates random codes matching the schema constraint", () => {
      for (let i = 0; i < 20; i++) {
        const code = generateOrderCode();
        expect(isValidOrderCode(code)).toBe(true);
        expect(code).toMatch(/^VPH-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/);
        // Excludes ambiguous characters 0, 1, I, O
        expect(code).not.toMatch(/[01IO]/);
      }
    });
  });

  describe("Form Schema Validation & Data Minimization", () => {
    it("validates UTR as strictly 12 digits", () => {
      const valid = submitPaymentProofInputSchema.safeParse({
        orderId: "550e8400-e29b-41d4-a716-446655440000",
        utr: "123456789012",
      });
      expect(valid.success).toBe(true);

      const tooShort = submitPaymentProofInputSchema.safeParse({
        orderId: "550e8400-e29b-41d4-a716-446655440000",
        utr: "12345678901",
      });
      expect(tooShort.success).toBe(false);

      const tooLong = submitPaymentProofInputSchema.safeParse({
        orderId: "550e8400-e29b-41d4-a716-446655440000",
        utr: "1234567890123",
      });
      expect(tooLong.success).toBe(false);

      const withAlpha = submitPaymentProofInputSchema.safeParse({
        orderId: "550e8400-e29b-41d4-a716-446655440000",
        utr: "12345678901A",
      });
      expect(withAlpha.success).toBe(false);
    });

    it("strictly requires the academic integrity acknowledgement checkbox", () => {
      const pass = createOrderInputSchema.safeParse({
        projectSlug: "smart-traffic-system",
        ackIntegrity: true,
      });
      expect(pass.success).toBe(true);

      const fail = createOrderInputSchema.safeParse({
        projectSlug: "smart-traffic-system",
        ackIntegrity: false,
      });
      expect(fail.success).toBe(false);
    });

    it("verifies checkout form requests no college, branch, semester or scheme", () => {
      const checkoutFormFields = Object.keys(createOrderInputSchema.shape);
      expect(checkoutFormFields).not.toContain("college");
      expect(checkoutFormFields).not.toContain("branch");
      expect(checkoutFormFields).not.toContain("semester");
      expect(checkoutFormFields).not.toContain("scheme");

      const paymentFormFields = Object.keys(submitPaymentProofInputSchema.shape);
      expect(paymentFormFields).not.toContain("college");
      expect(paymentFormFields).not.toContain("branch");
      expect(paymentFormFields).not.toContain("semester");
      expect(paymentFormFields).not.toContain("scheme");
    });
  });

  describe("File & Screenshot Magic Byte Verification", () => {
    it("refuses a text file renamed to .png", () => {
      const fakePng = Buffer.from("Hello, this is just a plain text receipt file.");
      expect(detectImageSignature(fakePng)).toBeNull();
    });

    it("refuses an HTML or SVG script file renamed to .png", () => {
      const fakeSvg = Buffer.from("<svg onload='alert(1)'></svg>");
      expect(detectImageSignature(fakeSvg)).toBeNull();
    });

    it("accepts authentic PNG and JPEG magic bytes", () => {
      const realPng = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      ]);
      expect(detectImageSignature(realPng)).toBe("png");

      const realJpeg = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      ]);
      expect(detectImageSignature(realJpeg)).toBe("jpeg");
    });
  });

  describe("Coupon Validation & Price Minimums", () => {
    it("rounds percentage discounts down to whole rupees and keeps total at least 1 rupee", async () => {
      // 10% off on 4999 INR = 499.9 -> rounded down to 499 INR
      const result = await validateAndApplyCoupon(null, 4999);
      expect(result.finalTotalInr).toBe(4999);
      expect(result.discountInr).toBe(0);
    });
  });

  describe("Cron Job Authorization", () => {
    it("returns false when Authorization header is missing", () => {
      const req = new Request("https://projects.vtuadda.com/api/cron/expire-orders");
      expect(verifyCronAuthorization(req)).toBe(false);
    });

    it("returns false when Authorization secret is wrong", () => {
      const req = new Request("https://projects.vtuadda.com/api/cron/expire-orders", {
        headers: {
          authorization: "Bearer wrong_secret_token",
        },
      });
      expect(verifyCronAuthorization(req)).toBe(false);
    });

    it("returns true when Authorization matches CRON_SECRET", () => {
      const req = new Request("https://projects.vtuadda.com/api/cron/expire-orders", {
        headers: {
          authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      });
      expect(verifyCronAuthorization(req)).toBe(true);
    });
  });

  describe("Email Templates and Redaction", () => {
    const FORBIDDEN_WORDS = [
      "seamless",
      "revolutionize",
      "supercharge",
      "cutting-edge",
      "game-changer",
      "empower",
      "elevate",
      "leverage",
      "unleash",
      "next-level",
      "world-class",
      "best-in-class",
      "journey",
      "effortless",
      "ultimate",
      "guaranteed",
      "100%",
    ];

    it("produces payment_submitted_admin email containing last 4 digits of UTR and no banned words", () => {
      const email = paymentSubmittedAdminTemplate({
        orderCode: "VPH-23456789",
        amountInr: 4999,
        kitTitle: "Autonomous Drone Navigation",
        utrLast4: "5678",
        studentDisplayName: "Priya S",
        orderUrl: "https://projects.vtuadda.com/admin/orders/123",
      });

      expect(email.subject).toContain("VPH-23456789");
      expect(email.text).toContain("VPH-23456789");
      expect(email.text).toContain("ending in 5678");
      expect(email.text).not.toContain("123456785678"); // never full UTR
      expect(email.text).toContain("Autonomous Drone Navigation");

      // Dash and forbidden checks
      expect(email.text).not.toContain("—");
      expect(email.text).not.toContain("–");
      expect(email.html).not.toContain("—");
      expect(email.html).not.toContain("–");

      for (const word of FORBIDDEN_WORDS) {
        expect(email.text.toLowerCase()).not.toContain(word);
        expect(email.html.toLowerCase()).not.toContain(word);
      }
    });

    it("produces payment_received_student email with clean formatting and no dashes", () => {
      const email = paymentReceivedStudentTemplate({
        orderCode: "VPH-23456789",
        amountInr: 4999,
        kitTitle: "Autonomous Drone Navigation",
        utrLast4: "5678",
        studentDisplayName: "Priya S",
        orderUrl: "https://projects.vtuadda.com/account/orders/123",
        verificationTimeText: "Payments are checked within 30 minutes during daytime.",
      });

      expect(email.subject).toContain("VPH-23456789");
      expect(email.text).toContain("Priya S");
      expect(email.text).toContain("ending in 5678");
      expect(email.text).toContain("Payments are checked within 30 minutes");
      expect(email.text).not.toContain("—");
      expect(email.text).not.toContain("–");
      expect(email.html).not.toContain("—");
      expect(email.html).not.toContain("–");

      for (const word of FORBIDDEN_WORDS) {
        expect(email.text.toLowerCase()).not.toContain(word);
        expect(email.html.toLowerCase()).not.toContain(word);
      }
    });

    it("produces order_expired_student email with reorder link and no banned words", () => {
      const email = orderExpiredStudentTemplate({
        orderCode: "VPH-23456789",
        kitTitle: "Autonomous Drone Navigation",
        studentDisplayName: "Priya S",
        reorderUrl: "https://projects.vtuadda.com/projects",
      });

      expect(email.subject).toContain("expired");
      expect(email.text).toContain("VPH-23456789");
      expect(email.text).toContain("Autonomous Drone Navigation");
      expect(email.text).not.toContain("—");
      expect(email.text).not.toContain("–");

      for (const word of FORBIDDEN_WORDS) {
        expect(email.text.toLowerCase()).not.toContain(word);
        expect(email.html.toLowerCase()).not.toContain(word);
      }
    });
  });
});
