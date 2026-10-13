import "server-only";
import QRCode from "qrcode";
import { siteConfig } from "../../../site.config";
import { getSystemSettings } from "@/server/settings";
import { createAdminClient } from "@/server/supabase/admin";
import type {
  PaymentProvider,
  PaymentInstructions,
  PaymentVerificationDetails,
  PaymentMethod,
} from "./provider";

/**
 * Builds the standard UPI deep-link URI with URL encoding for all query parameters.
 */
export function buildUpiUri(params: {
  vpa: string;
  payeeName: string;
  amountInr: number;
  orderCode: string;
}): string {
  const pa = encodeURIComponent(params.vpa);
  const pn = encodeURIComponent(params.payeeName);
  const am = params.amountInr.toFixed(2);
  const cu = "INR";
  const tn = encodeURIComponent(params.orderCode);
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}&tn=${tn}`;
}

export class ManualUpiProvider implements PaymentProvider {
  readonly id: PaymentMethod = "manual_upi";

  async preparePayment(orderId: string, amountInr: number): Promise<PaymentInstructions> {
    const adminClient = createAdminClient();

    // Fetch order code
    const { data: order, error } = await adminClient
      .from("orders")
      .select("order_code")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      throw new Error("Order not found for payment preparation");
    }

    // Fetch dynamic site settings or fall back to siteConfig
    const settings = await getSystemSettings();
    const payeeName = settings.upi_payee_name || siteConfig.upi.payeeName || "VTU Adda Projects";
    const vpa = settings.upi_vpa || siteConfig.upi.vpa;

    const upiUri = buildUpiUri({
      vpa,
      payeeName,
      amountInr,
      orderCode: order.order_code,
    });

    const qrSvg = await QRCode.toString(upiUri, {
      type: "svg",
      margin: 1,
      width: 256,
    });

    return {
      method: "manual_upi",
      amountInr,
      orderCode: order.order_code,
      payeeName,
      vpa,
      qrPayload: qrSvg,
      notes: upiUri,
    };
  }

  async describeVerification(paymentId: string): Promise<PaymentVerificationDetails> {
    const adminClient = createAdminClient();

    const { data: payment, error } = await adminClient
      .from("payments")
      .select("order_id, utr, proof_path, submitted_at, verified_by, verified_at, reject_reason, created_at")
      .eq("id", paymentId)
      .single();

    if (error || !payment) {
      throw new Error("Payment record not found");
    }

    return {
      orderId: payment.order_id,
      utr: payment.utr ?? undefined,
      proofPath: payment.proof_path ?? undefined,
      submittedAt: new Date(payment.submitted_at || payment.created_at),
      verifiedBy: payment.verified_by ?? undefined,
      verifiedAt: payment.verified_at ? new Date(payment.verified_at) : undefined,
      rejectReason: payment.reject_reason ?? undefined,
    };
  }
}

const manualUpiProviderInstance = new ManualUpiProvider();

/**
 * Payment provider registry. Currently resolves manual_upi.
 */
export function getProvider(id: PaymentMethod = "manual_upi"): PaymentProvider {
  if (id === "manual_upi") {
    return manualUpiProviderInstance;
  }
  throw new Error(`Unsupported payment method: ${id}`);
}
