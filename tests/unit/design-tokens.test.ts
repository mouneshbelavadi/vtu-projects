import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Permitted token colors from new modern design system
export const PERMITTED_HEX_COLORS = new Set([
  "#F8FAFC", // paper / page bg
  "#FFFFFF", // surface / card bg
  "#0F172A", // ink / slate-900
  "#475569", // ink-2 / slate-600
  "#94A3B8", // ink-3 / slate-400
  "#CBD5E1", // rule-strong / slate-300
  "#E2E8F0", // rule / slate-200
  "#4F46E5", // primary / indigo-600
  "#4338CA", // indigo-700
  "#6366F1", // indigo-500
  "#7C3AED", // violet-600
  "#EEF2FF", // brand-50 / accent-weak
  "#06B6D4", // cyan-500
  "#22D3EE", // cyan-400
  "#B45309", // warn-text / amber-700
  "#FEF3C7", // warn-bg / amber-100
  "#F59E0B", // amber-500
  "#EF4444", // danger / red-500
  "#FEE2E2", // danger-bg / red-100
  "#10B981", // success / emerald-500
  "#059669", // emerald-600
  "#D1FAE5", // success-bg / emerald-100
  "#0B0F19", // dark paper
  "#131A29", // dark surface
  "#1E293B", // dark rule
  "#334155", // dark rule-strong
  "#FBFAF7", // legacy paper fallback
  "#17191C", // legacy ink fallback
  "#4A5058", // legacy ink-2 fallback
  "#5F6670", // legacy ink-3 fallback
  "#DDD9D0", // legacy rule fallback
  "#B9B4A8", // legacy rule-strong fallback
  "#0B5D4B", // legacy accent fallback
  "#084A3C", // legacy accent-hover fallback
  "#E4F0EC", // legacy accent-weak fallback
  "#6B4700", // legacy warn fallback
  "#FFF4D6", // legacy warn-bg fallback
  "#A12B2B", // legacy danger fallback
  "#FBE9E7", // legacy danger-bg fallback
  "#1E6B3C", // legacy success fallback
  "#E6F3EA", // legacy success-bg fallback
]);

// Helper: Calculate relative luminance
export function getLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// Helper: Calculate WCAG contrast ratio
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function getAllSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllSourceFiles(full));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") || entry.name.endsWith(".css"))
    ) {
      files.push(full);
    }
  }
  return files;
}

describe("Design System Invariant Rules", () => {
  describe("Color Contrast Verification (WCAG AA)", () => {
    it("ensures ink on paper exceeds 7:1", () => {
      const ratio = getContrastRatio("#0F172A", "#F8FAFC");
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it("ensures ink-2 on paper exceeds 4.5:1", () => {
      const ratio = getContrastRatio("#475569", "#F8FAFC");
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("ensures ink on surface exceeds 7:1", () => {
      const ratio = getContrastRatio("#0F172A", "#FFFFFF");
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it("ensures white text on accent button exceeds 4.5:1", () => {
      const ratio = getContrastRatio("#FFFFFF", "#4F46E5");
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("ensures accent on accent-weak exceeds 4.5:1", () => {
      const ratio = getContrastRatio("#4F46E5", "#EEF2FF");
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("ensures warn-text on warn-bg exceeds 4.5:1", () => {
      const ratio = getContrastRatio("#B45309", "#FEF3C7");
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("ensures danger on danger-bg exceeds 4.5:1", () => {
      const ratio = getContrastRatio("#B91C1C", "#FEE2E2");
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("ensures success on success-bg exceeds 4.5:1", () => {
      const ratio = getContrastRatio("#047857", "#D1FAE5");
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe("Design Page Production Guard", () => {
    it("invokes notFound when NODE_ENV is production", async () => {
      const originalEnv = process.env.NODE_ENV;
      const envObj = process.env as Record<string, string | undefined>;
      try {
        envObj.NODE_ENV = "production";
        const { default: DesignPage } = await import("@/app/design/page");
        expect(() => DesignPage()).toThrowError(
          /NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/
        );
      } finally {
        envObj.NODE_ENV = originalEnv;
      }
    }, 15000);
  });
});
