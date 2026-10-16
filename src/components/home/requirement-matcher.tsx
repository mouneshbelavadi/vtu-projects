"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const DOMAINS = [
  "Artificial Intelligence & Machine Learning",
  "Web Development & Cloud",
  "Internet of Things (IoT) & Embedded",
  "Cybersecurity & Network Defense",
  "Blockchain & Distributed Ledgers",
  "Data Science & Big Data",
  "Robotics & Automation",
  "Electronics & VLSI",
  "Mechanical & Thermal Systems",
  "Civil & Environmental Engg",
];

export function RequirementMatcher() {
  const router = useRouter();
  const [domain, setDomain] = React.useState(DOMAINS[0]);
  const [title, setTitle] = React.useState("");
  const [requirements, setRequirements] = React.useState("");

  const handleSearchMatches = (e: React.FormEvent) => {
    e.preventDefault();
    const query = [title, domain].filter(Boolean).join(" ");
    router.push(`/projects?q=${encodeURIComponent(query)}`);
  };

  const handleCustomRequest = () => {
    router.push("/request");
  };

  return (
    <div className="rounded-2xl border border-rule/80 bg-surface p-6 sm:p-7 shadow-xs space-y-4">
      <div className="space-y-1">
        <h3 className="font-display text-lg font-bold text-ink">
          Project Scope & Topic Explorer
        </h3>
        <p className="text-xs text-ink-2 leading-relaxed">
          Specify your department and topic concept to find verified curriculum kits or initiate a custom project inquiry.
        </p>
      </div>

      <form onSubmit={handleSearchMatches} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
            Engineering Domain
          </label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-rule bg-surface text-sm text-ink shadow-xs focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all"
          >
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
            Project Title or Topic Idea
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Real-time driver drowsiness alert or LoRa water quality monitor"
            className="w-full h-11 px-3.5 rounded-xl border border-rule bg-surface text-sm text-ink placeholder:text-ink-3 shadow-xs focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
            Key Modules, Requirements or Tech Stack
          </label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={2}
            placeholder="e.g. PyTorch, YOLOv8, FastAPI, ESP32, includes synopsis and viva preparation notes..."
            className="w-full p-3.5 rounded-xl border border-rule bg-surface text-sm text-ink placeholder:text-ink-3 shadow-xs focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="submit"
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md hover:shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Find matching project kits</span>
            <span>&rarr;</span>
          </button>
          <button
            type="button"
            onClick={handleCustomRequest}
            className="h-11 px-5 rounded-xl border border-rule bg-surface text-ink text-xs sm:text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-rule-strong active:scale-[0.98] transition-all cursor-pointer shadow-xs"
          >
            Request custom build
          </button>
        </div>
      </form>
    </div>
  );
}
