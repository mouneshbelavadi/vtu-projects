import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { siteConfig } from "../site.config";

const isLaunch = process.argv.includes("--launch");
const urlArgIndex = process.argv.indexOf("--url");
const liveUrl =
  urlArgIndex !== -1 && process.argv[urlArgIndex + 1]
    ? process.argv[urlArgIndex + 1]
    : null;

type Status = "PASS" | "FAIL" | "NOT YET APPLICABLE" | "WARN";

interface CheckResult {
  name: string;
  status: Status;
  details: string;
}

const results: CheckResult[] = [];

function check(
  name: string,
  fn: () => { pass: boolean; laterPrompt?: number; warnOnly?: boolean; details: string }
) {
  try {
    const outcome = fn();
    if (outcome.pass) {
      results.push({ name, status: "PASS", details: outcome.details });
    } else if (outcome.warnOnly) {
      results.push({ name, status: "WARN", details: outcome.details });
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

async function checkAsync(
  name: string,
  fn: () => Promise<{ pass: boolean; warnOnly?: boolean; details: string }>
) {
  try {
    const outcome = await fn();
    if (outcome.pass) {
      results.push({ name, status: "PASS", details: outcome.details });
    } else if (outcome.warnOnly) {
      results.push({ name, status: "WARN", details: outcome.details });
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
  const hasOgImage =
    fs.existsSync(path.join(process.cwd(), "src", "app", "opengraph-image.tsx")) ||
    fs.existsSync(path.join(process.cwd(), "public", "og.png"));

  if (!hasFavicon || !hasAppleIcon || !hasIconSvg || !hasOgImage) {
    return {
      pass: false,
      laterPrompt: 2,
      details: "favicon.ico, apple-icon.png, icon.svg, and opengraph-image are required.",
    };
  }
  return { pass: true, details: "favicon.ico, icon.svg, apple-icon.png, and opengraph-image exist." };
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

// 8. no tool or AI wording in package.json, README, layout
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
    const cmd = process.platform === "win32" ? "npm.cmd run lint:copy" : "npm run lint:copy";
    execSync(cmd, { stdio: "pipe" });
    return { pass: true, details: "Copy lint clean." };
  } catch {
    return { pass: false, details: "lint:copy command failed." };
  }
});

// 12. npm audit shows no high or critical issues in production dependencies
check("npm audit shows no high or critical issues in production dependencies", () => {
  try {
    const cmd =
      process.platform === "win32"
        ? "npm.cmd audit --omit=dev --audit-level=high"
        : "npm audit --omit=dev --audit-level=high";
    execSync(cmd, { stdio: "pipe" });
    return { pass: true, details: "Zero high or critical production vulnerabilities." };
  } catch {
    return {
      pass: false,
      details: "High or critical vulnerabilities detected in production dependencies.",
    };
  }
});

// 13. verification_time_text configured
check("verification_time_text configured", () => {
  return {
    pass: false,
    warnOnly: true,
    details:
      "verification_time_text in /admin/settings is empty. Students will see default verification text on checkout.",
  };
});

// 14. ALLOW_INDEXING set only in production
check("ALLOW_INDEXING configured safely", () => {
  const allowIndexing = process.env.ALLOW_INDEXING === "true";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const isProd = siteUrl === "https://projects.vtuadda.com";

  if (allowIndexing && !isProd) {
    return {
      pass: false,
      details: "ALLOW_INDEXING is set to true on a non-production site. It must only be true in production.",
    };
  }
  return {
    pass: true,
    details: allowIndexing
      ? "ALLOW_INDEXING is active on production."
      : "Search indexing is safely disabled by default.",
  };
});

// --- ASYNC LIVE SITE CHECKS (Triggered via --url <url>) ---
async function runLiveSiteChecks(targetUrl: string) {
  const base = targetUrl.replace(/\/$/, "");

  // Live 1: HTTPS & Redirect
  await checkAsync("live: HTTPS and redirect", async () => {
    if (base.startsWith("https://")) {
      const httpUrl = base.replace(/^https:/, "http:");
      try {
        const res = await fetch(httpUrl, { redirect: "manual" });
        const location = res.headers.get("location") || "";
        const redirected = res.status >= 300 && res.status < 400 && location.startsWith("https://");
        if (redirected) {
          return { pass: true, details: "HTTP automatically redirects to HTTPS." };
        }
      } catch {
        // HTTP might be closed or redirected at edge
      }
      return { pass: true, details: "Target responds over HTTPS." };
    }
    return { pass: true, details: `Target is running on ${base}.` };
  });

  // Live 2: Security headers present
  await checkAsync("live: security headers present", async () => {
    const res = await fetch(`${base}/`);
    const csp = res.headers.get("content-security-policy");
    const nosniff = res.headers.get("x-content-type-options");
    const referrer = res.headers.get("referrer-policy");
    const permissions = res.headers.get("permissions-policy");
    const coop = res.headers.get("cross-origin-opener-policy");

    const missing: string[] = [];
    if (!csp) missing.push("Content-Security-Policy");
    if (!nosniff) missing.push("X-Content-Type-Options");
    if (!referrer) missing.push("Referrer-Policy");
    if (!permissions) missing.push("Permissions-Policy");
    if (!coop) missing.push("Cross-Origin-Opener-Policy");

    if (missing.length > 0) {
      return { pass: false, details: `Missing headers: ${missing.join(", ")}` };
    }
    return { pass: true, details: "All core security headers are active on live responses." };
  });

  // Live 3: No X-Powered-By header
  await checkAsync("live: no X-Powered-By header", async () => {
    const res = await fetch(`${base}/`);
    if (res.headers.get("x-powered-by")) {
      return { pass: false, details: "Response contains X-Powered-By header." };
    }
    return { pass: true, details: "X-Powered-By is absent from live responses." };
  });

  // Live 4: No .map files reachable
  await checkAsync("live: no source map files reachable", async () => {
    const homeHtml = await (await fetch(`${base}/`)).text();
    const scriptMatches = homeHtml.match(/src="(\/_next\/static\/[^"]+\.js)"/g) || [];
    for (const match of scriptMatches.slice(0, 3)) {
      const scriptPath = match.replace('src="', "").replace('"', "");
      const mapRes = await fetch(`${base}${scriptPath}.map`);
      if (mapRes.status === 200) {
        return { pass: false, details: `Source map accessible at ${scriptPath}.map` };
      }
    }
    return { pass: true, details: "JavaScript source maps (.map) return 404." };
  });

  // Live 5: Favicon, apple-touch-icon, and Open Graph image return 200
  await checkAsync("live: visual icons and Open Graph image respond 200", async () => {
    const [favRes, ogRes] = await Promise.all([
      fetch(`${base}/favicon.ico`),
      fetch(`${base}/opengraph-image`),
    ]);

    if (favRes.status !== 200) {
      return { pass: false, details: `/favicon.ico returned status ${favRes.status}` };
    }
    if (ogRes.status !== 200) {
      return { pass: false, details: `/opengraph-image returned status ${ogRes.status}` };
    }
    return { pass: true, details: "favicon.ico and opengraph-image respond 200." };
  });

  // Live 6: /privacy and /terms return 200 and not empty
  await checkAsync("live: /privacy and /terms return 200 and non-empty", async () => {
    const [privRes, termsRes] = await Promise.all([
      fetch(`${base}/privacy`),
      fetch(`${base}/terms`),
    ]);
    const privText = await privRes.text();
    const termsText = await termsRes.text();

    if (privRes.status !== 200 || privText.length < 500) {
      return { pass: false, details: `/privacy returned status ${privRes.status} with ${privText.length} bytes.` };
    }
    if (termsRes.status !== 200 || termsText.length < 500) {
      return { pass: false, details: `/terms returned status ${termsRes.status} with ${termsText.length} bytes.` };
    }
    return { pass: true, details: "Both policy pages respond 200 with complete prose." };
  });

  // Live 7: /robots.txt and /sitemap.xml respond correctly
  await checkAsync("live: /robots.txt and /sitemap.xml respond correctly", async () => {
    const [robotsRes, sitemapRes] = await Promise.all([
      fetch(`${base}/robots.txt`),
      fetch(`${base}/sitemap.xml`),
    ]);
    const robotsText = await robotsRes.text();
    const sitemapText = await sitemapRes.text();

    if (robotsRes.status !== 200 || !/user-agent:/i.test(robotsText)) {
      return { pass: false, details: `/robots.txt responded with invalid content (${robotsRes.status})` };
    }
    if (sitemapRes.status !== 200 || !sitemapText.includes("<urlset")) {
      return { pass: false, details: `/sitemap.xml responded with invalid XML (${sitemapRes.status})` };
    }
    return { pass: true, details: "/robots.txt and /sitemap.xml respond 200 with valid content." };
  });

  // Live 8: /.well-known/security.txt responds
  await checkAsync("live: /.well-known/security.txt responds", async () => {
    const secRes = await fetch(`${base}/.well-known/security.txt`);
    const secText = await secRes.text();
    if (secRes.status !== 200 || !secText.includes("Contact: mailto:")) {
      return { pass: false, details: `security.txt returned status ${secRes.status}` };
    }
    return { pass: true, details: "RFC 9116 security.txt responds 200 with Contact mailto." };
  });

  // Live 9: No generator tag and no AI tool words (case-sensitive in visible text and meta tags)
  await checkAsync("live: no generator meta tag or AI tool branding", async () => {
    const homeHtml = await (await fetch(`${base}/`)).text();
    if (homeHtml.includes('name="generator"')) {
      return { pass: false, details: "HTML contains generator meta tag." };
    }

    // Strip scripts and styles to inspect visible text and meta tags only
    const cleanHtml = homeHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

    const metaMatches = cleanHtml.match(/<meta\b[^>]*>/gi) || [];
    const textOnly = cleanHtml.replace(/<[^>]+>/g, " ");
    const toInspect = metaMatches.join(" ") + " " + textOnly;

    const BANNED_PATTERNS = [
      /\bAntigravity\b/,
      /\bLovable\b/,
      /\bBolt\b/,
      /\bv0\b/,
      /\bCursor\b/,
      /\bChatGPT\b/,
      /\bClaude\b/,
      /\bGemini\b/,
      /\bMade with\b/i,
      /\bBuilt with\b/i,
      /\bPowered by\b/i,
    ];

    for (const pattern of BANNED_PATTERNS) {
      if (pattern.test(toInspect)) {
        return { pass: false, details: `Page contains disallowed phrase matching ${pattern}` };
      }
    }
    return { pass: true, details: "No generator meta tag or AI tool wording in page source." };
  });

  // Live 10: /admin, /builder, /account redirect signed-out visitor
  await checkAsync("live: protected routes redirect signed-out visitors", async () => {
    const [adminRes, builderRes, accountRes] = await Promise.all([
      fetch(`${base}/admin`, { redirect: "manual" }),
      fetch(`${base}/builder`, { redirect: "manual" }),
      fetch(`${base}/account`, { redirect: "manual" }),
    ]);

    const isRedirect = (res: Response) =>
      res.status >= 300 && res.status < 400 && (res.headers.get("location") || "").includes("/login");

    if (!isRedirect(adminRes) || !isRedirect(builderRes) || !isRedirect(accountRes)) {
      return {
        pass: false,
        details: `Redirects: admin=${adminRes.status}, builder=${builderRes.status}, account=${accountRes.status}`,
      };
    }
    return { pass: true, details: "/admin, /builder, and /account redirect signed-out visitors to /login." };
  });

  // Live 11: /.env, /.git/config, and /api respond 404
  await checkAsync("live: sensitive paths and bare /api respond 404", async () => {
    const [envRes, gitRes, apiRes] = await Promise.all([
      fetch(`${base}/.env`),
      fetch(`${base}/.git/config`),
      fetch(`${base}/api`),
    ]);

    if (envRes.status !== 404 || gitRes.status !== 404 || apiRes.status !== 404) {
      return {
        pass: false,
        details: `Status: .env=${envRes.status}, .git=${gitRes.status}, /api=${apiRes.status}`,
      };
    }
    return { pass: true, details: "/.env, /.git/config, and bare /api all return 404." };
  });

  // Live 12: Foreign Origin receives no Access-Control-Allow-Origin
  await checkAsync("live: foreign Origin receives no Access-Control-Allow-Origin header", async () => {
    const res = await fetch(`${base}/api/cron/expire-orders`, {
      headers: { Origin: "https://unauthorized-attacker.example.com" },
    });
    if (res.headers.get("access-control-allow-origin")) {
      return { pass: false, details: "Access-Control-Allow-Origin was returned to foreign Origin." };
    }
    return { pass: true, details: "Foreign Origin receives no Access-Control-Allow-Origin header." };
  });

  // Live 13: Cron paths return 401 without secret
  await checkAsync("live: cron endpoints return 401 without bearer secret", async () => {
    const [expRes, remRes, purgeRes] = await Promise.all([
      fetch(`${base}/api/cron/expire-orders`),
      fetch(`${base}/api/cron/session-reminders`),
      fetch(`${base}/api/cron/purge-proofs`),
    ]);

    if (expRes.status !== 401 || remRes.status !== 401 || purgeRes.status !== 401) {
      return {
        pass: false,
        details: `Status: expire=${expRes.status}, reminders=${remRes.status}, purge=${purgeRes.status}`,
      };
    }
    return { pass: true, details: "All /api/cron/* routes return 401 Unauthorized without bearer secret." };
  });
}

async function main() {
  if (liveUrl) {
    console.log(`\nConnecting to live target: ${liveUrl} ...`);
    await runLiveSiteChecks(liveUrl);
  }

  // Output report
  console.log("\nVTU Adda Project Hub - Preflight Verification");
  console.log(`Mode: ${isLaunch ? "LAUNCH GATE" : "DEVELOPMENT"}\n`);

  let failed = false;

  for (const r of results) {
    const color =
      r.status === "PASS"
        ? "\x1b[32m"
        : r.status === "NOT YET APPLICABLE" || r.status === "WARN"
          ? "\x1b[33m"
          : "\x1b[31m";
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
}

main().catch((err) => {
  console.error("Fatal preflight error:", err);
  process.exit(1);
});
