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
    <div className="rounded-md border border-rule bg-surface p-6 shadow-sm space-y-4">
      <div className="space-y-1">
        <h3 className="font-serif text-lg font-bold text-ink">
          Match by Your Project Requirements
        </h3>
        <p className="text-xs text-ink-2">
          Tell us your domain and title idea. Find an existing kit immediately or request a custom milestone build.
        </p>
      </div>

      <form onSubmit={handleSearchMatches} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
            Engineering Domain
          </label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-rule bg-paper text-sm text-ink focus:border-accent focus:outline-none"
          >
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
            Project Title or Topic Idea
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Smart Attendance with Face Recognition or Solar Tracker"
            className="w-full h-10 px-3 rounded-md border border-rule bg-paper text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
            Key Modules, Requirements or Tech Stack
          </label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={2}
            placeholder="e.g. Python, OpenCV, Flask, SQLite, requires report and viva questions..."
            className="w-full p-3 rounded-md border border-rule bg-paper text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="submit"
            className="flex-1 h-10 rounded-md bg-accent text-surface text-xs sm:text-sm font-semibold hover:bg-accent-hover transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Find matching project kits</span>
            <span>&rarr;</span>
          </button>
          <button
            type="button"
            onClick={handleCustomRequest}
            className="h-10 px-4 rounded-md border border-rule bg-surface text-ink text-xs sm:text-sm font-medium hover:bg-paper hover:border-ink transition-colors cursor-pointer"
          >
            Request custom build
          </button>
        </div>
      </form>
    </div>
  );
}
