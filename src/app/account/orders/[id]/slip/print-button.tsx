"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-9 items-center justify-center rounded-md border border-rule px-4 text-xs font-semibold text-ink transition-colors duration-120 hover:bg-paper focus-visible:outline-2 focus-visible:outline-accent"
    >
      Print slip
    </button>
  );
}
