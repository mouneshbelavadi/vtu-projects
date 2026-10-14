import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Prose } from "@/components/ui/prose";
import { RefundContent } from "@/content/legal/refund";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy | VTU Adda Projects",
  description: "Clear refund rules and timelines for ready kits, custom projects, and mentoring sessions on VTU Adda Projects.",
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
