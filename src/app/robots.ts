import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const isIndexingAllowed =
    process.env.ALLOW_INDEXING === "true" &&
    process.env.NEXT_PUBLIC_SITE_URL === "https://projects.vtuadda.com";

  if (!isIndexingAllowed) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/builder", "/account", "/checkout", "/api"],
    },
    sitemap: "https://projects.vtuadda.com/sitemap.xml",
  };
}
