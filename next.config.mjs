import { createMDX } from "fumadocs-mdx/next";

/** @type {import("next").NextConfig} */
const nextConfig = {
  redirects: async () => [
    {
      source: "/docs",
      destination: "/docs/overview",
      permanent: false,
    },
  ],
};

const withMDX = createMDX();

export default withMDX(nextConfig);
