import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { GET as getSecurityTxt } from "@/app/.well-known/security.txt/route";
import { siteConfig } from "../../site.config";

// Mock Supabase admin client for sitemap
vi.mock("@/server/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => {
      if (table === "projects") {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [
                  {
                    slug: "smart-traffic-system",
                    updated_at: "2026-10-10T12:00:00Z",
                    branch: "CSE",
                    semester: "6",
                    course_type: "mini",
                  },
                  {
                    slug: "iot-weather-station",
                    updated_at: "2026-10-12T14:30:00Z",
                    branch: "ECE",
                    semester: "8",
                    course_type: "major",
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      return { select: () => Promise.resolve({ data: [], error: null }) };
    },
  })),
}));

describe("Prompt 11: Deployment & SEO Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("1. robots.txt Indexing Control", () => {
    it("disallows everything by default when indexing is not enabled", () => {
      delete process.env.ALLOW_INDEXING;
      process.env.NEXT_PUBLIC_SITE_URL = "https://projects.vtuadda.com";

      const res = robots();
      expect(res.rules).toEqual({
        userAgent: "*",
        disallow: "/",
      });
      expect(res.sitemap).toBeUndefined();
    });

    it("disallows everything on preview deployments even if ALLOW_INDEXING is true", () => {
      process.env.ALLOW_INDEXING = "true";
      process.env.NEXT_PUBLIC_SITE_URL = "https://preview-deploy.vercel.app";

      const res = robots();
      expect(res.rules).toEqual({
        userAgent: "*",
        disallow: "/",
      });
      expect(res.sitemap).toBeUndefined();
    });

    it("allows public crawling and protects private routes only on production when ALLOW_INDEXING is true", () => {
      process.env.ALLOW_INDEXING = "true";
      process.env.NEXT_PUBLIC_SITE_URL = "https://projects.vtuadda.com";

      const res = robots();
      expect(res.rules).toEqual({
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/builder", "/account", "/checkout", "/api"],
      });
      expect(res.sitemap).toBe("https://projects.vtuadda.com/sitemap.xml");
    });
  });

  describe("2. sitemap.xml Generation Invariants", () => {
    it("includes all public static pages and live kits with lastModified dates", async () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://projects.vtuadda.com";
      const entries = await sitemap();

      const urls = entries.map((e) => e.url);

      // Core static public pages
      expect(urls).toContain("https://projects.vtuadda.com");
      expect(urls).toContain("https://projects.vtuadda.com/projects");
      expect(urls).toContain("https://projects.vtuadda.com/mentoring");
      expect(urls).toContain("https://projects.vtuadda.com/request");
      expect(urls).toContain("https://projects.vtuadda.com/how-it-works");
      expect(urls).toContain("https://projects.vtuadda.com/contact");
      expect(urls).toContain("https://projects.vtuadda.com/academic-integrity");
      expect(urls).toContain("https://projects.vtuadda.com/refund");
      expect(urls).toContain("https://projects.vtuadda.com/privacy");
      expect(urls).toContain("https://projects.vtuadda.com/terms");

      // Live kits from DB
      expect(urls).toContain("https://projects.vtuadda.com/projects/smart-traffic-system");
      expect(urls).toContain("https://projects.vtuadda.com/projects/iot-weather-station");

      // Filter landing pages with results
      expect(urls).toContain("https://projects.vtuadda.com/projects/branch/cse");
      expect(urls).toContain("https://projects.vtuadda.com/projects/branch/ece");
      expect(urls).toContain("https://projects.vtuadda.com/projects/semester/6");
      expect(urls).toContain("https://projects.vtuadda.com/projects/semester/8");
      expect(urls).toContain("https://projects.vtuadda.com/projects/type/mini");
      expect(urls).toContain("https://projects.vtuadda.com/projects/type/major");

      // Invariant: Never include private or admin paths
      expect(urls.some((u) => u.includes("/admin"))).toBe(false);
      expect(urls.some((u) => u.includes("/builder"))).toBe(false);
      expect(urls.some((u) => u.includes("/account"))).toBe(false);
      expect(urls.some((u) => u.includes("/checkout"))).toBe(false);
      expect(urls.some((u) => u.includes("/api"))).toBe(false);
    });
  });

  describe("3. security.txt Endpoint Invariants", () => {
    it("returns RFC 9116 compliant security.txt with valid contact and future expiry", async () => {
      const res = await getSecurityTxt();
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/plain");

      const body = await res.text();
      expect(body).toContain(`Contact: mailto:${siteConfig.supportEmail || "contact@vtuadda.com"}`);
      expect(body).toContain("Preferred-Languages: en");
      expect(body).toContain("Canonical: ");
      expect(body).toContain("Expires: ");

      // Verify expiration is in the future
      const expiresMatch = body.match(/Expires:\s*(\S+)/);
      expect(expiresMatch).not.toBeNull();
      const expiresDate = new Date(expiresMatch![1] as string);
      expect(expiresDate.getTime()).toBeGreaterThan(Date.now());
    });
  });
});
