import { Suspense } from "react";
import { CommandPalette } from "./CommandPalette";
import { ContentIndexShell } from "./ContentIndexShell";
import type { ContentView } from "./ExploreNav";
import { LandingViews } from "./LandingViews";
import { getBooks } from "../lib/books";
import { getConferences } from "../lib/conferences";
import { getAllPosts } from "../lib/posts";
import { getAllViews } from "../lib/views";

export async function ContentIndexPage({ activeView }: { activeView: ContentView }) {
  // Let regeneration fail rather than caching an error page over valid content.
  const [posts, views, conferences] = await Promise.all([
    getAllPosts(),
    getAllViews(),
    getConferences(),
  ]);
  const books = getBooks();

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
