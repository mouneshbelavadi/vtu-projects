import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// 1. Safeguard checks
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const ALLOW_RLS_TESTS = process.env.ALLOW_RLS_TESTS;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (ALLOW_RLS_TESTS !== "true") {
  console.error("REFUSED: scripts/rls-check.ts requires ALLOW_RLS_TESTS=true.");
  process.exit(1);
}

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error("REFUSED: Missing Supabase URL or keys in environment.");
  process.exit(1);
}

// Safety check: ensure not running against production domain
if (
  SUPABASE_URL.includes("projects.vtuadda.com") ||
  process.env.NODE_ENV === "production"
) {
  console.error("REFUSED: RLS check cannot be executed against production environment.");
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`[PASS] ${description}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ${description}`);
    failedCount++;
  }
}

async function run() {
  console.log("Starting Row Level Security (RLS) Policy Matrix Verification...\n");

  const runId = Math.random().toString(36).substring(2, 8);
  const password = `TestPass!${runId}#998`;

  const userEmails = {
    studentA: `test-student-a-${runId}@vtuadda.internal`,
    studentB: `test-student-b-${runId}@vtuadda.internal`,
    builder: `test-builder-${runId}@vtuadda.internal`,
    admin: `test-admin-${runId}@vtuadda.internal`,
  };

  const createdUserIds: string[] = [];

  try {
    // 2. Create throwaway test users
    console.log("Creating temporary test users...");
    const [userA, userB, userBuilder, userAdmin] = await Promise.all([
      adminClient.auth.admin.createUser({
        email: userEmails.studentA,
        password,
        email_confirm: true,
      }),
      adminClient.auth.admin.createUser({
        email: userEmails.studentB,
        password,
        email_confirm: true,
      }),
      adminClient.auth.admin.createUser({
        email: userEmails.builder,
        password,
        email_confirm: true,
      }),
      adminClient.auth.admin.createUser({
        email: userEmails.admin,
        password,
        email_confirm: true,
      }),
    ]);

    if (!userA.data.user || !userB.data.user || !userBuilder.data.user || !userAdmin.data.user) {
      const errs = [userA.error, userB.error, userBuilder.error, userAdmin.error].filter(Boolean);
      throw new Error(`Failed to create test users via Admin API: ${JSON.stringify(errs)}`);
    }

    const idA = userA.data.user.id;
    const idB = userB.data.user.id;
    const idBuilder = userBuilder.data.user.id;
    const idAdmin = userAdmin.data.user.id;
    createdUserIds.push(idA, idB, idBuilder, idAdmin);

    // 3. Assign roles
    await adminClient.from("user_roles").upsert([
      { user_id: idBuilder, role: "builder" },
      { user_id: idAdmin, role: "admin" },
    ]);

    // 4. Sign in as each user
    const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
    });

    const clientA = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
    });
    const clientB = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
    });
    const clientBuilder = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
    });
    const clientAdminAal1 = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
    });

    await Promise.all([
      clientA.auth.signInWithPassword({ email: userEmails.studentA, password }),
      clientB.auth.signInWithPassword({ email: userEmails.studentB, password }),
      clientBuilder.auth.signInWithPassword({ email: userEmails.builder, password }),
      clientAdminAal1.auth.signInWithPassword({ email: userEmails.admin, password }),
    ]);

    // 5. Seed test fixtures
    console.log("Seeding test fixture records...");
    const liveProjectSlug = `proj-live-${runId}`;
    const draftProjectSlug = `proj-draft-${runId}`;

    const { data: liveProj } = await adminClient
      .from("projects")
      .insert({
        slug: liveProjectSlug,
        title: "Live Test Project",
        summary: "Live project summary",
        description: "Live project description",
        course_type: "mini_project",
        difficulty: "beginner",
        tech_stack: ["Python", "FastAPI"],
        price_inr: 4999,
        status: "live",
      })
      .select()
      .single();

    const { data: draftProj } = await adminClient
      .from("projects")
      .insert({
        slug: draftProjectSlug,
        title: "Draft Test Project",
        summary: "Draft project summary",
        description: "Draft project description",
        course_type: "major_project_phase_2",
        difficulty: "advanced",
        tech_stack: ["Next.js"],
        price_inr: 7999,
        status: "draft",
      })
      .select()
      .single();

    const { data: fileLive } = await adminClient
      .from("project_files")
      .insert({
        project_id: liveProj.id,
        kind: "code",
        storage_path: `projects/${liveProj.id}/code.zip`,
        original_name: "code.zip",
        size_bytes: 1048576,
        content_type: "application/zip",
      })
      .select()
      .single();

    const orderCodeB = `VPH-${runId.toUpperCase().padEnd(8, "X").slice(0, 8)}`;
    const { data: orderB } = await adminClient
      .from("orders")
      .insert({
        order_code: orderCodeB,
        user_id: idB,
        type: "kit",
        status: "paid",
        subtotal_inr: 4999,
        discount_inr: 0,
        total_inr: 4999,
        ack_integrity: true,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      })
      .select()
      .single();

    const { data: grantB } = await adminClient
      .from("download_grants")
      .insert({
        order_id: orderB.id,
        user_id: idB,
        project_id: liveProj.id,
        max_downloads: 5,
        download_count: 0,
      })
      .select()
      .single();

    const { data: paymentB } = await adminClient
      .from("payments")
      .insert({
        order_id: orderB.id,
        amount_inr: 4999,
        status: "paid",
        utr: "123456789012",
      })
      .select()
      .single();

    const { data: customReqB } = await adminClient
      .from("custom_requests")
      .insert({
        user_id: idB,
        title: "Custom Project Request B",
        brief: "Detailed project brief",
        branch: "CSE",
        semester: 6,
        scheme: "2022",
        course_type: "mini_project",
        deadline: new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0],
        ack_integrity: true,
        status: "in_progress",
        assigned_builder_id: idBuilder,
      })
      .select()
      .single();

    const { data: messageB } = await adminClient
      .from("messages")
      .insert({
        request_id: customReqB?.id,
        sender_id: idB,
        body: "Hello builder from student B",
      })
      .select()
      .single();

    const { data: milestoneB } = await adminClient
      .from("milestones")
      .insert({
        request_id: customReqB?.id,
        position: 1,
        title: "Test Milestone",
        needs_student_input: true,
        status: "pending",
      })
      .select()
      .single();

    const { data: requestFileB } = await adminClient
      .from("request_files")
      .insert({
        request_id: customReqB?.id,
        uploaded_by: idB,
        kind: "student_reference",
        storage_path: `requests/${customReqB?.id}/ref_test.pdf`,
        original_name: "ref_test.pdf",
        size_bytes: 1024,
        content_type: "application/pdf",
        is_final: false,
      })
      .select()
      .single();

    const { data: activeTier } = await adminClient
      .from("mentoring_tiers")
      .insert({
        name: "Active Test Tier",
        description: "Test description",
        price_inr: 999,
        session_count: 1,
        session_minutes: 30,
        active: true,
      })
      .select()
      .single();

    const { data: inactiveTier } = await adminClient
      .from("mentoring_tiers")
      .insert({
        name: "Inactive Test Tier",
        description: "Inactive description",
        price_inr: 1999,
        session_count: 1,
        session_minutes: 60,
        active: false,
      })
      .select()
      .single();

    const { data: slotBuilder } = await adminClient
      .from("mentor_slots")
      .insert({
        mentor_id: idBuilder,
        starts_at: new Date(Date.now() + 86400000 * 5).toISOString(),
        ends_at: new Date(Date.now() + 86400000 * 5 + 3600000).toISOString(),
        status: "booked",
      })
      .select()
      .single();

    const { data: bookingB } = await adminClient
      .from("bookings")
      .insert({
        user_id: idB,
        tier_id: activeTier?.id,
        slot_id: slotBuilder?.id,
        order_id: orderB?.id,
        status: "confirmed",
        meet_url: "https://meet.google.com/test-room",
      })
      .select()
      .single();

    if (
      !liveProj ||
      !draftProj ||
      !fileLive ||
      !orderB ||
      !grantB ||
      !paymentB ||
      !customReqB ||
      !messageB ||
      !milestoneB ||
      !requestFileB ||
      !activeTier ||
      !inactiveTier ||
      !slotBuilder ||
      !bookingB
    ) {
      throw new Error("Fixture seeding failed.");
    }

    console.log("\nExecuting Policy Assertions:\n");

    // Assertion 1: Anon cannot select private tables
    const anonOrders = await anonClient.from("orders").select("*");
    assert(
      !anonOrders.data || anonOrders.data.length === 0,
      "Anon cannot select orders"
    );

    const anonPayments = await anonClient.from("payments").select("*");
    assert(
      !anonPayments.data || anonPayments.data.length === 0,
      "Anon cannot select payments"
    );

    const anonAuditLog = await anonClient.from("audit_log").select("*");
    assert(
      !anonAuditLog.data || anonAuditLog.data.length === 0,
      "Anon cannot select audit_log"
    );

    const anonRateLimits = await anonClient.from("rate_limits").select("*");
    assert(
      !anonRateLimits.data || anonRateLimits.data.length === 0,
      "Anon cannot select rate_limits"
    );

    // Assertion 2: Public / Anon sees only live projects
    const anonProjects = await anonClient.from("projects").select("id, status");
    const hasDraftInAnon = (anonProjects.data || []).some(
      (p) => p.status === "draft"
    );
    assert(
      !hasDraftInAnon,
      "Public / Anon sees only live projects (drafts hidden)"
    );

    // Assertion 3: Student A cannot select Student B's profile
    const profileBByStudentA = await clientA
      .from("profiles")
      .select("*")
      .eq("id", idB);
    assert(
      !profileBByStudentA.data || profileBByStudentA.data.length === 0,
      "Student A cannot select Student B's profile"
    );

    // Assertion 4: Student A cannot select Student B's orders
    const ordersBByStudentA = await clientA
      .from("orders")
      .select("*")
      .eq("id", orderB.id);
    assert(
      !ordersBByStudentA.data || ordersBByStudentA.data.length === 0,
      "Student A cannot select Student B's orders"
    );

    // Assertion 5: Student A cannot select Student B's payments
    const paymentsBByStudentA = await clientA
      .from("payments")
      .select("*")
      .eq("id", paymentB.id);
    assert(
      !paymentsBByStudentA.data || paymentsBByStudentA.data.length === 0,
      "Student A cannot select Student B's payments"
    );

    // Assertion 6: Student A cannot select Student B's download grants
    const grantsBByStudentA = await clientA
      .from("download_grants")
      .select("*")
      .eq("id", grantB.id);
    assert(
      !grantsBByStudentA.data || grantsBByStudentA.data.length === 0,
      "Student A cannot select Student B's download grants"
    );

    // Assertion 7: Student A cannot select Student B's custom requests
    const requestsBByStudentA = await clientA
      .from("custom_requests")
      .select("*")
      .eq("id", customReqB.id);
    assert(
      !requestsBByStudentA.data || requestsBByStudentA.data.length === 0,
      "Student A cannot select Student B's custom requests"
    );

    // Assertion 8: Student A cannot select Student B's messages
    const messagesBByStudentA = await clientA
      .from("messages")
      .select("*")
      .eq("id", messageB.id);
    assert(
      !messagesBByStudentA.data || messagesBByStudentA.data.length === 0,
      "Student A cannot select Student B's messages"
    );

    // Assertion 9: Student cannot update their own role or insert into user_roles
    const roleInsertByStudent = await clientA
      .from("user_roles")
      .insert({ user_id: idA, role: "admin" });
    assert(
      Boolean(roleInsertByStudent.error),
      "Student cannot insert into user_roles"
    );

    const roleUpdateByStudent = await clientA
      .from("user_roles")
      .update({ role: "admin" })
      .eq("user_id", idA);
    assert(
      Boolean(roleUpdateByStudent.error) ||
        (roleUpdateByStudent.data || []).length === 0,
      "Student cannot update their own role"
    );

    // Assertion 10: Student cannot read project_files directly
    const directFileRead = await clientA
      .from("project_files")
      .select("*")
      .eq("id", fileLive.id);
    assert(
      !directFileRead.data || directFileRead.data.length === 0,
      "Student cannot select project_files directly"
    );

    // Assertion 11: Student can read project_file_summaries view (without storage_path)
    const summaryViewRead = await clientA
      .from("project_file_summaries")
      .select("*")
      .eq("id", fileLive.id);
    assert(
      Boolean(summaryViewRead.data && summaryViewRead.data.length > 0),
      "Student can read public project_file_summaries view"
    );

    // Assertion 12: Student cannot call rate_limit_hit function
    const rpcCall = await clientA.rpc("rate_limit_hit", {
      p_key: "test_key",
      p_limit: 5,
      p_window_seconds: 60,
    });
    assert(
      Boolean(rpcCall.error),
      "Student cannot call rate_limit_hit function directly"
    );

    // Assertion 13: Student cannot update orders or payments
    const orderUpdate = await clientA
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderB.id);
    assert(
      Boolean(orderUpdate.error) || (orderUpdate.data || []).length === 0,
      "Student cannot update orders"
    );

    const paymentUpdate = await clientA
      .from("payments")
      .update({ status: "paid" })
      .eq("id", paymentB.id);
    assert(
      Boolean(paymentUpdate.error) || (paymentUpdate.data || []).length === 0,
      "Student cannot update payments"
    );

    // Assertion 14: Builder sees assigned requests
    const builderRequests = await clientBuilder
      .from("custom_requests")
      .select("*")
      .eq("id", customReqB.id);
    assert(
      Boolean(builderRequests.data && builderRequests.data.length === 1),
      "Builder can select requests assigned to them"
    );

    // Assertion 15: Admin below AAL2 cannot read admin-only tables
    const adminAal1Audit = await clientAdminAal1.from("audit_log").select("*");
    assert(
      !adminAal1Audit.data || adminAal1Audit.data.length === 0,
      "Admin session below AAL2 cannot read audit_log"
    );

    const adminAal1Settings = await clientAdminAal1
      .from("site_settings")
      .select("*");
    assert(
      !adminAal1Settings.data || adminAal1Settings.data.length === 0,
      "Admin session below AAL2 cannot read site_settings"
    );

    // Assertion 16: Student A cannot select Student B's milestones
    const milestonesBByStudentA = await clientA
      .from("milestones")
      .select("*")
      .eq("id", milestoneB.id);
    assert(
      !milestonesBByStudentA.data || milestonesBByStudentA.data.length === 0,
      "Student A cannot select Student B's milestones"
    );

    // Assertion 17: Student A cannot select Student B's request files
    const filesBByStudentA = await clientA
      .from("request_files")
      .select("*")
      .eq("id", requestFileB.id);
    assert(
      !filesBByStudentA.data || filesBByStudentA.data.length === 0,
      "Student A cannot select Student B's request files"
    );

    // Assertion 18: Student cannot insert into custom_request_allowed_transitions
    const transitionInsertByStudent = await clientA
      .from("custom_request_allowed_transitions")
      .insert({ from_status: "submitted", to_status: "completed" });
    assert(
      Boolean(transitionInsertByStudent.error),
      "Student cannot insert into custom_request_allowed_transitions"
    );

    // Assertion 19: Anon cannot update or delete custom_request_allowed_transitions
    const transitionUpdateByAnon = await anonClient
      .from("custom_request_allowed_transitions")
      .delete()
      .eq("from_status", "submitted");
    assert(
      Boolean(transitionUpdateByAnon.error),
      "Anon cannot delete from custom_request_allowed_transitions"
    );

    // Assertion 20: Student cannot directly invoke transition_custom_request RPC
    const transitionRpcByStudent = await clientA.rpc("transition_custom_request", {
      p_request_id: customReqB.id,
      p_target_status: "completed",
      p_actor_id: idA,
    });
    assert(
      Boolean(transitionRpcByStudent.error),
      "Student cannot execute transition_custom_request function"
    );

    // Assertion 21: Public/Anon can read active mentoring tiers, but inactive are hidden
    const anonActiveTiers = await anonClient
      .from("mentoring_tiers")
      .select("id, active")
      .eq("id", activeTier.id);
    assert(
      Boolean(anonActiveTiers.data && anonActiveTiers.data.length === 1),
      "Anon can select active mentoring tiers"
    );

    const anonInactiveTiers = await anonClient
      .from("mentoring_tiers")
      .select("id, active")
      .eq("id", inactiveTier.id);
    assert(
      !anonInactiveTiers.data || anonInactiveTiers.data.length === 0,
      "Anon cannot select inactive mentoring tiers"
    );

    // Assertion 22: Student A cannot select Student B's booking
    const bookingBByStudentA = await clientA
      .from("bookings")
      .select("*")
      .eq("id", bookingB.id);
    assert(
      !bookingBByStudentA.data || bookingBByStudentA.data.length === 0,
      "Student A cannot select Student B's booking"
    );

    // Assertion 23: Builder can select booking for their assigned mentor slot
    const bookingBByBuilder = await clientBuilder
      .from("bookings")
      .select("*")
      .eq("id", bookingB.id);
    assert(
      Boolean(bookingBByBuilder.data && bookingBByBuilder.data.length === 1),
      "Builder can select bookings for their mentor slots"
    );

    // Assertion 24: Student cannot insert into mentoring_tiers directly
    const tierInsertByStudent = await clientA
      .from("mentoring_tiers")
      .insert({
        name: "Hacked Tier",
        price_inr: 0,
        session_count: 1,
        session_minutes: 60,
      });
    assert(
      Boolean(tierInsertByStudent.error),
      "Student cannot insert into mentoring_tiers"
    );

    // Assertion 25: Anon cannot select mentor_slots
    const anonSlots = await anonClient.from("mentor_slots").select("*");
    assert(
      !anonSlots.data || anonSlots.data.length === 0,
      "Anon cannot select mentor_slots directly"
    );
  } finally {
    console.log("\nCleaning up test fixtures and temporary users...");
    for (const uid of createdUserIds) {
      try {
        await adminClient.auth.admin.deleteUser(uid);
      } catch (err) {
        console.warn(`Could not delete user ${uid}:`, err);
      }
    }
  }

  console.log(`\nRLS Test Summary: ${passedCount} passed, ${failedCount} failed.`);
  if (failedCount > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Fatal error during RLS check:", err);
  process.exit(1);
});
