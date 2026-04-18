import { getConferences } from "../../lib/conferences";
import { getNowPost } from "../../lib/now";
import { getAllPosts } from "../../lib/posts";
import { getBaseUrl } from "../../lib/site";
import { getAllViews } from "../../lib/views";

export const revalidate = 3600;

type SitemapEntry = {
  loc: string;
  lastmod?: string;
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const asIsoDate = (value: string | null | undefined) => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
};

const getLatestIsoDate = (values: Array<string | null | undefined>) => {
  const latest = values.reduce<number | null>((currentLatest, value) => {
    if (!value) {
      return currentLatest;
    }
    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) {
      return currentLatest;
    }
    if (currentLatest === null || timestamp > currentLatest) {
      return timestamp;
    }
    return currentLatest;
  }, null);

  return latest === null ? undefined : new Date(latest).toISOString();
};

const renderEntry = (entry: SitemapEntry) => {
  const loc = escapeXml(entry.loc);
  const lastmod = entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : "";
  return `<url><loc>${loc}</loc>${lastmod}</url>`;
};

export async function GET() {
  const [baseUrl, posts, views, conferences, nowPost] = await Promise.all([
    getBaseUrl(),
    getAllPosts(),
    getAllViews(),
    getConferences(),
    getNowPost(),
  ]);

  const siteLastModified = getLatestIsoDate([
    ...posts.flatMap((post) => [post.updatedAt, post.publishedAt]),
    ...views.map((view) => view.updatedAt),
    ...conferences.map((conference) => conference.date),
    nowPost?.updatedAt,
    nowPost?.publishedAt,
  ]);

  const entries: SitemapEntry[] = [
    {
      loc: `${baseUrl}/`,
      lastmod: siteLastModified,
    },
    {
      loc: `${baseUrl}/graph`,
      lastmod: siteLastModified,
    },
    ...posts.map((post) => ({
      loc: `${baseUrl}${post.url}`,
      lastmod: asIsoDate(post.updatedAt ?? post.publishedAt),
    })),
    ...views.map((view) => ({
      loc: `${baseUrl}${view.url}`,
      lastmod: asIsoDate(view.updatedAt),
    })),
    ...conferences.map((conference) => ({
      loc: `${baseUrl}${conference.url}`,
      lastmod: asIsoDate(conference.date),
    })),
  ];

  if (nowPost) {
    entries.splice(2, 0, {
      loc: `${baseUrl}/now`,
      lastmod: asIsoDate(nowPost.updatedAt ?? nowPost.publishedAt),
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(renderEntry).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate}`,
    },
  });
}
