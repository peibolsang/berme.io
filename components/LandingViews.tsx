"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { usePathname, useSearchParams } from "next/navigation";
import type { Book, Conference, Post, View } from "../types";
import { PostsIndex } from "./PostsIndex";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const viewOptions = ["posts", "views", "books", "conferences"] as const;
type ViewOption = (typeof viewOptions)[number];
const viewLabels: Record<ViewOption, string> = {
  posts: "Posts",
  views: "Views",
  books: "Books",
  conferences: "Conferences",
};
type HighlightsView = "featured" | "popular";

const normalizeView = (value: string | null) =>
  viewOptions.includes(value as ViewOption) ? (value as ViewOption) : "posts";

type LandingViewsProps = {
  posts: Post[];
  pinned: Post[];
  popular: Post[];
  views: View[];
  books: Book[];
  conferences: Conference[];
};

const formatConferenceDateLabels = (iso: string) => {
  const date = new Date(iso);
  const month = date.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  const day = String(date.getUTCDate()).padStart(2, "0");
  return {
    full: `${month} ${day}`,
    compact: month,
  };
};

const groupConferencesByYear = (entries: Conference[]) => {
  const sorted = [...entries].sort(
    (left, right) =>
      new Date(right.date).getTime() - new Date(left.date).getTime(),
  );
  const groups = new Map<string, Conference[]>();

  sorted.forEach((conference) => {
    const year = String(new Date(conference.date).getUTCFullYear());
    const bucket = groups.get(year) ?? [];
    bucket.push(conference);
    groups.set(year, bucket);
  });

  return Array.from(groups.entries())
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map(([year, items]) => ({ year, items }));
};

const editorialCardBaseClassName =
  "flex h-full flex-col rounded-[1.75rem] border px-5 py-5 md:px-6 md:py-6";

