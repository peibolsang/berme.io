"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
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
        searchText: buildSearchText(book.title, book.description),
        bodyLines: buildBodyLines(book.title, book.description),
      })),
    [books],
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

    const postData = buildMatchesForEntries(postEntries, needle, MAX_TOTAL_MATCHES);
    const viewData = buildMatchesForEntries(
      viewEntries,
      needle,
      MAX_TOTAL_MATCHES - postData.used,
    );
    const bookData = buildMatchesForEntries(
      bookEntries,
      needle,
      MAX_TOTAL_MATCHES - postData.used - viewData.used,
    );

    return {
      postResults: postData.results,
      viewResults: viewData.results,
      bookResults: bookData.results,
      hasResults: postData.results.length + viewData.results.length + bookData.results.length > 0,
    };
  }, [bookEntries, debouncedQuery, postEntries, viewEntries]);

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
                  className="pl-10"
                />
              </div>
              <CommandList className="max-h-[60vh]">
                <CommandEmpty>{emptyMessage}</CommandEmpty>
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
                        {matches.map((match) => {
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
