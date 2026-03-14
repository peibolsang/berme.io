"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useState } from "react";
import {
  getSanitizedHeadingId,
  type MarkdownHeading,
} from "../lib/markdown-headings";

type ReadingShellProps = {
  children: ReactNode;
  contentId?: string;
  headings: MarkdownHeading[];
  isLongform: boolean;
  title: string;
  totalMinutes: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getDepthSpacing = (depth: number) => {
  if (depth <= 2) {
    return "";
  }

  if (depth === 3) {
    return "pl-3";
  }

  return "pl-5";
};

export const ReadingShell = ({
  children,
  contentId,
  headings,
  isLongform,
  title,
  totalMinutes,
}: ReadingShellProps) => {
  const generatedId = useId().replace(/:/g, "");
  const resolvedContentId = contentId ?? `reading-content-${generatedId}`;
  const [progress, setProgress] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(
    headings[0]?.id ?? null,
  );

  useEffect(() => {
    const article = document.getElementById(resolvedContentId);
    if (!article) {
      return;
    }

    const headingTargets = headings
      .map((heading) => ({
        heading,
        element: document.getElementById(getSanitizedHeadingId(heading.id)),
      }))
      .filter(
        (entry): entry is { heading: MarkdownHeading; element: HTMLElement } =>
          Boolean(entry.element),
      );

    let frameId = 0;

    const updateProgress = () => {
      frameId = window.requestAnimationFrame(() => {
        const viewportHeight = window.innerHeight;
        const articleRect = article.getBoundingClientRect();
        const scrollY = window.scrollY;
        const articleTop = articleRect.top + scrollY;
        const articleBottom = articleTop + article.offsetHeight;
        const progressStart = Math.max(0, articleTop - viewportHeight * 0.18);
        const progressEnd = Math.max(progressStart + 1, articleBottom - viewportHeight);
        const reachedPageBottom =
          Math.ceil(scrollY + viewportHeight) >=
          document.documentElement.scrollHeight - 2;

        const nextProgress = reachedPageBottom
          ? 100
          : clamp(
              ((scrollY - progressStart) / (progressEnd - progressStart)) * 100,
              0,
              100,
            );

        setProgress((current) =>
          Math.abs(current - nextProgress) > 0.5 ? nextProgress : current,
        );

        if (headingTargets.length === 0) {
          return;
        }

        const activeHeading = reachedPageBottom
          ? headingTargets.at(-1) ?? headingTargets[0]
          : headingTargets
              .map((entry) => ({
                ...entry,
                absoluteTop: entry.element.getBoundingClientRect().top + scrollY,
              }))
              .filter(
                ({ absoluteTop }) =>
                  absoluteTop <= scrollY + viewportHeight * 0.42,
              )
              .at(-1) ?? headingTargets[0];

        setActiveHeadingId((current) =>
          current === activeHeading.heading.id ? current : activeHeading.heading.id,
        );
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [headings, resolvedContentId]);

  const handleHeadingNavigation = useCallback((headingId: string) => {
    const targetId = getSanitizedHeadingId(headingId);
    const target = document.getElementById(targetId);
    if (!target) {
      return;
    }

    setActiveHeadingId(headingId);
    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    if (window.location.hash !== `#${targetId}`) {
      window.history.pushState(null, "", `#${targetId}`);
    }
  }, []);

  const navigation = (
    <div className="rounded-[1.25rem] border border-zinc-200/70 bg-white/35 p-4 shadow-[0_6px_18px_rgba(15,23,42,0.03)] backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Reading map
          </p>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
            {title}
          </p>
        </div>
        <p className="shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {Math.round(progress)}%
        </p>
      </div>
      <div className="mt-4 h-px overflow-hidden bg-zinc-200/90 dark:bg-slate-700/90">
        <div
          className="h-full bg-amber-400/80 transition-[width] duration-150 dark:bg-amber-300/80"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-3 text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
        {totalMinutes} min overall
      </div>
      <nav aria-label="Table of contents" className="mt-4">
        <ol className="space-y-1.5">
          {headings.map((heading) => {
            const selected = activeHeadingId === heading.id;

            return (
              <li key={heading.id} className={getDepthSpacing(heading.depth)}>
                <a
                  href={`#${getSanitizedHeadingId(heading.id)}`}
                  onClick={(event) => {
                    event.preventDefault();
                    handleHeadingNavigation(heading.id);
                  }}
                  className={`block border-l-2 px-3 py-2 no-underline transition ${
                    selected
                      ? "border-amber-400 text-zinc-900 dark:border-amber-300 dark:text-zinc-100"
                      : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800 dark:text-zinc-400 dark:hover:border-slate-600 dark:hover:text-zinc-100"
                  }`}
                >
                  <span className="block text-[13px] font-medium leading-snug">
                    {heading.text}
                  </span>
                  <span className="mt-1 block text-[10px] uppercase tracking-[0.16em] opacity-60">
                    {heading.effortMinutes} min section
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );

  return (
    <div className="relative">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-px bg-transparent xl:hidden">
        <div
          className="h-full bg-amber-400/85 transition-[width] duration-150 dark:bg-amber-300/85"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className={
          isLongform
            ? "mx-auto w-full xl:grid xl:max-w-none xl:grid-cols-[minmax(0,1fr)_20rem_3rem_minmax(0,42rem)_7rem_16rem_minmax(0,1fr)]"
            : "mx-auto w-full max-w-2xl"
        }
      >
        <div
          id={resolvedContentId}
          className={isLongform ? "min-w-0 xl:col-start-4" : "min-w-0"}
        >
          {children}
        </div>
        {isLongform ? (
          <aside className="hidden xl:col-start-6 xl:block">
            <div className="sticky top-28">{navigation}</div>
          </aside>
        ) : null}
      </div>
    </div>
  );
};
