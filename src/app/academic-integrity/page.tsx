import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Prose } from "@/components/ui/prose";
import { AcademicIntegrityContent } from "@/content/legal/academic-integrity";

export const metadata: Metadata = {
  title: "Academic Integrity Policy | VTU Adda Projects",
  description: "Our standards on academic honesty, ethical code reference usage, and non-affiliation disclaimer with Visvesvaraya Technological University.",
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
