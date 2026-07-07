import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-url";

const robots = (): MetadataRoute.Robots => {
  const base = siteUrl();

  return {
    rules: {
      allow: "/",
      userAgent: "*",
    },
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
};

export default robots;
