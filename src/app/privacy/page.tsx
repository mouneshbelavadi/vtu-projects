import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Prose } from "@/components/ui/prose";
import { PrivacyContent } from "@/content/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy | VTU Adda Projects",
  description:
    "Details on what student data we collect, processing purposes, statutory retention and grievance contact.",
  alternates: {
    canonical: "https://projects.vtuadda.com/privacy",
  },
  openGraph: {
    title: "Privacy Policy | VTU Adda Projects",
    description:
      "Details on what student data we collect, processing purposes, statutory retention and grievance contact.",
    url: "https://projects.vtuadda.com/privacy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | VTU Adda Projects",
    description:
      "Details on what student data we collect, processing purposes, statutory retention and grievance contact.",
  },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl py-10 px-4 sm:px-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Privacy Policy" },
        ]}
      />

      <Prose className="mx-auto">
        <PrivacyContent />
      </Prose>
    </div>
  );
}
