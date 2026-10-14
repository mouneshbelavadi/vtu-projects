import React from "react";

export const privacyLastUpdated = "14 October 2026";

export function PrivacyContent() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-xs text-ink-3">Last updated: {privacyLastUpdated}</p>

      <h2>1. Who We Are</h2>
      <p>
        VTU Adda Projects is an independent educational platform based in Bengaluru, Karnataka, India. We provide downloadable project kits, custom project support, and one-on-one technical mentoring for engineering students.
      </p>

      <h2>2. Personal Data We Collect</h2>
      <p>
        We only collect information necessary to deliver our services, process manual payments, and communicate with you. The personal data collected includes:
      </p>
      <ul>
        <li>
          <strong>Account details:</strong> Your display name, email address, and optional phone number.
        </li>
        <li>
          <strong>Purchase and payment data:</strong> Order codes, purchase amounts, item details, and the 12-digit UTR reference number you provide for bank verification.
        </li>
        <li>
          <strong>Payment proof screenshots:</strong> Optional screenshots of UPI receipts uploaded to aid manual verification. These are deleted automatically after 30 days.
        </li>
        <li>
          <strong>Custom project requests:</strong> Project title, requirements brief, academic branch, semester, scheme, submission deadline, team size, uploaded specification files, and communication messages.
        </li>
        <li>
          <strong>Mentoring bookings:</strong> Booked tier, scheduled session timing, and meeting links.
        </li>
        <li>
          <strong>Download logs:</strong> Cryptographically hashed IP addresses logged when downloading kit files to enforce fair download limits and prevent link sharing.
        </li>
        <li>
          <strong>Support tickets:</strong> Your name, email address, subject, message body, and optional order reference.
        </li>
      </ul>
      <p>
        <strong>We do not ask for or store your college name.</strong>
      </p>

      <h2>3. Why We Use Your Data</h2>
      <p>We process your personal information for the following specific purposes:</p>
      <ul>
        <li>To authenticate your sign-in and protect your account.</li>
        <li>To deliver purchased digital files and generate your personalised licence slip.</li>
        <li>To manually verify bank payments and prevent fraudulent UTR submissions.</li>
        <li>To coordinate custom project milestones and deliverables.</li>
        <li>To send transactional emails such as order confirmations, payment approvals, and mentoring reminders.</li>
        <li>To respond to your support enquiries and resolve grievances.</li>
        <li>To comply with statutory financial accounting and tax obligations in India.</li>
      </ul>

      <h2>4. Third-Party Service Providers and Data Residency</h2>
      <p>
        We do not sell, rent, or trade your personal data. We rely on reputable infrastructure providers to operate the service:
      </p>
      <ul>
        <li>
          <strong>Supabase:</strong> Database and authentication infrastructure hosted in AWS region ap-south-1 (Mumbai, India).
        </li>
        <li>
          <strong>Vercel:</strong> Web application hosting with primary compute points in Mumbai, India (bom1).
        </li>
        <li>
          <strong>Resend:</strong> Transactional email delivery service used to dispatch operational notifications.
        </li>
        <li>
          <strong>Google OAuth:</strong> Optional identity provider for students choosing to sign in with Google.
        </li>
      </ul>

      <h2>5. Data Retention</h2>
      <p>We keep personal data only for as long as needed:</p>
      <ul>
        <li>
          <strong>Payment proof screenshots:</strong> Deleted automatically 30 days after payment verification by an automated cleanup job.
        </li>
        <li>
          <strong>Order and payment records:</strong> Retained for 7 years to satisfy statutory tax and financial reporting requirements in India.
        </li>
        <li>
          <strong>Support messages and tickets:</strong> Retained for 1 year following ticket resolution.
        </li>
        <li>
          <strong>Inactive accounts and deletion requests:</strong> When you request account deletion, we retain data for a 30-day grace period, after which personal profile information is permanently removed or anonymised.
        </li>
      </ul>

      <h2>6. Users Under 18</h2>
      <p>
        Our platform is intended for users who are at least 18 years of age. Students aged 17 enrolled in an undergraduate engineering programme may access the platform only with the consent and supervision of a parent or legal guardian.
      </p>

      <h2>7. Cookies and Tracking</h2>
      <p>
        We use only essential cookies required for authentication and security tokens. We do not use advertising cookies, marketing trackers, or third-party behavioral analytics scripts.
      </p>

      <h2>8. Your Rights: Access, Export, and Deletion</h2>
      <p>
        Under applicable Indian data protection laws, you have the right to access, correct, export, or delete your personal data:
      </p>
      <ul>
        <li>
          <strong>Data export:</strong> You can download a complete JSON archive of your personal account records at any time from your account page.
        </li>
        <li>
          <strong>Correction:</strong> You can update your display name and contact phone number directly in your account settings.
        </li>
        <li>
          <strong>Deletion:</strong> You can submit an account deletion request through your account dashboard or by opening a support ticket.
        </li>
      </ul>

      <h2>9. Data Security</h2>
      <p>
        We protect your data using industry standard technical safeguards, including PostgreSQL Row Level Security (RLS) policies, encryption in transit using TLS 1.3, encrypted database storage at rest, and time-limited signed URLs for all private file downloads.
      </p>

      <h2>10. Grievance Redressal</h2>
      <p>
        If you have questions, concerns, or grievances regarding the processing of your personal data, you may contact our designated Grievance Officer:
      </p>
      <div className="bg-paper p-4 rounded-md border border-rule text-sm space-y-1">
        <p><strong>Grievance Officer:</strong> Rohan Sharma</p>
        <p><strong>Email:</strong> grievance@vtuadda.com</p>
        <p><strong>Address:</strong> 42, 3rd Cross, 5th Main, 7th Sector, HSR Layout, Bengaluru, Karnataka 560102, India</p>
      </div>
    </>
  );
}
