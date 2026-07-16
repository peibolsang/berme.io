import type { Book, Conference, Post, View } from "../types";
import type { GitHubComment } from "./github";

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

const mergeVaryHeader = (currentValue: string | null, value: string) => {
  const existing = new Set(
    (currentValue ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => entry.toLowerCase()),
  );
  existing.add(value.toLowerCase());
  return Array.from(existing)
    .map((entry) => (entry === "accept" ? "Accept" : entry))
    .join(", ");
};

export const estimateMarkdownTokens = (markdown: string) =>
  Math.max(1, Math.ceil(markdown.trim().length / 4));

export const createMarkdownResponse = (
  markdown: string,
  init?: Omit<ResponseInit, "headers"> & {
    headers?: HeadersInit;
  },
) => {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", MARKDOWN_CONTENT_TYPE);
  headers.set("Vary", mergeVaryHeader(headers.get("Vary"), "Accept"));
  headers.set("x-markdown-tokens", String(estimateMarkdownTokens(markdown)));
  return new Response(markdown, {
    ...init,
    headers,
  });
};

const buildLinkList = (entries: Array<{ title: string; url: string; detail?: string | null }>) =>
  entries.length > 0
    ? entries
        .map((entry) =>
          entry.detail
            ? `- [${entry.title}](${entry.url}) — ${entry.detail}`
            : `- [${entry.title}](${entry.url})`,
        )
        .join("\n")
    : "_None._";

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

type HomeMarkdownDocumentInput = {
  baseUrl: string;
  activeView: "posts" | "views" | "books" | "conferences";
  posts: Post[];
  pinned: Post[];
  popular: Post[];
  views: View[];
  books: Book[];
  conferences: Conference[];
  nowPost: Post | null;
};

const buildPostList = (posts: Post[]) =>
  buildLinkList(
    posts.map((post) => ({
      title: post.title,
      url: `${post.url}?view=posts`,
      detail: new Date(post.publishedAt).toISOString().slice(0, 10),
    })),
  );

export const buildHomeMarkdownDocument = ({
  baseUrl,
  activeView,
  posts,
  pinned,
  popular,
  views,
  books,
  conferences,
  nowPost,
}: HomeMarkdownDocumentInput) => {
  const viewsSection =
    activeView === "views"
      ? joinSections([
          "## Views",
          views.length > 0
            ? views
                .map((view) =>
                  joinSections([
                    `### [${view.title}](${view.url}?view=views)`,
                    view.description ?? undefined,
                    view.posts.length > 0
                      ? ["Posts:", ...view.posts.map((post) => `- ${post.title}`)].join("\n")
                      : "_No articles yet._",
                  ]),
                )
                .join("\n\n")
            : "No views available yet.",
        ])
      : null;

  const booksSection =
    activeView === "books"
      ? joinSections([
          "## Books",
          books.length > 0
            ? books
                .map((book) =>
                  `- [${book.title}](${book.url}) — ${book.description} (${book.cta})`,
                )
                .join("\n")
            : "No books available yet.",
        ])
      : null;

  const conferencesSection =
    activeView === "conferences"
      ? joinSections([
          "## Conferences",
          conferences.length > 0
            ? conferences
                .map((conference) => {
                  const details = [conference.event, conference.location, conference.summary]
                    .filter(Boolean)
                    .join(" — ");
                  return `- [${conference.title}](${conference.url}) — ${details}`;
                })
                .join("\n")
            : "No conference presentations yet.",
        ])
      : null;

  return joinSections([
    "# Pablo Bermejo",
    buildMetadataLines([
      ["Type", "Homepage"],
      ["Canonical HTML URL", quoteValue("/")],
      ["Canonical Base URL", quoteValue(baseUrl)],
      ["Selected view", activeView],
      ["Now", nowPost?.title ? `[${nowPost.title}](/now)` : null],
    ]),
    "---",
    "I am a hands-on technologist, systems thinker, and communicator. I explore technological change from first principles, connect ideas, and test them by building.",
    "Drawing on 20 years in enterprise software, I turn what I learn into clear perspectives to create a lasting difference in the teams I work with as we build technology together.",
    "## Available Views",
    "- [Posts](/?view=posts)",
    "- [Views](/?view=views)",
    "- [Books](/?view=books)",
    "- [Conferences](/?view=conferences)",
    activeView === "posts"
      ? joinSections([
          pinned.length > 0 ? "## Featured Posts" : null,
          pinned.length > 0 ? buildPostList(pinned) : null,
          popular.length > 0 ? "## Popular Posts" : null,
          popular.length > 0 ? buildPostList(popular) : null,
          "## Recent Posts",
          buildPostList(posts),
        ])
      : null,
    viewsSection,
    booksSection,
    conferencesSection,
  ]);
};

type NowMarkdownDocumentInput = {
  post: Post;
  currentlyWriting: Array<{ number: number; title: string }>;
  comments: GitHubComment[];
};

export const buildNowMarkdownDocument = ({
  post,
  currentlyWriting,
  comments,
}: NowMarkdownDocumentInput) => {
  const commentsSection =
    comments.length > 0
      ? joinSections([
          "## Comments",
          comments
            .map((comment) =>
              joinSections([
                `### ${comment.user?.login ?? "Unknown"} — ${comment.created_at}`,
                comment.body?.trim() || "_No comment body._",
              ]),
            )
            .join("\n\n"),
        ])
      : "## Comments\n\nNo comments yet.";

  const currentlyWritingSection =
    currentlyWriting.length > 0
      ? joinSections([
          "## Currently Writing",
          currentlyWriting.map((issue) => `- ${issue.title}`).join("\n"),
        ])
      : null;

  return joinSections([
    `# ${post.title}`,
    buildMetadataLines([
      ["Type", "Now"],
      ["Canonical HTML URL", quoteValue("/now")],
      ["Published", post.publishedAt],
      ["Updated", post.updatedAt],
      ["Author", post.author?.name],
      [
        "Labels",
        buildLabels(
          post.labels.filter((label) => {
            const normalized = label.toLowerCase();
            return normalized !== "published" && normalized !== "now";
          }),
        ),
      ],
    ]),
    "---",
    post.body.trim(),
    currentlyWritingSection,
    commentsSection,
  ]);
};
