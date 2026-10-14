"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitCustomRequestForm, type SubmitRequestState } from "./actions";
import { COURSE_TYPES } from "@/types/database";

const COURSE_TYPE_LABELS: Record<string, string> = {
  mini_project: "Mini Project",
  project_phase_1: "Project Phase 1",
  major_project_phase_2: "Major Project (Phase 2)",
  capstone: "Capstone Project",
  hackathon_project: "Hackathon Project",
  other: "Other Course Work",
};

export function RequestForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (prev: SubmitRequestState | null, formData: FormData) => {
      const res = await submitCustomRequestForm(prev, formData);
      if (res.success && res.requestId) {
        router.push(`/account/requests/${res.requestId}`);
      }
      return res;
    },
    null
  );

  const [briefLength, setBriefLength] = useState(0);

  // Calculate default minimum deadline date: 7 days from today
  const minDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div
          role="alert"
          className="rounded-[6px] border border-[#DDD9D0] bg-[#FBE9E7] p-4 text-[14px] text-[#A12B2B]"
        >
          {state.error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-[14px] font-semibold text-[#17191C]">
          Project Title <span className="text-[#A12B2B]">*</span>
        </label>
        <p className="mt-0.5 text-[12px] text-[#5F6670]">
          A clear title or problem statement for your proposed project (up to 120 characters).
        </p>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          placeholder="e.g. Real-Time Air Quality Monitoring System using LoRaWAN"
          className="mt-1.5 w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#17191C] placeholder-[#5F6670] focus:border-[#0B5D4B] focus:outline-none focus:ring-1 focus:ring-[#0B5D4B]"
        />
      </div>

      {/* Brief */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="brief" className="block text-[14px] font-semibold text-[#17191C]">
            Detailed Project Brief <span className="text-[#A12B2B]">*</span>
          </label>
          <span className="text-[12px] text-[#5F6670]">
            {briefLength} / 3000 characters (min 50)
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-[#5F6670]">
          Describe the objectives, problem to solve, specific modules, and expected output.
        </p>
        <textarea
          id="brief"
          name="brief"
          required
          rows={6}
          minLength={50}
          maxLength={3000}
          onChange={(e) => setBriefLength(e.target.value.length)}
          placeholder="Explain what the system should do, any hardware or software components needed, and what results you need to present to your project guide."
          className="mt-1.5 w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#17191C] placeholder-[#5F6670] focus:border-[#0B5D4B] focus:outline-none focus:ring-1 focus:ring-[#0B5D4B]"
        />
      </div>

      {/* Academic Context (Lives strictly on custom_requests, not profile) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="branch" className="block text-[14px] font-semibold text-[#17191C]">
            Branch <span className="text-[#A12B2B]">*</span>
          </label>
          <select
            id="branch"
            name="branch"
            required
            className="mt-1.5 w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#17191C] focus:border-[#0B5D4B] focus:outline-none focus:ring-1 focus:ring-[#0B5D4B]"
          >
            <option value="">Select branch</option>
            <option value="Computer Science and Engineering">CSE</option>
            <option value="Information Science and Engineering">ISE</option>
            <option value="Electronics and Communication Engineering">ECE</option>
            <option value="Electrical and Electronics Engineering">EEE</option>
            <option value="Mechanical Engineering">Mechanical</option>
            <option value="Civil Engineering">Civil</option>
            <option value="Artificial Intelligence and Machine Learning">AI and ML</option>
            <option value="Data Science">Data Science</option>
            <option value="Other Engineering">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="semester" className="block text-[14px] font-semibold text-[#17191C]">
            Semester <span className="text-[#A12B2B]">*</span>
          </label>
          <select
            id="semester"
            name="semester"
            required
            className="mt-1.5 w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#17191C] focus:border-[#0B5D4B] focus:outline-none focus:ring-1 focus:ring-[#0B5D4B]"
          >
            <option value="">Select semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="scheme" className="block text-[14px] font-semibold text-[#17191C]">
            VTU Scheme <span className="text-[#A12B2B]">*</span>
          </label>
          <select
            id="scheme"
            name="scheme"
            required
            className="mt-1.5 w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#17191C] focus:border-[#0B5D4B] focus:outline-none focus:ring-1 focus:ring-[#0B5D4B]"
          >
            <option value="">Select scheme</option>
            <option value="2022">2022 Scheme</option>
            <option value="2021">2021 Scheme</option>
            <option value="2018">2018 Scheme</option>
            <option value="2017">2017 Scheme</option>
            <option value="2015">2015 Scheme</option>
          </select>
        </div>
      </div>

      {/* Course Type and Tech Preference */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="course_type" className="block text-[14px] font-semibold text-[#17191C]">
            Course Type <span className="text-[#A12B2B]">*</span>
          </label>
          <select
            id="course_type"
            name="course_type"
            required
            className="mt-1.5 w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#17191C] focus:border-[#0B5D4B] focus:outline-none focus:ring-1 focus:ring-[#0B5D4B]"
          >
            <option value="">Select course type</option>
            {COURSE_TYPES.map((t) => (
              <option key={t} value={t}>
                {COURSE_TYPE_LABELS[t] || t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tech_pref" className="block text-[14px] font-semibold text-[#17191C]">
            Technology Preference (Optional)
          </label>
          <input
            id="tech_pref"
            name="tech_pref"
            type="text"
            maxLength={200}
            placeholder="e.g. Python, ESP32, React, TensorFlow"
            className="mt-1.5 w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#17191C] placeholder-[#5F6670] focus:border-[#0B5D4B] focus:outline-none focus:ring-1 focus:ring-[#0B5D4B]"
          />
        </div>
      </div>

      {/* Timeline and Team */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="deadline" className="block text-[14px] font-semibold text-[#17191C]">
            Target Deadline <span className="text-[#A12B2B]">*</span>
          </label>
          <p className="mt-0.5 text-[12px] text-[#5F6670]">Must be at least 7 days ahead.</p>
          <input
            id="deadline"
            name="deadline"
            type="date"
            required
            min={minDate}
            className="mt-1.5 w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#17191C] focus:border-[#0B5D4B] focus:outline-none focus:ring-1 focus:ring-[#0B5D4B]"
          />
        </div>

        <div>
          <label htmlFor="budget_inr" className="block text-[14px] font-semibold text-[#17191C]">
            Budget in Rupees (Optional)
          </label>
          <p className="mt-0.5 text-[12px] text-[#5F6670]">Target amount for the complete build.</p>
          <input
            id="budget_inr"
            name="budget_inr"
            type="number"
            min={0}
            step={100}
            placeholder="e.g. 5000"
            className="mt-1.5 w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#17191C] placeholder-[#5F6670] focus:border-[#0B5D4B] focus:outline-none focus:ring-1 focus:ring-[#0B5D4B]"
          />
        </div>

        <div>
          <label htmlFor="team_size" className="block text-[14px] font-semibold text-[#17191C]">
            Team Size <span className="text-[#A12B2B]">*</span>
          </label>
          <p className="mt-0.5 text-[12px] text-[#5F6670]">Students in this project group.</p>
          <select
            id="team_size"
            name="team_size"
            required
            defaultValue="1"
            className="mt-1.5 w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#17191C] focus:border-[#0B5D4B] focus:outline-none focus:ring-1 focus:ring-[#0B5D4B]"
          >
            <option value="1">1 student (Individual)</option>
            <option value="2">2 students</option>
            <option value="3">3 students</option>
            <option value="4">4 students (Full team)</option>
          </select>
        </div>
      </div>

      {/* Reference Files */}
      <div>
        <label htmlFor="reference_files" className="block text-[14px] font-semibold text-[#17191C]">
          Reference Files (Optional)
        </label>
        <p className="mt-0.5 text-[12px] text-[#5F6670]">
          Attach up to 3 files (IEEE base papers, problem specifications, or block diagrams). Allowed formats: PDF, DOCX, PNG, JPEG, TXT (up to 3 MB each). Files are checked by signature and stored privately.
        </p>
        <input
          id="reference_files"
          name="reference_files"
          type="file"
          multiple
          accept=".pdf,.docx,.png,.jpg,.jpeg,.txt"
          className="mt-1.5 block w-full text-[14px] text-[#5F6670] file:mr-4 file:rounded-[4px] file:border-0 file:bg-[#FBFAF7] file:px-4 file:py-2 file:text-[14px] file:font-semibold file:text-[#0B5D4B] hover:file:bg-[#FBFAF7]"
        />
      </div>

      {/* Academic Integrity Checkbox */}
      <div className="rounded-[6px] border border-[#DDD9D0] bg-[#FBFAF7] p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="ack_integrity"
            id="ack_integrity"
            required
            className="mt-1 h-4 w-4 rounded border-[#DDD9D0] text-[#0B5D4B] focus:ring-[#0B5D4B]"
          />
          <span className="text-[13px] leading-relaxed text-[#17191C]">
            I will follow my college and VTU rules, I will take part in each milestone, and I will be able to explain the project myself.
          </span>
        </label>
        <p className="mt-2 text-[12px] text-[#5F6670] border-t border-[#DDD9D0] pt-2">
          By submitting a request, you agree to our{" "}
          <Link href="/terms" className="text-[#0B5D4B] underline">
            Terms and Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[#0B5D4B] underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-[6px] bg-[#0B5D4B] px-5 py-3 text-center text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#084A3C] focus:outline-none focus:ring-2 focus:ring-[#0B5D4B] focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? "Submitting request..." : "Submit project request"}
        </button>
        <p className="mt-2 text-center text-[12px] text-[#5F6670]">
          You are not charged until you accept a written quote. Rate limited to 3 requests per day.
        </p>
      </div>
    </form>
  );
}
