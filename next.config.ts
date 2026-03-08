import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/:year/:month/:day/:slug.md",
          destination: "/api/content-markdown/post/:year/:month/:day/:slug",
        },
        {
          source: "/views/:slug.md",
          destination: "/api/content-markdown/view/:slug",
        },
        {
          source: "/conferences/:slug.md",
          destination: "/api/content-markdown/conference/:slug",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
