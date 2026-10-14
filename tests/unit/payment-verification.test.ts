import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  consumeDownloadAndSignUrl,
  generateOrderLicenceSlip,
  hashIp,
} from "@/server/orders/downloads";
import {
  approvePaymentAction,
  rejectPaymentAction,
  refundPaymentAction,
  getPaymentProofSignedUrl,
} from "@/server/payments/admin-actions";
import {
  verifyCronAuthorization,
  purgeExpiredProofs,
} from "@/server/payments/purge";
import { GET as getDownloadRoute } from "@/app/api/orders/[id]/download/[fileId]/route";
import { LICENCE_TERMS_TEXT, generateLicenceSlip } from "@/content/licence";
import { resetRateLimitStoreForTesting } from "@/server/security/rate-limit";
import { AppError } from "@/server/errors";

// In-memory test store to simulate database state for integration unit tests
interface MockDb {
  orders: Map<string, any>;
  payments: Map<string, any>;
  downloadGrants: Map<string, any>;
  projectFiles: Map<string, any>;
  profiles: Map<string, any>;
  siteSettings: Map<string, any>;
  auditLog: any[];
  storageBucket: Map<string, Buffer>;
}

let mockDb: MockDb;
let mockAdminUser: any;
let mockAuthUser: any;
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
    requireAdmin: vi.fn(async () => {
      if (!mockAdminUser) {
        throw new AppError("Access denied: administrator role required", "FORBIDDEN", 403);
      }
      if (mockAalLevel !== "aal2") {
        throw new AppError("MFA AAL2 required", "MFA_REQUIRED", 403);
      }
      return mockAdminUser;
    }),
  };
});

vi.mock("@/server/email", () => ({
  sendEmail: vi.fn(async () => true),
}));

