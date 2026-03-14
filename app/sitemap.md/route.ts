import {
  contentIndexRevalidate,
  getContentIndex,
} from "../../lib/content-index";

export const revalidate = contentIndexRevalidate;

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
  const { baseUrl, items } = await getContentIndex();
  const entries: UrlEntry[] = [{ url: `${baseUrl}/`, kind: "page", title: "Home" }];

  entries.push(
    ...items.map((item) => ({
      url: item.markdownUrl,
      kind: item.type,
      title: item.title,
      lastModified: asIsoDate(item.updatedAt ?? item.publishedAt),
    })),
  );

  const uniqueEntries = Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());
  const markdown = buildMarkdownSitemap(baseUrl, uniqueEntries);

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
