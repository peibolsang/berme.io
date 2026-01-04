import { Suspense } from "react";
import { getAllPosts } from "../lib/posts";
import { config } from "../lib/config";
import { KnowPablo } from "../components/KnowPablo";
import { LandingViews } from "../components/LandingViews";
import { getAllSeries } from "../lib/series";
import { getBooks } from "../lib/books";

export default async function Home() {
  try {
    const [posts, series] = await Promise.all([getAllPosts(), getAllSeries()]);
    const pinned = posts.filter((post) => post.pinned);
    const books = getBooks();

    return (
      <div className="min-h-screen px-6 py-16">
        <main className="mx-auto w-full max-w-5xl">
          <div className="grid gap-10 md:grid-cols-[240px_minmax(0,1fr)] md:gap-16">
            <aside className="hidden md:block">
              <h1 className="text-2xl font-semibold tracking-tight">
                Pablo Bermejo
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                I am a product leader, distinguished technologist, and writer. I've been
                building enterprise software platforms and applications for the last 20 years,
                and I love sharing what I learn.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                I create a lasting difference in the teams I work with as we build technology
                together.
              </p>
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                  Links
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <a
                      href="https://github.com/peibolsang"
                      className="text-zinc-900 hover:text-black dark:text-zinc-100 dark:hover:text-white"
                    >
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.linkedin.com/in/pablobermejo/"
                      className="text-zinc-900 hover:text-black dark:text-zinc-100 dark:hover:text-white"
                    >
                      LinkedIn
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://x.com/peibolsang"
                      className="text-zinc-900 hover:text-black dark:text-zinc-100 dark:hover:text-white"
                    >
                      X (Twitter)
                    </a>
                  </li>
                </ul>
              </div>
            </aside>

            <div className="space-y-10">
              <div className="md:hidden">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Pablo Bermejo
                </h1>
              </div>
              <Suspense fallback={<div className="h-6" />}>
                <LandingViews
                  posts={posts}
                  pinned={pinned}
                  series={series}
                  books={books}
                />
              </Suspense>
            </div>
          </div>
        </main>
        <KnowPablo />
      </div>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load posts.";
    const isDev = process.env.NODE_ENV !== "production";

    return (
      <div className="min-h-screen px-6 py-16">
        <main className="mx-auto w-full max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">
            Pablo Bermejo
          </h1>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            {isDev
              ? message
              : "Service unavailable. Please check back soon."}
          </p>
          {!config.github.token && (
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
              GitHub token not set; unauthenticated requests may be rate-limited.
            </p>
          )}
        </main>
      </div>
    );
  }
}
