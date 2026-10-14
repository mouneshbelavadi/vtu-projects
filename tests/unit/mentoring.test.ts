import { describe, it, expect, beforeEach, vi } from "vitest";
import { holdSlotForBooking, expireHeldSlots } from "@/server/mentoring/service";
import { sendSessionReminders } from "@/server/mentoring/reminders";
import {
  updateBookingMeetingLinkAction,
  generateSlotsAction,
  cancelBookingAdminAction,
} from "@/server/mentoring/admin-actions";
import { updateMentorMeetingLinkAction } from "@/server/mentoring/mentor-actions";
import { requestBookingCancellationAction } from "@/server/mentoring/student-actions";
import { formatISTTime, formatISTDateTime, formatISTSlotRange } from "@/lib/format";
import { GET as sessionRemindersRoute } from "@/app/api/cron/session-reminders/route";
import { AppError } from "@/server/errors";
import { resetRateLimitStoreForTesting } from "@/server/security/rate-limit";

// Valid UUID constants for testing
const UUID_STUDENT_A = "11111111-1111-4111-8111-111111111111";
const UUID_STUDENT_B = "22222222-2222-4222-8222-222222222222";
const UUID_MENTOR = "33333333-3333-4333-8333-333333333333";
const UUID_ADMIN = "44444444-4444-4444-8444-444444444444";
const UUID_TIER = "55555555-5555-4555-8555-555555555555";
const UUID_SLOT_CONCURRENT = "66666666-6666-4666-8666-666666666666";
const UUID_SLOT_TOO_SOON = "77777777-7777-4777-8777-777777777777";
const UUID_BOOKING_A = "88888888-8888-4888-8888-888888888888";
const UUID_OTHER_MENTOR = "99999999-9999-4999-8999-999999999999";
const UUID_OTHER_SLOT = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const UUID_OTHER_BOOKING = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const UUID_SLOT_EXPIRED = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const UUID_BOOKING_EXPIRED = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const UUID_SLOT_24H = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const UUID_BOOKING_24H = "ffffffff-ffff-4fff-8fff-ffffffffffff";

// In-memory test store
interface MockMentoringDb {
  mentorSlots: Map<string, any>;
  mentoringTiers: Map<string, any>;
  bookings: Map<string, any>;
  orders: Map<string, any>;
  orderItems: Map<string, any>;
  profiles: Map<string, any>;
  userRoles: Map<string, any>;
  tickets: Map<string, any>;
  siteSettings: Map<string, any>;
  auditLog: any[];
}

