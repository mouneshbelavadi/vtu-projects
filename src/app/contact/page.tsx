import type { Metadata } from "next";
import { getUserOrNull } from "@/server/auth";
import { siteConfig } from "../../../site.config";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Support | VTU Adda Projects",
  description:
    "Get in touch with support, submit questions with order codes, or contact our grievance officer in Bengaluru.",
  alternates: {
    canonical: "https://projects.vtuadda.com/contact",
  },
  openGraph: {
    title: "Contact Support | VTU Adda Projects",
    description:
      "Get in touch with support, submit questions with order codes, or contact our grievance officer in Bengaluru.",
    url: "https://projects.vtuadda.com/contact",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Support | VTU Adda Projects",
    description:
      "Get in touch with support, submit questions with order codes, or contact our grievance officer in Bengaluru.",
  },
};

export default async function ContactPage() {
  const authUser = await getUserOrNull();

  const supportEmail = siteConfig.supportEmail || "support@vtuadda.com";
  const whatsappNumber = siteConfig.whatsappNumber || "919876543210";
  const address = siteConfig.address || "42, 3rd Cross, 5th Main, 7th Sector, HSR Layout, Bengaluru, Karnataka 560102, India";
  const grievanceOfficer = siteConfig.grievanceOfficer?.name || "Rohan Sharma";
  const grievanceEmail = siteConfig.grievanceOfficer?.email || "grievance@vtuadda.com";

  return (
    <div className="mx-auto max-w-4xl py-10 px-4 sm:px-6 space-y-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Contact and Support" },
        ]}
      />

      <div className="space-y-2">
        <h1 className="font-serif text-3xl font-bold text-ink">Contact and Support</h1>
        <p className="text-ink-2 text-base">
          Have questions about project kits, custom builds, payments, or mentoring sessions? Send us a message or reach out through our official channels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Information Sidebar */}
        <div className="space-y-4 md:col-span-1">
          <div className="p-4 rounded-md border border-rule bg-surface space-y-3">
            <h2 className="font-serif font-semibold text-lg text-ink">Direct Channels</h2>
            
            <div className="text-sm space-y-1">
              <span className="text-xs text-ink-3 uppercase tracking-wider block font-medium">Email Support</span>
              <a
                href={`mailto:${supportEmail}`}
                className="text-accent hover:underline font-medium break-all block"
              >
                {supportEmail}
              </a>
              <span className="text-xs text-ink-3 block">Replies within 24 to 48 hours</span>
            </div>

            <div className="text-sm space-y-1 pt-2 border-t border-rule">
              <span className="text-xs text-ink-3 uppercase tracking-wider block font-medium">WhatsApp</span>
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline font-medium block"
              >
                +{whatsappNumber.replace(/[^0-9]/g, "")}
              </a>
              <span className="text-xs text-ink-3 block">Working hours (9 AM to 8 PM IST)</span>
            </div>

            <div className="text-sm space-y-1 pt-2 border-t border-rule">
              <span className="text-xs text-ink-3 uppercase tracking-wider block font-medium">Correspondence</span>
              <p className="text-xs text-ink-2 leading-relaxed">
                {address}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-md border border-rule bg-paper space-y-2 text-xs">
            <h3 className="font-semibold text-ink">Grievance Redressal</h3>
            <p className="text-ink-2">
              For grievances relating to personal data protection or service compliance:
            </p>
            <p className="font-medium text-ink">{grievanceOfficer}</p>
            <a href={`mailto:${grievanceEmail}`} className="text-accent underline block">
              {grievanceEmail}
            </a>
          </div>
        </div>

        {/* Support Ticket Submission Form */}
        <div className="space-y-4 md:col-span-2">
          <div className="space-y-1">
            <h2 className="font-serif font-semibold text-xl text-ink">Send a Message</h2>
            <p className="text-xs text-ink-3">
              Submit your enquiry below and our team will open a support ticket immediately.
            </p>
          </div>

          <ContactForm
            initialEmail={authUser?.user.email || ""}
            initialName={authUser?.profile?.display_name || ""}
          />
        </div>
      </div>
    </div>
  );
}
