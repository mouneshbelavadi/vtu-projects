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

export interface RequestReceivedData {
  studentDisplayName: string;
  requestTitle: string;
  requestUrl: string;
}

export interface QuoteSentData {
  studentDisplayName: string;
  requestTitle: string;
  totalPriceInr: number;
  depositAmountInr: number;
  validUntilText: string;
  requestUrl: string;
}

export interface RequestDeclinedData {
  studentDisplayName: string;
  requestTitle: string;
  reason: string;
  requestUrl: string;
}

export interface MilestoneInputNeededData {
  studentDisplayName: string;
  requestTitle: string;
  milestoneTitle: string;
  instructions: string;
  requestUrl: string;
}

export interface NewMessageData {
  recipientDisplayName: string;
  senderName: string;
  requestTitle: string;
  messageSnippet: string;
  requestUrl: string;
}

export interface FinalFilesReadyData {
  studentDisplayName: string;
  requestTitle: string;
  balanceAmountInr: number;
  requestUrl: string;
}

export interface RequestCompletedData {
  studentDisplayName: string;
  requestTitle: string;
  requestUrl: string;
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

export function requestReceivedTemplate(
  data: RequestReceivedData
): EmailRenderResult {
  const safeName = escapeHtml(data.studentDisplayName || "Student");
  const safeTitle = escapeHtml(data.requestTitle);

  const subject = `Custom project request received: ${data.requestTitle}`;

  const text = [
    `Hello ${data.studentDisplayName || "Student"},`,
    ``,
    `We have received your custom project request for "${data.requestTitle}".`,
    ``,
    `Our engineering team is reviewing your brief and project requirements. You will receive a written scope, timeline, and quote shortly.`,
    ``,
    `You can track your request status and review details at:`,
    data.requestUrl,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C; background-color: #FFFFFF; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #DDD9D0; border-radius: 6px; padding: 24px;">
    <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #17191C;">Custom request received</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Hello ${safeName},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      We have received your custom project request for <strong>${safeTitle}</strong>.
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Our team is reviewing your brief and requirements. We will send a written scope of work and quote for your approval.
    </p>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #4A5058;">
      View your request status:
    </p>
    <p style="margin: 0; font-size: 14px; word-break: break-all;">
      <a href="${escapeHtml(data.requestUrl)}" style="color: #0B5D4B; text-decoration: underline;">${escapeHtml(data.requestUrl)}</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function quoteSentTemplate(
  data: QuoteSentData
): EmailRenderResult {
  const safeName = escapeHtml(data.studentDisplayName || "Student");
  const safeTitle = escapeHtml(data.requestTitle);
  const formattedTotal = formatInr(data.totalPriceInr);
  const formattedDeposit = formatInr(data.depositAmountInr);

  const subject = `Quote ready for your project: ${data.requestTitle}`;

  const text = [
    `Hello ${data.studentDisplayName || "Student"},`,
    ``,
    `A quote has been prepared for your custom project "${data.requestTitle}".`,
    ``,
    `Total Price: ${formattedTotal}`,
    `Deposit Required: ${formattedDeposit}`,
    `Valid Until: ${data.validUntilText}`,
    ``,
    `Review the full milestone breakdown, scope text, and accept the quote at:`,
    data.requestUrl,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C; background-color: #FFFFFF; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #DDD9D0; border-radius: 6px; padding: 24px;">
    <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #1E6B3C;">Project quote ready</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Hello ${safeName},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      We have prepared a project scope and milestone timeline for <strong>${safeTitle}</strong>.
    </p>
    <table style="width: 512px; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Total Price:</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #DDD9D0;">${formattedTotal}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Deposit to Begin:</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #DDD9D0;">${formattedDeposit}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Valid Until:</td>
        <td style="padding: 8px 0; font-family: monospace; text-align: right; border-bottom: 1px solid #DDD9D0;">${escapeHtml(data.validUntilText)}</td>
      </tr>
    </table>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #4A5058;">
      Review the written milestones and accept your quote:
    </p>
    <p style="margin: 0; font-size: 14px; word-break: break-all;">
      <a href="${escapeHtml(data.requestUrl)}" style="color: #0B5D4B; text-decoration: underline; font-weight: 600;">${escapeHtml(data.requestUrl)}</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function requestDeclinedTemplate(
  data: RequestDeclinedData
): EmailRenderResult {
  const safeName = escapeHtml(data.studentDisplayName || "Student");
  const safeTitle = escapeHtml(data.requestTitle);
  const safeReason = escapeHtml(data.reason);

  const subject = `Update regarding custom project: ${data.requestTitle}`;

  const text = [
    `Hello ${data.studentDisplayName || "Student"},`,
    ``,
    `Thank you for submitting your custom project request for "${data.requestTitle}".`,
    ``,
    `Unfortunately, we are unable to accept this request at this time.`,
    `Reason: ${data.reason}`,
    ``,
    `You can review your request details at:`,
    data.requestUrl,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C; background-color: #FFFFFF; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #DDD9D0; border-radius: 6px; padding: 24px;">
    <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #A12B2B;">Custom request update</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Hello ${safeName},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      We reviewed your request for <strong>${safeTitle}</strong>, but we are unable to take on this project.
    </p>
    <div style="margin: 0 0 16px 0; padding: 12px; background-color: #FBE9E7; border: 1px solid #DDD9D0; border-radius: 4px; font-size: 14px; color: #A12B2B;">
      <strong>Reason:</strong> ${safeReason}
    </div>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #4A5058;">
      View request details:
    </p>
    <p style="margin: 0; font-size: 14px; word-break: break-all;">
      <a href="${escapeHtml(data.requestUrl)}" style="color: #0B5D4B; text-decoration: underline;">${escapeHtml(data.requestUrl)}</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function milestoneInputNeededTemplate(
  data: MilestoneInputNeededData
): EmailRenderResult {
  const safeName = escapeHtml(data.studentDisplayName || "Student");
  const safeTitle = escapeHtml(data.requestTitle);
  const safeMilestone = escapeHtml(data.milestoneTitle);
  const safeInstructions = escapeHtml(data.instructions);

  const subject = `Action needed on milestone: ${data.milestoneTitle}`;

  const text = [
    `Hello ${data.studentDisplayName || "Student"},`,
    ``,
    `Your custom project "${data.requestTitle}" requires your input to proceed.`,
    ``,
    `Milestone: ${data.milestoneTitle}`,
    `Requested Input: ${data.instructions}`,
    ``,
    `Please log in to your account and submit the required details:`,
    data.requestUrl,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C; background-color: #FFFFFF; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #DDD9D0; border-radius: 6px; padding: 24px;">
    <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #6B4700;">Student input needed</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Hello ${safeName},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Your assigned builder has reached a milestone on <strong>${safeTitle}</strong> that requires your input:
    </p>
    <div style="margin: 0 0 16px 0; padding: 12px; background-color: #FFF4D6; border: 1px solid #DDD9D0; border-radius: 4px; font-size: 14px; color: #6B4700;">
      <strong>${safeMilestone}:</strong> ${safeInstructions}
    </div>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #4A5058;">
      Submit your response in your project dashboard:
    </p>
    <p style="margin: 0; font-size: 14px; word-break: break-all;">
      <a href="${escapeHtml(data.requestUrl)}" style="color: #0B5D4B; text-decoration: underline; font-weight: 600;">${escapeHtml(data.requestUrl)}</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function newMessageTemplate(
  data: NewMessageData
): EmailRenderResult {
  const safeRecipient = escapeHtml(data.recipientDisplayName || "User");
  const safeSender = escapeHtml(data.senderName || "Project collaborator");
  const safeTitle = escapeHtml(data.requestTitle);
  const safeSnippet = escapeHtml(data.messageSnippet);

  const subject = `New message on project: ${data.requestTitle}`;

  const text = [
    `Hello ${data.recipientDisplayName || "User"},`,
    ``,
    `${data.senderName} sent a new message on "${data.requestTitle}":`,
    ``,
    `"${data.messageSnippet}"`,
    ``,
    `View the full discussion thread at:`,
    data.requestUrl,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C; background-color: #FFFFFF; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #DDD9D0; border-radius: 6px; padding: 24px;">
    <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #17191C;">New message received</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Hello ${safeRecipient},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      <strong>${safeSender}</strong> posted a message on <strong>${safeTitle}</strong>:
    </p>
    <div style="margin: 0 0 16px 0; padding: 12px; background-color: #FBFAF7; border: 1px solid #DDD9D0; border-radius: 4px; font-size: 14px; color: #17191C;">
      ${safeSnippet}
    </div>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #4A5058;">
      Open the conversation thread:
    </p>
    <p style="margin: 0; font-size: 14px; word-break: break-all;">
      <a href="${escapeHtml(data.requestUrl)}" style="color: #0B5D4B; text-decoration: underline;">${escapeHtml(data.requestUrl)}</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function finalFilesReadyTemplate(
  data: FinalFilesReadyData
): EmailRenderResult {
  const safeName = escapeHtml(data.studentDisplayName || "Student");
  const safeTitle = escapeHtml(data.requestTitle);
  const formattedBalance = formatInr(data.balanceAmountInr);

  const subject = `Deliverables completed for project: ${data.requestTitle}`;

  const text = [
    `Hello ${data.studentDisplayName || "Student"},`,
    ``,
    `Great news. Your assigned builder has uploaded the final deliverables for "${data.requestTitle}".`,
    ``,
    `Balance Due: ${formattedBalance}`,
    ``,
    `Final files are released immediately after the balance payment is verified.`,
    ``,
    `Review your project and complete the balance payment at:`,
    data.requestUrl,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C; background-color: #FFFFFF; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #DDD9D0; border-radius: 6px; padding: 24px;">
    <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #1E6B3C;">Final files ready</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Hello ${safeName},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      All milestones and deliverable files for <strong>${safeTitle}</strong> have been completed by your builder.
    </p>
    <table style="width: 512px; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Project:</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #DDD9D0;">${safeTitle}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5F6670; border-bottom: 1px solid #DDD9D0;">Balance Due:</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #DDD9D0;">${formattedBalance}</td>
      </tr>
    </table>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #4A5058;">
      Pay the remaining balance to download your deliverables:
    </p>
    <p style="margin: 0; font-size: 14px; word-break: break-all;">
      <a href="${escapeHtml(data.requestUrl)}" style="color: #0B5D4B; text-decoration: underline; font-weight: 600;">${escapeHtml(data.requestUrl)}</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function requestCompletedTemplate(
  data: RequestCompletedData
): EmailRenderResult {
  const safeName = escapeHtml(data.studentDisplayName || "Student");
  const safeTitle = escapeHtml(data.requestTitle);

  const subject = `Project completed: ${data.requestTitle}`;

  const text = [
    `Hello ${data.studentDisplayName || "Student"},`,
    ``,
    `Your balance payment has been verified and your custom project "${data.requestTitle}" is now complete.`,
    ``,
    `Your final deliverables and licence slip are now unlocked and ready for download in your project dashboard:`,
    data.requestUrl,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C; background-color: #FFFFFF; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #DDD9D0; border-radius: 6px; padding: 24px;">
    <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #1E6B3C;">Project completed</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Hello ${safeName},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Your balance payment for <strong>${safeTitle}</strong> has been confirmed. Your final project files and licence slip are now unlocked.
    </p>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #4A5058;">
      Download your completed project deliverables:
    </p>
    <p style="margin: 0; font-size: 14px; word-break: break-all;">
      <a href="${escapeHtml(data.requestUrl)}" style="color: #0B5D4B; text-decoration: underline; font-weight: 600;">${escapeHtml(data.requestUrl)}</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

// Prompt 9: Mentoring Bookings Email Templates

export interface BookingReceivedData {
  studentDisplayName: string;
  tierName: string;
  sessionTimeIst: string;
  orderCode: string;
  checkoutUrl: string;
}

export interface BookingConfirmedData {
  studentDisplayName: string;
  tierName: string;
  sessionTimeIst: string;
  meetUrl: string;
  bookingsUrl: string;
}

export interface BookingCancelledData {
  studentDisplayName: string;
  tierName: string;
  sessionTimeIst: string;
  reason?: string | null;
}

export interface SessionReminderData {
  recipientDisplayName: string;
  tierName: string;
  sessionTimeIst: string;
  meetUrl?: string | null;
  role: "student" | "mentor";
  sessionUrl: string;
}

export function bookingReceivedTemplate(
  data: BookingReceivedData
): EmailRenderResult {
  const safeName = escapeHtml(data.studentDisplayName || "Student");
  const safeTier = escapeHtml(data.tierName);
  const safeTime = escapeHtml(data.sessionTimeIst);
  const safeCode = escapeHtml(data.orderCode);
  const safeUrl = escapeHtml(data.checkoutUrl);

  const subject = `Booking hold created: ${data.tierName}`;

  const text = [
    `Hello ${data.studentDisplayName || "Student"},`,
    ``,
    `Your mentoring session hold for "${data.tierName}" has been reserved for ${data.sessionTimeIst}.`,
    `Order reference: ${data.orderCode}`,
    ``,
    `This slot is held for 2 hours while you complete your UPI payment.`,
    `Please complete payment and submit your 12-digit UTR at:`,
    data.checkoutUrl,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C; background-color: #FFFFFF; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #DDD9D0; border-radius: 6px; padding: 24px;">
    <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #17191C;">Mentoring session reserved</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Hello ${safeName},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Your session for <strong>${safeTier}</strong> is reserved for <strong>${safeTime}</strong> under order <strong>${safeCode}</strong>.
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      This slot is held for 2 hours. Please scan the UPI QR and submit your 12-digit UTR to secure your booking:
    </p>
    <p style="margin: 0; font-size: 14px; word-break: break-all;">
      <a href="${safeUrl}" style="color: #0B5D4B; text-decoration: underline; font-weight: 600;">${safeUrl}</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function bookingConfirmedTemplate(
  data: BookingConfirmedData
): EmailRenderResult {
  const safeName = escapeHtml(data.studentDisplayName || "Student");
  const safeTier = escapeHtml(data.tierName);
  const safeTime = escapeHtml(data.sessionTimeIst);
  const safeMeet = escapeHtml(data.meetUrl);
  const safeBookingsUrl = escapeHtml(data.bookingsUrl);

  const subject = `Booking confirmed: ${data.tierName} (${data.sessionTimeIst})`;

  const text = [
    `Hello ${data.studentDisplayName || "Student"},`,
    ``,
    `Your payment for "${data.tierName}" has been verified and your booking is confirmed!`,
    ``,
    `Session time: ${data.sessionTimeIst}`,
    `Meeting link: ${data.meetUrl}`,
    ``,
    `View all your bookings in your account:`,
    data.bookingsUrl,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C; background-color: #FFFFFF; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #DDD9D0; border-radius: 6px; padding: 24px;">
    <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #1E6B3C;">Booking confirmed</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Hello ${safeName},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Your payment for <strong>${safeTier}</strong> has been verified and your session is confirmed.
    </p>
    <div style="background-color: #FBFAF7; border: 1px solid #DDD9D0; border-radius: 6px; padding: 16px; margin: 0 0 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #17191C;">
        <strong>Time:</strong> ${safeTime}
      </p>
      <p style="margin: 0; font-size: 14px; color: #17191C; word-break: break-all;">
        <strong>Meeting link:</strong> <a href="${safeMeet}" style="color: #0B5D4B; text-decoration: underline;">${safeMeet}</a>
      </p>
    </div>
    <p style="margin: 0; font-size: 14px; word-break: break-all;">
      <a href="${safeBookingsUrl}" style="color: #0B5D4B; text-decoration: underline; font-weight: 600;">View in your account</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function bookingCancelledTemplate(
  data: BookingCancelledData
): EmailRenderResult {
  const safeName = escapeHtml(data.studentDisplayName || "Student");
  const safeTier = escapeHtml(data.tierName);
  const safeTime = escapeHtml(data.sessionTimeIst);
  const safeReason = data.reason ? escapeHtml(data.reason) : "Slot hold expired or cancelled by administrator.";

  const subject = `Booking cancelled: ${data.tierName}`;

  const text = [
    `Hello ${data.studentDisplayName || "Student"},`,
    ``,
    `Your booking for "${data.tierName}" scheduled for ${data.sessionTimeIst} has been cancelled.`,
    ``,
    `Reason: ${data.reason || "Slot hold expired or cancelled by administrator."}`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C; background-color: #FFFFFF; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #DDD9D0; border-radius: 6px; padding: 24px;">
    <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #A12B2B;">Booking cancelled</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Hello ${safeName},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Your session for <strong>${safeTier}</strong> scheduled for <strong>${safeTime}</strong> has been cancelled.
    </p>
    <p style="margin: 0; font-size: 14px; color: #4A5058;">
      <strong>Reason:</strong> ${safeReason}
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function sessionReminderTemplate(
  data: SessionReminderData
): EmailRenderResult {
  const safeName = escapeHtml(data.recipientDisplayName || "there");
  const safeTier = escapeHtml(data.tierName);
  const safeTime = escapeHtml(data.sessionTimeIst);
  const safeMeet = data.meetUrl ? escapeHtml(data.meetUrl) : null;
  const safeUrl = escapeHtml(data.sessionUrl);

  const subject = `Reminder: Upcoming session tomorrow for ${data.tierName}`;

  const text = [
    `Hello ${data.recipientDisplayName || "there"},`,
    ``,
    `This is a reminder that your mentoring session for "${data.tierName}" is scheduled for tomorrow at ${data.sessionTimeIst}.`,
    data.meetUrl ? `Meeting link: ${data.meetUrl}` : `Meeting link will be provided in your dashboard before the session.`,
    ``,
    `Session dashboard:`,
    data.sessionUrl,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C; background-color: #FFFFFF; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #DDD9D0; border-radius: 6px; padding: 24px;">
    <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #17191C;">Session reminder</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Hello ${safeName},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A5058;">
      Your mentoring session for <strong>${safeTier}</strong> is scheduled for tomorrow:
    </p>
    <div style="background-color: #FBFAF7; border: 1px solid #DDD9D0; border-radius: 6px; padding: 16px; margin: 0 0 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #17191C;">
        <strong>Time:</strong> ${safeTime}
      </p>
      ${
        safeMeet
          ? `<p style="margin: 0; font-size: 14px; color: #17191C; word-break: break-all;"><strong>Meeting link:</strong> <a href="${safeMeet}" style="color: #0B5D4B; text-decoration: underline;">${safeMeet}</a></p>`
          : `<p style="margin: 0; font-size: 14px; color: #4A5058;">Meeting link will be posted in your dashboard before the start time.</p>`
      }
    </div>
    <p style="margin: 0; font-size: 14px; word-break: break-all;">
      <a href="${safeUrl}" style="color: #0B5D4B; text-decoration: underline; font-weight: 600;">Open session dashboard</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}


