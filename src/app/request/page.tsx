import { redirect } from "next/navigation";
import { getUserOrNull } from "@/server/auth";
import { RequestForm } from "./request-form";

export const metadata = {
  title: "Custom Project Build Request | VTU Adda",
  description:
    "Submit your custom VTU engineering project topic. Receive a written scope, milestone roadmap, and clear quote.",
  alternates: {
    canonical: "https://projects.vtuadda.com/request",
  },
  openGraph: {
    title: "Custom Project Build Request | VTU Adda",
    description:
      "Submit your custom VTU engineering project topic. Receive a written scope, milestone roadmap, and clear quote.",
    url: "https://projects.vtuadda.com/request",
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom Project Build Request | VTU Adda",
    description:
      "Submit your custom VTU engineering project topic. Receive a written scope, milestone roadmap, and clear quote.",
  },
};

export default async function RequestPage() {
  const authUser = await getUserOrNull();

  if (!authUser) {
    redirect("/login?next=%2Frequest");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Page Header */}
      <div className="border-b border-[#DDD9D0] pb-6">
        <h1 className="text-[24px] font-bold tracking-tight text-[#17191C]">
          Request a Custom Project
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#5F6670]">
          Tell us about your proposed VTU engineering project. Our team reviews your problem statement and provides a written scope, milestone plan, and price before any work begins.
        </p>
      </div>

      {/* How it works in four steps */}
      <section className="my-6 rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-5">
        <h2 className="text-[16px] font-semibold text-[#17191C]">
          How custom projects work
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-[4px] border border-[#DDD9D0] bg-[#FBFAF7] p-3.5">
            <div className="text-[12px] font-bold text-[#0B5D4B]">Step 1</div>
            <div className="mt-1 text-[14px] font-semibold text-[#17191C]">You send the request</div>
            <p className="mt-1 text-[13px] leading-relaxed text-[#5F6670]">
              Describe your title, problem brief, scheme, semester, branch, and any technology preferences.
            </p>
          </div>

          <div className="rounded-[4px] border border-[#DDD9D0] bg-[#FBFAF7] p-3.5">
            <div className="text-[12px] font-bold text-[#0B5D4B]">Step 2</div>
            <div className="mt-1 text-[14px] font-semibold text-[#17191C]">We reply with scope and price</div>
            <p className="mt-1 text-[13px] leading-relaxed text-[#5F6670]">
              We reply with a written scope of work, milestone timeline, total price, and deposit amount.
            </p>
          </div>

          <div className="rounded-[4px] border border-[#DDD9D0] bg-[#FBFAF7] p-3.5">
            <div className="text-[12px] font-bold text-[#0B5D4B]">Step 3</div>
            <div className="mt-1 text-[14px] font-semibold text-[#17191C]">You accept and pay a deposit</div>
            <p className="mt-1 text-[13px] leading-relaxed text-[#5F6670]">
              You review the milestones. You are not charged anything until you formally accept the quote and pay the deposit.
            </p>
          </div>

          <div className="rounded-[4px] border border-[#DDD9D0] bg-[#FBFAF7] p-3.5">
            <div className="text-[12px] font-bold text-[#0B5D4B]">Step 4</div>
            <div className="mt-1 text-[14px] font-semibold text-[#17191C]">We build in milestones</div>
            <p className="mt-1 text-[13px] leading-relaxed text-[#5F6670]">
              Our assigned builder works through milestones, you take part in each one, and final files release after balance payment.
            </p>
          </div>
        </div>
      </section>

      {/* Refusal Box: What we do not take */}
      <section className="mb-8 rounded-[6px] border border-[#DDD9D0] bg-[#FBE9E7] p-5">
        <h2 className="text-[15px] font-bold text-[#A12B2B]">
          What we do not take
        </h2>
        <p className="mt-1 text-[13px] text-[#A12B2B]">
          In accordance with VTU academic regulations and our academic integrity policy, we strictly decline:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px] text-[#4A5058]">
          <li>Exam answers or live assessment help</li>
          <li>Lab records, manual write-ups, or assignment copying</li>
          <li>Work another student has already submitted in previous semesters</li>
          <li>Copied or plagiarised work from online repositories</li>
        </ul>
      </section>

      {/* The Request Form */}
      <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-6">
        <h2 className="text-[18px] font-bold text-[#17191C]">
          Custom Project Application
        </h2>
        <p className="mt-1 mb-6 text-[13px] text-[#5F6670]">
          Fill in your project details below. Branch, semester, and scheme live strictly on this request and are never added to your account profile.
        </p>
        <RequestForm />
      </div>
    </div>
  );
}
