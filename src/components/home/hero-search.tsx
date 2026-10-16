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
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by topic, domain (e.g. OpenCV, IoT, React), or branch..."
            className="w-full h-11 px-4 rounded-md border border-rule bg-surface text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <button
          type="submit"
          className="h-11 px-6 rounded-md bg-accent text-surface text-sm font-semibold hover:bg-accent-hover transition-colors whitespace-nowrap"
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
            className="px-2 py-0.5 rounded-sm bg-accent-weak text-accent border border-accent/20 hover:bg-accent hover:text-surface transition-colors font-medium cursor-pointer"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
