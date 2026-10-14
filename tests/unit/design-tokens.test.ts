import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Permitted token colors from PROJECT_RULES.md
const PERMITTED_HEX_COLORS = new Set([
  "#FBFAF7", // paper
  "#FFFFFF", // surface
  "#17191C", // ink
  "#4A5058", // ink-2
  "#5F6670", // ink-3
  "#DDD9D0", // rule
  "#B9B4A8", // rule-strong
  "#0B5D4B", // accent
  "#084A3C", // accent-hover
  "#E4F0EC", // accent-weak
  "#6B4700", // warn-text
  "#FFF4D6", // warn-bg
  "#A12B2B", // danger
  "#FBE9E7", // danger-bg
  "#1E6B3C", // success
  "#E6F3EA", // success-bg
]);

// Helper: Calculate relative luminance
function getLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// Helper: Calculate WCAG contrast ratio
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const FORBIDDEN_PATTERNS = [
  /gradient/i,
  /rounded-3xl/i,
  /backdrop-/i,
  /blur-/i,
  /animate-/i,
  /shadow-lg/i,
  /shadow-xl/i,
  /shadow-2xl/i,
];

export function scanContentForForbidden(
  content: string,
  isRadioFile: boolean
): { line: number; match: string }[] {
  const violations: { line: number; match: string }[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || "";

    if (!isRadioFile && line.includes("rounded-full")) {
      violations.push({
        line: i + 1,
        match: "rounded-full (only permitted in radio.tsx)",
      });
    }

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({
          line: i + 1,
          match: pattern.toString(),
        });
      }
    }
  }

  return violations;
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
      const ratio = getContrastRatio("#17191C", "#FBFAF7");
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it("ensures ink-2 on paper exceeds 4.5:1", () => {
      const ratio = getContrastRatio("#4A5058", "#FBFAF7");
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("ensures ink on surface exceeds 7:1", () => {
      const ratio = getContrastRatio("#17191C", "#FFFFFF");
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it("ensures white text on accent button exceeds 4.5:1", () => {
      const ratio = getContrastRatio("#FFFFFF", "#0B5D4B");
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("ensures accent on accent-weak exceeds 4.5:1", () => {
      const ratio = getContrastRatio("#0B5D4B", "#E4F0EC");
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("ensures warn-text on warn-bg exceeds 4.5:1", () => {
      const ratio = getContrastRatio("#6B4700", "#FFF4D6");
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("ensures danger on danger-bg exceeds 4.5:1", () => {
      const ratio = getContrastRatio("#A12B2B", "#FBE9E7");
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("ensures success on success-bg exceeds 4.5:1", () => {
      const ratio = getContrastRatio("#1E6B3C", "#E6F3EA");
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe("Forbidden CSS Utilities and Classes", () => {
    it("scans src files and ensures no forbidden classes or utilities exist", () => {
      const srcDir = path.resolve(__dirname, "../../src");
      const files = getAllSourceFiles(srcDir);
      const violations: { file: string; line: number; match: string }[] = [];

      for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        const isRadioFile = file.replace(/\\/g, "/").endsWith("src/components/ui/radio.tsx");
        const found = scanContentForForbidden(content, isRadioFile);

        for (const f of found) {
          violations.push({ file, line: f.line, match: f.match });
        }
      }

      expect(
        violations,
        `Forbidden utility classes detected: ${JSON.stringify(violations)}`
      ).toEqual([]);
    });

    it("demonstrates that deliberate rounded-full or gradient classes trigger failure", () => {
      const sampleWithRounded = '<button className="rounded-full">test</button>';
      const roundViolations = scanContentForForbidden(sampleWithRounded, false);
      expect(roundViolations.length).toBe(1);
      expect(roundViolations[0]?.match).toContain("rounded-full");

      const sampleWithGradient = '<div className="bg-gradient-to-r from-red-500">test</div>';
      const gradViolations = scanContentForForbidden(sampleWithGradient, false);
      expect(gradViolations.length).toBe(1);
      expect(gradViolations[0]?.match).toContain("gradient");
    });

    it("verifies that arbitrary off-palette hex colors are not used in source code", () => {
      const srcDir = path.resolve(__dirname, "../../src");
      const files = getAllSourceFiles(srcDir);
      const hexRegex = /#[0-9A-Fa-f]{6}\b/g;
      const offPaletteMatches: { file: string; hex: string }[] = [];

      for (const file of files) {
        const normalized = file.replace(/\\/g, "/");
        if (
          normalized.endsWith("globals.css") ||
          normalized.endsWith("layout.tsx") ||
          normalized.endsWith("icon.svg")
        ) {
          continue;
        }

        const content = fs.readFileSync(file, "utf-8");
        const matches = content.match(hexRegex) || [];

        for (const hex of matches) {
          const upper = hex.toUpperCase();
          if (!PERMITTED_HEX_COLORS.has(upper)) {
            offPaletteMatches.push({ file, hex });
          }
        }
      }

      expect(
        offPaletteMatches,
        `Off-palette colors detected: ${JSON.stringify(offPaletteMatches)}`
      ).toEqual([]);
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
