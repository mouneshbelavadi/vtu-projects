"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitCustomRequestForm, type SubmitRequestState } from "./actions";
import { COURSE_TYPES } from "@/types/database";
import {
  AlertCircle,
  Loader2,
  Send,
  FileText,
  Layers,
  Clock,
  Paperclip,
} from "lucide-react";

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
    <form action={formAction} className="space-y-8">
      {state?.error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-800 shadow-xs flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-rose-900">Submission Error</h3>
            <p className="mt-0.5 text-xs sm:text-sm leading-relaxed">{state.error}</p>
          </div>
        </div>
      )}

      {/* Section 1: Project Overview */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 border-b border-rule/60 pb-2">
          <FileText className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink font-heading">
            1. Project Overview
          </h3>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-ink">
            Project Title <span className="text-rose-500 font-bold">*</span>
          </label>
          <p className="mt-1 text-xs text-ink-3">
            A clear title or problem statement for your proposed project (up to 120 characters).
          </p>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={120}
            placeholder="e.g. Real-Time Air Quality Monitoring System using LoRaWAN"
            className="mt-2 w-full rounded-xl border border-rule bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-4 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all sm:text-base"
          />
        </div>

        {/* Brief */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="brief" className="block text-sm font-semibold text-ink">
              Detailed Project Brief <span className="text-rose-500 font-bold">*</span>
            </label>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                briefLength >= 50
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : "bg-surface-2 text-ink-3 border border-rule/60"
              }`}
            >
              {briefLength} / 3000 characters (min 50)
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-3">
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
            className="mt-2 w-full rounded-xl border border-rule bg-surface p-4 text-sm text-ink placeholder:text-ink-4 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all leading-relaxed sm:text-base"
          />
        </div>
      </div>

      {/* Section 2: Academic Context */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 border-b border-rule/60 pb-2">
          <Layers className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink font-heading">
            2. Academic Context
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="branch" className="block text-sm font-semibold text-ink">
              Branch <span className="text-rose-500 font-bold">*</span>
            </label>
            <select
              id="branch"
              name="branch"
              required
              className="mt-2 w-full rounded-xl border border-rule bg-surface px-4 py-3 text-sm text-ink shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all sm:text-base cursor-pointer"
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
            <label htmlFor="semester" className="block text-sm font-semibold text-ink">
              Semester <span className="text-rose-500 font-bold">*</span>
            </label>
            <select
              id="semester"
              name="semester"
              required
              className="mt-2 w-full rounded-xl border border-rule bg-surface px-4 py-3 text-sm text-ink shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all sm:text-base cursor-pointer"
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
            <label htmlFor="scheme" className="block text-sm font-semibold text-ink">
              VTU Scheme <span className="text-rose-500 font-bold">*</span>
            </label>
            <select
              id="scheme"
              name="scheme"
              required
              className="mt-2 w-full rounded-xl border border-rule bg-surface px-4 py-3 text-sm text-ink shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all sm:text-base cursor-pointer"
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="course_type" className="block text-sm font-semibold text-ink">
              Course Type <span className="text-rose-500 font-bold">*</span>
            </label>
            <select
              id="course_type"
              name="course_type"
              required
              className="mt-2 w-full rounded-xl border border-rule bg-surface px-4 py-3 text-sm text-ink shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all sm:text-base cursor-pointer"
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
            <label htmlFor="tech_pref" className="block text-sm font-semibold text-ink">
              Technology Preference (Optional)
            </label>
            <input
              id="tech_pref"
              name="tech_pref"
              type="text"
              maxLength={200}
              placeholder="e.g. Python, ESP32, React, TensorFlow"
              className="mt-2 w-full rounded-xl border border-rule bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-4 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all sm:text-base"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Timeline & Team */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 border-b border-rule/60 pb-2">
          <Clock className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink font-heading">
            3. Timeline & Team
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
          <div className="sm:col-span-4">
            <label htmlFor="deadline" className="block text-sm font-semibold text-ink">
              Target Deadline <span className="text-rose-500 font-bold">*</span>
            </label>
            <p className="mt-1 text-xs text-ink-3">Must be at least 7 days ahead.</p>
            <input
              id="deadline"
              name="deadline"
              type="date"
              required
              min={minDate}
              className="mt-2 w-full rounded-xl border border-rule bg-surface px-3 sm:px-3.5 py-3 text-sm text-ink shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all cursor-pointer"
            />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="budget_inr" className="block text-sm font-semibold text-ink">
              Budget (Optional)
            </label>
            <p className="mt-1 text-xs text-ink-3">Target amount (INR).</p>
            <input
              id="budget_inr"
              name="budget_inr"
              type="number"
              min={0}
              step={100}
              placeholder="e.g. 5000"
              className="mt-2 w-full rounded-xl border border-rule bg-surface px-3 sm:px-3.5 py-3 text-sm text-ink placeholder:text-ink-4 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all"
            />
          </div>

          <div className="sm:col-span-5">
            <label htmlFor="team_size" className="block text-sm font-semibold text-ink">
              Team Size <span className="text-rose-500 font-bold">*</span>
            </label>
            <p className="mt-1 text-xs text-ink-3">Students in this project group.</p>
            <select
              id="team_size"
              name="team_size"
              required
              defaultValue="1"
              className="mt-2 w-full rounded-xl border border-rule bg-surface pl-3 sm:pl-3.5 pr-8 py-3 text-sm text-ink shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all cursor-pointer"
            >
              <option value="1">1 student (Individual)</option>
              <option value="2">2 students</option>
              <option value="3">3 students</option>
              <option value="4">4 students (Full team)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 4: Reference Materials & Compliance */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 border-b border-rule/60 pb-2">
          <Paperclip className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink font-heading">
            4. Reference Materials & Compliance
          </h3>
        </div>

        {/* Reference Files */}
        <div>
          <label htmlFor="reference_files" className="block text-sm font-semibold text-ink">
            Reference Files (Optional)
          </label>
          <p className="mt-1 text-xs text-ink-3 leading-relaxed">
            Attach up to 3 files (IEEE base papers, problem specifications, or block diagrams). Allowed formats: PDF, DOCX, PNG, JPEG, TXT (up to 3 MB each). Files are checked by signature and stored privately.
          </p>
          <div className="mt-2.5 rounded-xl border-2 border-dashed border-rule/80 bg-surface-2/40 p-4 transition-colors hover:bg-surface-2/70 sm:p-5">
            <input
              id="reference_files"
              name="reference_files"
              type="file"
              multiple
              accept=".pdf,.docx,.png,.jpg,.jpeg,.txt"
              className="block w-full text-xs text-ink-3 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 transition-colors cursor-pointer sm:text-sm"
            />
          </div>
        </div>

        {/* Academic Integrity Checkbox */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 sm:p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="ack_integrity"
              id="ack_integrity"
              required
              className="mt-1 h-4 w-4 rounded border-rule text-indigo-600 focus:ring-4 focus:ring-indigo-600/20 cursor-pointer"
            />
            <span className="text-xs sm:text-sm leading-relaxed text-ink font-medium">
              I will follow my college and VTU rules, I will take part in each milestone, and I will be able to explain the project myself.
            </span>
          </label>
          <p className="mt-3 text-xs text-ink-3 border-t border-indigo-100/80 pt-3">
            By submitting a request, you agree to our{" "}
            <Link href="/terms" className="text-indigo-700 underline font-medium hover:text-indigo-900">
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-indigo-700 underline font-medium hover:text-indigo-900">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Sticky / Prominent Submit Section */}
      <div className="pt-2">
        <div className="sticky bottom-4 z-10 -mx-6 -mb-6 p-4 bg-surface/95 backdrop-blur-md border-t border-rule/70 rounded-b-2xl shadow-xl sm:static sm:z-auto sm:mx-0 sm:mb-0 sm:p-0 sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:rounded-none sm:shadow-none">
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-md hover:shadow-lg hover:shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer sm:text-base"
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Submitting request...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit project request</span>
              </>
            )}
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-ink-3">
          You are not charged until you accept a written quote. Rate limited to 3 requests per day.
        </p>
      </div>
    </form>
  );
}
