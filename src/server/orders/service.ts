import "server-only";
import crypto from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { siteConfig } from "../../../site.config";
import { createAdminClient } from "@/server/supabase/admin";
import { getSystemSettings } from "@/server/settings";
import { rateLimit } from "@/server/security/rate-limit";
import { detectImageSignature } from "@/server/storage/file-signatures";
import { generateOrderCode } from "./code";
import { validateAndApplyCoupon } from "./coupons";
import { sendEmail } from "@/server/email";
import { logger } from "@/server/log";

export const createOrderInputSchema = z.object({
  projectSlug: z.string().trim().min(1).max(120),
  couponCode: z.string().trim().max(50).optional().nullable(),
  displayName: z.string().trim().min(1).max(60).optional().nullable(),
  ackIntegrity: z.literal(true, {
    errorMap: () => ({
      message:
        "You must confirm that you will follow your college and VTU rules.",
    }),
  }),
});

export const submitPaymentProofInputSchema = z.object({
  orderId: z.string().uuid(),
  utr: z
    .string()
    .trim()
    .regex(/^[0-9]{12}$/, "UTR number must be exactly 12 digits"),
  paidVia: z.string().trim().max(30).optional().nullable(),
});

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  orderCode?: string;
  isExisting?: boolean;
  isAlreadyPaid?: boolean;
  errorMessage?: string;
}

export interface SubmitPaymentProofResult {
  success: boolean;
  orderId?: string;
  errorMessage?: string;
}

/**
 * Creates an order for a project kit, enforcing rate limits, sales limits,
 * server-side price calculation and database locking.
 */
export async function createKitOrder(
  userId: string,
  input: z.infer<typeof createOrderInputSchema>
): Promise<CreateOrderResult> {
  // 1. Rate limiting: 10 new orders per user per hour
  const rate = await rateLimit(`checkout_create_${userId}`, 10, 3600);
  if (!rate.allowed) {
    return {
      success: false,
      errorMessage:
        "Order creation limit reached. Please wait an hour before creating another order.",
    };
  }

  const adminClient = createAdminClient();

  // 2. Fetch live project from database to get the genuine price
  const { data: project, error: projectError } = await adminClient
    .from("projects")
    .select("id, slug, title, price_inr, status, sales_limit, sales_window_start")
    .eq("slug", input.projectSlug)
    .single();

  if (projectError || !project || project.status !== "live") {
    return {
      success: false,
      errorMessage: "The requested project is not available.",
    };
  }

  // 3. Update profile display name if user does not have one yet
  if (input.displayName) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.display_name || profile.display_name === "Student") {
      await adminClient
        .from("profiles")
        .update({
          display_name: input.displayName.trim().slice(0, 60),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }
  }

  // 4. Validate coupon on the server
  const couponResult = await validateAndApplyCoupon(
    input.couponCode,
    project.price_inr
  );

  if (!couponResult.valid) {
    return {
      success: false,
      errorMessage: couponResult.errorMessage || "Invalid coupon code.",
    };
  }

  const subtotalInr = project.price_inr;
  const discountInr = couponResult.discountInr;
  const totalInr = couponResult.finalTotalInr;
  const couponId = couponResult.couponId || null;

  // 5. Calculate expiration from settings
  const settings = await getSystemSettings();
  const expiryHours = settings.order_expiry_hours || 24;
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
  const orderCode = generateOrderCode();

  // 6. Execute atomic SQL RPC function
  const { data: rpcResult, error: rpcError } = await adminClient.rpc(
    "create_kit_order",
    {
      p_user_id: userId,
      p_project_id: project.id,
      p_order_code: orderCode,
      p_subtotal_inr: subtotalInr,
      p_discount_inr: discountInr,
      p_total_inr: totalInr,
      p_coupon_id: couponId,
      p_expires_at: expiresAt,
    }
  );

  if (rpcError) {
    const errMsg = rpcError.message || "";
    if (errMsg.includes("ALREADY_PAID")) {
      return {
        success: false,
        isAlreadyPaid: true,
        errorMessage: "You have already purchased this kit.",
      };
    }
    if (errMsg.includes("SALES_LIMIT_REACHED")) {
      return {
        success: false,
        errorMessage:
          "This kit is not available right now. You can ask for a custom version, or check again next semester.",
      };
    }
    logger.warn("Order creation RPC returned error", { code: rpcError.code });
    return {
      success: false,
      errorMessage: "Could not create order. Please try again.",
    };
  }

  const createdOrder = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
  if (!createdOrder) {
    return {
      success: false,
      errorMessage: "Could not finalize order record.",
    };
  }

  return {
    success: true,
    orderId: createdOrder.order_id,
    orderCode: createdOrder.order_code,
    isExisting: Boolean(createdOrder.is_existing),
  };
}

/**
 * Submits payment proof (UTR and optional screenshot) for an order,
 * atomically transitioning the order to pending_verification and dispatching emails.
 */
