"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Post } from "../types";

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

export const PostsIndex = ({ posts }: { posts: Post[] }) => {
  const grouped = useMemo(() => groupByYear(posts), [posts]);

  if (posts.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No published posts yet.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <section className="mb-10 md:mb-10">
        <Link
          href="/graph"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
        >
          <span>Explore reading paths</span>
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      {grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white/70 px-4 py-6 text-sm text-zinc-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-zinc-400">
          <p>No published posts yet.</p>
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
