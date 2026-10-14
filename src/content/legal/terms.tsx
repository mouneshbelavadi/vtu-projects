import React from "react";
import Link from "next/link";
import { LICENCE_TERMS_TEXT } from "@/content/licence";

export const termsLastUpdated = "14 October 2026";

export function TermsContent() {
  return (
    <>
      <h1>Terms and Conditions</h1>
      <p className="text-xs text-ink-3">Last updated: {termsLastUpdated}</p>

      <h2>1. Introduction and Agreement</h2>
      <p>
        These Terms and Conditions govern your access to and use of VTU Adda Projects. By creating an account, purchasing a project kit, requesting a custom build, or booking a mentoring session, you agree to be bound by these terms.
      </p>

      <h2>2. Services Offered</h2>
      <p>VTU Adda Projects provides three primary educational services:</p>
      <ul>
        <li>
          <strong>Ready Project Kits:</strong> Downloadable project packages containing source code, draft documentation, installation instructions, and sample viva voce preparation questions.
        </li>
        <li>
          <strong>Custom Project Development:</strong> Tailored engineering project modules built to student specifications with structured milestone deliverables.
        </li>
        <li>
          <strong>Technical Mentoring:</strong> Scheduled one-on-one live video mentoring sessions conducted by experienced mentors.
        </li>
      </ul>

      <h2>3. Accounts and Eligibility</h2>
      <p>
        You must be at least 18 years old to create an account. If you are 17 years old and currently enrolled in an undergraduate engineering programme, you may use the platform only with parental or legal guardian consent and supervision. You agree to provide accurate, current, and complete registration details.
      </p>

      <h2>4. Manual UPI Payments and File Release</h2>
      <p>
        We accept payments exclusively through manual Unified Payments Interface (UPI) transfers to our designated account.
      </p>
      <ul>
        <li>You must transfer the exact payable amount displayed during checkout.</li>
        <li>After completing the transfer, you must submit your 12-digit bank UTR reference number on the checkout screen.</li>
        <li>Our administrators manually verify your bank transfer against bank statements during working hours (9:00 AM to 8:00 PM IST).</li>
        <li>Deliverable files and licence slips are released immediately upon payment approval. We do not release files before payment confirmation.</li>
      </ul>

      <h2>5. Download Limits and File Access</h2>
      <p>
        Purchased project kits remain accessible in your account dashboard. Each purchased file carries a download limit (default 10 downloads per file) to prevent automated bulk scraping and unauthorised link sharing. If you exhaust your download allocation due to genuine technical issues, you may contact support for a manual reset.
      </p>

      <h2>6. Kit Licence and Acceptable Use</h2>
      <p>
        Every kit purchase grants a non-exclusive, non-transferable, revocable licence subject to the following condition:
      </p>
      <blockquote className="my-4">
        {LICENCE_TERMS_TEXT}
      </blockquote>
      <p>
        You may not resell, redistribute, sub-licence, share on cloud storage drives, or publish files from any kit on public code repositories such as GitHub or GitLab.
      </p>

      <h2>7. Custom Project Requests</h2>
      <p>
        Custom build requests are subject to mutual review and approval:
      </p>
      <ul>
        <li>We reserve the right to decline any custom request that violates our academic integrity standards or falls outside our technical scope.</li>
        <li>Accepted projects require an upfront deposit (typically 50 percent of the quoted project fee) before development begins.</li>
        <li>Custom builds progress through predefined milestones with student feedback checkpoints.</li>
        <li>Final deliverable archives and licences are released only upon payment of the remaining project balance.</li>
      </ul>

      <h2>8. Technical Mentoring Sessions</h2>
      <p>
        Mentoring sessions are conducted online via secure video conference links.
      </p>
      <ul>
        <li>Sessions are dedicated to technical guidance, architectural explanation, code walkthroughs, and viva preparation.</li>
        <li>Mentors teach and clarify concepts. Mentors will not write assignment submissions or take exams on your behalf.</li>
        <li>Sessions must be booked at least 12 hours in advance.</li>
        <li>Meeting links appear in your dashboard once the session payment is approved.</li>
      </ul>

      <h2>9. Student Academic Duties and Disclaimers</h2>
      <p>
        VTU Adda Projects is an academic reference and learning aid. We do not promise, guarantee, or represent that:
      </p>
      <ul>
        <li>Any project will guarantee academic passing marks, specific grades, or honours.</li>
        <li>Any college faculty member, external examiner, or university committee will approve your submission without modification.</li>
        <li>You are exempt from studying, understanding, or independently presenting the work.</li>
      </ul>
      <p>
        <strong>We are not affiliated with, approved by, or endorsed by Visvesvaraya Technological University (VTU) or any constituent college.</strong>
      </p>

      <h2>10. Cancellation and Refunds</h2>
      <p>
        All refunds and cancellations are governed strictly by our{" "}
        <Link href="/refund" className="text-accent underline font-semibold">
          Refund Policy
        </Link>
        . Digital downloads cannot be returned once downloaded.
      </p>

      <h2>11. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by applicable law, VTU Adda Projects and its operators shall not be liable for any indirect, incidental, consequential, or punitive damages arising from the use of our materials. Our total aggregate liability for any claim shall not exceed the amount actually paid by you for the specific service in dispute.
      </p>

      <h2>12. Account Termination</h2>
      <p>
        We reserve the right to suspend or terminate accounts that breach these terms, submit fraudulent payment references, publish licensed materials publicly, or attempt unauthorized system access.
      </p>

      <h2>13. Governing Law and Dispute Jurisdiction</h2>
      <p>
        These Terms and Conditions are governed by the laws of the Republic of India. Any legal dispute or proceeding arising out of or related to these terms shall be subject to the exclusive jurisdiction of the competent civil courts in Bengaluru, Karnataka, India.
      </p>
    </>
  );
}
