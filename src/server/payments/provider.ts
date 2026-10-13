import "server-only";

export type PaymentMethod = "manual_upi";

export type PaymentStatus =
  | "awaiting_payment"
  | "pending_verification"
  | "paid"
  | "rejected"
  | "expired"
  | "refunded";

export interface PaymentInstructions {
  method: PaymentMethod;
  amountInr: number;
  orderCode: string;
  payeeName: string;
  vpa: string;
  qrPayload?: string;
  notes?: string;
}

export interface PaymentVerificationDetails {
  orderId: string;
  utr?: string;
  proofPath?: string;
  submittedAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectReason?: string;
}

export interface PaymentProvider {
  readonly id: PaymentMethod;
  preparePayment(orderId: string, amountInr: number): Promise<PaymentInstructions>;
  describeVerification(paymentId: string): Promise<PaymentVerificationDetails>;
}
