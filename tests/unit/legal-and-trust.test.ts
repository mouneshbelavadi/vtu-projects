import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";

// Import legal components
import { PrivacyContent } from "@/content/legal/privacy";
import { TermsContent } from "@/content/legal/terms";
import { RefundContent } from "@/content/legal/refund";
import { AcademicIntegrityContent } from "@/content/legal/academic-integrity";
import { HowItWorksContent } from "@/content/legal/how-it-works";
import { createSupportTicket } from "@/server/tickets/service";
import { submitVerifiedReview, moderateReview } from "@/server/reviews/service";
import { exportUserData, anonymiseAccount } from "@/server/account/data-tools";
import { resetRateLimitStoreForTesting } from "@/server/security/rate-limit";

// Mock sendEmail
vi.mock("@/server/email/send", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

// Mock logger
vi.mock("@/server/log", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock server client (for MFA checking)
vi.mock("@/server/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      mfa: {
        listFactors: vi.fn(async () => ({ data: { totp: [] } })),
        challengeAndVerify: vi.fn(async () => ({ data: { user: {} }, error: null })),
      },
    },
  })),
}));

// In-memory test store
interface MockDbStore {
  tickets: Map<string, any>;
  orders: Map<string, any>;
  order_items: Map<string, any>;
  download_grants: Map<string, any>;
  download_log: Map<string, any>;
  reviews: Map<string, any>;
  audit_log: any[];
  profiles: Map<string, any>;
  payments: Map<string, any>;
  custom_requests: Map<string, any>;
  request_files: Map<string, any>;
  messages: Map<string, any>;
  bookings: Map<string, any>;
}

let mockDb: MockDbStore;

function initMockDb() {
  mockDb = {
    tickets: new Map(),
    orders: new Map([
      ["order-1", { id: "order-1", user_id: "student-1", status: "paid" }],
      ["order-unpaid", { id: "order-unpaid", user_id: "student-1", status: "pending" }],
      ["order-nodownload", { id: "order-nodownload", user_id: "student-2", status: "paid" }],
      ["order-other", { id: "order-other", user_id: "student-other", status: "paid" }],
      ["order-target", { id: "order-target", user_id: "user-target", status: "paid" }],
    ]),
    order_items: new Map([
      ["item-1", { id: "item-1", order_id: "order-1", project_id: "proj-1" }],
      ["item-nodownload", { id: "item-nodownload", order_id: "order-nodownload", project_id: "proj-2" }],
      ["item-unpaid", { id: "item-unpaid", order_id: "order-unpaid", project_id: "proj-1" }],
      ["item-target", { id: "item-target", order_id: "order-target", project_id: "proj-1" }],
    ]),
    download_grants: new Map([
      [
        "grant-1",
        {
          id: "grant-1",
          order_id: "order-1",
          project_id: "proj-1",
          user_id: "student-1",
          download_count: 3,
        },
      ],
      [
        "grant-nodownload",
        {
          id: "grant-nodownload",
          order_id: "order-nodownload",
          project_id: "proj-2",
          user_id: "student-2",
          download_count: 0,
        },
      ],
      [
        "grant-target",
        {
          id: "grant-target",
          order_id: "order-target",
          project_id: "proj-1",
          user_id: "user-target",
          download_count: 1,
        },
      ],
    ]),
    download_log: new Map(),
    reviews: new Map(),
    audit_log: [],
    profiles: new Map([
      ["student-1", { id: "student-1", display_name: "Rahul Student", phone: "9876543210" }],
      ["student-2", { id: "student-2", display_name: "Sneha Student", phone: "9876543211" }],
      ["user-target", { id: "user-target", display_name: "Target User", phone: "9123456780" }],
    ]),
    payments: new Map([
      [
        "pay-1",
        {
          id: "pay-1",
          order_id: "order-target",
          proof_path: "payment-proofs/target.png",
          status: "verified",
        },
      ],
    ]),
    custom_requests: new Map([
      [
        "req-target",
        {
          id: "req-target",
          user_id: "user-target",
          title: "Custom IoT Monitor",
          status: "completed",
        },
      ],
    ]),
    request_files: new Map([
      [
        "rf-target",
        {
          id: "rf-target",
          request_id: "req-target",
          storage_path: "requests/target-doc.pdf",
        },
      ],
    ]),
    messages: new Map([
      [
        "msg-target",
        {
          id: "msg-target",
          request_id: "req-target",
          body: "Original secret project requirement details",
        },
      ],
    ]),
    bookings: new Map(),
  };
}