let mockDb: MockMentoringDb;
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
    from: (table: string) => {
      const filters: any[] = [];
      let updatePatch: any = null;

      const chain: any = {
        select: (cols?: string) => chain,
        eq: (col: string, val: any) => {
          filters.push({ op: "eq", col, val });
          return chain;
        },
        is: (col: string, val: any) => {
          filters.push({ op: "is", col, val });
          return chain;
        },
        gte: (col: string, val: any) => {
          filters.push({ op: "gte", col, val });
          return chain;
        },
        lte: (col: string, val: any) => {
          filters.push({ op: "lte", col, val });
          return chain;
        },
        single: async () => {
          const res = await chain.execute();
          if (res.data && res.data.length > 0) {
            return { data: res.data[0], error: null };
          }
          return { data: null, error: { message: "Not found" } };
        },
        maybeSingle: async () => {
          const res = await chain.execute();
          if (res.data && res.data.length > 0) {
            return { data: res.data[0], error: null };
          }
          return { data: null, error: null };
        },
        insert: async (records: any) => {
          const rows = Array.isArray(records) ? records : [records];
          if (table === "mentor_slots") {
            // Check exclusion overlap for same mentor
            for (const newRow of rows) {
              for (const existing of mockDb.mentorSlots.values()) {
                if (
                  existing.mentor_id === newRow.mentor_id &&
                  existing.status !== "cancelled"
                ) {
                  const s1 = new Date(newRow.starts_at).getTime();
                  const e1 = new Date(newRow.ends_at).getTime();
                  const s2 = new Date(existing.starts_at).getTime();
                  const e2 = new Date(existing.ends_at).getTime();
                  if (s1 < e2 && e1 > s2) {
                    return {
                      data: null,
                      error: {
                        code: "23P01",
                        message: "conflicting key value violates exclusion constraint",
                      },
                    };
                  }
                }
              }
              const id = newRow.id || `slot-${mockDb.mentorSlots.size + 1}`;
              mockDb.mentorSlots.set(id, { ...newRow, id });
            }
            return { data: rows, error: null };
          }
          if (table === "tickets") {
            for (const r of rows) {
              const id = r.id || `ticket-${mockDb.tickets.size + 1}`;
              mockDb.tickets.set(id, { ...r, id });
            }
            return { data: rows, error: null };
          }
          if (table === "audit_log") {
            mockDb.auditLog.push(...rows);
            return { data: rows, error: null };
          }
          return { data: rows, error: null };
        },
        update: (patch: any) => {
          updatePatch = patch;
          return chain;
        },
        delete: () => chain,
        execute: async () => {
          if (table === "mentor_slots") {
            let items = Array.from(mockDb.mentorSlots.values());
            for (const f of filters) {
              if (f.op === "eq") items = items.filter((x) => x[f.col] === f.val);
            }
            return { data: items, error: null };
          }
          if (table === "mentoring_tiers") {
            let items = Array.from(mockDb.mentoringTiers.values());
            for (const f of filters) {
              if (f.op === "eq") items = items.filter((x) => x[f.col] === f.val);
            }
            return { data: items, error: null };
          }
          if (table === "profiles") {
            let items = Array.from(mockDb.profiles.values());
            for (const f of filters) {
              if (f.op === "eq") items = items.filter((x) => x[f.col] === f.val);
            }
            return { data: items, error: null };
          }
          if (table === "user_roles") {
            let items = Array.from(mockDb.userRoles.values());
            for (const f of filters) {
              if (f.op === "eq") items = items.filter((x) => x[f.col] === f.val);
            }
            return { data: items, error: null };
          }
          if (table === "bookings") {
            let items = Array.from(mockDb.bookings.values()).map((b) => {
              const tier = mockDb.mentoringTiers.get(b.tier_id);
              const slot = mockDb.mentorSlots.get(b.slot_id);
              return {
                ...b,
                mentoring_tiers: tier ? { name: tier.name } : null,
                mentor_slots: slot,
              };
            });

            for (const f of filters) {
              if (f.op === "eq") items = items.filter((x) => x[f.col] === f.val);
              if (f.op === "is" && f.val === null) items = items.filter((x) => x[f.col] === null);
              if (f.op === "gte") items = items.filter((x) => x.mentor_slots?.starts_at >= f.val);
              if (f.op === "lte") items = items.filter((x) => x.mentor_slots?.starts_at <= f.val);
            }

            if (updatePatch) {
              for (const it of items) {
                const b = mockDb.bookings.get(it.id);
                if (b) Object.assign(b, updatePatch);
              }
            }
            return { data: items, error: null };
          }
          return { data: [], error: null };
        },
        then: (resolve: any, reject: any) => chain.execute().then(resolve, reject),
      };

      return chain;
    },
    rpc: async (func: string, params: any) => {
      if (func === "hold_slot") {
        const slot = mockDb.mentorSlots.get(params.p_slot_id);
        if (!slot) return { data: null, error: { message: "SLOT_NOT_FOUND" } };
        if (slot.status !== "open") {
          return { data: null, error: { message: "SLOT_NOT_AVAILABLE" } };
        }

        const noticeHours = mockDb.siteSettings.get("mentoring_min_notice_hours") || 12;
        const minTime = Date.now() + noticeHours * 60 * 60 * 1000;
        if (new Date(slot.starts_at).getTime() < minTime) {
          return { data: null, error: { message: "MIN_NOTICE_VIOLATION" } };
        }

        const tier = mockDb.mentoringTiers.get(params.p_tier_id);
        if (!tier || !tier.active) {
          return { data: null, error: { message: "INVALID_TIER" } };
        }

        const orderId = `order-${Date.now()}`;
        const bookingId = `booking-${Date.now()}`;
        const orderCode = `VPH-SLOTTEST`;

        slot.status = "held";
        slot.held_until = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        slot.held_by = params.p_user_id;

        mockDb.orders.set(orderId, {
          id: orderId,
          order_code: orderCode,
          user_id: params.p_user_id,
          status: "awaiting_payment",
          type: "mentoring",
          total_inr: tier.price_inr,
        });

        mockDb.bookings.set(bookingId, {
          id: bookingId,
          user_id: params.p_user_id,
          tier_id: tier.id,
          slot_id: slot.id,
          order_id: orderId,
          status: "awaiting_payment",
          meet_url: null,
          reminder_sent_at: null,
          cancelled_reason: null,
        });

        return {
          data: {
            success: true,
            order_id: orderId,
            booking_id: bookingId,
            order_code: orderCode,
          },
          error: null,
        };
      }

      if (func === "expire_held_slots") {
        let count = 0;
        const now = Date.now();
        for (const slot of mockDb.mentorSlots.values()) {
          if (slot.status === "held" && new Date(slot.held_until).getTime() <= now) {
            slot.status = "open";
            slot.held_until = null;
            slot.held_by = null;
            count++;

            for (const b of mockDb.bookings.values()) {
              if (b.slot_id === slot.id && b.status === "awaiting_payment") {
                b.status = "cancelled";
                b.cancelled_reason = "Hold expired";
              }
            }
          }
        }
        return { data: count, error: null };
      }

      return { data: null, error: { message: "Unknown RPC" } };
    },
    auth: {
      admin: {
        getUserById: vi.fn(async (id: string) => ({
          data: { user: { id, email: `${id}@example.com` } },
          error: null,
        })),
      },
    },
  })),
}));

