import { Suspense } from "react";
import { CommandPalette } from "./CommandPalette";
import { ContentIndexShell } from "./ContentIndexShell";
import type { ContentView } from "./ExploreNav";
import { LandingViews } from "./LandingViews";
import { config } from "../lib/config";
import { getBooks } from "../lib/books";
import { getConferences } from "../lib/conferences";
import { getAllPosts } from "../lib/posts";
import { getAllViews } from "../lib/views";

export async function ContentIndexPage({ activeView }: { activeView: ContentView }) {
  let posts: Awaited<ReturnType<typeof getAllPosts>> = [];
  let views: Awaited<ReturnType<typeof getAllViews>> = [];
  let conferences: Awaited<ReturnType<typeof getConferences>> = [];
  let loadError: string | null = null;

  try {
    [posts, views, conferences] = await Promise.all([
      getAllPosts(),
      getAllViews(),
      getConferences(),
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unable to load content.";
  }

  const books = getBooks();

  if (loadError) {
    const isDev = process.env.NODE_ENV !== "production";
    return (
      <ContentIndexShell activeView={activeView}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {isDev ? loadError : "Service unavailable. Please check back soon."}
        </p>
        {!config.github.token ? (
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            GitHub token not set; unauthenticated requests may be rate-limited.
          </p>
        ) : null}
      </ContentIndexShell>
    );
  }

  return (
    <ContentIndexShell activeView={activeView}>
      <Suspense fallback={<div className="h-6" />}>
        <CommandPalette
          posts={posts}
          views={views}
          books={books}
          conferences={conferences}
          showTrigger={false}
        />
        <LandingViews
          activeView={activeView}
          posts={posts}
          views={views}
          books={books}
          conferences={conferences}
        />
      </Suspense>
    </ContentIndexShell>
  );
}
