"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Book, Post, View } from "../types";
import { PostsIndex } from "./PostsIndex";
import { Markdown } from "./Markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const viewOptions = ["posts", "views", "books"] as const;
type ViewOption = (typeof viewOptions)[number];
const viewLabels: Record<ViewOption, string> = {
  posts: "Posts",
  views: "Views",
  books: "Books",
};

const normalizeView = (value: string | null) =>
  viewOptions.includes(value as ViewOption) ? (value as ViewOption) : "posts";

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return String(date.getUTCFullYear());
};

type LandingViewsProps = {
  posts: Post[];
  pinned: Post[];
  views: View[];
  books: Book[];
};

export const LandingViews = ({ posts, pinned, views, books }: LandingViewsProps) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const activeView = useMemo(
    () => normalizeView(searchParams.get("view")),
    [searchParams],
  );

  const handleViewChange = useCallback(
    (value: string) => {
      const nextView = normalizeView(value);
      if (nextView === activeView) {
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      if (nextView === "posts") {
        params.delete("view");
      } else {
        params.set("view", nextView);
      }
      const query = params.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      router.push(href, { scroll: false });
    },
    [activeView, pathname, router, searchParams],
  );

  return (
    <Tabs value={activeView} onValueChange={handleViewChange} className="space-y-10">
      <TabsList aria-label="Content views">
        {viewOptions.map((view) => (
          <TabsTrigger key={view} value={view}>
            {viewLabels[view]}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="posts">
        <div id="panel-posts">
          {pinned.length > 0 && (
            <section className="-mx-6 border-y border-zinc-200/70 bg-white px-6 py-5 shadow-sm md:-mx-5 md:rounded-2xl md:border md:border-zinc-200/70 md:px-5 dark:border-slate-700 dark:bg-slate-900/60 md:dark:border-slate-700">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full border border-zinc-300 bg-[#f4f1ea] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-100">
                  Featured
                </span>
              </div>
              <ul className="space-y-3 text-sm">
                {pinned.map((post) => {
                  const date = new Date(post.publishedAt);
                  const year = String(date.getUTCFullYear());

                  return (
                    <li
                      key={post.url}
                      className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-2"
                    >
                      <span className="text-[11px] tracking-[0.08em] text-zinc-400 dark:text-zinc-500">
                        <span className="sm:hidden">{year}</span>
                        <span className="hidden sm:inline">{year}</span>
                      </span>
                      <div className="space-y-1">
                        <Link
                          href={post.url}
                          className="text-sm font-semibold leading-snug text-zinc-900 hover:text-black dark:text-zinc-100 dark:hover:text-white"
                        >
                          {post.title}
                        </Link>
                        {post.excerpt && (
                          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
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
                  {entry.body ? (
                    <div className="markdown-body mb-4 text-sm text-zinc-600 dark:text-zinc-300">
                      <Markdown content={entry.body} />
                    </div>
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
    </Tabs>
  );
};