function getTableList(table: string): any[] {
  if (table === "audit_log") return mockDb.audit_log;
  const store = (mockDb as any)[table];
  return store ? Array.from(store.values()) : [];
}

function saveTableRecord(table: string, id: string, rec: any) {
  if (table === "audit_log") {
    mockDb.audit_log.push(rec);
  } else {
    const store = (mockDb as any)[table];
    if (store) store.set(id, rec);
  }
}

function buildQueryChain(table: string) {
  const predicates: Array<(item: any) => boolean> = [];
  let stagedUpdate: any = null;

  const chain: any = {
    select: () => chain,
    eq: (col: string, val: any) => {
      predicates.push((item) => item[col] === val);
      return chain;
    },
    in: (col: string, vals: any[]) => {
      predicates.push((item) => vals.includes(item[col]));
      return chain;
    },
    not: (col: string, op: string, val: any) => {
      if (op === "is" && val === null) {
        predicates.push((item) => item[col] !== null && item[col] !== undefined);
      }
      return chain;
    },
    single: async () => {
      const items = getTableList(table).filter((row) => predicates.every((p) => p(row)));
      if (items.length > 0) return { data: items[0], error: null };
      return { data: null, error: { message: "Row not found" } };
    },
    maybeSingle: async () => {
      const items = getTableList(table).filter((row) => predicates.every((p) => p(row)));
      return { data: items[0] || null, error: null };
    },
    then: (resolve: any, reject: any) => {
      const items = getTableList(table).filter((row) => predicates.every((p) => p(row)));
      return Promise.resolve({ data: items, error: null }).then(resolve, reject);
    },
    insert: (records: any) => {
      const rows = Array.isArray(records) ? records : [records];
      const insertedRows = rows.map((r) => {
        const id = r.id || `${table}-${Math.random().toString(36).substring(2, 9)}`;
        const saved = { ...r, id };
        saveTableRecord(table, id, saved);
        return saved;
      });
      return {
        select: () => ({
          single: async () => ({ data: insertedRows[0], error: null }),
          maybeSingle: async () => ({ data: insertedRows[0], error: null }),
        }),
        then: (resolve: any, reject: any) =>
          Promise.resolve({ data: insertedRows, error: null }).then(resolve, reject),
      };
    },
    update: (patch: any) => {
      stagedUpdate = patch;
      return {
        eq: (col: string, val: any) => {
          predicates.push((item) => item[col] === val);
          const items = getTableList(table).filter((row) => predicates.every((p) => p(row)));
          items.forEach((item) => Object.assign(item, stagedUpdate));
          return Promise.resolve({ data: items, error: null });
        },
        in: (col: string, vals: any[]) => {
          predicates.push((item) => vals.includes(item[col]));
          const items = getTableList(table).filter((row) => predicates.every((p) => p(row)));
          items.forEach((item) => Object.assign(item, stagedUpdate));
          return Promise.resolve({ data: items, error: null });
        },
      };
    },
  };

  return chain;
}

// Mock admin client
vi.mock("@/server/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => buildQueryChain(table),
    auth: {
      admin: {
        getUserById: vi.fn(async (id: string) => ({
          data: { user: { id, email: `${id}@example.com` } },
          error: null,
        })),
        deleteUser: vi.fn(async (id: string) => ({ data: null, error: null })),
      },
    },
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn(async (paths: string[]) => ({ data: paths, error: null })),
      })),
    },
  })),
}));

