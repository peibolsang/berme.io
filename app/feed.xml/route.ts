import { getAllPosts } from "../../lib/posts";
import { getBaseUrl } from "../../lib/site";
import { config } from "../../lib/config";

export const revalidate = config.revalidateSeconds;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET() {
  const baseUrl = getBaseUrl();
  const posts = await getAllPosts();

  const items = posts
    .map((post) => {
      const title = escapeXml(post.title);
      const link = `${baseUrl}${post.url}`;
      const description = escapeXml(post.excerpt ?? "");
      return `
        <item>
          <title>${title}</title>
          <link>${link}</link>
          <guid>${link}</guid>
          <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
          <description>${description}</description>
        </item>
      `;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>Pablo</title>
        <link>${baseUrl}</link>
        <description>Notes and essays.</description>
        ${items}
      </channel>
    </rss>`;

  return new Response(xml.trim(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
