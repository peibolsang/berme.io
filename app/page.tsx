import { Suspense } from "react";
import { CommandPalette } from "../components/CommandPalette";
import { ContentIndexShell } from "../components/ContentIndexShell";
import type { ContentView } from "../components/ExploreNav";
import { HomeLanding } from "../components/HomeLanding";
import { LandingViews } from "../components/LandingViews";
import type { FeaturedWriting } from "../components/FeaturedWritingStack";
import { config } from "../lib/config";
import { getBooks } from "../lib/books";
import { getConferences } from "../lib/conferences";
import { getAllPosts } from "../lib/posts";
import { getAllViews } from "../lib/views";

const landingFallback: FeaturedWriting[] = [
  {
    title: "A practical theory of software platforms",
    href: "/?view=posts",
  },
  {
    title: "Building the AI future teams can actually adopt",
    href: "/?view=posts",
  },
  {
    title: "The infinite product manager",
    href: "/?view=posts",
  },
];

const contentViews = new Set<ContentView>([
  "posts",
  "views",
  "books",
  "conferences",
]);

const isContentView = (value: string | undefined): value is ContentView =>
  value !== undefined && contentViews.has(value as ContentView);

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const requestedView =
    typeof params.view === "string" ? params.view : undefined;

  if (!isContentView(requestedView)) {
    let landingPosts = landingFallback;

    try {
      const posts = await getAllPosts();
      const candidates = [
        ...posts.filter((post) => post.pinned),
        ...posts.filter((post) => !post.pinned),
      ].filter(
        (post, index, entries) =>
          entries.findIndex((entry) => entry.url === post.url) === index,
      );
      const livePosts = candidates.slice(0, 3).map((post) => ({
        title: post.title,
        href: post.url,
      }));

      landingPosts = [...livePosts, ...landingFallback]
        .filter(
          (entry, index, entries) =>
            entries.findIndex(
              (candidate) =>
                candidate.href === entry.href && candidate.title === entry.title,
            ) === index,
        )
        .slice(0, 3);
    } catch {
      // Keep the public landing page available when the remote CMS is unavailable.
    }

    return <HomeLanding featuredPosts={landingPosts} />;
  }

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
      <ContentIndexShell activeView={requestedView}>
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
    <ContentIndexShell activeView={requestedView}>
      <Suspense fallback={<div className="h-6" />}>
        <CommandPalette
          posts={posts}
          views={views}
          books={books}
          conferences={conferences}
          showTrigger={false}
        />
        <LandingViews
          activeView={requestedView}
          posts={posts}
          views={views}
          books={books}
          conferences={conferences}
        />
      </Suspense>
    </ContentIndexShell>
  );
}
