import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { Prose } from "@/components/ui/prose";
import { RefundContent, refundTocItems } from "@/content/legal/refund";

export const metadata: Metadata = {
  title: "Refund Policy | VTU Adda Projects",
  description:
    "Refund rules, cancellation time limits and UPI reversal timelines for kits, custom builds and mentoring.",
  alternates: {
    canonical: "https://projects.vtuadda.com/refund",
  },
  openGraph: {
    title: "Refund Policy | VTU Adda Projects",
    description:
      "Refund rules, cancellation time limits and UPI reversal timelines for kits, custom builds and mentoring.",
    url: "https://projects.vtuadda.com/refund",
  },
  twitter: {
    card: "summary_large_image",
    title: "Refund Policy | VTU Adda Projects",
    description:
      "Refund rules, cancellation time limits and UPI reversal timelines for kits, custom builds and mentoring.",
  },
};

export default function RefundPage() {
  return (
    <LegalPageLayout
      breadcrumbItems={[
        { label: "Home", href: "/" },
        { label: "Refund Policy" },
      ]}
      tocItems={refundTocItems}
    >
      <Prose>
        <RefundContent />
      </Prose>
    </LegalPageLayout>
  );
}
