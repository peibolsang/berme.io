import { getConferences } from "./conferences";
import { config } from "./config";
import { toMarkdownUrl } from "./markdown-exports";
import { getAllPosts } from "./posts";
import { getBaseUrl } from "./site";
import { getAllViews } from "./views";

type ContentIndexItemType = "post" | "view" | "conference";

type RelatedContentLink = {
  id: string;
  title: string;
  htmlUrl: string;
};

export type ContentIndexItem = {
  id: string;
  type: ContentIndexItemType;
  title: string;
  htmlUrl: string;
  markdownUrl: string;
  publishedAt?: string;
  updatedAt?: string;
  labels: string[];
  relatedLabels: string[];
  summary?: string;
  excerpt?: string;
  view?: RelatedContentLink | null;
  posts?: RelatedContentLink[];
  event?: string;
  location?: string | null;
};

export type ContentIndexDocument = {
  schemaVersion: "1.0";
  generatedAt: string;
  baseUrl: string;
  site: {
    name: string;
    description: string;
    htmlUrl: string;
    sitemapMarkdownUrl: string;
    sitemapJsonUrl: string;
  };
  items: ContentIndexItem[];
};

const siteDescription =
  "Personal site and technical writing by Pablo Bermejo on product leadership, enterprise software, and software engineering.";

const normalizeLabel = (label: string) => label.trim();

const dedupeAndSort = (values: Array<string | null | undefined>) =>
  Array.from(
    new Set(values.map((value) => normalizeLabel(value ?? "")).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));

const toIsoDate = (value: string | null | undefined) => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
};

const stripMarkdown = (value: string) =>
  value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/[*_~#>-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const summarize = (value: string | null | undefined, maxLength = 220) => {
  const plainText = stripMarkdown(value ?? "");
  if (!plainText) {
    return undefined;
  }
  if (plainText.length <= maxLength) {
    return plainText;
  }
  return `${plainText.slice(0, maxLength).trimEnd()}...`;
};

const visiblePostLabels = (labels: string[]) =>
  dedupeAndSort(labels.filter((label) => label.toLowerCase() !== "published"));

const visibleConferenceLabels = (labels: string[]) =>
  dedupeAndSort(
    labels.filter((label) => {
      const normalized = label.toLowerCase();
      return normalized !== "published" && normalized !== "conference";
    }),
  );

const typeSortOrder: Record<ContentIndexItemType, number> = {
  post: 0,
  view: 1,
  conference: 2,
};

export const getContentIndex = async (): Promise<ContentIndexDocument> => {
  const [baseUrl, posts, views, conferences] = await Promise.all([
    getBaseUrl(),
    getAllPosts(),
    getAllViews(),
    getConferences(),
  ]);

  const items: ContentIndexItem[] = [
    ...posts.map((post) => {
      const labels = visiblePostLabels(post.labels);
      const view =
        post.viewNumber && post.viewTitle && post.viewSlug
          ? {
              id: `view:${post.viewNumber}`,
              title: post.viewTitle,
              htmlUrl: `${baseUrl}/views/${post.viewSlug}`,
            }
          : null;

      return {
        id: `post:${post.number}`,
        type: "post" as const,
        title: post.title,
        htmlUrl: `${baseUrl}${post.url}`,
        markdownUrl: `${baseUrl}${toMarkdownUrl(post.url)}`,
        publishedAt: toIsoDate(post.publishedAt),
        updatedAt: toIsoDate(post.updatedAt),
        labels,
        relatedLabels: labels,
        summary: post.excerpt,
        excerpt: post.excerpt,
        view,
      };
    }),
    ...views.map((view) => {
      const labels = dedupeAndSort(view.posts.flatMap((post) => visiblePostLabels(post.labels)));

      return {
        id: `view:${view.number}`,
        type: "view" as const,
        title: view.title,
        htmlUrl: `${baseUrl}${view.url}`,
        markdownUrl: `${baseUrl}${toMarkdownUrl(view.url)}`,
        updatedAt: toIsoDate(view.updatedAt),
        labels,
        relatedLabels: labels,
        summary: view.description ?? summarize(view.body),
        posts: view.posts.map((post) => ({
          id: `post:${post.number}`,
          title: post.title,
          htmlUrl: `${baseUrl}${post.url}`,
        })),
      };
    }),
    ...conferences.map((conference) => {
      const labels = visibleConferenceLabels(conference.labels);

      return {
        id: `conference:${conference.number}`,
        type: "conference" as const,
        title: conference.title,
        htmlUrl: `${baseUrl}${conference.url}`,
        markdownUrl: `${baseUrl}${toMarkdownUrl(conference.url)}`,
        publishedAt: toIsoDate(conference.date),
        labels,
        relatedLabels: labels,
        summary: conference.summary,
        event: conference.event,
        location: conference.location ?? null,
      };
    }),
  ].sort((left, right) => {
    const typeDiff = typeSortOrder[left.type] - typeSortOrder[right.type];
    if (typeDiff !== 0) {
      return typeDiff;
    }
    return left.htmlUrl.localeCompare(right.htmlUrl);
  });

  return {
    schemaVersion: "1.0",
    generatedAt: new Date().toISOString(),
    baseUrl,
    site: {
      name: "berme.io",
      description: siteDescription,
      htmlUrl: `${baseUrl}/`,
      sitemapMarkdownUrl: `${baseUrl}/sitemap.md`,
      sitemapJsonUrl: `${baseUrl}/sitemap.json`,
    },
    items,
  };
};

export const contentIndexRevalidate = config.revalidateSeconds;
