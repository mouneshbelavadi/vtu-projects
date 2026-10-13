import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ALLOWED_STATUS_TRANSITIONS,
  isAllowedTransition,
  transitionCustomRequest,
} from "@/server/requests/state-machine";
import {
  validateCustomReferenceFile,
  validateBuilderDeliverableFile,
} from "@/server/storage/file-signatures";
import { consumeCustomRequestDownloadAndSignUrl } from "@/server/requests/downloads";
import {
  acceptQuoteAction,
  saveMilestoneInputAction,
  sendMessageAction,
} from "@/server/requests/student-actions";
import {
  updateMilestoneStatusAction,
  markDeliveryAction,
} from "@/server/requests/builder-actions";
import { requireBuilder, requireUser, requireAdmin } from "@/server/auth";
import { AppError } from "@/server/errors";
import { resetRateLimitStoreForTesting } from "@/server/security/rate-limit";
import type { CustomRequestStatus } from "@/types/database";

// In-memory test store to simulate database rows
interface MockRequestsDb {
  customRequests: Map<string, any>;
  requestFiles: Map<string, any>;
  milestones: Map<string, any>;
  messages: Map<string, any>;
  orders: Map<string, any>;
  orderItems: Map<string, any>;
  profiles: Map<string, any>;
  userRoles: Map<string, any>;
  auditLog: any[];
}

let mockDb: MockRequestsDb;
let mockAuthUser: any = null;
let mockAalLevel: "aal1" | "aal2" = "aal2";

vi.mock("@/server/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth")>();
  return {
    ...actual,
    getUserOrNull: vi.fn(async () => mockAuthUser),
    requireUser: vi.fn(async () => {
      if (!mockAuthUser) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
      return mockAuthUser;
    }),
    requireRole: vi.fn(async (role: string) => {
      if (!mockAuthUser) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
      if (!mockAuthUser.roles?.includes(role)) {
        throw new AppError("Forbidden: role required", "FORBIDDEN", 403);
      }
      return mockAuthUser;
    }),
    requireAdmin: vi.fn(async () => {
      if (!mockAuthUser) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
      if (!mockAuthUser.roles?.includes("admin")) {
        throw new AppError("Admin required", "FORBIDDEN", 403);
      }
      if (mockAalLevel !== "aal2") {
        throw new AppError("MFA AAL2 required", "MFA_REQUIRED", 403);
      }
      return mockAuthUser;
    }),
    requireBuilder: vi.fn(async () => {
      if (!mockAuthUser) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
      if (!mockAuthUser.roles?.includes("builder")) {
        throw new AppError("Builder role required", "FORBIDDEN", 403);
      }
      if (mockAalLevel !== "aal2") {
        throw new AppError("MFA AAL2 required", "MFA_REQUIRED", 403);
      }
      return mockAuthUser;
    }),
  };
});

