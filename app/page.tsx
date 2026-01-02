import Link from "next/link";
import { getAllPosts } from "../lib/posts";
import { config } from "../lib/config";

type YearGroup = {
  year: string;
  posts: {
    title: string;
    date: string;
    url: string;
  }[];
};

const groupByYear = (posts: Awaited<ReturnType<typeof getAllPosts>>) => {
  const groups = new Map<string, YearGroup>();

  posts.forEach((post) => {
    const date = new Date(post.publishedAt);
    const year = String(date.getUTCFullYear());
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const dateLabel = `${month}-${day}`;

    const entry = groups.get(year) ?? {
      year,
      posts: [],
    };

    entry.posts.push({
      title: post.title,
      date: dateLabel,
      url: post.url,
    });

    groups.set(year, entry);
  });

  return Array.from(groups.values()).sort((a, b) => b.year.localeCompare(a.year));
};

export default async function Home() {
  try {
    const posts = await getAllPosts();
    const grouped = groupByYear(posts);

    return (
      <div className="min-h-screen px-6 py-16">
        <main className="mx-auto w-full max-w-2xl">
          <header className="mb-12">
            <h1 className="text-2xl font-semibold tracking-tight">
              Pablo Bermejo
            </h1>
          </header>

          <div className="space-y-10">
            {grouped.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No published posts yet.
              </p>
            ) : (
              grouped.map((group) => (
                <section key={group.year}>
                <h2 className="mb-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                  {group.year}
                </h2>
                <ul className="space-y-2 text-sm">
                    {group.posts.map((post) => (
                      <li key={post.url} className="flex gap-4">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {post.date}
                        </span>
                      <Link
                        href={post.url}
                        className="text-zinc-900 hover:text-black dark:text-zinc-100 dark:hover:text-white"
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
        </main>
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
