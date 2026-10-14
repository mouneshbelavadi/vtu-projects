import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Prose } from "@/components/ui/prose";
import { RefundContent } from "@/content/legal/refund";

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
    <div className="mx-auto max-w-4xl py-10 px-4 sm:px-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Refund Policy" },
        ]}
      />

      <Prose className="mx-auto">
        <RefundContent />
      </Prose>
    </div>
  );
}
