import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-url";
import { source } from "@/lib/source";

const sitemap = (): MetadataRoute.Sitemap => {
  const base = siteUrl();

  return [
    {
      url: base,
    },
    ...source.getPages().map((page) => ({
      url: new URL(page.url, base).toString(),
    })),
  ];
};

export default sitemap;