export async function submitOrderPaymentProof({
  userId,
  userEmail,
  orderId,
  utr,
  screenshotBuffer,
}: {
  userId: string;
  userEmail: string;
  orderId: string;
  utr: string;
  screenshotBuffer?: Buffer | null;
}): Promise<SubmitPaymentProofResult> {
  // 1. Rate limit: 5 submissions per user per hour
  const rate = await rateLimit(`payment_submit_${userId}`, 5, 3600);
  if (!rate.allowed) {
    return {
      success: false,
      errorMessage:
        "Payment submission limit reached. Please wait before submitting again.",
    };
  }

  const adminClient = createAdminClient();

  // 2. Process optional screenshot
  let proofPath: string | null = null;
  if (screenshotBuffer && screenshotBuffer.length > 0) {
    // Check max size: 3 MB
    if (screenshotBuffer.length > 3 * 1024 * 1024) {
      return {
        success: false,
        errorMessage: "Payment screenshot must be 3 MB or less.",
      };
    }

    // Verify magic bytes
    const detectedType = detectImageSignature(screenshotBuffer);
    if (!detectedType) {
      return {
        success: false,
        errorMessage:
          "Invalid image format. Allowed formats: PNG, JPEG, or WebP.",
      };
    }

    try {
      // Re-encode with sharp to webp (maximum 1600px, metadata stripped)
      const webpBuffer = await sharp(screenshotBuffer)
        .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      const proofFileName = `${crypto.randomUUID()}.webp`;
      proofPath = `${userId}/${orderId}/${proofFileName}`;

      const { error: uploadError } = await adminClient.storage
        .from("payment-proofs")
        .upload(proofPath, webpBuffer, {
          contentType: "image/webp",
          upsert: false,
        });

      if (uploadError) {
        logger.warn("Proof screenshot storage failed", { orderId });
        return {
          success: false,
          errorMessage:
            "Could not upload screenshot. Please try again without the screenshot or try a smaller image.",
        };
      }
    } catch {
      logger.warn("Image re-encoding error", { orderId });
      return {
        success: false,
        errorMessage: "Failed to process screenshot image. Please try again.",
      };
    }
  }

  // 3. Execute atomic SQL RPC function
  const { data: rpcResult, error: rpcError } = await adminClient.rpc(
    "submit_payment_proof",
    {
      p_order_id: orderId,
      p_user_id: userId,
      p_utr: utr,
      p_proof_path: proofPath,
    }
  );

  if (rpcError) {
    const errMsg = rpcError.message || "";
    if (errMsg.includes("UTR_ALREADY_USED")) {
      return {
        success: false,
        errorMessage:
          "This UTR is already used for another order. Check the number or contact support.",
      };
    }
    if (errMsg.includes("ORDER_EXPIRED")) {
      return {
        success: false,
        errorMessage: "This order has expired.",
      };
    }
    if (errMsg.includes("MAX_ATTEMPTS_EXCEEDED")) {
      return {
        success: false,
        errorMessage:
          "Maximum payment attempts reached for this order. Please contact support.",
      };
    }
    if (errMsg.includes("ORDER_NOT_FOUND")) {
      return {
        success: false,
        errorMessage: "Order not found.",
      };
    }
    logger.warn("Payment submission RPC failed", { code: rpcError.code });
    return {
      success: false,
      errorMessage: "Could not submit payment details. Please try again.",
    };
  }

  const resultData = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
  const orderCode = resultData?.order_code || "Order";
  const totalInr = resultData?.total_inr || 0;
  const kitTitle = resultData?.kit_title || "Project Kit";
  const utrLast4 = utr.slice(-4);

  // 4. Fetch student display name for personalized email
  const { data: profile } = await adminClient
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  const studentDisplayName = profile?.display_name || "Student";
  const settings = await getSystemSettings();
  const orderUrl = `${siteConfig.siteUrl}/account/orders/${orderId}`;
  const adminOrderUrl = `${siteConfig.siteUrl}/admin/orders/${orderId}`;

  // 5. Send emails (non-blocking, never fails the response)
  try {
    // Collect all admin emails
    const { data: adminRows } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminEmails: string[] = [siteConfig.supportEmail];
    if (adminRows) {
      for (const row of adminRows) {
        const { data: adminUser } = await adminClient.auth.admin.getUserById(
          row.user_id
        );
        if (adminUser?.user?.email && !adminEmails.includes(adminUser.user.email)) {
          adminEmails.push(adminUser.user.email);
        }
      }
    }

    // Email 1: payment_submitted_admin
    await sendEmail("payment_submitted_admin", adminEmails, {
      orderCode,
      amountInr: totalInr,
      kitTitle,
      utrLast4,
      studentDisplayName,
      orderUrl: adminOrderUrl,
    });

    // Email 2: payment_received_student
    await sendEmail(
      "payment_received_student",
      userEmail,
      {
        orderCode,
        amountInr: totalInr,
        kitTitle,
        utrLast4,
        studentDisplayName,
        orderUrl,
        verificationTimeText: settings.verification_time_text,
      },
      userId
    );
  } catch {
    // Non-fatal email logging
    logger.warn("Post-submission email failed", { orderId });
  }

  return {
    success: true,
    orderId,
  };
}