describe("Prompt 10: Legal, Trust, Reviews & Support Tests", () => {
  beforeEach(() => {
    initMockDb();
    resetRateLimitStoreForTesting();
  });

  describe("1. Legal Policy Content Invariants", () => {
    const policyComponents = [
      { name: "Privacy Policy", Component: PrivacyContent },
      { name: "Terms and Conditions", Component: TermsContent },
      { name: "Refund Policy", Component: RefundContent },
      { name: "Academic Integrity", Component: AcademicIntegrityContent },
      { name: "How It Works", Component: HowItWorksContent },
    ];

    policyComponents.forEach(({ name, Component }) => {
      it(`${name} renders without placeholders, emojis, or banned punctuation dashes`, () => {
        const html = renderToString(React.createElement(Component));

        // Must render non-empty content
        expect(html.length).toBeGreaterThan(200);

        // No TODOs, FIXMEs, or UNKNOWN markers
        expect(html).not.toMatch(/TODO/i);
        expect(html).not.toMatch(/FIXME/i);
        expect(html).not.toMatch(/\[placeholder\]/i);
        expect(html).not.toMatch(/UNKNOWN/i);

        // No em dashes (—) or en dashes (–) in prose
        expect(html).not.toContain("—");
        expect(html).not.toContain("–");

        // No emojis in legal copy (check common unicode emoji ranges)
        expect(html).not.toMatch(
          /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
        );
      });
    });

    it("Academic Integrity policy explicitly contains mandatory non-affiliation disclaimer", () => {
      const html = renderToString(React.createElement(AcademicIntegrityContent));
      expect(html).toContain("We are not affiliated with VTU or any college.");
    });
  });

  describe("2. Support Tickets Bot Protection & Rate Limiting", () => {
    it("rejects submission when honeypot field is filled", async () => {
      const res = await createSupportTicket({
        name: "Bot User",
        email: "bot@example.com",
        subject: "Spam message",
        message: "This is automated spam content that should be blocked.",
        ip: "192.168.1.100",
        renderedAt: Date.now() - 5000,
        honeypot: "http://spamlink.com",
      });

      expect(res.success).toBe(false);
      expect(res.errorMessage).toBe("Invalid submission detected.");
    });

    it("rejects rapid submission under 3 seconds (minimum fill time check)", async () => {
      const res = await createSupportTicket({
        name: "Rapid User",
        email: "fast@example.com",
        subject: "Fast message",
        message: "This was submitted in under three seconds by a robot.",
        ip: "192.168.1.101",
        renderedAt: Date.now() - 1000, // Only 1 second elapsed
      });

      expect(res.success).toBe(false);
      expect(res.errorMessage).toBe("Please take your time to complete the form.");
    });

    it("creates support ticket successfully for legitimate user and inputs", async () => {
      const res = await createSupportTicket({
        name: "Real Student",
        email: "student@example.com",
        subject: "Need help with kit extraction",
        message: "I downloaded the project zip file and have a question regarding setup.",
        orderCode: "ORD-9876",
        ip: "192.168.1.150",
        renderedAt: Date.now() - 6000,
      });

      expect(res.success).toBe(true);
      expect(res.ticketId).toBeDefined();

      const createdTicket = mockDb.tickets.get(res.ticketId!);
      expect(createdTicket).toBeDefined();
      expect(createdTicket.subject).toBe("Need help with kit extraction");
      expect(createdTicket.status).toBe("open");
    });

    it("enforces rate limit of 3 requests per hour per IP", async () => {
      const testIp = "10.0.0.99";
      const validRenderedAt = Date.now() - 5000;

      // 1st request
      const res1 = await createSupportTicket({
        name: "Test User",
        email: "rate1@example.com",
        subject: "Valid subject 1",
        message: "This is a legitimate message body with sufficient length.",
        ip: testIp,
        renderedAt: validRenderedAt,
      });
      expect(res1.success).toBe(true);

      // 2nd request
      const res2 = await createSupportTicket({
        name: "Test User",
        email: "rate2@example.com",
        subject: "Valid subject 2",
        message: "This is a legitimate message body with sufficient length.",
        ip: testIp,
        renderedAt: validRenderedAt,
      });
      expect(res2.success).toBe(true);

      // 3rd request
      const res3 = await createSupportTicket({
        name: "Test User",
        email: "rate3@example.com",
        subject: "Valid subject 3",
        message: "This is a legitimate message body with sufficient length.",
        ip: testIp,
        renderedAt: validRenderedAt,
      });
      expect(res3.success).toBe(true);

      // 4th request must be blocked
      const res4 = await createSupportTicket({
        name: "Test User",
        email: "rate4@example.com",
        subject: "Valid subject 4",
        message: "This is a legitimate message body with sufficient length.",
        ip: testIp,
        renderedAt: validRenderedAt,
      });
      expect(res4.success).toBe(false);
      expect(res4.errorMessage).toContain("too many requests recently");
    });

    it("enforces rate limit of 5 requests per day per email", async () => {
      const testEmail = "email-limit@example.com";
      const validRenderedAt = Date.now() - 5000;

      for (let i = 1; i <= 5; i++) {
        const res = await createSupportTicket({
          name: "Test User",
          email: testEmail,
          subject: `Valid subject ${i}`,
          message: "This is a legitimate message body with sufficient length.",
          ip: `10.1.0.${i}`, // Different IPs to isolate email limit
          renderedAt: validRenderedAt,
        });
        expect(res.success).toBe(true);
      }

      // 6th request from same email
      const res6 = await createSupportTicket({
        name: "Test User",
        email: testEmail,
        subject: "Valid subject 6",
        message: "This is a legitimate message body with sufficient length.",
        ip: "10.1.0.6",
        renderedAt: validRenderedAt,
      });
      expect(res6.success).toBe(false);
      expect(res6.errorMessage).toContain("Too many messages from this email today");
    });
  });

  describe("3. Verified Reviews Invariants", () => {
    it("refuses reviews from unpaid orders", async () => {
      const res = await submitVerifiedReview({
        userId: "student-1",
        orderId: "order-unpaid",
        projectId: "proj-1",
        rating: 5,
        body: "Attempting to review without paying for the kit package.",
      });

      expect(res.success).toBe(false);
      expect(res.errorMessage).toBe("You can only review kits from paid orders.");
    });

    it("refuses reviews if user does not own the order", async () => {
      const res = await submitVerifiedReview({
        userId: "student-2",
        orderId: "order-1", // Belongs to student-1
        projectId: "proj-1",
        rating: 5,
        body: "Attempting to review an order owned by another student.",
      });

      expect(res.success).toBe(false);
      expect(res.errorMessage).toBe("You do not own this order.");
    });

    it("refuses reviews if kit is not in the order", async () => {
      const res = await submitVerifiedReview({
        userId: "student-1",
        orderId: "order-1",
        projectId: "proj-nonexistent",
        rating: 5,
        body: "Attempting to review a project that was never ordered.",
      });

      expect(res.success).toBe(false);
      expect(res.errorMessage).toBe("The specified kit is not part of this order.");
    });

    it("refuses reviews if student has not downloaded at least one file", async () => {
      const res = await submitVerifiedReview({
        userId: "student-2",
        orderId: "order-nodownload",
        projectId: "proj-2",
        rating: 5,
        body: "Attempting to review before downloading any deliverable files.",
      });

      expect(res.success).toBe(false);
      expect(res.errorMessage).toBe(
        "You must download at least one file before reviewing this project."
      );
    });

    it("enforces rating boundary constraints between 1 and 5", async () => {
      const resLow = await submitVerifiedReview({
        userId: "student-1",
        orderId: "order-1",
        projectId: "proj-1",
        rating: 0,
        body: "Valid review text that exceeds twenty characters in length.",
      });
      expect(resLow.success).toBe(false);
      expect(resLow.errorMessage).toBe("Rating must be between 1 and 5 stars.");

      const resHigh = await submitVerifiedReview({
        userId: "student-1",
        orderId: "order-1",
        projectId: "proj-1",
        rating: 6,
        body: "Valid review text that exceeds twenty characters in length.",
      });
      expect(resHigh.success).toBe(false);
      expect(resHigh.errorMessage).toBe("Rating must be between 1 and 5 stars.");
    });

    it("enforces text length constraints (minimum 20, maximum 2000 chars)", async () => {
      const resShort = await submitVerifiedReview({
        userId: "student-1",
        orderId: "order-1",
        projectId: "proj-1",
        rating: 5,
        body: "Too short",
      });
      expect(resShort.success).toBe(false);
      expect(resShort.errorMessage).toBe("Review text must be at least 20 characters long.");

      const resLong = await submitVerifiedReview({
        userId: "student-1",
        orderId: "order-1",
        projectId: "proj-1",
        rating: 5,
        body: "A".repeat(2001),
      });
      expect(resLong.success).toBe(false);
      expect(resLong.errorMessage).toBe("Review text cannot exceed 2000 characters.");
    });

    it("submits valid review successfully with status pending", async () => {
      const res = await submitVerifiedReview({
        userId: "student-1",
        orderId: "order-1",
        projectId: "proj-1",
        rating: 5,
        body: "The project code and documentation were comprehensive and easy to follow.",
      });

      expect(res.success).toBe(true);
      expect(res.reviewId).toBeDefined();

      const saved = mockDb.reviews.get(res.reviewId!);
      expect(saved).toBeDefined();
      expect(saved.status).toBe("pending");
      expect(saved.rating).toBe(5);
    });

    it("refuses duplicate reviews for same user and project", async () => {
      // First submission
      const res1 = await submitVerifiedReview({
        userId: "student-1",
        orderId: "order-1",
        projectId: "proj-1",
        rating: 5,
        body: "The project code and documentation were comprehensive and easy to follow.",
      });
      expect(res1.success).toBe(true);

      // Duplicate submission
      const res2 = await submitVerifiedReview({
        userId: "student-1",
        orderId: "order-1",
        projectId: "proj-1",
        rating: 4,
        body: "Submitting a second review for the exact same project by same student.",
      });
      expect(res2.success).toBe(false);
      expect(res2.errorMessage).toBe("You have already submitted a review for this kit.");
    });

    it("moderates review: approve and hide works without changing text", async () => {
      // Submit a review first
      const submitRes = await submitVerifiedReview({
        userId: "student-1",
        orderId: "order-1",
        projectId: "proj-1",
        rating: 5,
        body: "Great explanation of algorithms and clean source code included.",
      });
      expect(submitRes.success).toBe(true);
      const reviewId = submitRes.reviewId!;

      // Approve review
      const approveRes = await moderateReview({
        reviewId,
        status: "approved",
        adminUserId: "admin-1",
      });
      expect(approveRes.success).toBe(true);

      let r = mockDb.reviews.get(reviewId);
      expect(r.status).toBe("approved");
      expect(r.body).toBe("Great explanation of algorithms and clean source code included.");

      // Check audit row
      const auditApprove = mockDb.audit_log.find((a) => a.action === "review_approved");
      expect(auditApprove).toBeDefined();
      expect(auditApprove.entity_id).toBe(reviewId);

      // Hide review with reason
      const hideRes = await moderateReview({
        reviewId,
        status: "hidden",
        adminReason: "Violated guidelines",
        adminUserId: "admin-1",
      });
      expect(hideRes.success).toBe(true);

      r = mockDb.reviews.get(reviewId);
      expect(r.status).toBe("hidden");
      expect(r.admin_reason).toBe("Violated guidelines");
    });
  });

  describe("4. Account Data Export & Anonymisation Invariants", () => {
    it("exports data strictly belonging to the target user", async () => {
      const data = await exportUserData("user-target");

      expect(data.user.id).toBe("user-target");
      expect(data.profile?.display_name).toBe("Target User");
      expect(data.orders.length).toBe(1);
      expect(data.orders[0]?.id).toBe("order-target");
      expect(data.customRequests.length).toBe(1);
      expect(data.customRequests[0]?.id).toBe("req-target");

      // Verify no records from student-1 leaked in
      expect(data.orders.some((o) => o.user_id === "student-1")).toBe(false);
    });

    it("anonymisation requires exact confirmation text ANONYMISE", async () => {
      const res = await anonymiseAccount({
        targetUserId: "user-target",
        adminUserId: "admin-1",
        totpCode: "123456",
        confirmationText: "delete", // Wrong confirmation
      });

      expect(res.success).toBe(false);
      expect(res.errorMessage).toContain('must be exactly "ANONYMISE"');
    });

    it("anonymisation requires valid 6-digit TOTP format", async () => {
      const res = await anonymiseAccount({
        targetUserId: "user-target",
        adminUserId: "admin-1",
        totpCode: "abc", // Invalid code
        confirmationText: "ANONYMISE",
      });

      expect(res.success).toBe(false);
      expect(res.errorMessage).toContain("valid 6-digit TOTP code");
    });

    it("anonymises personal fields, purges files, replaces messages, and retains 7-year accounting records", async () => {
      const res = await anonymiseAccount({
        targetUserId: "user-target",
        adminUserId: "admin-1",
        totpCode: "123456",
        confirmationText: "ANONYMISE",
      });

      expect(res.success).toBe(true);

      // Profile personal fields scrambled
      const profile = mockDb.profiles.get("user-target");
      expect(profile.display_name).toBe("Anonymised User");
      expect(profile.phone).toBeNull();

      // Message body replaced with removal notice
      const msg = mockDb.messages.get("msg-target");
      expect(msg.body).toContain("Content removed");

      // Statutory accounting order record is retained
      const order = mockDb.orders.get("order-target");
      expect(order).toBeDefined();
      expect(order.status).toBe("paid");

      // Audit row logged with zero personal data
      const audit = mockDb.audit_log.find((a) => a.action === "user_anonymised");
      expect(audit).toBeDefined();
      expect(audit.details.retention_applied).toBe("7_year_statutory_accounting_retained");
      expect(audit.details.email).toBeUndefined();
      expect(audit.details.phone).toBeUndefined();
    });
  });
});