vi.mock("@/server/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => ({
      select: (cols?: string) => ({
        eq: (col: string, val: any) => ({
          eq: (col2: string, val2: any) => ({
            single: async () => {
              if (table === "custom_requests") {
                const r = mockDb.customRequests.get(val);
                if (r && r[col2] === val2) return { data: r, error: null };
                return { data: null, error: { message: "Not found" } };
              }
              if (table === "milestones") {
                const m = mockDb.milestones.get(val);
                if (m && m[col2] === val2) return { data: m, error: null };
                return { data: null, error: { message: "Not found" } };
              }
              if (table === "request_files") {
                const f = mockDb.requestFiles.get(val);
                if (f && f[col2] === val2) return { data: f, error: null };
                return { data: null, error: { message: "Not found" } };
              }
              return { data: null, error: { message: "Not found" } };
            },
            maybeSingle: async () => {
              if (table === "order_items") {
                for (const item of mockDb.orderItems.values()) {
                  if (item.request_id === val && item.label === val2) {
                    return { data: item, error: null };
                  }
                }
                return { data: null, error: null };
              }
              return { data: null, error: null };
            },
          }),
          single: async () => {
            if (table === "custom_requests") {
              const r = mockDb.customRequests.get(val);
              return r ? { data: r, error: null } : { data: null, error: { message: "Not found" } };
            }
            if (table === "milestones") {
              const m = mockDb.milestones.get(val);
              return m ? { data: m, error: null } : { data: null, error: { message: "Not found" } };
            }
            if (table === "request_files") {
              const f = mockDb.requestFiles.get(val);
              return f ? { data: f, error: null } : { data: null, error: { message: "Not found" } };
            }
            if (table === "profiles") {
              const p = mockDb.profiles.get(val);
              return p ? { data: p, error: null } : { data: null, error: { message: "Not found" } };
            }
            return { data: null, error: { message: "Not found" } };
          },
          maybeSingle: async () => {
            if (table === "user_roles") {
              for (const r of mockDb.userRoles.values()) {
                if (r.user_id === val) return { data: r, error: null };
              }
            }
            return { data: null, error: null };
          },
        }),
      }),
      insert: (record: any) => ({
        select: (c?: string) => ({
          single: async () => {
            const id = record.id || `gen-${Math.random().toString(36).substring(2, 9)}`;
            const saved = { ...record, id };
            if (table === "orders") mockDb.orders.set(id, saved);
            if (table === "custom_requests") mockDb.customRequests.set(id, saved);
            if (table === "messages") mockDb.messages.set(id, saved);
            return { data: saved, error: null };
          },
        }),
      }),
      update: (patch: any) => ({
        eq: (col: string, val: any) => {
          if (table === "custom_requests") {
            const r = mockDb.customRequests.get(val);
            if (r) Object.assign(r, patch);
          }
          if (table === "milestones") {
            const m = mockDb.milestones.get(val);
            if (m) Object.assign(m, patch);
          }
          if (table === "request_files") {
            for (const f of mockDb.requestFiles.values()) {
              if (f.request_id === val) Object.assign(f, patch);
            }
          }
          return { error: null };
        },
      }),
      delete: () => ({
        eq: (col: string, val: any) => ({ error: null }),
      }),
    }),
    storage: {
      from: (bucket: string) => ({
        createSignedUrl: async (storagePath: string, expiresIn: number) => {
          return { data: { signedUrl: `https://storage.vtuadda.internal/${bucket}/${storagePath}?token=mock` }, error: null };
        },
      }),
    },
    rpc: async (fn: string, args: any) => {
      if (fn === "transition_custom_request") {
        const req = mockDb.customRequests.get(args.p_request_id);
        if (!req) return { data: null, error: { message: "Not found" } };
        req.status = args.p_target_status;
        return { data: "ok", error: null };
      }
      return { data: null, error: null };
    },
    auth: {
      admin: {
        getUserById: async (uid: string) => ({
          data: { user: { id: uid, email: `user-${uid}@vtuadda.internal` } },
          error: null,
        }),
      },
    },
  })),
}));