vi.mock("@/server/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => {
      return {
        select: (cols?: string) => {
          return {
            eq: (col: string, val: any) => {
              return {
                eq: (col2: string, val2: any) => {
                  return {
                    single: async () => {
                      if (table === "orders") {
                        const o = mockDb.orders.get(val);
                        if (o && o.user_id === val2) return { data: o, error: null };
                        return { data: null, error: { message: "Not found" } };
                      }
                      if (table === "download_grants") {
                        for (const g of mockDb.downloadGrants.values()) {
                          if (g.order_id === val && g.user_id === val2) {
                            return { data: g, error: null };
                          }
                        }
                        return { data: null, error: { message: "Not found" } };
                      }
                      if (table === "project_files") {
                        const f = mockDb.projectFiles.get(val);
                        if (f && f.project_id === val2) return { data: f, error: null };
                        return { data: null, error: { message: "Not found" } };
                      }
                      return { data: null, error: { message: "Not found" } };
                    },
                    maybeSingle: async () => {
                      if (table === "orders") {
                        const o = mockDb.orders.get(val);
                        if (o && o.user_id === val2) return { data: o, error: null };
                      }
                      return { data: null, error: null };
                    },
                  };
                },
                single: async () => {
                  if (table === "payments") {
                    const p = mockDb.payments.get(val);
                    return p ? { data: p, error: null } : { data: null, error: { message: "Not found" } };
                  }
                  if (table === "orders") {
                    const o = mockDb.orders.get(val);
                    return o ? { data: o, error: null } : { data: null, error: { message: "Not found" } };
                  }
                  if (table === "download_grants") {
                    const g = mockDb.downloadGrants.get(val);
                    return g ? { data: g, error: null } : { data: null, error: { message: "Not found" } };
                  }
                  return { data: null, error: { message: "Not found" } };
                },
                maybeSingle: async () => {
                  if (table === "site_settings") {
                    const s = mockDb.siteSettings.get(val);
                    return s ? { data: s, error: null } : { data: null, error: null };
                  }
                  if (table === "profiles") {
                    const p = mockDb.profiles.get(val);
                    return p ? { data: p, error: null } : { data: null, error: null };
                  }
                  return { data: null, error: null };
                },
                limit: async () => ({ data: [], error: null }),
              };
            },
            not: () => ({
              is: () => ({
                neq: () => ({
                  not: () => ({
                    lte: () => ({
                      limit: async (lim: number) => {
                        const results: any[] = [];
                        const retentionDays = mockDb.siteSettings.get("proof_retention_days")?.value || 0;
                        const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
                        for (const p of mockDb.payments.values()) {
                          if (
                            p.proof_path &&
                            !p.proof_deleted_at &&
                            p.status !== "pending_verification" &&
                            p.verified_at &&
                            new Date(p.verified_at).getTime() <= cutoff
                          ) {
                            results.push(p);
                            if (results.length >= lim) break;
                          }
                        }
                        return { data: results, error: null };
                      },
                    }),
                  }),
                }),
              }),
            }),
          };
        },
        update: (updates: any) => {
          return {
            eq: (col: string, val: any) => {
              return {
                eq: (col2: string, val2: any) => {
                  if (table === "payments") {
                    const p = mockDb.payments.get(val);
                    if (p && p[col2] === val2) {
                      Object.assign(p, updates);
                      return { error: null };
                    }
                  }
                  return { error: null };
                },
                is: (col2: string, val2: any) => {
                  if (table === "download_grants") {
                    for (const g of mockDb.downloadGrants.values()) {
                      if (g.order_id === val && (val2 === null ? g[col2] === null : g[col2] === val2)) {
                        Object.assign(g, updates);
                      }
                    }
                  }
                  return { error: null };
                },
                then: (resolve: any) => {
                  if (table === "payments") {
                    const p = mockDb.payments.get(val);
                    if (p) Object.assign(p, updates);
                  }
                  if (table === "orders") {
                    const o = mockDb.orders.get(val);
                    if (o) Object.assign(o, updates);
                  }
                  if (table === "download_grants") {
                    const g = mockDb.downloadGrants.get(val);
                    if (g) Object.assign(g, updates);
                  }
                  resolve({ error: null });
                },
              };
            },
          };
        },
        insert: async (row: any) => {
          if (table === "audit_log") {
            mockDb.auditLog.push(row);
          }
          return { error: null };
        },
        upsert: async (row: any) => {
          if (table === "download_grants") {
            const id = row.id || `grant-${mockDb.downloadGrants.size + 1}`;
            mockDb.downloadGrants.set(id, { id, ...row });
          }
          return { error: null };
        },
      };
    },
    rpc: async (func: string, args: any) => {
      if (func === "approve_payment") {
        const p = mockDb.payments.get(args.p_payment_id);
        if (!p) return { data: "not_found", error: null };
        if (p.status !== "pending_verification") return { data: "already_processed", error: null };
        p.status = "paid";
        p.verified_by = args.p_admin_id;
        p.verified_at = new Date().toISOString();
        const o = mockDb.orders.get(p.order_id);
        if (o) o.status = "paid";
        return { data: "ok", error: null };
      }
      if (func === "reject_payment") {
        const p = mockDb.payments.get(args.p_payment_id);
        if (!p) return { data: "not_found", error: null };
        if (p.status !== "pending_verification") return { data: "already_processed", error: null };
        p.status = "rejected";
        p.reject_reason = args.p_note ? `${args.p_reason}: ${args.p_note}` : args.p_reason;
        p.verified_by = args.p_admin_id;
        p.verified_at = new Date().toISOString();
        const o = mockDb.orders.get(p.order_id);
        if (o) o.status = "rejected";
        return { data: "ok", error: null };
      }
      if (func === "refund_payment") {
        const p = mockDb.payments.get(args.p_payment_id);
        if (!p) return { data: "not_found", error: null };
        if (p.status !== "paid") return { data: "not_paid", error: null };
        if (args.p_amount_inr > p.amount_inr) return { data: "amount_exceeds_paid", error: null };
        p.status = "refunded";
        p.refund_amount_inr = args.p_amount_inr;
        p.refund_reference = args.p_reference;
        p.refunded_at = new Date().toISOString();
        const o = mockDb.orders.get(p.order_id);
        if (o) o.status = "refunded";
        for (const g of mockDb.downloadGrants.values()) {
          if (g.order_id === p.order_id) {
            g.revoked_at = new Date().toISOString();
          }
        }
        return { data: "ok", error: null };
      }
      if (func === "consume_download") {
        const g = mockDb.downloadGrants.get(args.p_grant_id);
        if (!g) return { data: null, error: { message: "GRANT_NOT_FOUND" } };
        if (g.revoked_at) return { data: null, error: { message: "GRANT_REVOKED" } };
        if (g.expires_at && new Date(g.expires_at) <= new Date()) {
          return { data: null, error: { message: "GRANT_EXPIRED" } };
        }
        if (g.download_count >= g.max_downloads) {
          return { data: null, error: { message: "DOWNLOAD_LIMIT_REACHED" } };
        }
        const f = mockDb.projectFiles.get(args.p_file_id);
        if (!f || f.project_id !== g.project_id) {
          return { data: null, error: { message: "FILE_NOT_FOUND" } };
        }
        g.download_count += 1;
        return {
          data: [
            {
              storage_path: f.storage_path,
              file_name: f.original_name,
              content_type: "application/zip",
            },
          ],
          error: null,
        };
      }
      if (func === "purge_expired_proofs") {
        const retentionDays = mockDb.siteSettings.get("proof_retention_days")?.value;
        if (!retentionDays || retentionDays <= 0) return { data: [], error: null };
        const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
        const matching: any[] = [];
        for (const p of mockDb.payments.values()) {
          if (
            p.proof_path &&
            !p.proof_deleted_at &&
            p.status !== "pending_verification" &&
            p.verified_at &&
            new Date(p.verified_at).getTime() <= cutoff
          ) {
            matching.push({ payment_id: p.id, proof_path: p.proof_path });
          }
        }
        return { data: matching, error: null };
      }
      return { data: null, error: { message: "RPC not simulated" } };
    },
    storage: {
      from: (bucket: string) => ({
        createSignedUrl: async (storagePath: string, expiresIn: number) => {
          if (!mockDb.storageBucket.has(storagePath)) {
            return { data: null, error: { message: "Object not found" } };
          }
          // Test double: signed URL contains an expiration timestamp
          const expiresAt = Date.now() + expiresIn * 1000;
          return {
            data: {
              signedUrl: `https://mock-supabase.co/storage/v1/object/sign/${bucket}/${storagePath}?token=mock_token&expires=${expiresAt}`,
            },
            error: null,
          };
        },
        remove: async (paths: string[]) => {
          for (const p of paths) {
            if (p === "simulate_failure_path.webp") {
              return { error: { message: "Storage network error" } };
            }
            mockDb.storageBucket.delete(p);
          }
          return { error: null };
        },
      }),
    },
    auth: {
      admin: {
        getUserById: async (uid: string) => ({
          data: { user: { id: uid, email: `student_${uid}@example.com` } },
          error: null,
        }),
      },
    },
  })),
}));

