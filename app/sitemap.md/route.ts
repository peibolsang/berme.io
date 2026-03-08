import { getAllPosts } from "../../lib/posts";
import { getBaseUrl } from "../../lib/site";
import { getAllViews } from "../../lib/views";
import { getConferences } from "../../lib/conferences";
import { toMarkdownUrl } from "../../lib/markdown-exports";

export const revalidate = 3600;

const asIsoDate = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString();
};

type UrlEntry = {
  url: string;
  kind: "page" | "view" | "post" | "conference";
  title: string;
  lastModified?: string;
};

const buildMarkdownSitemap = (baseUrl: string, entries: UrlEntry[]) => {
  const generatedAt = new Date().toISOString();
  const lines = [
    "# Sitemap",
    "",
    "LLM-optimized sitemap for berme.io.",
    "",
    `- Generated: ${generatedAt}`,
    `- Canonical Base URL: ${baseUrl}`,
    `- Total URLs: ${entries.length}`,
    "",
    "## URL Index",
    "",
    "| URL | Type | Title | Last Modified |",
    "| --- | --- | --- | --- |",
    ...entries.map((entry) =>
      `| ${entry.url} | ${entry.kind} | ${entry.title.replace(/\|/g, "\\|")} | ${entry.lastModified ?? ""} |`,
    ),
    "",
    "## Notes",
    "",
    "- Use canonical URLs exactly as listed in the URL Index.",
    "- Post, view, and conference entries intentionally point to their markdown variants.",
    "- Post and view timestamps are ISO-8601 in UTC.",
  ];

  return lines.join("\n");
};

export async function GET() {
  const baseUrl = await getBaseUrl();
  const [posts, views, conferences] = await Promise.all([
    getAllPosts(),
    getAllViews(),
    getConferences(),
  ]);
  const entries: UrlEntry[] = [{ url: `${baseUrl}/`, kind: "page", title: "Home" }];

  for (const view of views) {
    entries.push({
      url: `${baseUrl}${toMarkdownUrl(view.url)}`,
      kind: "view",
      title: view.title,
      lastModified: asIsoDate(view.updatedAt),
    });
  }

  for (const post of posts) {
    entries.push({
      url: `${baseUrl}${toMarkdownUrl(post.url)}`,
      kind: "post",
      title: post.title,
      lastModified: asIsoDate(post.updatedAt),
    });
  }

  for (const conference of conferences) {
    entries.push({
      url: `${baseUrl}${toMarkdownUrl(conference.url)}`,
      kind: "conference",
      title: conference.title,
      lastModified: asIsoDate(conference.date),
    });
  }

  const uniqueEntries = Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());
  const markdown = buildMarkdownSitemap(baseUrl, uniqueEntries);

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
