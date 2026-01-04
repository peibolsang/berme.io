"use client";

import Link from "next/link";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Post } from "../types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type LabelMeta = {
  key: string;
  displayName: string;
};

type YearGroup = {
  year: string;
  posts: {
    title: string;
    date: string;
    dateCompact: string;
    url: string;
    pinned?: boolean;
  }[];
};

const monthNames = [
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
];

const normalizeLabel = (label: string) => label.trim().toLowerCase();

const formatDateLabels = (iso: string) => {
  const date = new Date(iso);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const monthName =
    monthNames[date.getUTCMonth()] ??
    String(date.getUTCMonth() + 1).padStart(2, "0");
  const dateLabel = `${monthName} ${day}`;
  const dateCompact = monthName;
  return { dateLabel, dateCompact };
};

const groupByYear = (posts: Post[]) => {
  const groups = new Map<string, YearGroup>();

  posts.forEach((post) => {
    const date = new Date(post.publishedAt);
    const year = String(date.getUTCFullYear());
    const { dateLabel, dateCompact } = formatDateLabels(post.publishedAt);

    const entry = groups.get(year) ?? {
      year,
      posts: [],
    };

    entry.posts.push({
      title: post.title,
      date: dateLabel,
      dateCompact,
      url: post.url,
      pinned: post.pinned,
    });

    groups.set(year, entry);
  });

  return Array.from(groups.values()).sort((a, b) => b.year.localeCompare(a.year));
};

const intersectSets = (left: Set<string>, right: Set<string>) => {
  const [small, large] = left.size <= right.size ? [left, right] : [right, left];
  const result = new Set<string>();
  small.forEach((value) => {
    if (large.has(value)) {
      result.add(value);
    }
  });
  return result;
};

const intersectSize = (left: Set<string>, right: Set<string>) => {
  const [small, large] = left.size <= right.size ? [left, right] : [right, left];
  let count = 0;
  small.forEach((value) => {
    if (large.has(value)) {
      count += 1;
    }
  });
  return count;
};

const toUniqueSorted = (values: string[]) =>
  Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));

