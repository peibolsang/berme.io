import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Vary",
            value: "Accept",
          },
          {
            key: "Link",
            value:
              '</sitemap.xml>; rel="https://www.sitemaps.org/protocol.html"; type="application/xml"',
          },
        ],
      },
      {
        source: "/now",
        headers: [
          {
            key: "Vary",
            value: "Accept",
          },
        ],
      },
      {
        source: "/views/:slug",
        headers: [
          {
            key: "Vary",
            value: "Accept",
          },
        ],
      },
      {
        source: "/conferences/:slug",
        headers: [
          {
            key: "Vary",
            value: "Accept",
          },
        ],
      },
      {
        source: "/:year/:month/:day/:slug",
        headers: [
          {
            key: "Vary",
            value: "Accept",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [
            {
              type: "header",
              key: "accept",
              value: ".*text/markdown.*",
            },
          ],
          destination: "/api/content-markdown/home",
        },
        {
          source: "/now",
          has: [
            {
              type: "header",
              key: "accept",
              value: ".*text/markdown.*",
            },
          ],
          destination: "/api/content-markdown/now",
        },
        {
          source: "/:year/:month/:day/:slug",
          has: [
            {
              type: "header",
              key: "accept",
              value: ".*text/markdown.*",
            },
          ],
          destination: "/api/content-markdown/post/:year/:month/:day/:slug",
        },
        {
          source: "/views/:slug",
          has: [
            {
              type: "header",
              key: "accept",
              value: ".*text/markdown.*",
            },
          ],
          destination: "/api/content-markdown/view/:slug",
        },
        {
          source: "/conferences/:slug",
          has: [
            {
              type: "header",
              key: "accept",
              value: ".*text/markdown.*",
            },
          ],
          destination: "/api/content-markdown/conference/:slug",
        },
        {
          source: "/:year/:month/:day/:slug.md",
          destination: "/api/content-markdown/post/:year/:month/:day/:slug",
        },
        {
          source: "/now.md",
          destination: "/api/content-markdown/now",
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
