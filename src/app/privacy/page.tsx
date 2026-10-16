import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { Prose } from "@/components/ui/prose";
import { PrivacyContent, privacyTocItems } from "@/content/legal/privacy";

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
    <LegalPageLayout
      breadcrumbItems={[
        { label: "Home", href: "/" },
        { label: "Privacy Policy" },
      ]}
      tocItems={privacyTocItems}
    >
      <Prose>
        <PrivacyContent />
      </Prose>
    </LegalPageLayout>
  );
}
