import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Prose } from "@/components/ui/prose";
import { TermsContent } from "@/content/legal/terms";

export const metadata: Metadata = {
  title: "Terms and Conditions | VTU Adda Projects",
  description: "Terms and Conditions governing purchase of project kits, custom builds, technical mentoring, and intellectual property licences.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl py-10 px-4 sm:px-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Terms and Conditions" },
        ]}
      />

      <Prose className="mx-auto">
        <TermsContent />
      </Prose>
    </div>
  );
}
