import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Prose } from "@/components/ui/prose";
import { HowItWorksContent } from "@/content/legal/how-it-works";

export const metadata: Metadata = {
  title: "How It Works | VTU Adda Projects",
  description:
    "Learn how ready kits, custom builds, manual UPI verification and mentoring work on VTU Adda Projects.",
  alternates: {
    canonical: "https://projects.vtuadda.com/how-it-works",
  },
  openGraph: {
    title: "How It Works | VTU Adda Projects",
    description:
      "Learn how ready kits, custom builds, manual UPI verification and mentoring work on VTU Adda Projects.",
    url: "https://projects.vtuadda.com/how-it-works",
  },
  twitter: {
    card: "summary_large_image",
    title: "How It Works | VTU Adda Projects",
    description:
      "Learn how ready kits, custom builds, manual UPI verification and mentoring work on VTU Adda Projects.",
  },
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl py-10 px-4 sm:px-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "How It Works" },
        ]}
      />

      <Prose className="mx-auto">
        <HowItWorksContent />
      </Prose>
    </div>
  );
}
