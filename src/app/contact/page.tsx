import type { Metadata } from "next";
import { getUserOrNull } from "@/server/auth";
import { siteConfig } from "../../../site.config";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ContactForm } from "./contact-form";
import {
  Mail,
  MessageCircle,
  MapPin,
  Sparkles,
  Clock,
  Scale,
} from "lucide-react";

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

  const supportEmail = siteConfig.supportEmail || "contact@vtuadda.com";
  const whatsappNumber = siteConfig.whatsappNumber || "919876543210";
  const address =
    siteConfig.address ||
    "42, 3rd Cross, 5th Main, 7th Sector, HSR Layout, Bengaluru, Karnataka 560102, India";
  const grievanceOfficer = siteConfig.grievanceOfficer?.name || "Rohan Sharma";
  const grievanceEmail =
    siteConfig.grievanceOfficer?.email || "contact@vtuadda.com";

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-b from-surface-2/40 via-surface to-surface-2/20 py-10 sm:py-16">
      {/* Soft decorative background shapes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 -z-10 h-96 w-96 rounded-full bg-gradient-to-tr from-indigo-500/10 via-violet-500/10 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-10 top-1/3 -z-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 left-10 -z-10 h-72 w-72 rounded-full bg-indigo-500/5 blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Contact and Support" },
          ]}
        />

        {/* Page Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/90 px-3.5 py-1 text-xs font-semibold text-indigo-700 shadow-xs backdrop-blur-sm animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Support & Helpdesk</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink font-heading sm:text-4xl lg:text-5xl">
            Contact and{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Support
            </span>
          </h1>
          <p className="text-sm leading-relaxed text-ink-2 sm:text-base max-w-3xl">
            Have questions about project kits, custom builds, payments, or mentoring sessions? Send us a message or reach out through our official channels.
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Contact Information Cards */}
          <div className="space-y-5 lg:col-span-5">
            {/* Card 1: Email Support */}
            <div className="group rounded-2xl border border-rule/80 bg-surface p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-4 ring-indigo-500/10 group-hover:scale-105 transition-transform duration-200">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-3 block">
                    Email Support
                  </span>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="font-semibold text-accent hover:text-indigo-800 hover:underline break-all block text-sm sm:text-base transition-colors"
                  >
                    {supportEmail}
                  </a>
                  <span className="text-xs text-ink-3 block">Replies within 24 to 48 hours</span>
                </div>
              </div>
            </div>

            {/* Card 2: WhatsApp Channel */}
            <div className="group rounded-2xl border border-rule/80 bg-surface p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-4 ring-emerald-500/10 group-hover:scale-105 transition-transform duration-200">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-3 block">
                    WhatsApp
                  </span>
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-emerald-700 hover:text-emerald-900 hover:underline block text-sm sm:text-base transition-colors"
                  >
                    +{whatsappNumber.replace(/[^0-9]/g, "")}
                  </a>
                  <span className="text-xs text-ink-3 block">Working hours (9 AM to 8 PM IST)</span>
                </div>
              </div>
            </div>

            {/* Card 3: Correspondence Address */}
            <div className="group rounded-2xl border border-rule/80 bg-surface p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 ring-4 ring-cyan-500/10 group-hover:scale-105 transition-transform duration-200">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-3 block">
                    Correspondence
                  </span>
                  <p className="text-xs leading-relaxed text-ink-2 font-medium">
                    {address}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 4: Grievance Redressal */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6 shadow-xs">
              <div className="flex items-center gap-2.5 text-indigo-900">
                <Scale className="h-5 w-5 text-indigo-600 shrink-0" />
                <h3 className="font-bold text-sm text-indigo-950 font-heading">
                  Grievance Redressal
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-2">
                For grievances relating to personal data protection or service compliance:
              </p>
              <div className="mt-3 pt-3 border-t border-indigo-100/80 space-y-1">
                <p className="font-semibold text-sm text-ink">{grievanceOfficer}</p>
                <a
                  href={`mailto:${grievanceEmail}`}
                  className="text-xs font-medium text-accent hover:underline block"
                >
                  {grievanceEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Support Form in Raised Card */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-rule/80 bg-surface p-6 sm:p-8 lg:p-10 shadow-xl shadow-slate-900/5">
              <div className="border-b border-rule/70 pb-5 mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight text-ink font-heading sm:text-2xl">
                    Send a Message
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    <Clock className="h-3 w-3 text-indigo-500" />
                    Quick Response
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-3 sm:text-sm">
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
      </div>
    </div>
  );
}
