import { escapeHtml } from "./escape";
import { formatInr } from "@/lib/format";

export interface EmailRenderResult {
  subject: string;
  text: string;
  html: string;
}

export interface PaymentSubmittedAdminData {
  orderCode: string;
  amountInr: number;
  kitTitle: string;
  utrLast4: string;
  studentDisplayName?: string;
  orderUrl: string;
}

export interface PaymentReceivedStudentData {
  orderCode: string;
  amountInr: number;
  kitTitle: string;
  utrLast4: string;
  studentDisplayName: string;
  orderUrl: string;
  verificationTimeText?: string | null;
}

export interface OrderExpiredStudentData {
  orderCode: string;
  kitTitle: string;
  studentDisplayName: string;
  reorderUrl: string;
}

export interface PaymentApprovedStudentData {
  orderCode: string;
  studentDisplayName: string;
  kitTitle: string;
  amountInr: number;
  orderUrl: string;
}

export interface PaymentRejectedStudentData {
  orderCode: string;
  studentDisplayName: string;
  kitTitle: string;
  reason: string;
  note?: string | null;
  reorderUrl: string;
}

export interface RefundRecordedStudentData {
  orderCode: string;
  studentDisplayName: string;
  kitTitle: string;
  refundAmountInr: number;
  refundReference: string;
}

