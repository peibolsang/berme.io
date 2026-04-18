"use client";

import { useEffect } from "react";
import type { ContentIndexDocument, ContentIndexItem } from "../lib/content-index";

type WebMcpTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<unknown> | unknown;
  annotations?: {
    readOnlyHint?: boolean;
  };
};

type ModelContextWithRegisterTool = {
  registerTool: (
    tool: WebMcpTool,
    options?: {
      signal?: AbortSignal;
    },
  ) => void;
};

type ModelContextWithProvideContext = {
  provideContext: (context: {
    tools: WebMcpTool[];
  }) => void | (() => void) | { dispose?: () => void };
};

type BrowserNavigator = Navigator & {
  modelContext?: ModelContextWithRegisterTool & Partial<ModelContextWithProvideContext>;
};

const SECTION_TO_URL = {
  posts: "/",
  views: "/?view=views",
  books: "/?view=books",
  conferences: "/?view=conferences",
} as const;

let contentIndexPromise: Promise<ContentIndexDocument | null> | null = null;

const getContentIndex = async () => {
  if (!contentIndexPromise) {
    contentIndexPromise = fetch("/sitemap.json", {
      headers: {
        Accept: "application/json",
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        return (await response.json()) as ContentIndexDocument;
      })
      .catch(() => null);
  }

  return contentIndexPromise;
};

const relativePathFromUrl = (absoluteOrRelativeUrl: string) => {
  try {
    const resolved = new URL(absoluteOrRelativeUrl, window.location.origin);
    if (resolved.origin !== window.location.origin) {
      return null;
    }
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return null;
  }
};

const navigateTo = (path: string) => {
  window.location.assign(path);
  return {
    ok: true,
    navigatedTo: path,
  };
};

const normalizeQuery = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const buildSearchText = (item: ContentIndexItem) =>
  [item.title, item.summary, item.excerpt, item.event, item.location, ...(item.labels ?? [])]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .toLowerCase();

const createTools = (): WebMcpTool[] => [
  {
    name: "berme.search_content",
    title: "Search berme.io content",
    description:
      "Search posts, views, and conference entries on berme.io using the site's structured content index. Returns matching canonical URLs without navigating.",
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search terms to match against titles, summaries, labels, and metadata.",
          minLength: 1,
        },
        kind: {
          type: "string",
          enum: ["all", "post", "view", "conference"],
          description: "Optional content type filter.",
          default: "all",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 10,
          default: 5,
          description: "Maximum number of results to return.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    async execute(input) {
      const query = normalizeQuery(input.query);
      const kind =
        input.kind === "post" || input.kind === "view" || input.kind === "conference"
          ? input.kind
          : "all";
      const limit =
        typeof input.limit === "number" && Number.isFinite(input.limit)
          ? Math.min(10, Math.max(1, Math.trunc(input.limit)))
          : 5;

      if (!query) {
        return {
          ok: false,
          error: "query is required",
        };
      }

      const contentIndex = await getContentIndex();
      if (!contentIndex) {
        return {
          ok: false,
          error: "content index unavailable",
        };
      }

      const filtered = contentIndex.items
        .filter((item) => kind === "all" || item.type === kind)
        .map((item) => ({
          item,
          score: buildSearchText(item).includes(query)
            ? (item.title.toLowerCase().includes(query) ? 2 : 1)
            : 0,
        }))
        .filter((entry) => entry.score > 0)
        .sort((left, right) => {
          if (right.score !== left.score) {
            return right.score - left.score;
          }
          return left.item.title.localeCompare(right.item.title);
        })
        .slice(0, limit)
        .map(({ item }) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          url: relativePathFromUrl(item.htmlUrl) ?? item.htmlUrl,
          summary: item.summary ?? item.excerpt ?? null,
          labels: item.labels,
        }));

      return {
        ok: true,
        query,
        count: filtered.length,
        results: filtered,
      };
    },
  },
  {
    name: "berme.open_home_section",
    title: "Open a homepage section",
    description:
      "Navigate to one of the main homepage sections on berme.io: posts, views, books, or conferences.",
    inputSchema: {
      type: "object",
      properties: {
        section: {
          type: "string",
          enum: ["posts", "views", "books", "conferences"],
          description: "Homepage section to open.",
        },
      },
      required: ["section"],
      additionalProperties: false,
    },
    execute(input) {
      const section =
        input.section === "views" ||
        input.section === "books" ||
        input.section === "conferences"
          ? input.section
          : "posts";

      return navigateTo(SECTION_TO_URL[section]);
    },
  },
  {
    name: "berme.open_site_page",
    title: "Open a key page",
    description:
      "Navigate to a key berme.io page such as the /now page or the content relationship graph.",
    inputSchema: {
      type: "object",
      properties: {
        page: {
          type: "string",
          enum: ["now", "graph"],
          description: "The key page to open.",
        },
      },
      required: ["page"],
      additionalProperties: false,
    },
    execute(input) {
      const page = input.page === "graph" ? "/graph" : "/now";
      return navigateTo(page);
    },
  },
  {
    name: "berme.open_content_url",
    title: "Open a canonical content URL",
    description:
      "Navigate to a canonical berme.io URL for a post, view, conference, or other site route. Only same-origin relative URLs are allowed.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Same-origin relative URL to open, for example /now or /2026/04/18/example-post.",
        },
      },
      required: ["url"],
      additionalProperties: false,
    },
    execute(input) {
      const value = typeof input.url === "string" ? input.url.trim() : "";
      const path = relativePathFromUrl(value);
      if (!path || !path.startsWith("/")) {
        return {
          ok: false,
          error: "url must be a same-origin relative path",
        };
      }

      return navigateTo(path);
    },
  },
];

export const WebMcpProvider = () => {
  useEffect(() => {
    const browserNavigator = navigator as BrowserNavigator;
    const modelContext = browserNavigator.modelContext;
    if (!modelContext) {
      return;
    }

    const tools = createTools();

    if (typeof modelContext.provideContext === "function") {
      const cleanup = modelContext.provideContext({ tools });
      return () => {
        if (typeof cleanup === "function") {
          cleanup();
          return;
        }
        cleanup?.dispose?.();
      };
    }

    if (typeof modelContext.registerTool !== "function") {
      return;
    }

    const abortController = new AbortController();

    tools.forEach((tool) => {
      try {
        modelContext.registerTool(tool, {
          signal: abortController.signal,
        });
      } catch {
        // Ignore registration failures so normal browsing is unaffected.
      }
    });

    return () => {
      abortController.abort();
    };
  }, []);

  return null;
};
