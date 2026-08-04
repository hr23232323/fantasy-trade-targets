import type { MetadataRoute } from "next";

const crawlRules = {
  allow: "/",
  disallow: "/api/",
};

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", ...crawlRules },
      { userAgent: "OAI-SearchBot", ...crawlRules },
      { userAgent: "Claude-SearchBot", ...crawlRules },
      { userAgent: "PerplexityBot", ...crawlRules },
    ],
    sitemap: "https://www.fantasytradetarget.com/sitemap.xml",
    host: "https://www.fantasytradetarget.com",
  };
}
