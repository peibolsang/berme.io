"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import type { Post } from "../types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

type CommandPaletteProps = {
  posts: Post[];
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

const buildSnippet = (post: Post) => {
  const base = post.excerpt?.trim() || post.body || "";
  if (!base) {
    return "";
  }
  const clean = stripMarkdownInline(base);
  return clean.length > 160 ? `${clean.slice(0, 157)}...` : clean;
};

const buildSearchText = (post: Post) => {
  const bodyText = post.body ? stripMarkdownInline(post.body) : "";
  const combined = `${post.title} ${bodyText}`.toLowerCase();
  return combined.length > 50000 ? combined.slice(0, 50000) : combined;
};

const buildBodyLines = (post: Post) => {
  const titleLine = stripMarkdownLine(post.title || "");
  if (!post.body) {
    return titleLine ? [titleLine] : [];
  }
  const bodyLines = post.body
    .split(/\r?\n/)
    .map((line) => stripMarkdownLine(line))
    .filter(Boolean);
  return titleLine ? [titleLine, ...bodyLines] : bodyLines;
};

const MIN_QUERY_LENGTH = 2;
const MAX_MATCHES_PER_POST = 6;
const MAX_TOTAL_MATCHES = 200;

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

const buildTextFragmentUrl = (url: string, text: string) => {
  const cleaned = text.replace(/^…/, "").replace(/…$/, "").replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return url;
  }
  const encoded = encodeURIComponent(cleaned);
  const [base] = url.split("#");
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

export const CommandPalette = ({ posts, showTrigger = true }: CommandPaletteProps) => {
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

  const entries = useMemo(
    () =>
      posts.map((post) => ({
        id: post.id,
        title: post.title,
        url: post.url,
        snippet: buildSnippet(post),
        searchText: buildSearchText(post),
        bodyLines: buildBodyLines(post),
      })),
    [posts],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [query]);

  const filteredEntries = useMemo(() => {
    const needle = debouncedQuery.trim();
    if (!needle || needle.length < MIN_QUERY_LENGTH) {
      return [];
    }
    const lowered = needle.toLowerCase();
    const results: Array<{
      entry: typeof entries[number];
      matches: Array<{
        line: string;
        lineIndex: number;
        matchIndex: number;
        needle: string;
      }>;
    }> = [];
    let totalMatches = 0;
    entries
      .filter((entry) => entry.searchText.includes(lowered))
      .forEach((entry) => {
        if (totalMatches >= MAX_TOTAL_MATCHES) {
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
          .slice(0, MAX_MATCHES_PER_POST);
        if (matches.length > 0) {
          totalMatches += matches.length;
          results.push({ entry, matches });
        }
      });
    return results;
  }, [debouncedQuery, entries]);

  const emptyMessage =
    debouncedQuery.trim().length >= MIN_QUERY_LENGTH ? "No posts match that query." : "";

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
                <CommandGroup>
                  {filteredEntries.map(({ entry, matches }) => (
                    <CommandGroup key={entry.id}>
                      <div className="px-2 pb-1 pt-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                        {entry.title}
                      </div>
                      {matches.map((match) => {
                        const { parts, fragmentText } = buildHighlightPartsAll(
                          match.line,
                          [match.matchIndex],
                          match.needle.length,
                        );
                        const targetUrl = buildTextFragmentUrl(entry.url, fragmentText);
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
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ))}
                </CommandGroup>
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
