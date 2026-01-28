"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Link1Icon,
  MagnifyingGlassIcon,
  ReaderIcon,
} from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import type { Book, Post, View } from "../types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";
import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator as MenubarMenuSeparator,
  MenubarTrigger,
} from "./ui/menubar";

type CommandPaletteProps = {
  posts: Post[];
  views: View[];
  books: Book[];
  showTrigger?: boolean;
};

const stripMarkdownInline = (value: string) =>
  value
    // Keep link + image alt text while dropping the URL.
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Drop code blocks / inline code.
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    // Strip common markdown formatting while keeping inner text.
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/#+\s*/g, " ")
    .replace(/[>*~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const stripMarkdownLine = (value: string) =>
  stripMarkdownInline(value).replace(/\s+/g, " ").trim();

const buildSearchText = (title: string, body?: string) => {
  const bodyText = body ? stripMarkdownInline(body) : "";
  const combined = `${title} ${bodyText}`.toLowerCase();
  return combined.length > 50000 ? combined.slice(0, 50000) : combined;
};

const buildBodyLines = (title: string, body?: string) => {
  const titleLine = stripMarkdownLine(title || "");
  if (!body) {
    return titleLine ? [titleLine] : [];
  }
  const bodyLines = body
    .split(/\r?\n/)
    .map((line) => stripMarkdownLine(line))
    .filter(Boolean);
  return titleLine ? [titleLine, ...bodyLines] : bodyLines;
};

const MIN_QUERY_LENGTH = 2;
const MAX_MATCHES_PER_ENTRY = 6;
const MAX_TOTAL_MATCHES = 200;

type SearchEntry = {
  id: string;
  title: string;
  titleLine: string;
  url: string;
  kind: "post" | "view" | "book";
  createdAt: string | null;
  searchText: string;
  bodyLines: string[];
};

type EntryMatch = {
  line: string;
  lineIndex: number;
  matchIndex: number;
  needle: string;
};

const buildMatchesForEntries = (
  entries: SearchEntry[],
  needle: string,
  remaining: number,
) => {
  if (!needle) {
    return { results: [] as Array<{ entry: SearchEntry; matches: EntryMatch[] }>, used: 0 };
  }
  const lowered = needle.toLowerCase();
  const results: Array<{ entry: SearchEntry; matches: EntryMatch[] }> = [];
  let used = 0;
  entries
    .filter((entry) => entry.searchText.includes(lowered))
    .forEach((entry) => {
      if (used >= remaining) {
        return;
      }
      const matches = findAllMatchLines(entry.bodyLines, needle)
        .flatMap((match) =>
          match.indices.map((index) => ({
            line: match.line,
            lineIndex: match.lineIndex,
            matchIndex: index,
            needle,
          })),
        )
        .slice(0, MAX_MATCHES_PER_ENTRY);
      if (matches.length === 0) {
        return;
      }
      const allowed = Math.min(matches.length, remaining - used);
      results.push({ entry, matches: matches.slice(0, allowed) });
      used += allowed;
    });
  return { results, used };
};

const findAllMatchLines = (lines: string[], needle: string) => {
  if (!needle) {
    return [];
  }
  const loweredNeedle = needle.toLowerCase();
  const matches: Array<{ line: string; indices: number[]; lineIndex: number }> = [];
  lines.forEach((line, lineIndex) => {
    const loweredLine = line.toLowerCase();
    const indices: number[] = [];
    let fromIndex = 0;
    while (fromIndex < loweredLine.length) {
      const index = loweredLine.indexOf(loweredNeedle, fromIndex);
      if (index === -1) {
        break;
      }
      indices.push(index);
      fromIndex = index + loweredNeedle.length;
    }
    if (indices.length > 0) {
      matches.push({ line, indices, lineIndex });
    }
  });
  return matches;
};

const buildHighlightPartsAll = (
  line: string,
  indices: number[],
  needleLength: number,
) => {
  const maxContext = 80;
  const first = indices[0];
  const last = indices[indices.length - 1] + needleLength;

  const sentenceChars = ".!?";
  const findSentenceStart = (value: string, from: number) => {
    for (let i = from; i >= 0; i -= 1) {
      if (sentenceChars.includes(value[i])) {
        return i + 1;
      }
    }
    return 0;
  };
  const findSentenceEnd = (value: string, from: number) => {
    for (let i = from; i < value.length; i += 1) {
      if (sentenceChars.includes(value[i])) {
        return i + 1;
      }
    }
    return value.length;
  };

  let start = findSentenceStart(line, first - 1);
  let end = findSentenceEnd(line, last);

  const adjustToWordBoundary = () => {
    let adjustedStart = Math.max(0, first - maxContext);
    let adjustedEnd = Math.min(line.length, last + maxContext);
    if (adjustedStart > 0) {
      const nextSpace = line.indexOf(" ", adjustedStart);
      if (nextSpace !== -1 && nextSpace < adjustedEnd) {
        adjustedStart = nextSpace + 1;
      }
    }
    if (adjustedEnd < line.length) {
      const prevSpace = line.lastIndexOf(" ", adjustedEnd);
      if (prevSpace !== -1 && prevSpace > adjustedStart) {
        adjustedEnd = prevSpace;
      }
    }
    if (adjustedEnd <= adjustedStart) {
      return { start: Math.max(0, first - maxContext), end: Math.min(line.length, last + maxContext) };
    }
    return { start: adjustedStart, end: adjustedEnd };
  };

  if (end - start > maxContext * 3) {
    const adjusted = adjustToWordBoundary();
    start = adjusted.start;
    end = adjusted.end;
  }

  const sliced = line.slice(start, end).trim();
  const sliceOffset = line.indexOf(sliced, start);
  const relativeIndices = indices
    .map((index) => index - sliceOffset)
    .filter((index) => index >= 0 && index <= sliced.length);

  const parts: Array<{ text: string; highlight: boolean }> = [];
  let cursor = 0;
  relativeIndices.forEach((index) => {
    if (index > cursor) {
      parts.push({ text: sliced.slice(cursor, index), highlight: false });
    }
    const matchText = sliced.slice(index, index + needleLength);
    parts.push({ text: matchText, highlight: true });
    cursor = index + needleLength;
  });
  if (cursor < sliced.length) {
    parts.push({ text: sliced.slice(cursor), highlight: false });
  }

  return { parts, fragmentText: sliced };
};

const buildTextFragmentRange = (text: string) => {
  const cleaned = text.replace(/^…/, "").replace(/…$/, "").replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return null;
  }
  const tokens = cleaned.split(" ").filter(Boolean);
  const isSafeToken = (token: string) => /^[A-Za-z0-9]+$/.test(token);
  const pickTokens = (fromStart: boolean, count: number) => {
    const picked: string[] = [];
    const iterable = fromStart ? tokens : [...tokens].reverse();
    for (const token of iterable) {
      if (!isSafeToken(token)) {
        continue;
      }
      picked.push(token);
      if (picked.length >= count) {
        break;
      }
    }
    const ordered = fromStart ? picked : picked.reverse();
    return ordered.length === count ? ordered.join(" ") : null;
  };

  const start = pickTokens(true, 3);
  const end = pickTokens(false, 3);
  if (!start || !end || start === end) {
    return null;
  }
  return { start, end };
};

const buildTextFragmentUrl = (
  url: string,
  text: string,
  mode: "full" | "range" = "full",
) => {
  const cleaned = text.replace(/^…/, "").replace(/…$/, "").replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return url;
  }
  const [base] = url.split("#");
  if (mode === "range") {
    const range = buildTextFragmentRange(cleaned);
    if (range) {
      return `${base}#:~:text=${encodeURIComponent(range.start)},${encodeURIComponent(
        range.end,
      )}`;
    }
  }
  const encoded = encodeURIComponent(cleaned);
  return `${base}#:~:text=${encoded}`;
};

const isEditableElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
};

export const CommandPalette = ({ posts, views, books, showTrigger = true }: CommandPaletteProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [shortcutLabel, setShortcutLabel] = useState("Cmd+K");
  const [sortOrder, setSortOrder] = useState<"best" | "newest" | "oldest">("best");
  const [titleOnly, setTitleOnly] = useState(false);
  const [kindFilter, setKindFilter] = useState<"all" | "post" | "view" | "book">("all");
  const [dateFilter, setDateFilter] = useState<
    | { type: "year"; year: number }
    | { type: "month"; year: number; month: number }
    | { type: "range"; label: "Last 30 days" | "Last 90 days" | "Last 365 days"; from: Date; to: Date }
    | null
  >(null);
  const hasTitleFilter = titleOnly;
  const hasTypeFilter = kindFilter !== "all";
  const hasDateFilter = Boolean(dateFilter);
  const sortIsDefault = sortOrder === "best";

  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }
    const platform = navigator.platform.toLowerCase();
    setShortcutLabel(platform.includes("mac") ? "Cmd+K" : "Ctrl+K");
  }, []);

  const postEntries = useMemo<SearchEntry[]>(
    () =>
      posts.map((post) => ({
        id: post.id,
        title: post.title,
        titleLine: stripMarkdownLine(post.title || ""),
        url: post.url,
        kind: "post",
        createdAt: post.publishedAt,
        searchText: buildSearchText(post.title, post.body),
        bodyLines: buildBodyLines(post.title, post.body),
      })),
    [posts],
  );

  const viewEntries = useMemo<SearchEntry[]>(
    () =>
      views.map((view) => {
        const body = view.body ?? view.description ?? "";
        return {
          id: `view-${view.number}`,
          title: view.title,
          titleLine: stripMarkdownLine(view.title || ""),
          url: `${view.url}?view=views`,
          kind: "view",
          createdAt: view.updatedAt,
          searchText: buildSearchText(view.title, body),
          bodyLines: buildBodyLines(view.title, body),
        };
      }),
    [views],
  );

  const bookEntries = useMemo<SearchEntry[]>(
    () =>
      books.map((book, index) => ({
        id: `book-${index}`,
        title: book.title,
        titleLine: stripMarkdownLine(book.title || ""),
        url: book.url,
        kind: "book",
        createdAt: null,
        searchText: buildSearchText(book.title, book.description),
        bodyLines: buildBodyLines(book.title, book.description),
      })),
    [books],
  );

  const isSameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();


  const filterEntries = useCallback(
    (entries: SearchEntry[]) =>
      entries.filter((entry) => {
        if (kindFilter !== "all" && entry.kind !== kindFilter) {
          return false;
        }
        if (dateFilter) {
          if (!entry.createdAt) {
            return false;
          }
          const created = new Date(entry.createdAt);
          if (Number.isNaN(created.getTime())) {
            return false;
          }
          if (dateFilter.type === "year") {
            return created.getFullYear() === dateFilter.year;
          }
          if (dateFilter.type === "range") {
            return created >= dateFilter.from && created <= dateFilter.to;
          }
          return (
            created.getFullYear() === dateFilter.year &&
            created.getMonth() === dateFilter.month
          );
        }
        return true;
      }),
    [dateFilter, kindFilter],
  );

  const sortEntries = useCallback(
    (entries: SearchEntry[]) => {
      const sorted = [...entries];
      if (sortOrder !== "best") {
        sorted.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : Number.NaN;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : Number.NaN;
          const aValid = !Number.isNaN(aTime);
          const bValid = !Number.isNaN(bTime);
          if (aValid && bValid && aTime !== bTime) {
            return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
          }
          if (aValid !== bValid) {
            return aValid ? -1 : 1;
          }
          return a.title.localeCompare(b.title);
        });
      }
      return sorted;
    },
    [sortOrder],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { postResults, viewResults, bookResults, hasResults } = useMemo(() => {
    const needle = debouncedQuery.trim();
    if (!needle || needle.length < MIN_QUERY_LENGTH) {
      return {
        postResults: [] as Array<{ entry: SearchEntry; matches: EntryMatch[] }>,
        viewResults: [] as Array<{ entry: SearchEntry; matches: EntryMatch[] }>,
        bookResults: [] as Array<{ entry: SearchEntry; matches: EntryMatch[] }>,
        hasResults: false,
      };
    }

    const postData = buildMatchesForEntries(
      sortEntries(filterEntries(postEntries)),
      needle,
      MAX_TOTAL_MATCHES,
    );
    const viewData = buildMatchesForEntries(
      sortEntries(filterEntries(viewEntries)),
      needle,
      MAX_TOTAL_MATCHES - postData.used,
    );
    const bookData = buildMatchesForEntries(
      sortEntries(filterEntries(bookEntries)),
      needle,
      MAX_TOTAL_MATCHES - postData.used - viewData.used,
    );

    return {
      postResults: postData.results,
      viewResults: viewData.results,
      bookResults: bookData.results,
      hasResults: postData.results.length + viewData.results.length + bookData.results.length > 0,
    };
  }, [bookEntries, debouncedQuery, filterEntries, postEntries, sortEntries, viewEntries]);

  const showFilters = true;

  const emptyMessage =
    debouncedQuery.trim().length >= MIN_QUERY_LENGTH && !hasResults
      ? "No matches found."
      : "";

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setDebouncedQuery("");
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (isEditableElement(event.target)) {
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const openSitemap = useCallback(() => {
    window.open("/sitemap.xml", "_blank", "noopener,noreferrer");
  }, []);

  const openRss = useCallback(() => {
    window.open("/feed.xml", "_blank", "noopener,noreferrer");
  }, []);

  const actions = useMemo(() => [
    {
      id: "sitemap",
      label: "View Sitemap",
      letter: "S",
      icon: Link1Icon,
      action: openSitemap,
    },
    {
      id: "rss",
      label: "View RSS",
      letter: "R",
      icon: ReaderIcon,
      action: openRss,
    },
  ], [openRss, openSitemap]);

  const actionByLetter = useMemo(
    () => new Map(actions.map((action) => [action.letter, action])),
    [actions],
  );

  const filteredActions = useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase();
    if (!needle) {
      return actions;
    }
    return actions.filter((action) => action.label.toLowerCase().includes(needle));
  }, [actions, debouncedQuery]);

  return (
    <>
      {showTrigger ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 shadow-sm transition hover:text-zinc-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-zinc-400 dark:hover:text-zinc-200"
          aria-label="Open search"
        >
          <span>Search</span>
          <span className="rounded-full border border-current/20 px-2 py-[1px] text-[9px]">
            {shortcutLabel}
          </span>
        </button>
      ) : null}

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex min-h-[100dvh] w-full items-start justify-center bg-zinc-900/50 px-4 pb-6 pt-16 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePalette();
            }
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <Command shouldFilter={false}>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                  <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <CommandInput
                  ref={inputRef}
                  placeholder="Search posts by title or content..."
                  value={query}
                  onValueChange={setQuery}
                  onKeyDown={(event) => {
                    if (query.length > 0) {
                      return;
                    }
                    const action = actionByLetter.get(event.key);
                    if (!action) {
                      return;
                    }
                    event.preventDefault();
                    action.action();
                  }}
                  className="pl-10"
                />
              </div>
              <CommandList className="max-h-[60vh] p-1">
                <div className="-mx-1 bg-white/80 px-2 py-2 backdrop-blur dark:bg-slate-950/80">
                    <CommandGroup>
                      <div className="space-y-1 px-2 pb-2">
                        {filteredActions.map((action) => (
                          <CommandItem
                            key={action.id}
                            value={action.label}
                            onSelect={() => {
                              action.action();
                            }}
                            className="flex items-center justify-between gap-3 px-2 py-2"
                          >
                            <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                              <action.icon className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                              {action.label}
                            </span>
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 text-[11px] font-semibold uppercase text-zinc-500 dark:border-slate-700 dark:text-zinc-400">
                              {action.letter}
                            </span>
                          </CommandItem>
                        ))}
                      </div>
                    </CommandGroup>
                    <div className="pb-2" />
                    {showFilters ? (
                      <Menubar className="w-full justify-between">
                        <div className="flex items-center gap-2">
                      <MenubarMenu>
                        <MenubarTrigger className={!sortIsDefault ? "text-zinc-900 dark:text-white" : undefined}>
                          {sortIsDefault
                            ? "Sort"
                            : `Sort: ${sortOrder === "newest" ? "Newest" : "Oldest"}`}
                        </MenubarTrigger>
                        <MenubarContent>
                          <MenubarRadioGroup
                            value={sortOrder}
                            onValueChange={(value) =>
                              setSortOrder(
                                value === "newest" || value === "oldest" ? value : "best",
                              )
                            }
                          >
                            <MenubarRadioItem value="best">Best Match</MenubarRadioItem>
                            <MenubarRadioItem value="newest">
                              Created: Newest first
                            </MenubarRadioItem>
                            <MenubarRadioItem value="oldest">
                              Created: Oldest first
                            </MenubarRadioItem>
                          </MenubarRadioGroup>
                          {!sortIsDefault ? (
                            <>
                              <MenubarMenuSeparator />
                              <button
                                type="button"
                                className="w-full rounded-lg px-2 py-2 text-left text-xs text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-slate-800"
                                onClick={() => setSortOrder("best")}
                              >
                                Reset sort
                              </button>
                            </>
                          ) : null}
                        </MenubarContent>
                      </MenubarMenu>
                      <MenubarMenu>
                        <MenubarTrigger
                          onClick={() => setTitleOnly((prev) => !prev)}
                          className={titleOnly ? "text-zinc-900 dark:text-white" : undefined}
                        >
                          {titleOnly ? "Title only: On" : "Title only"}
                        </MenubarTrigger>
                      </MenubarMenu>
                      <MenubarMenu>
                        <MenubarTrigger className={hasTypeFilter ? "text-zinc-900 dark:text-white" : undefined}>
                          {kindFilter === "all"
                            ? "In"
                            : `In: ${kindFilter === "post" ? "Posts" : kindFilter === "view" ? "Views" : "Books"}`}
                        </MenubarTrigger>
                        <MenubarContent>
                          <MenubarRadioGroup
                            value={kindFilter}
                            onValueChange={(value) =>
                              setKindFilter(
                                value === "post" || value === "view" || value === "book"
                                  ? value
                                  : "all",
                              )
                            }
                          >
                            <MenubarRadioItem value="all">All</MenubarRadioItem>
                            <MenubarRadioItem
                              value="post"
                              onSelect={() =>
                                setKindFilter((prev) => (prev === "post" ? "all" : "post"))
                              }
                            >
                              Posts
                            </MenubarRadioItem>
                            <MenubarRadioItem
                              value="view"
                              onSelect={() =>
                                setKindFilter((prev) => (prev === "view" ? "all" : "view"))
                              }
                            >
                              Views
                            </MenubarRadioItem>
                            <MenubarRadioItem
                              value="book"
                              onSelect={() =>
                                setKindFilter((prev) => (prev === "book" ? "all" : "book"))
                              }
                            >
                              Books
                            </MenubarRadioItem>
                          </MenubarRadioGroup>
                        </MenubarContent>
                      </MenubarMenu>
                      <MenubarMenu>
                        <MenubarTrigger className={hasDateFilter ? "text-zinc-900 dark:text-white" : undefined}>
                          {dateFilter
                            ? dateFilter.type === "year"
                              ? `Date: ${dateFilter.year}`
                              : dateFilter.type === "range"
                                ? `Date: ${dateFilter.label}`
                                : `Date: ${new Date(
                                    dateFilter.year,
                                    dateFilter.month,
                                    1,
                                  ).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                            : "Date"}
                        </MenubarTrigger>
                        <MenubarContent className="w-[320px] min-w-[320px] border-zinc-200 bg-white p-2 text-zinc-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-zinc-100">
                          <div className="flex items-start justify-between px-2 pb-2 pt-1">
                            <div className="grid grid-cols-1 gap-1 text-xs">
                              {[
                                { label: "Last 30 days", days: 30 },
                                { label: "Last 90 days", days: 90 },
                                { label: "Last 365 days", days: 365 },
                              ].map(({ label, days }) => (
                                <button
                                  key={label}
                                  type="button"
                                  className="w-full rounded-lg px-2 py-1 text-left text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-slate-800"
                                  onClick={() => {
                                    const today = new Date();
                                    const from = new Date(
                                      today.getFullYear(),
                                      today.getMonth(),
                                      today.getDate() - (days - 1),
                                    );
                                    const to = new Date(
                                      today.getFullYear(),
                                      today.getMonth(),
                                      today.getDate(),
                                      23,
                                      59,
                                      59,
                                      999,
                                    );
                                    setDateFilter({ type: "range", label: label as any, from, to });
                                  }}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                            <button
                              type="button"
                              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                              onClick={() => setDateFilter(null)}
                            >
                              Clear
                            </button>
                          </div>
                          <div className="px-2 pb-0">
                            <MenubarMenuSeparator className="mb-2 bg-zinc-200 dark:bg-slate-700" />
                            <select
                              value={
                                dateFilter?.type === "month" || dateFilter?.type === "year"
                                  ? dateFilter.year
                                  : new Date().getFullYear()
                              }
                              onChange={(event) =>
                                setDateFilter({
                                  type: "year",
                                  year: Number(event.target.value),
                                })
                              }
                              className="mb-3 mt-1 w-auto rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-zinc-200"
                            >
                              {Array.from({ length: 12 }).map((_, index) => {
                                const year = new Date().getFullYear() - index;
                                return (
                                  <option key={year} value={year}>
                                    {year}
                                  </option>
                                );
                              })}
                            </select>
                            <div className="flex items-center justify-between">
                              <span className="text-base font-semibold text-zinc-700 dark:text-zinc-100">
                              {dateFilter?.type === "month"
                                ? new Date(dateFilter.year, dateFilter.month, 1).toLocaleDateString(
                                    "en-US",
                                    { month: "short" },
                                  )
                                : ""}
                            </span>
                          </div>
                          <div className="mt-1 grid grid-cols-3 gap-2 text-sm">
                            {[
                              "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec",
                              ].map((label, month) => {
                                const selected =
                                  dateFilter?.type === "month" && dateFilter.month === month;
                                return (
                                  <button
                                    key={label}
                                    type="button"
                                    className={`rounded-lg px-2 py-2 text-center ${
                                      selected
                                        ? "bg-zinc-900 text-white dark:bg-amber-300 dark:text-zinc-900"
                                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-slate-800"
                                    }`}
                                    onClick={() =>
                                      setDateFilter((prev) => ({
                                        type: "month",
                                        year:
                                          prev?.type === "year" || prev?.type === "month"
                                            ? prev.year
                                            : new Date().getFullYear(),
                                        month,
                                      }))
                                    }
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </MenubarContent>
                      </MenubarMenu>
                    </div>
                    </Menubar>
                    ) : null}
                  </div>
                <div className="-mx-1 h-px bg-zinc-200 dark:bg-slate-700" />
                {(() => {
                  const needle = debouncedQuery.trim();
                  const renderEntryGroup = (entry: SearchEntry, matches: EntryMatch[]) => {
                    const titleMatches = entry.titleLine
                      ? findAllMatchLines([entry.titleLine], needle).flatMap(
                          (match) => match.indices,
                        )
                      : [];
                    const titleHasMatch = titleMatches.length > 0;
                    const titleHighlight = entry.titleLine
                      ? titleHasMatch
                        ? buildHighlightPartsAll(entry.titleLine, titleMatches, needle.length)
                        : {
                            parts: [{ text: entry.titleLine, highlight: false }],
                            fragmentText: entry.titleLine,
                          }
                      : { parts: [], fragmentText: "" };
                    const titleTargetUrl =
                      titleHasMatch && entry.kind !== "book"
                        ? buildTextFragmentUrl(
                            entry.url,
                            titleHighlight.fragmentText,
                            entry.kind === "view" ? "range" : "full",
                          )
                        : entry.url;

                    return (
                      <Fragment key={entry.id}>
                        <CommandItem
                          value={`${entry.id}-title`}
                          onSelect={() => {
                            if (typeof window !== "undefined") {
                              window.location.assign(titleTargetUrl);
                            } else {
                              router.push(titleTargetUrl);
                            }
                            closePalette();
                          }}
                          className="px-2 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300"
                        >
                          <span className="flex w-full items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                              {titleHighlight.parts.map((part, index) =>
                                part.highlight ? (
                                  <mark
                                    key={`${entry.id}-title-h-${index}`}
                                    className="rounded bg-amber-200/70 px-1 py-0.5 text-zinc-900 dark:bg-amber-400/25 dark:text-amber-100"
                                  >
                                    {part.text}
                                  </mark>
                                ) : (
                                  <span key={`${entry.id}-title-t-${index}`}>{part.text}</span>
                                ),
                              )}
                            </span>
                            <span
                              className="shrink-0 text-zinc-400 dark:text-zinc-500"
                              aria-hidden="true"
                            >
                              <svg
                                viewBox="0 0 16 16"
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M13 4v4.5c0 1.4-1.1 2.5-2.5 2.5H3" />
                                <path d="M5.5 8.5 3 11 5.5 13.5" />
                              </svg>
                            </span>
                          </span>
                        </CommandItem>
                        {!titleOnly &&
                          matches.map((match) => {
                            if (match.lineIndex === 0) {
                              return null;
                            }
                            const { parts, fragmentText } = buildHighlightPartsAll(
                              match.line,
                            [match.matchIndex],
                            match.needle.length,
                          );
                          const targetUrl =
                            entry.kind !== "book"
                              ? buildTextFragmentUrl(
                                  entry.url,
                                  fragmentText,
                                  entry.kind === "view" ? "range" : "full",
                                )
                              : entry.url;
                          return (
                            <CommandItem
                              key={`${entry.id}-${match.lineIndex}-${match.matchIndex}`}
                              value={`${entry.id}-${match.lineIndex}-${match.matchIndex}`}
                              onSelect={() => {
                                if (typeof window !== "undefined") {
                                  window.location.assign(targetUrl);
                                } else {
                                  router.push(targetUrl);
                                }
                                closePalette();
                              }}
                              className="flex items-start gap-2 pl-3"
                            >
                              <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-amber-300/80 dark:bg-amber-300/60" />
                              <span className="flex w-full items-start justify-between gap-3">
                                <span className="text-xs text-zinc-600 dark:text-zinc-300">
                                  {parts.map((part, index) =>
                                    part.highlight ? (
                                      <mark
                                        key={`${entry.id}-h-${index}`}
                                        className="rounded bg-amber-200/70 px-1 py-0.5 text-zinc-900 dark:bg-amber-400/25 dark:text-amber-100"
                                      >
                                        {part.text}
                                      </mark>
                                    ) : (
                                      <span key={`${entry.id}-t-${index}`}>{part.text}</span>
                                    ),
                                  )}
                                </span>
                                <span
                                  className="shrink-0 text-zinc-400 dark:text-zinc-500"
                                  aria-hidden="true"
                                >
                                  <svg
                                    viewBox="0 0 16 16"
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.1"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M13 4v4.5c0 1.4-1.1 2.5-2.5 2.5H3" />
                                    <path d="M5.5 8.5 3 11 5.5 13.5" />
                                  </svg>
                                </span>
                              </span>
                            </CommandItem>
                          );
                        })}
                      </Fragment>
                    );
                  };

                  const sections = [
                    { key: "posts", label: "Posts", items: postResults },
                    { key: "views", label: "Views", items: viewResults },
                    { key: "books", label: "Books", items: bookResults },
                  ];

                  const visibleSections = sections.filter(
                    (section) => section.items.length > 0,
                  );

                  return visibleSections.map((section, index) => (
                    <Fragment key={section.key}>
                      {index > 0 ? <CommandSeparator className="my-2" /> : null}
                      <CommandGroup>
                        <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                          {section.label}
                        </div>
                        {section.items.map(({ entry, matches }) =>
                          renderEntryGroup(entry, matches),
                        )}
                      </CommandGroup>
                    </Fragment>
                  ));
                })()}
              </CommandList>
            </Command>
            <div className="mt-6 flex items-center justify-between border-t border-zinc-200 px-4 py-2 text-[11px] text-zinc-400 dark:border-slate-700 dark:text-zinc-500">
              <span>Esc to close</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
