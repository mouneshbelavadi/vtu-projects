import fs from "node:fs";
import path from "node:path";

const BANNED_PHRASES = [
  "seamless",
  "revolutionize",
  "supercharge",
  "cutting-edge",
  "game-changer",
  "empower",
  "elevate",
  "leverage",
  "unleash",
  "next-level",
  "world-class",
  "best-in-class",
  "journey",
  "effortless",
  "ultimate",
  "guaranteed",
  "100%",
  "trusted by",
  "your success starts here",
  "take your project to the next level",
];

// Regex for emoji detection
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

// Regex for em dash (U+2014) and en dash (U+2013)
const DASH_REGEX = /[\u2013\u2014]/;

interface Violation {
  file: string;
  line: number;
  reason: string;
  snippet: string;
}

function getFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFiles(fullPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") ||
        entry.name.endsWith(".tsx") ||
        entry.name.endsWith(".js") ||
        entry.name.endsWith(".jsx") ||
        entry.name.endsWith(".md") ||
        entry.name.endsWith(".json"))
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

function lintFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const isLegalDoc = filePath.includes(path.join("src", "content", "legal"));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || "";
    const lineNumber = i + 1;

    // Check dashes
    if (DASH_REGEX.test(line)) {
      violations.push({
        file: filePath,
        line: lineNumber,
        reason:
          "Contains em dash or en dash. Use a comma, colon, full stop, or hyphen with spaces.",
        snippet: line.trim(),
      });
    }

    // Check emoji
    if (EMOJI_REGEX.test(line)) {
      violations.push({
        file: filePath,
        line: lineNumber,
        reason: "Contains emoji decoration. Project rules forbid emojis.",
        snippet: line.trim(),
      });
    }

    // Check banned phrases (skip for legal pages)
    if (!isLegalDoc) {
      const lower = line.toLowerCase();
      for (const phrase of BANNED_PHRASES) {
        if (lower.includes(phrase.toLowerCase())) {
          violations.push({
            file: filePath,
            line: lineNumber,
            reason: `Contains banned copy phrase: "${phrase}"`,
            snippet: line.trim(),
          });
        }
      }
    }
  }

  return violations;
}

function main() {
  const root = process.cwd();
  const scanDirs = [path.join(root, "src"), path.join(root, "content")];
  const allViolations: Violation[] = [];

  for (const dir of scanDirs) {
    const files = getFiles(dir);
    for (const file of files) {
      allViolations.push(...lintFile(file));
    }
  }

  if (allViolations.length > 0) {
    console.error(`\x1b[31mLint copy failed with ${allViolations.length} violation(s):\x1b[0m\n`);
    for (const v of allViolations) {
      console.error(`- ${v.file}:${v.line} -> ${v.reason}`);
      console.error(`  Line: "${v.snippet}"\n`);
    }
    process.exit(1);
  } else {
    console.log("\x1b[32mAll copy and text checks passed cleanly.\x1b[0m");
    process.exit(0);
  }
}

main();
