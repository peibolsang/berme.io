import type { Conference, Post, View } from "../types";

export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";

const joinSections = (sections: Array<string | null | undefined>) =>
  sections.filter((section): section is string => Boolean(section)).join("\n\n");

const quoteValue = (value: string) => `\`${value}\``;

const buildMetadataLines = (entries: Array<[string, string | null | undefined]>) =>
  entries
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `- ${label}: ${value as string}`)
    .join("\n");

const buildLabels = (labels: string[]) => {
  const visibleLabels = labels
    .map((label) => label.trim())
    .filter(Boolean);
  return visibleLabels.length > 0 ? visibleLabels.join(", ") : null;
};

export const toMarkdownUrl = (url: string) => {
  if (!url || url === "/" || url.endsWith(".md")) {
    return url;
  }
  return `${url.replace(/\/$/, "")}.md`;
};

export const buildPostMarkdownDocument = (post: Post) =>
  joinSections([
    `# ${post.title}`,
    buildMetadataLines([
      ["Type", "Post"],
      ["Canonical HTML URL", quoteValue(post.url)],
      ["Published", post.publishedAt],
      ["Updated", post.updatedAt],
      ["Author", post.author?.name],
      ["Labels", buildLabels(post.labels.filter((label) => label.toLowerCase() !== "published"))],
      ["View", post.viewTitle],
    ]),
    "---",
    post.body.trim(),
  ]);

export const buildViewMarkdownDocument = (view: View) => {
  const postsSection =
    view.posts.length > 0
      ? ["## Posts in This View", "", ...view.posts.map((post) => `- ${post.title}`)].join("\n")
      : null;

  return joinSections([
    `# ${view.title}`,
    buildMetadataLines([
      ["Type", "View"],
      ["Canonical HTML URL", quoteValue(view.url)],
      ["Updated", view.updatedAt],
      ["Author", view.author?.name],
      ["Posts", String(view.posts.length)],
    ]),
    "---",
    view.body?.trim() || "_No body content._",
    postsSection,
  ]);
};

export const buildConferenceMarkdownDocument = (conference: Conference) =>
  joinSections([
    `# ${conference.title}`,
    buildMetadataLines([
      ["Type", "Conference"],
      ["Canonical HTML URL", quoteValue(conference.url)],
      ["Event", conference.event],
      ["Presented", conference.date],
      ["Location", conference.location],
      ["Pages", String(conference.pageCount)],
      ["Content density", conference.contentDensity],
      [
        "Labels",
        buildLabels(
          conference.labels.filter((label) => {
            const normalized = label.trim().toLowerCase();
            return normalized !== "published" && normalized !== "conference";
          }),
        ),
      ],
      ["PDF URL", quoteValue(conference.pdfPath)],
    ]),
    "---",
    "## Summary",
    conference.summary,
  ]);
