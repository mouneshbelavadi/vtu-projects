import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Prose } from "@/components/ui/prose";
import { AcademicIntegrityContent } from "@/content/legal/academic-integrity";

export const metadata: Metadata = {
  title: "Academic Integrity Policy | VTU Adda",
  description:
    "Ethical learning standards, student reference guidelines and our non-affiliation disclaimer with VTU.",
  alternates: {
    canonical: "https://projects.vtuadda.com/academic-integrity",
  },
  openGraph: {
    title: "Academic Integrity Policy | VTU Adda",
    description:
      "Ethical learning standards, student reference guidelines and our non-affiliation disclaimer with VTU.",
    url: "https://projects.vtuadda.com/academic-integrity",
  },
  twitter: {
    card: "summary_large_image",
    title: "Academic Integrity Policy | VTU Adda",
    description:
      "Ethical learning standards, student reference guidelines and our non-affiliation disclaimer with VTU.",
  },
};

export default function AcademicIntegrityPage() {
  return (
    <div className="mx-auto max-w-4xl py-10 px-4 sm:px-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Academic Integrity" },
        ]}
      />

      <Prose className="mx-auto">
        <AcademicIntegrityContent />
      </Prose>
    </div>
  );
}
