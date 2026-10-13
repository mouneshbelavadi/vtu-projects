import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { siteConfig } from "../site.config";

const isLaunch = process.argv.includes("--launch");

type Status = "PASS" | "FAIL" | "NOT YET APPLICABLE";

interface CheckResult {
  name: string;
  status: Status;
  details: string;
}

const results: CheckResult[] = [];

function check(name: string, fn: () => { pass: boolean; laterPrompt?: number; details: string }) {
  try {
    const outcome = fn();
    if (outcome.pass) {
      results.push({ name, status: "PASS", details: outcome.details });
    } else if (outcome.laterPrompt && !isLaunch) {
      results.push({
        name,
        status: "NOT YET APPLICABLE",
        details: `Requires Prompt ${outcome.laterPrompt}: ${outcome.details}`,
      });
    } else {
      results.push({ name, status: "FAIL", details: outcome.details });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ name, status: "FAIL", details: msg });
  }
}

// 1. site.config complete
check("site.config complete", () => {
  const missing: string[] = [];
  if (!siteConfig.businessName) missing.push("businessName");
  if (!siteConfig.tradeName) missing.push("tradeName");
  if (!siteConfig.siteName) missing.push("siteName");
  if (!siteConfig.siteUrl) missing.push("siteUrl");
  if (!siteConfig.supportEmail) missing.push("supportEmail");
  if (!siteConfig.whatsappNumber) missing.push("whatsappNumber");
  if (!siteConfig.upi.payeeName) missing.push("upi.payeeName");
  if (!siteConfig.upi.vpa) missing.push("upi.vpa");
  if (!siteConfig.address) missing.push("address");
  if (!siteConfig.grievanceOfficer.name) missing.push("grievanceOfficer.name");
  if (!siteConfig.grievanceOfficer.email) missing.push("grievanceOfficer.email");

  if (missing.length > 0) {
    return {
      pass: false,
      laterPrompt: 4,
      details: `Owner must fill required fields: ${missing.join(", ")}`,
    };
  }
  return { pass: true, details: "All required site.config fields are filled." };
});

// 2. legalReviewedOn set
check("legalReviewedOn set", () => {
  if (!siteConfig.legalReviewedOn) {
    return {
      pass: false,
      laterPrompt: 10,
      details: "legalReviewedOn is empty; must be recorded after legal review.",
    };
  }
  return { pass: true, details: `Reviewed on ${siteConfig.legalReviewedOn}` };
});

// 3. favicon, apple-touch-icon and Open Graph image files exist
check("favicon, apple-touch-icon, and Open Graph image exist", () => {
  const hasFavicon =
    fs.existsSync(path.join(process.cwd(), "src", "app", "favicon.ico")) ||
    fs.existsSync(path.join(process.cwd(), "public", "favicon.ico"));
  const hasAppleIcon =
    fs.existsSync(path.join(process.cwd(), "src", "app", "apple-icon.png")) ||
    fs.existsSync(path.join(process.cwd(), "public", "apple-touch-icon.png"));
  const hasIconSvg = fs.existsSync(path.join(process.cwd(), "src", "app", "icon.svg"));

  if (!hasFavicon || !hasAppleIcon || !hasIconSvg) {
    return {
      pass: false,
      laterPrompt: 2,
      details: "favicon.ico, apple-icon.png, and icon.svg are required.",
    };
  }
  return { pass: true, details: "favicon.ico, icon.svg, and apple-icon.png exist." };
});

// 4. privacy and terms routes exist and are non-empty
check("privacy and terms routes exist and are non-empty", () => {
  const privacyRoute = path.join(process.cwd(), "src", "app", "privacy", "page.tsx");
  const termsRoute = path.join(process.cwd(), "src", "app", "terms", "page.tsx");
  const privacyExists = fs.existsSync(privacyRoute) && fs.statSync(privacyRoute).size > 50;
  const termsExists = fs.existsSync(termsRoute) && fs.statSync(termsRoute).size > 50;

  if (!privacyExists || !termsExists) {
    return {
      pass: false,
      laterPrompt: 10,
      details: "Legal pages scheduled for Prompt 10.",
    };
  }
  return { pass: true, details: "Privacy and terms routes exist and have content." };
});

// 5. no source map files in the production build output
check("no source map files in production build output", () => {
  const nextDir = path.join(process.cwd(), ".next");
  if (!fs.existsSync(nextDir)) {
    return {
      pass: false,
      laterPrompt: 1,
      details:
        "Production build output (.next) has not been generated yet. Run npm run build first.",
    };
  }

  function findMapFiles(dir: string): string[] {
    const maps: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        maps.push(...findMapFiles(full));
      } else if (entry.isFile() && entry.name.endsWith(".map")) {
        maps.push(full);
      }
    }
    return maps;
  }

  const mapFiles = findMapFiles(nextDir);
  if (mapFiles.length > 0) {
    return {
      pass: false,
      details: `Found ${mapFiles.length} source map file(s) in build output: ${mapFiles[0]}`,
    };
  }
  return { pass: true, details: "No .map files found in .next directory." };
});