const arraysEqual = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const buildLabelIndex = (posts: Post[]) => {
  const labelToPostIds = new Map<string, Set<string>>();
  const displayNames = new Map<string, string>();
  const allPostIds = new Set<string>();

  posts.forEach((post) => {
    allPostIds.add(post.id);
    const seenKeys = new Set<string>();
    const labels = Array.isArray(post.labels) ? post.labels : [];

    labels.forEach((label) => {
      const trimmed = label.trim();
      if (!trimmed) {
        return;
      }
      const key = normalizeLabel(trimmed);
      if (key === "published") {
        return;
      }
      if (!key || seenKeys.has(key)) {
        return;
      }
      seenKeys.add(key);
      if (!displayNames.has(key)) {
        displayNames.set(key, trimmed);
      }
      if (!labelToPostIds.has(key)) {
        labelToPostIds.set(key, new Set());
      }
      labelToPostIds.get(key)?.add(post.id);
    });
  });

  const allLabels: LabelMeta[] = Array.from(displayNames.entries())
    .map(([key, displayName]) => ({ key, displayName }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return { allLabels, labelToPostIds, allPostIds, displayNames };
};

const readLabelsFromParams = (
  params: URLSearchParams,
  allowedLabels: Set<string>,
) => {
  const raw = params.get("labels");
  if (!raw) {
    return [];
  }
  const normalized = raw
    .split(",")
    .map((label) => normalizeLabel(label))
    .filter(Boolean)
    .filter((label) => allowedLabels.has(label));
  return toUniqueSorted(normalized);
};

export const PostsIndex = ({ posts }: { posts: Post[] }) => {
  const { allLabels, labelToPostIds, allPostIds, displayNames } = useMemo(
    () => buildLabelIndex(posts),
    [posts],
  );
  const labelKeys = useMemo(
    () => new Set(allLabels.map((label) => label.key)),
    [allLabels],
  );
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const initialSelectedLabels = useMemo(
    () =>
      labelKeys.size === 0
        ? []
        : readLabelsFromParams(new URLSearchParams(searchParams.toString()), labelKeys),
    [labelKeys, searchParams],
  );
  const [selectedLabels, setSelectedLabels] = useState<string[]>(initialSelectedLabels);
  const isSyncingFromSearch = useRef(false);
  const hasInitialized = useRef(false);

  const getLabelsFromSearch = useCallback(
    () => readLabelsFromParams(new URLSearchParams(searchParams.toString()), labelKeys),
    [searchParams, labelKeys],
  );

  useEffect(() => {
    if (labelKeys.size === 0) {
      setSelectedLabels([]);
      hasInitialized.current = true;
      return;
    }
    const fromSearch = getLabelsFromSearch();
    setSelectedLabels((prev) => {
      if (arraysEqual(prev, fromSearch)) {
        return prev;
      }
      isSyncingFromSearch.current = true;
      return fromSearch;
    });
    hasInitialized.current = true;
  }, [getLabelsFromSearch, labelKeys]);

  useEffect(() => {
    if (!hasInitialized.current) {
      return;
    }
    if (labelKeys.size === 0) {
      return;
    }
    if (isSyncingFromSearch.current) {
      isSyncingFromSearch.current = false;
      return;
    }
    const fromSearch = getLabelsFromSearch();
    if (arraysEqual(fromSearch, selectedLabels)) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (selectedLabels.length === 0) {
      params.delete("labels");
    } else {
      params.set("labels", selectedLabels.join(","));
    }
    const query = params.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    router.replace(href, { scroll: false });
  }, [selectedLabels, searchParams, pathname, router, getLabelsFromSearch, labelKeys]);

  const selectedSet = useMemo(() => new Set(selectedLabels), [selectedLabels]);

  const matchingIds = useMemo<Set<string>>(() => {
    if (selectedLabels.length === 0) {
      return allPostIds;
    }
    let candidate: Set<string> | null = null;
    selectedLabels.forEach((label) => {
      const labelSet = labelToPostIds.get(label);
      if (!labelSet) {
        candidate = new Set<string>();
        return;
      }
      if (!candidate) {
        candidate = new Set<string>(labelSet);
      } else {
        candidate = intersectSets(candidate, labelSet);
      }
    });
    return candidate ?? new Set<string>();
  }, [selectedLabels, labelToPostIds, allPostIds]);

  const matchingPosts = useMemo(
    () => posts.filter((post) => matchingIds.has(post.id)),
    [posts, matchingIds],
  );

  const grouped = useMemo(() => groupByYear(matchingPosts), [matchingPosts]);

  const labelState = useMemo(() => {
    const enabled = new Set<string>();
    const counts = new Map<string, number>();

    allLabels.forEach((label) => {
      const labelSet = labelToPostIds.get(label.key);
      if (!labelSet) {
        counts.set(label.key, 0);
        return;
      }
      if (selectedSet.has(label.key)) {
        enabled.add(label.key);
        counts.set(label.key, matchingIds.size);
        return;
      }
      const count = intersectSize(matchingIds, labelSet);
      if (count > 0) {
        enabled.add(label.key);
      }
      counts.set(label.key, count);
    });

    return { enabled, counts };
  }, [allLabels, labelToPostIds, matchingIds, selectedSet]);

  const toggleLabel = (labelKey: string) => {
    setSelectedLabels((prev) => {
      const next = prev.includes(labelKey)
        ? prev.filter((label) => label !== labelKey)
        : [...prev, labelKey];
      return toUniqueSorted(next);
    });
  };

  if (posts.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No published posts yet.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {allLabels.length > 0 && (
        <section className="space-y-3 mb-10 md:mb-10">
          <div className="md:hidden">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-zinc-200"
                  aria-label="Filter by label"
                >
                  <span className="flex flex-wrap gap-2">
                    {selectedLabels.length === 0 ? (
                      <span className="text-zinc-400 dark:text-zinc-500">
                        Select labels
                      </span>
                    ) : (
                      selectedLabels.map((labelKey) => (
                        <span
                          key={labelKey}
                          className="rounded-full border border-zinc-200 bg-white/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-zinc-200"
                        >
                          {displayNames.get(labelKey) ?? labelKey}
                        </span>
                      ))
                    )}
                  </span>
                  <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(22rem,calc(100vw-3rem))] p-0">
                <Command>
                  <CommandList>
                    <CommandEmpty>No labels found.</CommandEmpty>
                    <CommandGroup>
                      {allLabels.map((label) => {
                        const selected = selectedSet.has(label.key);
                        const enabled = labelState.enabled.has(label.key);
                        const disabled = !selected && !enabled;
                        const count = labelState.counts.get(label.key) ?? 0;

                        return (
                          <CommandItem
                            key={label.key}
                            value={label.displayName}
                            disabled={disabled}
                            onSelect={() => toggleLabel(label.key)}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={[
                                  "flex h-4 w-4 items-center justify-center rounded border",
                                  selected
                                    ? "border-zinc-800 bg-zinc-900 text-white dark:border-amber-300 dark:bg-amber-400/20 dark:text-amber-100"
                                    : "border-zinc-300 bg-transparent text-transparent dark:border-slate-600",
                                ].join(" ")}
                              >
                                <CheckIcon className="h-3 w-3" />
                              </span>
                              <span>{label.displayName}</span>
                            </span>
                            <span className="rounded-full border border-current/20 px-2 py-[1px] text-[10px] uppercase tracking-[0.16em]">
                              {count}
                            </span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap gap-2">
            {allLabels.map((label) => {
              const selected = selectedSet.has(label.key);
              const enabled = labelState.enabled.has(label.key);
              const disabled = !selected && !enabled;
              const count = labelState.counts.get(label.key) ?? 0;

              return (
                <button
                  key={label.key}
                  type="button"
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => toggleLabel(label.key)}
                  className={[
                    "hidden items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] transition md:flex",
                    selected
                      ? "border-zinc-900/70 bg-[#f4f1ea] text-zinc-900 shadow-[0_0_0_1px_rgba(24,24,27,0.2)] dark:border-amber-300/70 dark:bg-amber-400/20 dark:text-amber-100 dark:shadow-[0_0_0_1px_rgba(245,158,11,0.35)]"
                      : "border-zinc-300 bg-[#f4f1ea] text-zinc-700 hover:text-zinc-900 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-100 dark:hover:text-amber-50",
                    disabled
                      ? "cursor-not-allowed opacity-40 hover:text-zinc-600 dark:hover:text-zinc-200"
                      : "cursor-pointer",
                  ].join(" ")}
                >
                  {selected && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-zinc-700/40 bg-white/70 text-zinc-800 dark:border-amber-300/60 dark:bg-amber-400/20 dark:text-amber-100">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 16 16"
                        className="h-3 w-3"
                        fill="currentColor"
                      >
                        <path d="M6.2 11.2 3 8l1.1-1.1 2.1 2.1 5-5L12.3 5l-6.1 6.2Z" />
                      </svg>
                    </span>
                  )}
                  <span>{label.displayName}</span>
                  <span className="rounded-full border border-current/20 px-2 py-[1px] text-[9px]">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white/70 px-4 py-6 text-sm text-zinc-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-zinc-400">
          <p>No posts match the selected labels.</p>
        </div>
      ) : (
        grouped.map((group) => (
          <section key={group.year}>
            <h2 className="mb-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              {group.year}
            </h2>
            <ul className="space-y-2 text-sm">
              {group.posts.map((post) => (
                <li
                  key={post.url}
                  className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-2"
                >
                  <span className="text-[11px] tracking-[0.08em] text-zinc-400 dark:text-zinc-500">
                    <span className="sm:hidden">{post.dateCompact}</span>
                    <span className="hidden sm:inline">{post.date}</span>
                  </span>
                  <Link
                    href={post.url}
                    className="text-sm leading-snug text-zinc-900 hover:text-black dark:text-zinc-100 dark:hover:text-white"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
};
