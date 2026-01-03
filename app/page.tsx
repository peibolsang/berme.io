import Link from "next/link";
import { getAllPosts } from "../lib/posts";
import { config } from "../lib/config";
import { KnowPablo } from "../components/KnowPablo";

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
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const dateLabel = `${month}-${day}`;
  const monthName = monthNames[date.getUTCMonth()] ?? month;
  const dateCompact = monthName;
  return { dateLabel, dateCompact };
};

const groupByYear = (posts: Awaited<ReturnType<typeof getAllPosts>>) => {
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

export default async function Home() {
  try {
    const posts = await getAllPosts();
    const grouped = groupByYear(posts);
    const pinned = posts.filter((post) => post.pinned);

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
                and I love to share what I learn.
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
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                  Books
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <a
                      href="https://leanpub.com/software-platforms"
                      className="text-zinc-900 hover:text-black dark:text-zinc-100 dark:hover:text-white"
                    >
                      Software Platforms
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
            {pinned.length > 0 && (
              <section className="-mx-6 border-y border-zinc-200/70 bg-white px-6 py-5 shadow-sm md:-mx-5 md:rounded-2xl md:border md:border-zinc-200/70 md:px-5 dark:border-slate-700 dark:bg-slate-900/60 md:dark:border-slate-700">
                <div className="mb-4 flex items-center gap-3">
                  <span className="rounded-full border border-zinc-300 bg-[#f4f1ea] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-100">
                    Featured
                  </span>
                </div>
                <ul className="space-y-3 text-sm">
                  {pinned.map((post) => {
                    const { dateLabel, dateCompact } = formatDateLabels(
                      post.publishedAt
                    );

                    return (
                      <li
                        key={post.url}
                        className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-2"
                      >
                        <span className="text-[11px] tracking-[0.08em] text-zinc-400 dark:text-zinc-500">
                          <span className="sm:hidden">{dateCompact}</span>
                          <span className="hidden sm:inline">{dateLabel}</span>
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
