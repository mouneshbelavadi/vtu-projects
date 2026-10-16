import { siteConfig } from "../../../../site.config";

export const dynamic = "force-static";

export async function GET() {
  const contactEmail = siteConfig.supportEmail || "contact@vtuadda.com";
  const siteUrl = siteConfig.siteUrl || "https://projects.vtuadda.com";
  // Expires one year from generation
  const expiresDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const lines = [
    `Contact: mailto:${contactEmail}`,
    `Expires: ${expiresDate}`,
    `Preferred-Languages: en`,
    `Canonical: ${siteUrl}/.well-known/security.txt`,
    `Policy: ${siteUrl}/terms`,
  ];

  return new Response(lines.join("\n") + "\n", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
