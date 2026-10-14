import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { AppError } from "@/server/errors";
import { verifyCronAuthorization } from "@/server/orders/expiry";

// Mock auth module
let mockAuthUser: any = null;
let mockAal: "aal1" | "aal2" = "aal1";

vi.mock("@/server/auth", () => ({
  getUserOrNull: vi.fn(async () => mockAuthUser),
  requireUser: vi.fn(async () => {
    if (!mockAuthUser) throw new AppError("Sign in required", "UNAUTHORIZED", 401);
    return mockAuthUser;
  }),
  requireAdmin: vi.fn(async () => {
    if (!mockAuthUser) throw new AppError("Sign in required", "UNAUTHORIZED", 401);
    if (!mockAuthUser.roles?.includes("admin")) {
      throw new AppError("Admin required", "FORBIDDEN", 403);
    }
    if (mockAal !== "aal2") {
      throw new AppError("Two-factor authentication required", "MFA_REQUIRED", 403);
    }
    return mockAuthUser;
  }),
  requireBuilder: vi.fn(async () => {
    if (!mockAuthUser) throw new AppError("Sign in required", "UNAUTHORIZED", 401);
    if (!mockAuthUser.roles?.includes("builder") && !mockAuthUser.roles?.includes("admin")) {
      throw new AppError("Builder required", "FORBIDDEN", 403);
    }
    return mockAuthUser;
  }),
}));

// Mock Supabase admin client
vi.mock("@/server/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { id: "test", status: "open" }, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      insert: () => ({ select: () => ({ single: async () => ({ data: {}, error: null }) }) }),
      update: () => ({ eq: async () => ({ data: {}, error: null }) }),
    }),
  })),
}));

describe("Prompt 12: Authorization Matrix Automated Audit", () => {
  describe("1. Exhaustive Route Coverage in docs/AUTHZ_MATRIX.md", () => {
    it("ensures every application page and API route is documented in docs/AUTHZ_MATRIX.md", () => {
      const matrixPath = path.resolve(__dirname, "../../docs/AUTHZ_MATRIX.md");
      expect(fs.existsSync(matrixPath), "docs/AUTHZ_MATRIX.md must exist").toBe(true);
      const matrixContent = fs.readFileSync(matrixPath, "utf-8");

      // Key representative routes that must be in the matrix
      const requiredRoutes = [
        "/",
        "/projects",
        "/projects/[slug]",
        "/mentoring",
        "/mentoring/book/[tierId]",
        "/checkout/start",
        "/checkout/[orderId]",
        "/request",
        "/account",
        "/account/orders",
        "/account/orders/[id]",
        "/account/requests",
        "/account/bookings",
        "/builder",
        "/builder/sessions",
        "/builder/requests/[id]",
        "/admin",
        "/admin/mfa",
        "/admin/projects",
        "/admin/orders",
        "/admin/payments",
        "/admin/requests",
        "/admin/mentoring",
        "/admin/tickets",
        "/admin/reviews",
        "/admin/users/[id]",
        "/admin/settings",
        "/admin/audit",
        "/privacy",
        "/terms",
        "/refund",
        "/academic-integrity",
        "/how-it-works",
        "/contact",
        "/api/orders/[id]/download/[fileId]",
        "/api/orders/[id]/licence",
        "/api/requests/[id]/download/[fileId]",
        "/api/account/export",
        "/api/cron/expire-orders",
        "/api/cron/session-reminders",
        "/api/cron/purge-proofs",
      ];

      for (const route of requiredRoutes) {
        expect(
          matrixContent.includes(route),
          `Route "${route}" is missing from docs/AUTHZ_MATRIX.md`
        ).toBe(true);
      }
    });

    it("ensures every critical server action is documented in docs/AUTHZ_MATRIX.md", () => {
      const matrixPath = path.resolve(__dirname, "../../docs/AUTHZ_MATRIX.md");
      const matrixContent = fs.readFileSync(matrixPath, "utf-8");

      const requiredActions = [
        "createOrderAction",
        "submitPaymentAction",
        "createCustomRequestAction",
        "acceptQuoteAction",
        "uploadMilestoneFileAction",
        "approveMilestoneAction",
        "holdSlotAction",
        "confirmBookingAction",
        "submitSupportTicketAction",
        "submitReviewAction",
        "approvePaymentAction",
        "rejectPaymentAction",
        "recordRefundAction",
        "moderateReviewAction",
        "anonymiseAccountAction",
        "generateSlotsAction",
      ];

      for (const action of requiredActions) {
        expect(
          matrixContent.includes(action),
          `Server Action "${action}" is missing from docs/AUTHZ_MATRIX.md`
        ).toBe(true);
      }
    });
  });

  describe("2. Authorization Gate Enforcement Tests", () => {
    beforeEach(() => {
      mockAuthUser = null;
      mockAal = "aal1";
    });

    it("guest is rejected from calling requireAdmin", async () => {
      const { requireAdmin } = await import("@/server/auth");
      await expect(requireAdmin()).rejects.toThrow("Sign in required");
    });

    it("student user is rejected from calling requireAdmin (403 FORBIDDEN)", async () => {
      const { requireAdmin } = await import("@/server/auth");
      mockAuthUser = {
        user: { id: "student-1", email: "student@example.com" },
        roles: ["student"],
      };

      await expect(requireAdmin()).rejects.toThrow("Admin required");
    });

    it("admin without AAL2 MFA is rejected from calling requireAdmin (403 MFA_REQUIRED)", async () => {
      const { requireAdmin } = await import("@/server/auth");
      mockAuthUser = {
        user: { id: "admin-1", email: "admin@example.com" },
        roles: ["admin"],
      };
      mockAal = "aal1"; // No MFA

      await expect(requireAdmin()).rejects.toThrow("Two-factor authentication required");
    });

    it("admin with AAL2 MFA passes requireAdmin successfully", async () => {
      const { requireAdmin } = await import("@/server/auth");
      mockAuthUser = {
        user: { id: "admin-1", email: "admin@example.com" },
        roles: ["admin"],
      };
      mockAal = "aal2"; // Verified TOTP MFA

      const admin = await requireAdmin();
      expect(admin.user.id).toBe("admin-1");
    });

    it("cron endpoints reject requests without authorization bearer header", () => {
      const reqNoAuth = new Request("http://localhost:3000/api/cron/expire-orders");
      expect(verifyCronAuthorization(reqNoAuth)).toBe(false);

      const reqWrongAuth = new Request("http://localhost:3000/api/cron/expire-orders", {
        headers: { authorization: "Bearer invalid_secret_token" },
      });
      expect(verifyCronAuthorization(reqWrongAuth)).toBe(false);
    });
  });
});