// 6. no X-Powered-By
check("no X-Powered-By configured", () => {
  const nextConfigPath = path.join(process.cwd(), "next.config.mjs");
  const middlewarePath = path.join(process.cwd(), "src", "middleware.ts");
  const hasPoweredByFalse =
    fs.existsSync(nextConfigPath) &&
    fs.readFileSync(nextConfigPath, "utf-8").includes("poweredByHeader: false");
  const middlewareDeletesHeader =
    fs.existsSync(middlewarePath) &&
    fs.readFileSync(middlewarePath, "utf-8").includes("X-Powered-By");

  if (!hasPoweredByFalse && !middlewareDeletesHeader) {
    return { pass: false, details: "X-Powered-By is not disabled." };
  }
  return { pass: true, details: "poweredByHeader is disabled and stripped." };
});

// 7. no generator meta tag
check("no generator meta tag in page source", () => {
  const layoutPath = path.join(process.cwd(), "src", "app", "layout.tsx");
  if (fs.existsSync(layoutPath)) {
    const content = fs.readFileSync(layoutPath, "utf-8").toLowerCase();
    if (content.includes('name="generator"') || content.includes("generator:")) {
      return { pass: false, details: "Generator meta tag found in layout." };
    }
  }
  return { pass: true, details: "No generator meta tag present." };
});

// 8. no tool or AI wording in package.json, README, layout and footer
check("no tool or AI wording in package.json, README, layout", () => {
  const FORBIDDEN_WORDS = [
    "antigravity",
    "cursor",
    "v0",
    "copilot",
    "chatgpt",
    "claude",
    "made with ai",
    "generated by",
  ];
  const filesToCheck = [
    path.join(process.cwd(), "package.json"),
    path.join(process.cwd(), "README.md"),
    path.join(process.cwd(), "src", "app", "layout.tsx"),
  ];

  for (const file of filesToCheck) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf-8").toLowerCase();
      for (const word of FORBIDDEN_WORDS) {
        if (content.includes(word)) {
          return {
            pass: false,
            details: `Found forbidden tool/AI reference "${word}" in ${path.basename(file)}`,
          };
        }
      }
    }
  }
  return { pass: true, details: "No tool or AI wording found." };
});

// 9. no dangerouslySetInnerHTML outside JSON-LD component
check("no dangerouslySetInnerHTML outside JSON-LD component", () => {
  const srcDir = path.join(process.cwd(), "src");
  function findDanger(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const hits: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        hits.push(...findDanger(full));
      } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
        if (
          !entry.name.toLowerCase().includes("json-ld") &&
          !entry.name.toLowerCase().includes("jsonld")
        ) {
          const content = fs.readFileSync(full, "utf-8");
          if (content.includes("dangerouslySetInnerHTML")) {
            hits.push(full);
          }
        }
      }
    }
    return hits;
  }

  const occurrences = findDanger(srcDir);
  if (occurrences.length > 0) {
    return {
      pass: false,
      details: `dangerouslySetInnerHTML used outside JSON-LD in: ${occurrences.join(", ")}`,
    };
  }
  return { pass: true, details: "No unsanctioned dangerouslySetInnerHTML calls." };
});

// 10. no console.log in src
check("no console.log in src", () => {
  const srcDir = path.join(process.cwd(), "src");
  function findConsole(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const hits: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        hits.push(...findConsole(full));
      } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
        const content = fs.readFileSync(full, "utf-8");
        if (content.includes("console.log(")) {
          hits.push(full);
        }
      }
    }
    return hits;
  }

  const logs = findConsole(srcDir);
  if (logs.length > 0) {
    return { pass: false, details: `console.log found in: ${logs.join(", ")}` };
  }
  return { pass: true, details: "No console.log statements found in src." };
});

// 11. lint:copy passes
check("lint:copy passes", () => {
  try {
    execSync("npm run lint:copy", { stdio: "pipe" });
    return { pass: true, details: "Copy lint clean." };
  } catch {
    return { pass: false, details: "lint:copy command failed." };
  }
});

// 12. npm audit shows no high or critical issues in production dependencies
check("npm audit shows no high or critical issues in production dependencies", () => {
  try {
    execSync("npm audit --omit=dev --audit-level=high", { stdio: "pipe" });
    return { pass: true, details: "Zero high or critical production vulnerabilities." };
  } catch {
    return {
      pass: false,
      details: "High or critical vulnerabilities detected in production dependencies.",
    };
  }
});

// Output report
console.log("\nVTU Adda Project Hub - Preflight Verification");
console.log(`Mode: ${isLaunch ? "LAUNCH GATE" : "DEVELOPMENT"}\n`);

let failed = false;

for (const r of results) {
  const color =
    r.status === "PASS" ? "\x1b[32m" : r.status === "NOT YET APPLICABLE" ? "\x1b[33m" : "\x1b[31m";
  console.log(`[${color}${r.status}\x1b[0m] ${r.name}`);
  console.log(`        ${r.details}`);
  if (r.status === "FAIL") {
    failed = true;
  }
}

console.log("\n---------------------------------------------");
if (failed) {
  console.error("\x1b[31mPreflight failed. Fix failures before proceeding.\x1b[0m\n");
  process.exit(1);
} else {
  console.log("\x1b[32mPreflight checks passed for current stage.\x1b[0m\n");
  process.exit(0);
}
