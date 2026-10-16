"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const POPULAR_SEARCHES = [
  { label: "AI & Machine Learning", query: "machine learning" },
  { label: "Computer Vision", query: "computer vision" },
  { label: "IoT & Sensors", query: "iot" },
  { label: "Web Applications", query: "web" },
  { label: "Cybersecurity", query: "security" },
  { label: "Blockchain", query: "blockchain" },
];

export function HeroSearch() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchTerm.trim();
    if (clean) {
      router.push(`/projects?q=${encodeURIComponent(clean)}`);
    } else {
      router.push("/projects");
    }
  };

  const handleTagClick = (query: string) => {
    router.push(`/projects?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="space-y-3 pt-2">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            aria-label="Search project kits"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by topic, domain (e.g. OpenCV, IoT, React), or branch..."
            className="w-full h-12 px-4 rounded-xl border border-rule bg-surface text-sm text-ink placeholder:text-ink-3 shadow-xs transition-all duration-200 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
          />
        </div>
        <button
          type="submit"
          className="h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:shadow-indigo-500/25 active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap"
        >
          Find projects
        </button>
      </form>

      {/* Quick Tag Suggestions */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-3">
        <span className="font-medium text-ink-2">Popular topics:</span>
        {POPULAR_SEARCHES.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleTagClick(item.query)}
            className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 transition-all font-medium cursor-pointer"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