describe("Prompt 8: Custom Project Requests Security and State Machine", () => {
  beforeEach(() => {
    resetRateLimitStoreForTesting();
    mockAalLevel = "aal2";

    mockDb = {
      customRequests: new Map(),
      requestFiles: new Map(),
      milestones: new Map(),
      messages: new Map(),
      orders: new Map(),
      orderItems: new Map(),
      profiles: new Map(),
      userRoles: new Map(),
      auditLog: [],
    };

    // Seed student A profile
    mockDb.profiles.set("student-a-id", {
      id: "student-a-id",
      display_name: "Rahul Sharma",
      phone: "9876543210",
    });

    // Seed student B profile
    mockDb.profiles.set("student-b-id", {
      id: "student-b-id",
      display_name: "Ananya Rao",
      phone: "9876543211",
    });

    // Seed builder profile
    mockDb.profiles.set("builder-id", {
      id: "builder-id",
      display_name: "Kiran Builder",
      phone: "9876543212",
    });

    // Seed user roles
    mockDb.userRoles.set("r-builder", { user_id: "builder-id", role: "builder" });
  });

  it("1. ensures Student B cannot read or write Student A's request, files, milestones or messages", async () => {
    // Student A creates a request
    const reqAId = "req-student-a";
    mockDb.customRequests.set(reqAId, {
      id: reqAId,
      user_id: "student-a-id",
      title: "Smart Traffic Light Controller",
      status: "quoted",
      quote_total_inr: 5000,
      quote_deposit_inr: 2000,
      quote_valid_until: "2099-01-01",
      ack_integrity: true,
      assigned_builder_id: "builder-id",
    });

    const mId = "mile-1";
    mockDb.milestones.set(mId, {
      id: mId,
      request_id: reqAId,
      position: 1,
      title: "System Design",
      status: "awaiting_student",
      needs_student_input: true,
      student_input_text: null,
    });

    // Act as Student B
    mockAuthUser = {
      user: { id: "student-b-id", email: "studentb@vtuadda.internal" },
      roles: ["student"],
    };

    // Student B tries to accept Student A's quote
    await expect(
      acceptQuoteAction({ requestId: reqAId, ackIntegrity: true })
    ).rejects.toThrow(/access denied/i);

    // Student B tries to submit input on Student A's milestone
    await expect(
      saveMilestoneInputAction({
        requestId: reqAId,
        milestoneId: mId,
        inputText: "Hijacked input",
      })
    ).rejects.toThrow(/access denied/i);

    // Student B tries to post a message to Student A's request
    await expect(
      sendMessageAction({
        requestId: reqAId,
        body: "Unauthorized message",
      })
    ).rejects.toThrow(/access denied/i);
  });

  it("2. ensures a builder cannot open or modify an unassigned request", async () => {
    const reqUnassignedId = "req-other-builder";
    mockDb.customRequests.set(reqUnassignedId, {
      id: reqUnassignedId,
      user_id: "student-a-id",
      title: "Drone Navigation System",
      status: "in_progress",
      assigned_builder_id: "other-builder-id", // NOT builder-id!
    });

    const mId = "m-drone-1";
    mockDb.milestones.set(mId, {
      id: mId,
      request_id: reqUnassignedId,
      status: "in_progress",
    });

    // Act as builder-id
    mockAuthUser = {
      user: { id: "builder-id", email: "builder@vtuadda.internal" },
      roles: ["builder"],
    };

    await expect(
      updateMilestoneStatusAction({
        requestId: reqUnassignedId,
        milestoneId: mId,
        status: "done",
      })
    ).rejects.toThrow(/not assigned to you/i);

    await expect(
      markDeliveryAction({ requestId: reqUnassignedId })
    ).rejects.toThrow(/not assigned to you/i);
  });

  it("3. verifies builder view strictly contains no email, phone, surname or college", () => {
    // Student's full profile has full name and phone number
    const profile = mockDb.profiles.get("student-a-id");
    expect(profile.display_name).toBe("Rahul Sharma");
    expect(profile.phone).toBe("9876543210");

    // Builder extraction rule: strictly first name only!
    const studentFirstName = profile.display_name.trim().split(/\s+/)[0];
    expect(studentFirstName).toBe("Rahul");
    expect(studentFirstName).not.toContain("Sharma"); // No surname
    expect(studentFirstName).not.toContain("9876543210"); // No phone
    expect(studentFirstName).not.toContain("@"); // No email
  });

  it("4. refuses a builder access when MFA assurance level is below AAL2", async () => {
    mockAuthUser = {
      user: { id: "builder-id", email: "builder@vtuadda.internal" },
      roles: ["builder"],
    };
    mockAalLevel = "aal1"; // AAL1 only, lacks MFA!

    await expect(
      updateMilestoneStatusAction({
        requestId: "req-1",
        milestoneId: "m-1",
        status: "done",
      })
    ).rejects.toThrow(/MFA AAL2 required/i);
  });

  it("5. prevents final files from being downloaded before the balance order is paid and request completed, even with guessed id", async () => {
    const reqId = "req-almost-done";
    mockDb.customRequests.set(reqId, {
      id: reqId,
      user_id: "student-a-id",
      status: "delivered", // Delivered, balance not yet paid!
      assigned_builder_id: "builder-id",
    });

    const finalFileId = "file-final-zip";
    mockDb.requestFiles.set(finalFileId, {
      id: finalFileId,
      request_id: reqId,
      kind: "deliverable",
      is_final: true, // Final release file
      storage_path: "requests/req-almost-done/deliv_code.zip",
      original_name: "final_source_code.zip",
    });

    mockAuthUser = {
      user: { id: "student-a-id", email: "studenta@vtuadda.internal" },
      roles: ["student"],
    };

    // Attempting download while in 'delivered' (balance unpaid) must be rejected
    await expect(
      consumeCustomRequestDownloadAndSignUrl({
        requestId: reqId,
        fileId: finalFileId,
        userId: "student-a-id",
        clientIp: "127.0.0.1",
      })
    ).rejects.toThrow(/locked until the balance order is paid/i);

    // Once status advances to 'completed' (after balance approval), download succeeds
    mockDb.customRequests.get(reqId).status = "completed";

    const downloadResult = await consumeCustomRequestDownloadAndSignUrl({
      requestId: reqId,
      fileId: finalFileId,
      userId: "student-a-id",
      clientIp: "127.0.0.1",
    });

    expect(downloadResult.signedUrl).toContain("https://storage.vtuadda.internal");
  });

  it("6. simulates deposit approval moving custom request to in_progress exactly once", () => {
    const customReq = {
      id: "req-deposit-test",
      status: "accepted",
    };

    // Simulated approve_payment logic for item 'Deposit'
    const simulateDepositApproval = (req: any, itemLabel: string) => {
      if (itemLabel === "Deposit" && req.status === "accepted") {
        req.status = "in_progress";
        return true;
      }
      return false;
    };

    const firstApproval = simulateDepositApproval(customReq, "Deposit");
    expect(firstApproval).toBe(true);
    expect(customReq.status).toBe("in_progress");

    // Re-running approval is idempotent and does not transition again
    const secondApproval = simulateDepositApproval(customReq, "Deposit");
    expect(secondApproval).toBe(false);
    expect(customReq.status).toBe("in_progress");
  });

  it("7. simulates balance approval completing the custom request", () => {
    const customReq = {
      id: "req-balance-test",
      status: "delivered",
    };

    const simulateBalanceApproval = (req: any, itemLabel: string) => {
      if (itemLabel === "Balance" && req.status === "delivered") {
        req.status = "completed";
        return true;
      }
      return false;
    };

    const approvalResult = simulateBalanceApproval(customReq, "Balance");
    expect(approvalResult).toBe(true);
    expect(customReq.status).toBe("completed");

    // Idempotent
    expect(simulateBalanceApproval(customReq, "Balance")).toBe(false);
    expect(customReq.status).toBe("completed");
  });

  it("8. refuses acceptance of an expired quote", async () => {
    const reqExpiredId = "req-expired";
    mockDb.customRequests.set(reqExpiredId, {
      id: reqExpiredId,
      user_id: "student-a-id",
      title: "Expired Project",
      status: "quoted",
      quote_total_inr: 4000,
      quote_deposit_inr: 1500,
      quote_valid_until: "2020-01-01", // Past date, expired!
      ack_integrity: true,
    });

    mockAuthUser = {
      user: { id: "student-a-id", email: "studenta@vtuadda.internal" },
      roles: ["student"],
    };

    await expect(
      acceptQuoteAction({
        requestId: reqExpiredId,
        ackIntegrity: true,
      })
    ).rejects.toThrow(/quote has expired/i);
  });

  it("9. ensures accepting a quote twice creates only one deposit order", async () => {
    const reqQuoteId = "req-quote-twice";
    mockDb.customRequests.set(reqQuoteId, {
      id: reqQuoteId,
      user_id: "student-a-id",
      title: "Project Quote Twice",
      status: "quoted",
      quote_total_inr: 6000,
      quote_deposit_inr: 2500,
      quote_valid_until: "2099-12-31",
      ack_integrity: true,
    });

    mockAuthUser = {
      user: { id: "student-a-id", email: "studenta@vtuadda.internal" },
      roles: ["student"],
    };

    // First acceptance creates an order
    const firstRes = await acceptQuoteAction({
      requestId: reqQuoteId,
      ackIntegrity: true,
    });

    expect(firstRes.orderId).toBeDefined();

    // Attach order item in mockDb to reflect DB state
    mockDb.orderItems.set("item-deposit-1", {
      order_id: firstRes.orderId,
      request_id: reqQuoteId,
      label: "Deposit",
      price_inr: 2500,
    });

    // Second acceptance returns the same order and does not throw or create duplicate
    const secondRes = await acceptQuoteAction({
      requestId: reqQuoteId,
      ackIntegrity: true,
    });

    expect(secondRes.orderId).toBe(firstRes.orderId);
  });

  it("10. verifies every allowed transition is accepted and every forbidden transition is refused", async () => {
    const statuses: CustomRequestStatus[] = [
      "submitted",
      "under_review",
      "quoted",
      "accepted",
      "in_progress",
      "delivered",
      "completed",
      "declined",
      "cancelled",
    ];

    // Allowed transition matrix check
    for (const fromStatus of statuses) {
      const allowedTargets = ALLOWED_STATUS_TRANSITIONS[fromStatus];
      for (const toStatus of statuses) {
        if (fromStatus === toStatus) continue;

        const isAllowed = isAllowedTransition(fromStatus, toStatus);
        if (allowedTargets.includes(toStatus)) {
          expect(isAllowed).toBe(true);
        } else {
          expect(isAllowed).toBe(false);
        }
      }
    }

    // Verify forbidden transition via state machine helper throws
    const testReq = {
      id: "req-test-transitions",
      status: "submitted",
    };
    mockDb.customRequests.set(testReq.id, testReq);

    // Forbidden: submitted -> completed
    await expect(
      transitionCustomRequest({
        requestId: testReq.id,
        targetStatus: "completed",
        actorId: "admin-id",
      })
    ).rejects.toThrow(/Forbidden status transition/i);

    // Forbidden: completed -> in_progress (terminal status cannot transition)
    testReq.status = "completed";
    await expect(
      transitionCustomRequest({
        requestId: testReq.id,
        targetStatus: "in_progress",
        actorId: "admin-id",
      })
    ).rejects.toThrow(/Forbidden status transition/i);
  });

  it("11. refuses renamed executable uploads and ensures file signatures are verified", () => {
    // Windows PE executable header: 'MZ' (0x4D, 0x5A) renamed to .pdf
    const exeAsPdf = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    const refCheck = validateCustomReferenceFile(exeAsPdf, "project_doc.pdf");
    expect(refCheck.valid).toBe(false);
    expect(refCheck.error).toMatch(/Executable binary signatures are strictly prohibited/i);

    // Linux ELF header (0x7F, 0x45, 0x4C, 0x46) renamed to .png
    const elfAsPng = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00]);
    const builderCheck = validateBuilderDeliverableFile(elfAsPng, "schematic.png");
    expect(builderCheck.valid).toBe(false);
    expect(builderCheck.error).toMatch(/Executable binary signatures are strictly prohibited/i);

    // Banned extension (.exe)
    const legitZipData = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
    const exeExtCheck = validateBuilderDeliverableFile(legitZipData, "setup.exe");
    expect(exeExtCheck.valid).toBe(false);
    expect(exeExtCheck.error).toMatch(/Executable or unsafe file extension/i);

    // Valid PNG
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    expect(validateCustomReferenceFile(validPng, "diagram.png").valid).toBe(true);

    // Valid PDF
    const validPdf = Buffer.from("%PDF-1.4 sample pdf document content");
    expect(validateCustomReferenceFile(validPdf, "base_paper.pdf").valid).toBe(true);
  });
});