describe("Prompt 7: Payment Verification and Secure File Downloads", () => {
  const studentAId = "11111111-1111-4111-8111-111111111111";
  const studentBId = "22222222-2222-4222-8222-222222222222";
  const orderId = "33333333-3333-4333-8333-333333333333";
  const fileId = "44444444-4444-4444-8444-444444444444";
  const projectId = "55555555-5555-4555-8555-555555555555";
  const paymentId = "66666666-6666-4666-8666-666666666666";
  const grantId = "77777777-7777-4777-8777-777777777777";

  beforeEach(() => {
    resetRateLimitStoreForTesting();
    mockAalLevel = "aal2";
    process.env.CRON_SECRET = "test_cron_secret_12345678901234567890";

    mockDb = {
      orders: new Map(),
      payments: new Map(),
      downloadGrants: new Map(),
      projectFiles: new Map(),
      profiles: new Map(),
      siteSettings: new Map(),
      auditLog: [],
      storageBucket: new Map(),
    };

    // Initialize mock database entries
    mockDb.orders.set(orderId, {
      id: orderId,
      order_code: "VPH-23456789",
      status: "paid",
      user_id: studentAId,
      subtotal_inr: 4999,
      total_inr: 4999,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    });

    mockDb.payments.set(paymentId, {
      id: paymentId,
      order_id: orderId,
      amount_inr: 4999,
      status: "pending_verification",
      utr: "123456789012",
      proof_path: "proofs/screenshot.webp",
      attempt: 1,
      submitted_at: new Date(Date.now() - 1800000).toISOString(),
      created_at: new Date(Date.now() - 1800000).toISOString(),
    });

    mockDb.downloadGrants.set(grantId, {
      id: grantId,
      order_id: orderId,
      user_id: studentAId,
      project_id: projectId,
      max_downloads: 5,
      download_count: 0,
      expires_at: null,
      revoked_at: null,
      created_at: new Date().toISOString(),
    });

    mockDb.projectFiles.set(fileId, {
      id: fileId,
      project_id: projectId,
      original_name: "SourceCode.zip",
      storage_path: "deliverables/SourceCode.zip",
      kind: "deliverable",
      size_bytes: 1024 * 1024 * 15,
    });

    mockDb.profiles.set(studentAId, {
      id: studentAId,
      display_name: "Student Alpha",
      phone: "+919876543210",
    });

    mockDb.siteSettings.set("proof_retention_days", {
      key: "proof_retention_days",
      value: 30,
    });

    mockDb.storageBucket.set("proofs/screenshot.webp", Buffer.from("fake-proof-content"));
    mockDb.storageBucket.set("deliverables/SourceCode.zip", Buffer.from("fake-zip-content"));

    mockAdminUser = {
      user: { id: "99999999-9999-4999-8999-999999999999", email: "admin@vtuadda.com" },
      profile: { display_name: "System Administrator" },
      roles: ["admin"],
    };

    mockAuthUser = {
      user: { id: studentAId, email: "student_a@example.com" },
      profile: { display_name: "Student Alpha" },
      roles: ["student"],
    };
  });

  // 1. student B cannot download or see student A's files (404)
  it("refuses student B from downloading or seeing student A's files (404)", async () => {
    try {
      await consumeDownloadAndSignUrl({
        orderId,
        fileId,
        userId: studentBId, // Student B attempting to access Student A's order
        clientIp: "127.0.0.1",
      });
      expect.unreachable("Should have thrown 404");
    } catch (err: any) {
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(404);
    }
  });

  // 2. a revoked, expired, exhausted or unpaid grant is refused
  it("refuses download if grant is revoked, expired, exhausted or order is unpaid", async () => {
    // A. Revoked grant
    const revokedGrant = mockDb.downloadGrants.get(grantId)!;
    revokedGrant.revoked_at = new Date().toISOString();
    await expect(
      consumeDownloadAndSignUrl({
        orderId,
        fileId,
        userId: studentAId,
        clientIp: "127.0.0.1",
      })
    ).rejects.toThrowError(/revoked/i);
    revokedGrant.revoked_at = null;

    // B. Expired grant
    revokedGrant.expires_at = new Date(Date.now() - 10000).toISOString();
    await expect(
      consumeDownloadAndSignUrl({
        orderId,
        fileId,
        userId: studentAId,
        clientIp: "127.0.0.1",
      })
    ).rejects.toThrowError(/expired/i);
    revokedGrant.expires_at = null;

    // C. Exhausted grant (download_count >= max_downloads)
    revokedGrant.download_count = 5;
    await expect(
      consumeDownloadAndSignUrl({
        orderId,
        fileId,
        userId: studentAId,
        clientIp: "127.0.0.1",
      })
    ).rejects.toThrowError(/limit reached/i);
    revokedGrant.download_count = 0;

    // D. Order not paid
    const order = mockDb.orders.get(orderId)!;
    order.status = "awaiting_payment";
    await expect(
      consumeDownloadAndSignUrl({
        orderId,
        fileId,
        userId: studentAId,
        clientIp: "127.0.0.1",
      })
    ).rejects.toThrowError(/paid/i);
  });

  // 3. a GET request to the download route does not change the count
  it("rejects GET request to download route with 405 without touching download count", async () => {
    const initialCount = mockDb.downloadGrants.get(grantId)!.download_count;

    const response = await getDownloadRoute();
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");

    const finalCount = mockDb.downloadGrants.get(grantId)!.download_count;
    expect(finalCount).toBe(initialCount);
  });

  // 4. the signed URL stops working after 60 seconds (use a test double)
  it("verifies that generated signed URL expires in 60 seconds", async () => {
    const result = await consumeDownloadAndSignUrl({
      orderId,
      fileId,
      userId: studentAId,
      clientIp: "127.0.0.1",
    });

    expect(result.signedUrl).toContain("expires=");
    const url = new URL(result.signedUrl);
    const expiresParam = parseInt(url.searchParams.get("expires") || "0", 10);
    const now = Date.now();

    // Valid within 60 seconds
    expect(expiresParam).toBeGreaterThan(now);
    expect(expiresParam).toBeLessThanOrEqual(now + 61000);

    // Test double expiry validation helper
    function isSignedUrlValid(signedUrl: string, currentTime: number): boolean {
      const u = new URL(signedUrl);
      const exp = parseInt(u.searchParams.get("expires") || "0", 10);
      return currentTime <= exp;
    }

    expect(isSignedUrlValid(result.signedUrl, now + 30000)).toBe(true);
    expect(isSignedUrlValid(result.signedUrl, now + 65000)).toBe(false);
  });

  // 5. approving the wrong last-4 digits is refused
  it("refuses approval when last 4 digits do not match the stored UTR", async () => {
    // Stored UTR is '123456789012' -> last 4 are '9012'
    const result = await approvePaymentAction({
      paymentId,
      last4Utr: "8888", // Incorrect digits
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toMatch(/last 4 digits do not match/i);

    // Payment must remain pending_verification
    expect(mockDb.payments.get(paymentId)!.status).toBe("pending_verification");
  });

  // 6. approving a payment that is already paid, rejected or refunded changes nothing
  it("refuses approval on payment already decided (idempotent safety)", async () => {
    const payment = mockDb.payments.get(paymentId)!;

    // Already paid
    payment.status = "paid";
    const resPaid = await approvePaymentAction({ paymentId, last4Utr: "9012" });
    expect(resPaid.success).toBe(false);
    expect(resPaid.errorMessage).toMatch(/already been processed/i);

    // Rejected
    payment.status = "rejected";
    const resRej = await approvePaymentAction({ paymentId, last4Utr: "9012" });
    expect(resRej.success).toBe(false);

    // Refunded
    payment.status = "refunded";
    const resRef = await approvePaymentAction({ paymentId, last4Utr: "9012" });
    expect(resRef.success).toBe(false);
  });

  // 7. two simultaneous approvals create exactly one set of grants
  it("ensures simultaneous approval attempts are atomic and create only one set of grants", async () => {
    // Initial grants size
    const initialGrants = mockDb.downloadGrants.size;

    // Run two approvals concurrently
    const [res1, res2] = await Promise.all([
      approvePaymentAction({ paymentId, last4Utr: "9012" }),
      approvePaymentAction({ paymentId, last4Utr: "9012" }),
    ]);

    // One succeeds, one is rejected as already processed
    const successCount = [res1.success, res2.success].filter(Boolean).length;
    expect(successCount).toBe(1);

    // Grants table has not duplicated
    expect(mockDb.downloadGrants.size).toBe(initialGrants);
  }, 15000);

  // 8. an admin session without MFA is refused on every action
  it("refuses admin actions when MFA AAL2 assurance level is missing", async () => {
    mockAalLevel = "aal1"; // Non-MFA session

    await expect(
      approvePaymentAction({ paymentId, last4Utr: "9012" })
    ).rejects.toThrowError(/MFA/i);

    await expect(
      rejectPaymentAction({ paymentId, reason: "Amount does not match" })
    ).rejects.toThrowError(/MFA/i);

    await expect(
      refundPaymentAction({ paymentId, amountInr: 4999, reference: "REF-123" })
    ).rejects.toThrowError(/MFA/i);
  });

  // 9. refunding revokes access and a download after refund is refused
  it("revokes download grants when payment is refunded and blocks subsequent downloads", async () => {
    // Set payment to paid
    const payment = mockDb.payments.get(paymentId)!;
    payment.status = "paid";

    // Mark refunded
    const refundResult = await refundPaymentAction({
      paymentId,
      amountInr: 4999,
      reference: "UPI-REFUND-998877",
    });
    expect(refundResult.success).toBe(true);

    // Verify order and payment marked refunded
    expect(payment.status).toBe("refunded");
    expect(mockDb.orders.get(orderId)!.status).toBe("refunded");

    // Verify grant is revoked
    const grant = mockDb.downloadGrants.get(grantId)!;
    expect(grant.revoked_at).not.toBeNull();

    // Subsequent download must throw error
    await expect(
      consumeDownloadAndSignUrl({
        orderId,
        fileId,
        userId: studentAId,
        clientIp: "127.0.0.1",
      })
    ).rejects.toThrow();
  });

  // 10. the licence slip is generated without using up a download
  it("generates licence slip with correct content without consuming download credits", async () => {
    const grant = mockDb.downloadGrants.get(grantId)!;
    const initialDownloads = grant.download_count;

    const slip = await generateOrderLicenceSlip({
      orderId,
      userId: studentAId,
    });

    expect(slip.filename).toBe("LICENCE-VPH-23456789.txt");
    expect(slip.content).toContain(LICENCE_TERMS_TEXT);
    expect(slip.content).toContain("Order Code: VPH-23456789");
    expect(slip.content).toContain("Buyer: Student Alpha");

    // Download count must remain untouched
    expect(grant.download_count).toBe(initialDownloads);
  });

  // 11. guessing a storage path gives no access
  it("denies access to non-existent or ungranted storage paths", async () => {
    try {
      await consumeDownloadAndSignUrl({
        orderId,
        fileId: "00000000-0000-4000-8000-000000000000",
        userId: studentAId,
        clientIp: "127.0.0.1",
      });
      expect.unreachable("Should have thrown error");
    } catch (err: any) {
      expect(err).toBeInstanceOf(AppError);
    }
  });

  // 12. a payment with no screenshot can be approved and rejected
  it("allows payments with no screenshot to be both approved and rejected cleanly", async () => {
    const noProofId = "88888888-8888-4888-8888-888888888888";
    const paymentNoProof = {
      id: noProofId,
      order_id: orderId,
      amount_inr: 2500,
      status: "pending_verification",
      utr: "998877665544",
      proof_path: null, // No screenshot uploaded
      attempt: 1,
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    mockDb.payments.set(noProofId, paymentNoProof);

    // Verify signed URL returns null cleanly
    const proofRes = await getPaymentProofSignedUrl(noProofId);
    expect(proofRes.signedUrl).toBeNull();

    // Rejection works
    const rejRes = await rejectPaymentAction({
      paymentId: noProofId,
      reason: "Screenshot unclear",
      note: "No screenshot attached",
    });
    expect(rejRes.success).toBe(true);
    expect(paymentNoProof.status).toBe("rejected");

    // Approval works for pending payment without screenshot
    paymentNoProof.status = "pending_verification";
    const appRes = await approvePaymentAction({
      paymentId: noProofId,
      last4Utr: "5544",
    });
    expect(appRes.success).toBe(true);
    expect(paymentNoProof.status).toBe("paid");
  });

  // 13. screenshot purge cron job specs
  describe("Screenshot Retention Purge Cron Job", () => {
    it("rejects unauthorized cron requests without bearer token with 401", () => {
      const unauthorizedReq = new Request("http://localhost:3000/api/cron/purge-proofs");
      expect(verifyCronAuthorization(unauthorizedReq)).toBe(false);

      const invalidTokenReq = new Request("http://localhost:3000/api/cron/purge-proofs", {
        headers: { authorization: "Bearer invalid_secret_token" },
      });
      expect(verifyCronAuthorization(invalidTokenReq)).toBe(false);

      const validReq = new Request("http://localhost:3000/api/cron/purge-proofs", {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
      expect(verifyCronAuthorization(validReq)).toBe(true);
    });

    it("does nothing if proof_retention_days is empty or invalid", async () => {
      mockDb.siteSettings.set("proof_retention_days", {
        key: "proof_retention_days",
        value: null,
      });

      const res = await purgeExpiredProofs();
      expect(res.purged_count).toBe(0);
      expect(res.skipped_reason).toBeDefined();
    });

    it("never purges screenshots for payments still in pending_verification", async () => {
      // Payment has screenshot and is old, but still pending_verification
      const pendingPayment = mockDb.payments.get(paymentId)!;
      pendingPayment.status = "pending_verification";
      pendingPayment.verified_at = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();

      const res = await purgeExpiredProofs();
      expect(res.purged_count).toBe(0);
      expect(pendingPayment.proof_path).toBe("proofs/screenshot.webp");
      expect(pendingPayment.proof_deleted_at).toBeUndefined();
    });

    it("purges screenshots of decided payments older than retention period, keeping UTR and order rows intact", async () => {
      // 40 days old verified payment
      const oldPayment = mockDb.payments.get(paymentId)!;
      oldPayment.status = "paid";
      oldPayment.verified_at = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();

      const res = await purgeExpiredProofs();
      expect(res.purged_count).toBe(1);

      // Physical file deleted from storage bucket
      expect(mockDb.storageBucket.has("proofs/screenshot.webp")).toBe(false);

      // Payment row retains UTR, amount, status, and order, but proof_path is null and proof_deleted_at is set
      expect(oldPayment.proof_path).toBeNull();
      expect(oldPayment.proof_deleted_at).toBeDefined();
      expect(oldPayment.utr).toBe("123456789012");
      expect(oldPayment.amount_inr).toBe(4999);
      expect(oldPayment.status).toBe("paid");

      // Audit log has one row with count
      const purgeAudit = mockDb.auditLog.find((a) => a.action === "purge_payment_proofs");
      expect(purgeAudit).toBeDefined();
      expect(purgeAudit.details.purged_count).toBe(1);
    });

    it("retries a file on the next run if physical storage deletion fails", async () => {
      const failingId = "55555555-4444-4444-8444-444444444444";
      const failingPayment: any = {
        id: failingId,
        order_id: orderId,
        amount_inr: 4999,
        status: "paid",
        utr: "123456789012",
        proof_path: "simulate_failure_path.webp",
        verified_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };
      mockDb.payments.set(failingId, failingPayment);
      mockDb.storageBucket.set("simulate_failure_path.webp", Buffer.from("fail-content"));

      const res = await purgeExpiredProofs();
      expect(res.purged_count).toBe(0);

      // Row is untouched so next run retries
      expect(failingPayment.proof_path).toBe("simulate_failure_path.webp");
      expect(failingPayment.proof_deleted_at).toBeUndefined();
    });
  });
});
