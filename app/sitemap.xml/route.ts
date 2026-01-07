import { getAllPosts } from "../../lib/posts";
import { getAllSeries } from "../../lib/series";
import { getBaseUrl } from "../../lib/site";

export const revalidate = 3600;

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
  const baseUrl = await getBaseUrl();
  const [posts, series] = await Promise.all([getAllPosts(), getAllSeries()]);
  const urls = [
    { loc: `${baseUrl}/` },
    ...series.map((entry) => ({
      loc: `${baseUrl}${entry.url}`,
      lastmod: entry.updatedAt,
    })),
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
