import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Prose } from "@/components/ui/prose";
import { PrivacyContent } from "@/content/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy | VTU Adda Projects",
  description: "Learn how VTU Adda Projects collects, uses, retains, and protects your personal data under Indian data protection regulations.",
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