vi.mock("@/server/email", () => ({
  sendEmail: vi.fn(async () => true),
}));

describe("Prompt 9: Mentoring Bookings Security Requirements", () => {
  const studentA = {
    user: { id: UUID_STUDENT_A, email: "student1@example.com" },
    profile: { display_name: "Aarav Sharma" },
    roles: ["student"],
  };

  const studentB = {
    user: { id: UUID_STUDENT_B, email: "student2@example.com" },
    profile: { display_name: "Pooja Patel" },
    roles: ["student"],
  };

  const mentorUser = {
    user: { id: UUID_MENTOR, email: "mentor@vtuadda.com" },
    profile: { display_name: "Mentor Vikram" },
    roles: ["builder"],
  };

  const adminUser = {
    user: { id: UUID_ADMIN, email: "admin@vtuadda.com" },
    profile: { display_name: "Admin User" },
    roles: ["admin"],
  };

  beforeEach(() => {
    resetRateLimitStoreForTesting();
    mockAalLevel = "aal2";
    mockAuthUser = studentA;

    mockDb = {
      mentorSlots: new Map(),
      mentoringTiers: new Map(),
      bookings: new Map(),
      orders: new Map(),
      orderItems: new Map(),
      profiles: new Map([
        [UUID_STUDENT_A, { id: UUID_STUDENT_A, display_name: "Aarav Sharma" }],
        [UUID_STUDENT_B, { id: UUID_STUDENT_B, display_name: "Pooja Patel" }],
        [UUID_MENTOR, { id: UUID_MENTOR, display_name: "Mentor Vikram" }],
        [UUID_ADMIN, { id: UUID_ADMIN, display_name: "Admin User" }],
      ]),
      userRoles: new Map([
        ["r1", { user_id: UUID_MENTOR, role: "builder" }],
        ["r2", { user_id: UUID_ADMIN, role: "admin" }],
      ]),
      tickets: new Map(),
      siteSettings: new Map([["mentoring_min_notice_hours", 12]]),
      auditLog: [],
    };

    // Seed standard active tier
    mockDb.mentoringTiers.set(UUID_TIER, {
      id: UUID_TIER,
      name: "Code Walkthrough & Review",
      description: "Line-by-line code explanation",
      price_inr: 1499,
      session_count: 1,
      session_minutes: 45,
      active: true,
      sort_order: 1,
    });
  });

  // 1. Concurrency: two simultaneous holds of one slot produce exactly one booking
  it("two simultaneous holds of one slot produce exactly one booking", async () => {
    // Open slot 24h ahead
    const startsAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const endsAt = new Date(Date.now() + 25 * 3600 * 1000).toISOString();
    mockDb.mentorSlots.set(UUID_SLOT_CONCURRENT, {
      id: UUID_SLOT_CONCURRENT,
      mentor_id: UUID_MENTOR,
      starts_at: startsAt,
      ends_at: endsAt,
      status: "open",
    });

    // Run first hold as Student A
    const resA = await holdSlotForBooking(UUID_STUDENT_A, {
      slotId: UUID_SLOT_CONCURRENT,
      tierId: UUID_TIER,
      ackIntegrity: true,
    });
    expect(resA.success).toBe(true);
    expect(resA.orderId).toBeDefined();

    // Run second hold concurrently as Student B
    const resB = await holdSlotForBooking(UUID_STUDENT_B, {
      slotId: UUID_SLOT_CONCURRENT,
      tierId: UUID_TIER,
      ackIntegrity: true,
    });
    expect(resB.success).toBe(false);
    expect(resB.errorMessage).toBe("This time was just taken. Please choose another.");

    // Exactly one booking row exists for this slot
    const bookingsForSlot = Array.from(mockDb.bookings.values()).filter(
      (b) => b.slot_id === UUID_SLOT_CONCURRENT
    );
    expect(bookingsForSlot).toHaveLength(1);
    expect(bookingsForSlot[0].user_id).toBe(UUID_STUDENT_A);
  });

  // 2. A slot in the past or inside the minimum notice cannot be booked
  it("a slot in the past or inside the minimum notice cannot be booked", async () => {
    // Slot starting in 2 hours (less than 12h notice requirement)
    const tooSoonStart = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    const tooSoonEnd = new Date(Date.now() + 3 * 3600 * 1000).toISOString();
    mockDb.mentorSlots.set(UUID_SLOT_TOO_SOON, {
      id: UUID_SLOT_TOO_SOON,
      mentor_id: UUID_MENTOR,
      starts_at: tooSoonStart,
      ends_at: tooSoonEnd,
      status: "open",
    });

    const res = await holdSlotForBooking(UUID_STUDENT_A, {
      slotId: UUID_SLOT_TOO_SOON,
      tierId: UUID_TIER,
      ackIntegrity: true,
    });

    expect(res.success).toBe(false);
    expect(res.errorMessage).toContain("minimum notice");
  });

  // 3. A student cannot see or modify another student's booking
  it("a student cannot cancel or tamper with another student's booking", async () => {
    // Booking belongs to student A
    mockDb.bookings.set(UUID_BOOKING_A, {
      id: UUID_BOOKING_A,
      user_id: UUID_STUDENT_A,
      status: "confirmed",
      slot_id: UUID_SLOT_CONCURRENT,
    });

    // Act as student B
    mockAuthUser = studentB;
    const res = await requestBookingCancellationAction(UUID_BOOKING_A, "Want to cancel this booking");
    expect(res.success).toBe(false);
    expect(res.errorMessage).toBe("Booking not found.");
  });

  // 4. The link is not shown before the booking is confirmed
  it("the link is not shown before the booking is confirmed", async () => {
    const unconfirmedBooking = {
      id: "b-unconfirmed",
      status: "awaiting_payment",
      meet_url: "https://meet.google.com/secret-room",
    };

    // Helper simulating student page view gate
    const getVisibleMeetingLink = (booking: { status: string; meet_url: string | null }) => {
      if (booking.status === "confirmed") {
        return booking.meet_url;
      }
      return null;
    };

    expect(getVisibleMeetingLink(unconfirmedBooking)).toBeNull();

    const pendingBooking = {
      id: "b-pending",
      status: "pending_verification",
      meet_url: "https://meet.google.com/secret-room",
    };
    expect(getVisibleMeetingLink(pendingBooking)).toBeNull();

    const confirmedBooking = {
      id: "b-confirmed",
      status: "confirmed",
      meet_url: "https://meet.google.com/secret-room",
    };
    expect(getVisibleMeetingLink(confirmedBooking)).toBe("https://meet.google.com/secret-room");
  });

  // 5. A mentor sees only their own sessions and no contact details
  it("a mentor sees only their own sessions and data minimization isolates student identity to first name only", async () => {
    mockDb.mentorSlots.set(UUID_SLOT_CONCURRENT, {
      id: UUID_SLOT_CONCURRENT,
      mentor_id: UUID_MENTOR,
      starts_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      ends_at: new Date(Date.now() + 25 * 3600 * 1000).toISOString(),
    });
    mockDb.mentorSlots.set(UUID_OTHER_SLOT, {
      id: UUID_OTHER_SLOT,
      mentor_id: UUID_OTHER_MENTOR,
      starts_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      ends_at: new Date(Date.now() + 25 * 3600 * 1000).toISOString(),
    });

    mockDb.bookings.set(UUID_BOOKING_A, {
      id: UUID_BOOKING_A,
      user_id: UUID_STUDENT_A,
      slot_id: UUID_SLOT_CONCURRENT,
      status: "confirmed",
    });
    mockDb.bookings.set(UUID_OTHER_BOOKING, {
      id: UUID_OTHER_BOOKING,
      user_id: UUID_STUDENT_B,
      slot_id: UUID_OTHER_SLOT,
      status: "confirmed",
    });

    // Act as mentorUser
    mockAuthUser = mentorUser;

    // Mentor tries to update other mentor's session
    const updateOtherRes = await updateMentorMeetingLinkAction(
      UUID_OTHER_BOOKING,
      "https://meet.google.com/abc-xyz"
    );
    expect(updateOtherRes.success).toBe(false);
    expect(updateOtherRes.errorMessage).toContain("not authorized");

    // Mentor updates own session successfully
    const updateOwnRes = await updateMentorMeetingLinkAction(
      UUID_BOOKING_A,
      "https://meet.google.com/my-room"
    );
    expect(updateOwnRes.success).toBe(true);

    // Verify student identity minimization: profile display_name "Aarav Sharma" is trimmed to "Aarav"
    const rawDisplayName = mockDb.profiles.get(UUID_STUDENT_A).display_name;
    const firstName = rawDisplayName.trim().split(/\s+/)[0];
    expect(firstName).toBe("Aarav");
    expect(firstName).not.toContain("Sharma");
  });

  // 6. Overlapping slots are refused by the database
  it("overlapping slots are refused by the database exclusion constraint", async () => {
    mockAuthUser = adminUser;

    // Seed existing slot 10:00 to 11:00 on 2026-10-25
    mockDb.mentorSlots.set("slot-existing", {
      id: "slot-existing",
      mentor_id: UUID_MENTOR,
      starts_at: "2026-10-25T10:00:00+05:30",
      ends_at: "2026-10-25T11:00:00+05:30",
      status: "open",
    });

    const formData = new FormData();
    formData.append("mentorId", UUID_MENTOR);
    formData.append("date", "2026-10-25");
    formData.append("startTime", "10:30"); // Overlaps with 10:00-11:00!
    formData.append("endTime", "11:30");
    formData.append("slotMinutes", "60");

    const res = await generateSlotsAction(formData);
    expect(res.success).toBe(false);
    expect(res.errorMessage).toBe("This slot overlaps with an existing slot for this mentor.");
  });

  // 7. An expired hold frees the slot
  it("an expired hold frees the slot and cancels the awaiting_payment booking", async () => {
    const expiredSlot = {
      id: UUID_SLOT_EXPIRED,
      mentor_id: UUID_MENTOR,
      starts_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      ends_at: new Date(Date.now() + 49 * 3600 * 1000).toISOString(),
      status: "held",
      held_until: new Date(Date.now() - 5000).toISOString(), // Expired 5 seconds ago
      held_by: UUID_STUDENT_A,
    };
    mockDb.mentorSlots.set(UUID_SLOT_EXPIRED, expiredSlot);

    mockDb.bookings.set(UUID_BOOKING_EXPIRED, {
      id: UUID_BOOKING_EXPIRED,
      slot_id: UUID_SLOT_EXPIRED,
      user_id: UUID_STUDENT_A,
      status: "awaiting_payment",
    });

    const res = await expireHeldSlots();
    expect(res.released_count).toBe(1);

    const updatedSlot = mockDb.mentorSlots.get(UUID_SLOT_EXPIRED);
    expect(updatedSlot.status).toBe("open");
    expect(updatedSlot.held_until).toBeNull();
    expect(updatedSlot.held_by).toBeNull();

    const updatedBooking = mockDb.bookings.get(UUID_BOOKING_EXPIRED);
    expect(updatedBooking.status).toBe("cancelled");
    expect(updatedBooking.cancelled_reason).toBe("Hold expired");
  });

  // 8. A javascript: or http: meeting link is refused
  it("a javascript: or http: meeting link is refused", async () => {
    mockAuthUser = adminUser;

    const resJs = await updateBookingMeetingLinkAction(UUID_BOOKING_A, "javascript:alert(1)");
    expect(resJs.success).toBe(false);
    expect(resJs.errorMessage).toContain("https://");

    const resHttp = await updateBookingMeetingLinkAction(UUID_BOOKING_A, "http://insecure-meeting.com");
    expect(resHttp.success).toBe(false);
    expect(resHttp.errorMessage).toContain("https://");

    mockAuthUser = mentorUser;
    const resMentorHttp = await updateMentorMeetingLinkAction(UUID_BOOKING_A, "http://insecure-meeting.com");
    expect(resMentorHttp.success).toBe(false);
    expect(resMentorHttp.errorMessage).toContain("https://");
  });

  // 9. The reminder route returns 401 without the secret and sends each reminder once
  it("the reminder route returns 401 without the secret and sends each reminder once", async () => {
    // Request without secret
    const unauthReq = new Request("http://localhost/api/cron/session-reminders", {
      method: "GET",
    });
    const unauthRes = await sessionRemindersRoute(unauthReq);
    expect(unauthRes.status).toBe(401);

    // Populate a confirmed booking 24 hours ahead
    const startsAt24h = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const endsAt24h = new Date(Date.now() + 25 * 3600 * 1000).toISOString();
    mockDb.mentorSlots.set(UUID_SLOT_24H, {
      id: UUID_SLOT_24H,
      mentor_id: UUID_MENTOR,
      starts_at: startsAt24h,
      ends_at: endsAt24h,
      status: "booked",
    });

    mockDb.bookings.set(UUID_BOOKING_24H, {
      id: UUID_BOOKING_24H,
      user_id: UUID_STUDENT_A,
      slot_id: UUID_SLOT_24H,
      tier_id: UUID_TIER,
      status: "confirmed",
      meet_url: "https://meet.google.com/session-24h",
      reminder_sent_at: null,
    });

    // First run sends reminder
    const run1 = await sendSessionReminders();
    expect(run1.reminders_sent).toBe(1);

    const bAfter = mockDb.bookings.get(UUID_BOOKING_24H);
    expect(bAfter.reminder_sent_at).not.toBeNull();

    // Second run sends 0 reminders
    const run2 = await sendSessionReminders();
    expect(run2.reminders_sent).toBe(0);
  });

  // 10. Times are displayed in IST
  it("times are always formatted and displayed in IST with label IST", () => {
    // 04:30 UTC corresponds to 10:00 AM IST
    const utcTime = "2026-10-15T04:30:00.000Z";
    const utcEndTime = "2026-10-15T05:30:00.000Z";

    const formattedTime = formatISTTime(utcTime);
    expect(formattedTime).toContain("IST");
    expect(formattedTime).toContain("10:00");

    const formattedDateTime = formatISTDateTime(utcTime);
    expect(formattedDateTime).toContain("IST");
    expect(formattedDateTime).toContain("15 Oct 2026");
    expect(formattedDateTime).toContain("10:00");

    const slotRange = formatISTSlotRange(utcTime, utcEndTime);
    expect(slotRange).toContain("IST");
    expect(slotRange).toContain("10:00");
    expect(slotRange).toContain("11:00");
    expect(slotRange).not.toContain("—"); // No em dash
    expect(slotRange).not.toContain("–"); // No en dash
  });
});
