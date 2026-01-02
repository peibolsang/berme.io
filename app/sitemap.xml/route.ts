import { getAllPosts } from "../../lib/posts";
import { getBaseUrl } from "../../lib/site";
import { config } from "../../lib/config";

export const revalidate = config.revalidateSeconds;

const buildSitemap = (baseUrl: string, urls: { loc: string; lastmod?: string }[]) => {
  const items = urls
    .map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : "";
      return `<url><loc>${entry.loc}</loc>${lastmod}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    items +
    `</urlset>`;
};

export async function GET() {
  const baseUrl = getBaseUrl();
  const posts = await getAllPosts();
  const urls = [
    { loc: `${baseUrl}/` },
    ...posts.map((post) => ({
      loc: `${baseUrl}${post.url}`,
      lastmod: post.updatedAt,
    })),
  ];

  const xml = buildSitemap(baseUrl, urls);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
