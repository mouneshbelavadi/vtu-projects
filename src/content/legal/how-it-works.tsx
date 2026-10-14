import React from "react";
import Link from "next/link";

export const howItWorksLastUpdated = "14 October 2026";

export function HowItWorksContent() {
  return (
    <>
      <h1>How It Works</h1>
      <p className="text-xs text-ink-3">Last updated: {howItWorksLastUpdated}</p>

      <h2>Three Clear Paths to Academic Success</h2>
      <p>
        VTU Adda Projects is designed specifically for VTU engineering students seeking high-quality project kits, custom engineering guidance, or expert technical mentorship. Here is how each service functions from start to finish.
      </p>

      <h2>Path 1: Ready Project Kits</h2>
      <p>
        Browse our catalog of vetted engineering projects across Computer Science, Information Science, Electronics, and Mechanical Engineering.
      </p>
      <ol>
        <li>
          <strong>Select your kit:</strong> Explore complete project summaries, architecture overviews, tech stacks, and preview media.
        </li>
        <li>
          <strong>Proceed to checkout:</strong> A unique order code (e.g. VPH-89ABCDEF) is generated. You have a 2-hour payment window before the order expires.
        </li>
        <li>
          <strong>Pay via manual UPI:</strong> Scan the displayed UPI QR code or copy our Virtual Payment Address (VPA) into your UPI app (Google Pay, PhonePe, Paytm, or BHIM). Pay the exact total shown.
        </li>
        <li>
          <strong>Submit your UTR:</strong> Enter your 12-digit bank reference number (UTR) on the checkout screen. You may also attach an optional payment screenshot.
        </li>
        <li>
          <strong>Manual verification:</strong> Our administrators verify the bank receipt against our account statements during business hours (9:00 AM to 8:00 PM IST).
        </li>
        <li>
          <strong>Download deliverables:</strong> Once verified, your deliverables unlock immediately. You receive the complete source code archive, draft project report, installation readme, viva questions, and your personalized licence slip. Each file allows up to 10 downloads.
        </li>
      </ol>
      <p className="pt-2">
        <Link href="/projects" className="text-accent underline font-semibold">
          Browse ready project kits &rarr;
        </Link>
      </p>

      <h2>Path 2: Custom Project Development</h2>
      <p>
        If your college has assigned a unique problem statement or requires specific technologies, our builder team can construct a tailored build.
      </p>
      <ol>
        <li>
          <strong>Submit your request:</strong> Fill out the custom build form on our website. Specify your branch, semester, scheme, deadline, team size (1 to 4 students), and detailed requirements brief.
        </li>
        <li>
          <strong>Review and quotation:</strong> Our builders assess the scope and reply with a milestone roadmap and fixed price quote.
        </li>
        <li>
          <strong>Deposit payment:</strong> Pay the 50 percent booking deposit via manual UPI to initiate development.
        </li>
        <li>
          <strong>Milestone checkpoints:</strong> Track implementation progress through dedicated stages. Test code modules and submit feedback directly in the project portal.
        </li>
        <li>
          <strong>Balance and final delivery:</strong> Review the project demonstration, clear the remaining balance, and download the finished source code, report, and documentation.
        </li>
      </ol>
      <p className="pt-2">
        <Link href="/request" className="text-accent underline font-semibold">
          Submit a custom project request &rarr;
        </Link>
      </p>

      <h2>Path 3: One-on-One Technical Mentoring</h2>
      <p>
        Book direct sessions with experienced builders to prepare for viva voce examinations, clarify code logic, or debug tricky issues.
      </p>
      <ol>
        <li>
          <strong>Choose a mentoring tier:</strong> Select a suitable session package (Quick Viva Prep, Architecture Deep Dive, or Comprehensive Full Project Review).
        </li>
        <li>
          <strong>Select a date and time slot:</strong> Browse open calendar slots in Indian Standard Time (IST). Slots must be booked at least 12 hours in advance.
        </li>
        <li>
          <strong>Hold and confirm:</strong> Your selected slot is held for 2 hours while you complete UPI payment.
        </li>
        <li>
          <strong>Access meeting link:</strong> Once approved, the secure video conference link (Google Meet) appears in your student dashboard.
        </li>
        <li>
          <strong>Attend session:</strong> Join the live video call with your mentor at the scheduled time. We send an email reminder 24 hours prior to your session.
        </li>
      </ol>
      <p className="pt-2">
        <Link href="/mentoring" className="text-accent underline font-semibold">
          Explore mentoring tiers &rarr;
        </Link>
      </p>

      <h2>Transparent and Reliable</h2>
      <p>
        Have questions about any of our processes? Visit our{" "}
        <Link href="/contact" className="text-accent underline font-semibold">
          Contact page
        </Link>{" "}
        or review our{" "}
        <Link href="/terms" className="text-accent underline font-semibold">
          Terms and Conditions
        </Link>
        .
      </p>
    </>
  );
}