export function paymentSubmittedAdminTemplate(
  data: PaymentSubmittedAdminData
): EmailRenderResult {
  const safeOrderCode = escapeHtml(data.orderCode);
  const safeKitTitle = escapeHtml(data.kitTitle);
  const safeUtrLast4 = escapeHtml(data.utrLast4);
  const safeStudentName = escapeHtml(data.studentDisplayName || "A student");
  const formattedAmount = formatInr(data.amountInr);

  const subject = `[Admin] Payment submitted for order ${data.orderCode}`;

  const text = [
    `Payment submission notification`,
    ``,
    `Order Code: ${data.orderCode}`,
    `Kit Title: ${data.kitTitle}`,
    `Amount: ${formattedAmount}`,
    `Student: ${data.studentDisplayName || "Student"}`,
    `UTR (last 4 digits): ending in ${data.utrLast4}`,
    ``,
    `Please check your bank record and verify this payment in the admin portal:`,
    data.orderUrl,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C; background-color: #FFFFFF; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #DDD9D0; border-radius: 6px; padding: 24px;">
    <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #17191C;">New payment submitted</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      ${safeStudentName} has submitted payment details for order <strong>${safeOrderCode}</strong>.
    </p>
    <table style="width: 512px; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Order Code:</td>
        <td style="padding: 8px 0; font-family: monospace; font-weight: 600; text-align: right; border-bottom: 1px solid #DDD9D0;">${safeOrderCode}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Kit:</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #DDD9D0;">${safeKitTitle}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Amount:</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #DDD9D0;">${formattedAmount}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">UTR Reference:</td>
        <td style="padding: 8px 0; font-family: monospace; text-align: right; border-bottom: 1px solid #DDD9D0;">ending in ${safeUtrLast4}</td>
      </tr>
    </table>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #4A5058;">
      Review bank records and verify this order at:
    </p>
    <p style="margin: 0; font-size: 14px; word-break: break-all;">
      <a href="${escapeHtml(data.orderUrl)}" style="color: #0B5D4B; text-decoration: underline;">${escapeHtml(data.orderUrl)}</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function paymentReceivedStudentTemplate(
  data: PaymentReceivedStudentData
): EmailRenderResult {
  const safeOrderCode = escapeHtml(data.orderCode);
  const safeKitTitle = escapeHtml(data.kitTitle);
  const safeUtrLast4 = escapeHtml(data.utrLast4);
  const safeStudentName = escapeHtml(data.studentDisplayName || "Student");
  const formattedAmount = formatInr(data.amountInr);

  const subject = `We received your payment details for order ${data.orderCode}`;

  const textLines = [
    `Hello ${data.studentDisplayName || "Student"},`,
    ``,
    `We received your payment details for order ${data.orderCode}.`,
    ``,
    `Kit: ${data.kitTitle}`,
    `Amount: ${formattedAmount}`,
    `UTR (last 4 digits): ending in ${data.utrLast4}`,
    ``,
    `We check your UTR number and the amount against our bank record.`,
  ];

  if (data.verificationTimeText) {
    textLines.push(data.verificationTimeText);
  }

  textLines.push(
    ``,
    `You can track the verification progress on your order page:`,
    data.orderUrl
  );

  const text = textLines.join("\n");

  const verificationNoteHtml = data.verificationTimeText
    ? `<p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058; background-color: #FBFAF7; padding: 12px; border-radius: 4px; border: 1px solid #DDD9D0;">${escapeHtml(
        data.verificationTimeText
      )}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C; background-color: #FFFFFF; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #DDD9D0; border-radius: 6px; padding: 24px;">
    <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #17191C;">Payment details received</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Hello ${safeStudentName},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      We have received your payment details for order <strong>${safeOrderCode}</strong>.
    </p>
    <table style="width: 512px; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Order Code:</td>
        <td style="padding: 8px 0; font-family: monospace; font-weight: 600; text-align: right; border-bottom: 1px solid #DDD9D0;">${safeOrderCode}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Kit:</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #DDD9D0;">${safeKitTitle}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Amount:</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #DDD9D0;">${formattedAmount}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">UTR:</td>
        <td style="padding: 8px 0; font-family: monospace; text-align: right; border-bottom: 1px solid #DDD9D0;">ending in ${safeUtrLast4}</td>
      </tr>
    </table>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      We check your UTR number and amount against our bank records before releasing your project deliverables.
    </p>
    ${verificationNoteHtml}
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #4A5058;">
      Track your order status:
    </p>
    <p style="margin: 0; font-size: 14px; word-break: break-all;">
      <a href="${escapeHtml(data.orderUrl)}" style="color: #0B5D4B; text-decoration: underline;">${escapeHtml(data.orderUrl)}</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function orderExpiredStudentTemplate(
  data: OrderExpiredStudentData
): EmailRenderResult {
  const safeOrderCode = escapeHtml(data.orderCode);
  const safeKitTitle = escapeHtml(data.kitTitle);
  const safeStudentName = escapeHtml(data.studentDisplayName || "Student");

  const subject = `Order ${data.orderCode} has expired`;

  const text = [
    `Hello ${data.studentDisplayName || "Student"},`,
    ``,
    `Your order ${data.orderCode} for "${data.kitTitle}" has expired because payment was not completed before the deadline.`,
    ``,
    `If you still wish to purchase this project kit, please start a new order:`,
    data.reorderUrl,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C; background-color: #FFFFFF; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #DDD9D0; border-radius: 6px; padding: 24px;">
    <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #17191C;">Order expired</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Hello ${safeStudentName},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Your order <strong>${safeOrderCode}</strong> for <strong>${safeKitTitle}</strong> has expired because payment details were not submitted before the expiry deadline.
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      If you still wish to purchase this project kit, you can start a new order at:
    </p>
    <p style="margin: 0; font-size: 14px; word-break: break-all;">
      <a href="${escapeHtml(data.reorderUrl)}" style="color: #0B5D4B; text-decoration: underline;">${escapeHtml(data.reorderUrl)}</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function paymentApprovedStudentTemplate(
  data: PaymentApprovedStudentData
): EmailRenderResult {
  const safeOrderCode = escapeHtml(data.orderCode);
  const safeKitTitle = escapeHtml(data.kitTitle);
  const safeStudentName = escapeHtml(data.studentDisplayName || "Student");
  const formattedAmount = formatInr(data.amountInr);

  const subject = `Payment verified for order ${data.orderCode} - access granted`;

  const text = [
    `Hello ${data.studentDisplayName || "Student"},`,
    ``,
    `Your payment of ${formattedAmount} for order ${data.orderCode} (${data.kitTitle}) has been verified.`,
    ``,
    `Your project deliverables are now unlocked. You can download your files and licence slip directly from your order page:`,
    data.orderUrl,
    ``,
    `Please log in with the account you used during purchase to access your files.`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C; background-color: #FFFFFF; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #DDD9D0; border-radius: 6px; padding: 24px;">
    <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #1E6B3C;">Payment verified</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Hello ${safeStudentName},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Good news. Your payment for order <strong>${safeOrderCode}</strong> has been verified.
    </p>
    <table style="width: 512px; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Order Code:</td>
        <td style="padding: 8px 0; font-family: monospace; font-weight: 600; text-align: right; border-bottom: 1px solid #DDD9D0;">${safeOrderCode}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Kit:</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #DDD9D0;">${safeKitTitle}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Amount Paid:</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #DDD9D0;">${formattedAmount}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Access Status:</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #1E6B3C; border-bottom: 1px solid #DDD9D0;">Unlocked</td>
      </tr>
    </table>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #4A5058;">
      Your project files and licence slip are ready for download in your order dashboard:
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; word-break: break-all;">
      <a href="${escapeHtml(data.orderUrl)}" style="color: #0B5D4B; text-decoration: underline; font-weight: 600;">${escapeHtml(data.orderUrl)}</a>
    </p>
    <p style="margin: 0; font-size: 12px; color: #5F6670;">
      Deliverables are licensed for your individual academic use.
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function paymentRejectedStudentTemplate(
  data: PaymentRejectedStudentData
): EmailRenderResult {
  const safeOrderCode = escapeHtml(data.orderCode);
  const safeKitTitle = escapeHtml(data.kitTitle);
  const safeStudentName = escapeHtml(data.studentDisplayName || "Student");
  const safeReason = escapeHtml(data.reason);
  const safeNote = data.note ? escapeHtml(data.note) : "";

  const subject = `Update regarding your payment for order ${data.orderCode}`;

  const textLines = [
    `Hello ${data.studentDisplayName || "Student"},`,
    ``,
    `We could not verify your payment for order ${data.orderCode} (${data.kitTitle}).`,
    ``,
    `Reason: ${data.reason}`,
  ];

  if (data.note) {
    textLines.push(`Note from reviewer: ${data.note}`);
  }

  textLines.push(
    ``,
    `You can review your order and submit payment details again at:`,
    data.reorderUrl
  );

  const text = textLines.join("\n");

  const noteBlock = data.note
    ? `<div style="margin: 0 0 16px 0; padding: 12px; background-color: #FBFAF7; border: 1px solid #DDD9D0; border-radius: 4px; font-size: 14px; color: #4A5058;"><strong>Reviewer note:</strong> ${safeNote}</div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C; background-color: #FFFFFF; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #DDD9D0; border-radius: 6px; padding: 24px;">
    <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #A12B2B;">Payment could not be verified</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Hello ${safeStudentName},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      We reviewed your submitted payment details for order <strong>${safeOrderCode}</strong> (${safeKitTitle}), but were unable to confirm the transaction.
    </p>
    <div style="margin: 0 0 16px 0; padding: 12px; background-color: #FBE9E7; border: 1px solid #DDD9D0; border-radius: 4px; font-size: 14px; color: #A12B2B;">
      <strong>Reason:</strong> ${safeReason}
    </div>
    ${noteBlock}
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #4A5058;">
      You can re-check your UPI transaction reference and submit updated details:
    </p>
    <p style="margin: 0; font-size: 14px; word-break: break-all;">
      <a href="${escapeHtml(data.reorderUrl)}" style="color: #0B5D4B; text-decoration: underline;">${escapeHtml(data.reorderUrl)}</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function refundRecordedStudentTemplate(
  data: RefundRecordedStudentData
): EmailRenderResult {
  const safeOrderCode = escapeHtml(data.orderCode);
  const safeKitTitle = escapeHtml(data.kitTitle);
  const safeStudentName = escapeHtml(data.studentDisplayName || "Student");
  const safeReference = escapeHtml(data.refundReference);
  const formattedAmount = formatInr(data.refundAmountInr);

  const subject = `Refund recorded for order ${data.orderCode}`;

  const text = [
    `Hello ${data.studentDisplayName || "Student"},`,
    ``,
    `A refund of ${formattedAmount} has been recorded for your order ${data.orderCode} (${data.kitTitle}).`,
    ``,
    `Refund Reference: ${data.refundReference}`,
    ``,
    `As this order has been refunded, access to the downloadable deliverables has been closed.`,
    ``,
    `If you have questions regarding this transaction, please reply with your order code.`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C; background-color: #FFFFFF; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #DDD9D0; border-radius: 6px; padding: 24px;">
    <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #17191C;">Refund recorded</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Hello ${safeStudentName},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      A refund has been recorded for your order <strong>${safeOrderCode}</strong> (${safeKitTitle}).
    </p>
    <table style="width: 512px; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Order Code:</td>
        <td style="padding: 8px 0; font-family: monospace; font-weight: 600; text-align: right; border-bottom: 1px solid #DDD9D0;">${safeOrderCode}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Kit:</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #DDD9D0;">${safeKitTitle}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Refund Amount:</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #DDD9D0;">${formattedAmount}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Reference:</td>
        <td style="padding: 8px 0; font-family: monospace; text-align: right; border-bottom: 1px solid #DDD9D0;">${safeReference}</td>
      </tr>
    </table>
    <p style="margin: 0; font-size: 14px; color: #4A5058;">
      Because this order has been refunded, download access for these deliverables has been revoked.
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

