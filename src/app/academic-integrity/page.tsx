import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { Prose } from "@/components/ui/prose";
import {
  AcademicIntegrityContent,
  academicIntegrityTocItems,
} from "@/content/legal/academic-integrity";

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
    <LegalPageLayout
      breadcrumbItems={[
        { label: "Home", href: "/" },
        { label: "Academic Integrity" },
      ]}
      tocItems={academicIntegrityTocItems}
    >
      <Prose>
        <AcademicIntegrityContent />
      </Prose>
    </LegalPageLayout>
  );
}
