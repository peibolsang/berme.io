import { unstable_cache } from "next/cache";
import type { Conference } from "../types";
import { config } from "./config";
import { getAllBlogIssues } from "./github";
import { parseFrontmatter } from "./frontmatter";
import { slugify } from "./slugify";

const CONFERENCE_LABEL = "conference";

const hasConferenceLabel = (labels: Array<{ name?: string }>) =>
  labels.some(
    (label) => String(label.name ?? "").trim().toLowerCase() === CONFERENCE_LABEL,
  );

const asDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toIsoDate = (value: Date) => value.toISOString();

const stripMarkdown = (value: string) =>
  value
    .replace(
      /\\?\[[^\]]+\\?\]\s*\\?\[[^\]]+\\?\]\s*\\?\[[0-9]{8}\\?\]\.pdf/gi,
      " ",
    )
    .replace(
      /\[([^\]]*\.pdf[^\]]*)\]\((https?:\/\/[^)\s]+)\)/gi,
      " ",
    )
    .replace(
      /\[[^\]]+\]\((https?:\/\/[^)\s]*(?:github|githubusercontent|user-attachments)[^)\\s]*)\)/gi,
      " ",
    )
    .replace(
      /\[[^\]]*\]\((https?:\/\/[^)\s]+\.pdf(?:\?[^)\s]*)?)\)/gi,
      " ",
    )
    .replace(/<https?:\/\/[^>\s]+\.pdf(?:\?[^>\s]*)?>/gi, " ")
    .replace(/https?:\/\/[^\s)]+\.pdf(?:\?[^\s)]*)?/gi, " ")
    .replace(/\\?\]\s*\\?\(\s*\\?\)/g, " ")
    .replace(/\\?\]\s*\\?\(\s+\\?\)/g, " ")
    .replace(/\\?\]\s*\\?\(/g, " ")
    .replace(/\\?\)/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[>*_~#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildSummary = (excerpt: unknown, body: string) => {
  if (typeof excerpt === "string" && excerpt.trim()) {
    const cleanedExcerpt = stripMarkdown(excerpt);
    if (cleanedExcerpt) {
      return cleanedExcerpt;
    }
  }
  const normalized = stripMarkdown(body);
  if (!normalized) {
    return "Presentation slides and conference notes.";
  }
  return normalized;
};

const resolvePdfUrl = (frontmatter: Record<string, unknown>, body: string) => {
  const frontmatterCandidates = [
    frontmatter.pdfUrl,
    frontmatter.pdfPath,
    frontmatter.pdf,
    frontmatter.slides,
  ].filter((value): value is string => typeof value === "string");

  const markdownLinkRegex = /\[[^\]]*\]\((https?:\/\/[^)\s]+\.pdf(?:\?[^)\s]*)?)\)/gi;
  const angleLinkRegex = /<(https?:\/\/[^>\s]+\.pdf(?:\?[^>\s]*)?)>/gi;
  const bareLinkRegex = /(https?:\/\/[^\s)]+\.pdf(?:\?[^\s)]*)?)/gi;

  const collected: string[] = [];
  const collectMatches = (regex: RegExp) => {
    for (const match of body.matchAll(regex)) {
      if (match[1]) {
        collected.push(match[1].trim());
      }
    }
  };

  collectMatches(markdownLinkRegex);
  collectMatches(angleLinkRegex);
  collectMatches(bareLinkRegex);

  const candidates = [...frontmatterCandidates, ...collected].map((value) =>
    value.replace(/[)>.,]$/, "").trim(),
  );

  return candidates.find((value) => /^https?:\/\//i.test(value) && /\.pdf(\?|$)/i.test(value)) ?? null;
};

const wordCount = (value: string) => {
  const normalized = stripMarkdown(value);
  if (!normalized) {
    return 0;
  }
  return normalized.split(" ").filter(Boolean).length;
};

const inferDensity = (
  body: string,
  pageCount: number,
): Conference["contentDensity"] => {
  const pages = Math.max(1, pageCount);
  const wordsPerPage = wordCount(body) / pages;
  if (wordsPerPage >= 220) {
    return "dense";
  }
  if (wordsPerPage <= 100) {
    return "light";
  }
  return "medium";
};

const pdfPageCountCache = new Map<string, Promise<number>>();

const estimatePdfPageCount = async (pdfUrl: string) => {
  if (pdfPageCountCache.has(pdfUrl)) {
    return pdfPageCountCache.get(pdfUrl) as Promise<number>;
  }

  const promise = (async () => {
    try {
      const response = await fetch(pdfUrl, { cache: "force-cache" });
      if (!response.ok) {
        return 1;
      }
      const arrayBuffer = await response.arrayBuffer();
      const raw = new Uint8Array(arrayBuffer);
      const text = Buffer.from(raw).toString("latin1");
      const pageMatches = text.match(/\/Type\s*\/Page\b/g);
      const count = pageMatches?.length ?? 0;
      return count > 0 ? count : 1;
    } catch {
      return 1;
    }
  })();

  pdfPageCountCache.set(pdfUrl, promise);
  return promise;
};

const buildConferenceUrl = (slug: string) => `/conferences/${slug}`;

const fetchConferences = async (): Promise<Conference[]> => {
  const issues = await getAllBlogIssues();

  const entries: Array<Conference | null> = await Promise.all(
    issues.map(async (issue) => {
      if (!hasConferenceLabel(issue.labels)) {
        return null;
      }

      const { data, body } = parseFrontmatter(issue.body ?? "");
      const event = typeof data.event === "string" ? data.event.trim() : "";
      if (!event) {
        return null;
      }

      const publishedAtRaw = data.publishedAt ?? issue.created_at;
      const date = asDate(publishedAtRaw as string);
      if (!date) {
        return null;
      }

      const slugBase =
        typeof data.slug === "string" && data.slug.trim() ? data.slug : issue.title;
      const slug = slugify(slugBase);
      if (!slug) {
        return null;
      }

      const pdfPath = resolvePdfUrl(data, body);
      if (!pdfPath) {
        return null;
      }

      const pageCount = await estimatePdfPageCount(pdfPath);
      const density = inferDensity(body, pageCount);
      const summary = buildSummary(data.excerpt, body);
      const location = typeof data.location === "string" ? data.location.trim() : "";
      const labels = issue.labels
        .map((label) => String(label.name ?? "").trim())
        .filter(Boolean);
      const baseConference: Conference = {
        id: String(issue.id),
        number: issue.number,
        slug,
        title: issue.title,
        event,
        date: toIsoDate(date),
        summary,
        pdfPath,
        pageCount,
        contentDensity: density,
        labels,
        url: buildConferenceUrl(slug),
      };

      if (location) {
        baseConference.location = location;
      }

      return baseConference;
    }),
  );

  return entries
    .filter((entry): entry is Conference => entry !== null)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
};

export const getConferences = unstable_cache(fetchConferences, ["conferences"], {
  revalidate: config.revalidateSeconds,
  tags: ["conferences", "github-issues"],
});

export const getConferenceBySlug = async (slug: string): Promise<Conference | null> => {
  const conferences = await getConferences();
  return conferences.find((conference) => conference.slug === slug) ?? null;
};

export const getConferenceYearsGrouped = async () => {
  const grouped = new Map<string, Conference[]>();
  const conferences = await getConferences();

  conferences.forEach((conference) => {
    const year = String(new Date(conference.date).getUTCFullYear());
    const bucket = grouped.get(year) ?? [];
    bucket.push(conference);
    grouped.set(year, bucket);
  });

  return Array.from(grouped.entries())
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map(([year, items]) => ({
      year,
      items,
    }));
};
