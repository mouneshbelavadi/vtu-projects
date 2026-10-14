import React from "react";
import Link from "next/link";

export const refundLastUpdated = "14 October 2026";

export function RefundContent() {
  return (
    <>
      <h1>Refund and Cancellation Policy</h1>
      <p className="text-xs text-ink-3">Last updated: {refundLastUpdated}</p>

      <h2>1. Overview</h2>
      <p>
        We aim to provide clear and fair refund conditions for our digital products and educational services. Because our project kits are digital deliverables that cannot be physically returned, distinct rules apply to each service category.
      </p>

      <h2>2. Ready Project Kits</h2>
      <p>
        Refund eligibility for downloadable project kits is determined as follows:
      </p>
      <ul>
        <li>
          <strong>Corrupted or incomplete deliverables:</strong> If the downloaded archive files are defective, corrupt, or missing components promised in the catalogue listing, and our technical support team cannot resolve the problem within 48 hours of your notification, you are entitled to a full refund.
        </li>
        <li>
          <strong>Non-refundable situations:</strong> Once you have downloaded any project files that match the catalogue description, the purchase is non-refundable. We do not provide refunds for changes of mind, schedule alterations by your college, or failure to review the listed prerequisites.
        </li>
      </ul>

      <h2>3. Custom Project Requests</h2>
      <p>
        Custom build requests involve dedicated engineering time:
      </p>
      <ul>
        <li>
          <strong>Initial booking deposit:</strong> The initial 50 percent deposit is non-refundable once engineering work has commenced.
        </li>
        <li>
          <strong>Milestone balance payments:</strong> Milestone payments may be refunded if the deliverables fail to satisfy the agreed functional requirements established in the milestone scope.
        </li>
        <li>
          <strong>Declined requests:</strong> If our engineering team declines your submitted request before development starts, any preliminary payment received is refunded in full.
        </li>
      </ul>

      <h2>4. Technical Mentoring Sessions</h2>
      <p>
        Mentoring slots occupy dedicated mentor availability:
      </p>
      <ul>
        <li>
          <strong>Notice of 24 hours or more:</strong> If you request session cancellation at least 24 hours prior to the scheduled start time in Indian Standard Time (IST), you will receive a full 100 percent refund.
        </li>
        <li>
          <strong>Notice within 24 hours:</strong> Cancellations submitted less than 24 hours before the session start time are non-refundable.
        </li>
        <li>
          <strong>Student no-shows:</strong> If you fail to join the scheduled video meeting within 15 minutes of the start time, the session is marked completed and fees are non-refundable.
        </li>
        <li>
          <strong>Mentor cancellations:</strong> If a mentor is unable to attend, you may choose either an immediate free reschedule to another open slot or a full refund.
        </li>
      </ul>

      <h2>5. How to Request a Refund</h2>
      <p>To request a refund, follow these straightforward steps:</p>
      <ol>
        <li>
          Navigate to our{" "}
          <Link href="/contact" className="text-accent underline font-semibold">
            Contact Support Page
          </Link>
          .
        </li>
        <li>Select Support as the enquiry category.</li>
        <li>Enter your full name, registered email address, and order code (e.g. VPH-12345678).</li>
        <li>State clearly the reason for your refund request and attach any relevant error screenshots or details.</li>
      </ol>

      <h2>6. Refund Method and Timelines</h2>
      <p>
        All refunds are processed manually by our finance team:
      </p>
      <ul>
        <li>Refunds are returned directly to the originating UPI ID or bank account used for the initial transaction.</li>
        <li>Approved refund requests are initiated within 5 to 7 business days following administrative approval.</li>
        <li>Once processed, our team records the bank UTR refund reference on your order record and sends an email confirmation.</li>
      </ul>

      <div className="pt-6 border-t border-rule mt-6 flex flex-wrap gap-4 text-xs font-semibold">
        <Link href="/account/orders" className="text-accent hover:underline">
          View your orders &rarr;
        </Link>
        <Link href="/contact" className="text-accent hover:underline">
          Submit refund request &rarr;
        </Link>
        <Link href="/terms" className="text-accent hover:underline">
          Terms and conditions &rarr;
        </Link>
      </div>
    </>
  );
}
