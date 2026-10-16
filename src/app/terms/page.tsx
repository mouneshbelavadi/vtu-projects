import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { Prose } from "@/components/ui/prose";
import { TermsContent, termsTocItems } from "@/content/legal/terms";

export const metadata: Metadata = {
  title: "Terms and Conditions | VTU Adda",
  description:
    "Terms of service governing ready kit licences, manual UPI orders, custom projects, and Bengaluru jurisdiction.",
  alternates: {
    canonical: "https://projects.vtuadda.com/terms",
  },
  openGraph: {
    title: "Terms and Conditions | VTU Adda",
    description:
      "Terms of service governing ready kit licences, manual UPI orders, custom projects, and Bengaluru jurisdiction.",
    url: "https://projects.vtuadda.com/terms",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms and Conditions | VTU Adda",
    description:
      "Terms of service governing ready kit licences, manual UPI orders, custom projects, and Bengaluru jurisdiction.",
  },
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      breadcrumbItems={[
        { label: "Home", href: "/" },
        { label: "Terms and Conditions" },
      ]}
      tocItems={termsTocItems}
    >
      <Prose>
        <TermsContent />
      </Prose>
    </LegalPageLayout>
  );
}