export const LandingViews = ({
  posts,
  pinned,
  popular,
  views,
  books,
  conferences,
}: LandingViewsProps) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [activeView, setActiveView] = useState<ViewOption>(() =>
    normalizeView(searchParams.get("view")),
  );

  useEffect(() => {
    setActiveView(normalizeView(searchParams.get("view")));
  }, [searchParams]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveView(normalizeView(params.get("view")));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleViewChange = useCallback(
    (value: string) => {
      const nextView = normalizeView(value);
      if (nextView === activeView) {
        return;
      }
      setActiveView(nextView);
      const params =
        typeof window === "undefined"
          ? new URLSearchParams(searchParams.toString())
          : new URLSearchParams(window.location.search);
      if (nextView === "posts") {
        params.delete("view");
      } else {
        params.set("view", nextView);
      }
      const query = params.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", href);
      }
    },
    [activeView, pathname, searchParams],
  );
  const groupedConferences = groupConferencesByYear(conferences);
  const hasFeatured = pinned.length > 0;
  const hasPopular = popular.length > 0;
  const [highlightsView, setHighlightsView] = useState<HighlightsView>(() =>
    hasFeatured ? "featured" : "popular",
  );
  const featuredPaneRef = useRef<HTMLDivElement | null>(null);
  const popularPaneRef = useRef<HTMLOListElement | null>(null);
  const [highlightsPaneHeight, setHighlightsPaneHeight] = useState(0);

  useEffect(() => {
    if (highlightsView === "featured" && !hasFeatured && hasPopular) {
      setHighlightsView("popular");
      return;
    }
    if (highlightsView === "popular" && !hasPopular && hasFeatured) {
      setHighlightsView("featured");
    }
  }, [hasFeatured, hasPopular, highlightsView]);

  useEffect(() => {
    if (!hasFeatured && !hasPopular) {
      setHighlightsPaneHeight(0);
      return;
    }

    let frameId = 0;
    const updateHeight = () => {
      frameId = window.requestAnimationFrame(() => {
        const featuredHeight = featuredPaneRef.current?.offsetHeight ?? 0;
        const popularHeight = popularPaneRef.current?.offsetHeight ?? 0;
        setHighlightsPaneHeight(Math.max(featuredHeight, popularHeight));
      });
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    if (featuredPaneRef.current) {
      observer.observe(featuredPaneRef.current);
    }
    if (popularPaneRef.current) {
      observer.observe(popularPaneRef.current);
    }

    window.addEventListener("resize", updateHeight);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [hasFeatured, hasPopular, pinned, popular]);

  return (
    <Tabs
      value={activeView}
      onValueChange={handleViewChange}
      className="min-w-0 overflow-x-hidden space-y-10"
    >
      <TabsList aria-label="Content views">
        {viewOptions.map((view) => (
          <TabsTrigger key={view} value={view}>
            {viewLabels[view]}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="posts">
        <div id="panel-posts">
          {hasFeatured || hasPopular ? (
            <section className="space-y-5">
              <div className="flex items-center justify-start">
                {hasFeatured && hasPopular ? (
                  <div className="inline-flex w-full max-w-full items-center rounded-full border border-zinc-200 bg-zinc-50 p-1 dark:border-slate-700 dark:bg-slate-950/70 sm:w-auto">
                    {(
                      [
                        { key: "featured", label: "Featured", count: pinned.length },
                        { key: "popular", label: "Popular", count: popular.length },
                      ] as const
                    ).map((option) => {
                      const selected = highlightsView === option.key;

                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setHighlightsView(option.key)}
                            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition md:flex-none ${
                              selected
                                ? "bg-zinc-900 text-white dark:bg-amber-300 dark:text-zinc-950"
                                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                            }`}
                          aria-pressed={selected}
                        >
                          {option.label}
                          <span className="ml-2 text-[11px] opacity-70">
                            {option.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 dark:border-slate-700 dark:bg-slate-950/70 dark:text-zinc-100">
                    {hasFeatured ? "Featured" : "Popular"}
                    <span className="ml-2 text-[11px] opacity-70">
                      {hasFeatured ? pinned.length : popular.length}
                    </span>
                  </div>
                )}
              </div>

              <div
                className="relative"
                style={
                  highlightsPaneHeight > 0
                    ? { minHeight: `${highlightsPaneHeight}px` }
                    : undefined
                }
              >
                {hasFeatured ? (
                  <div
                    ref={featuredPaneRef}
                    aria-hidden={highlightsView !== "featured"}
                    className={`grid gap-3 transition-opacity duration-200 md:grid-cols-3 ${
                      highlightsView === "featured"
                        ? "relative opacity-100"
                        : "pointer-events-none absolute inset-0 opacity-0"
                    }`}
                  >
                    {pinned.map((post, index) => (
                      <article
                        key={`${post.url}-featured`}
                        className={`${editorialCardBaseClassName} border-zinc-200/80 bg-[#f7f3eb] dark:border-slate-700 dark:bg-slate-950/60`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white/70 text-sm font-semibold text-zinc-700 dark:border-slate-600 dark:bg-slate-900/60 dark:text-zinc-200">
                            {index + 1}
                          </div>
                          <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                            {new Date(post.publishedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                              timeZone: "UTC",
                            })}
                          </span>
                        </div>
                        <h3 className="mt-5 text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                          <Link
                            href={post.url}
                            className="hover:text-black dark:hover:text-white"
                          >
                            {post.title}
                          </Link>
                        </h3>
                      </article>
                    ))}
                  </div>
                ) : null}

                {hasPopular ? (
                  <ol
                    ref={popularPaneRef}
                    aria-hidden={highlightsView !== "popular"}
                    className={`grid gap-3 transition-opacity duration-200 md:grid-cols-3 ${
                      highlightsView === "popular"
                        ? "relative opacity-100"
                        : "pointer-events-none absolute inset-0 opacity-0"
                    }`}
                  >
                    {popular.map((post, index) => (
                      <li
                        key={`${post.url}-popular`}
                        className={`${editorialCardBaseClassName} border-zinc-200/80 bg-[#f7f3eb] dark:border-slate-700 dark:bg-slate-950/60`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white/70 text-sm font-semibold text-zinc-700 dark:border-slate-600 dark:bg-slate-900/60 dark:text-zinc-200">
                            {index + 1}
                          </div>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                            {new Date(post.publishedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                              timeZone: "UTC",
                            })}
                          </span>
                        </div>
                        <h3 className="mt-5 text-lg font-semibold leading-snug text-white">
                          <Link
                            href={post.url}
                            className="text-zinc-900 hover:text-black dark:text-zinc-100 dark:hover:text-white"
                          >
                            {post.title}
                          </Link>
                        </h3>
                        {post.excerpt ? (
                          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                            {post.excerpt}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            </section>
          ) : null}
          <div className="mt-10">
            <PostsIndex posts={posts} />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="views">
        <div id="panel-views">
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            Long-lived thinking organized by concept and refined over time.
          </p>
          {views.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white/70 px-4 py-6 text-sm text-zinc-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-zinc-400">
              No views available yet.
            </div>
          ) : (
            <div className="space-y-10">
              {views.map((entry) => (
                <section key={entry.number}>
                  <h2 className="mb-4 text-base font-semibold text-zinc-600 dark:text-zinc-300">
                    <Link
                      href={`${entry.url}?view=views`}
                      className="hover:text-zinc-900 dark:hover:text-white"
                    >
                      {entry.title}
                    </Link>
                  </h2>
                  {entry.bodyHtml ? (
                    <div
                      className="markdown-body mb-4 text-sm text-zinc-600 dark:text-zinc-300"
                      dangerouslySetInnerHTML={{ __html: entry.bodyHtml }}
                    />
                  ) : null}
                  {entry.posts.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No articles yet.
                    </p>
                  ) : (
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white [&::-webkit-details-marker]:hidden">
                        <ChevronDownIcon className="h-4 w-4 transition group-open:rotate-180 group-open:text-zinc-700 dark:group-open:text-zinc-200" />
                        <span className="underline-offset-4 group-hover:underline">
                          Explore this line of thought
                        </span>
                        <span className="rounded-full border border-current/20 px-2 py-[1px] text-[10px] no-underline">
                          {entry.posts.length}
                        </span>
                      </summary>
                      <ul className="ml-2 mt-3 space-y-2 text-sm">
                        {entry.posts.map((post) => (
                          <li
                            key={post.url}
                            className="relative pl-4 after:absolute after:left-0 after:top-0 after:h-[calc(100%+0.5rem)] after:w-px after:bg-zinc-200 last:after:h-3 dark:after:bg-slate-700"
                          >
                            <span className="absolute left-0 top-3 h-px w-3 bg-zinc-200 dark:bg-slate-700" />
                            <Link
                              href={`${post.url}?view=views`}
                              className="text-sm leading-snug text-zinc-900 hover:text-black dark:text-zinc-100 dark:hover:text-white"
                            >
                              {post.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="books">
        <div id="panel-books">
          {books.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white/70 px-4 py-6 text-sm text-zinc-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-zinc-400">
              No books available yet.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {books.map((book) => {
                const isExternal = /^https?:\/\//.test(book.url);
                return (
                    <a
                      key={book.title}
                      href={book.url}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noreferrer noopener" : undefined}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-md transition hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
                    >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-transparent">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 border-t border-zinc-200 bg-[#f4f1ea]/70 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/60">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          {book.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {book.description}
                        </p>
                      </div>
                      <span className="mt-auto flex justify-center">
                        <span className="rounded-full bg-zinc-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white dark:bg-white dark:text-zinc-900">
                          {book.cta}
                        </span>
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="conferences">
        <div id="panel-conferences">
          <div className="mb-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Talks and seminars from conferences, with on-site PDF viewing.
            </p>
          </div>
          {groupedConferences.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white/70 px-4 py-6 text-sm text-zinc-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-zinc-400">
              No conference presentations yet.
            </div>
          ) : (
            <div className="space-y-10">
              {groupedConferences.map((group) => (
                <section key={group.year}>
                  <h2 className="mb-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    {group.year}
                  </h2>
                  <div className="space-y-5">
                    {group.items.map((conference) => {
                      const labels = formatConferenceDateLabels(conference.date);
                      return (
                        <article
                          key={conference.id}
                          className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-2"
                        >
                          <span className="pt-1 text-[11px] tracking-[0.08em] text-zinc-400 dark:text-zinc-500">
                            <span className="sm:hidden">{labels.compact}</span>
                            <span className="hidden sm:inline">{labels.full}</span>
                          </span>
                          <div>
                            <h3 className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                              <Link
                                href={`/conferences/${conference.slug}`}
                                className="hover:text-black dark:hover:text-white"
                              >
                                {conference.title}
                              </Link>
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                              <span>{conference.event}</span>
                              {conference.location ? (
                                <>
                                  <span aria-hidden="true">•</span>
                                  <span>{conference.location}</span>
                                </>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                              {conference.summary}
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};
