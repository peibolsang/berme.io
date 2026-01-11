import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { getAllViews, getViewByNumber } from "../../../lib/views";
import { Markdown } from "../../../components/Markdown";
import { BackLink } from "../../../components/BackLink";
import { config } from "../../../lib/config";

type PageProps = {
  params: Promise<{
    number: string;
  }>;
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    timeZone: "UTC",
  });
};

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
});

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { number } = await params;
  const view = await getViewByNumber(number);
  if (!view) {
    return {};
  }

  return {
    title: `${view.title} · View`,
    description: view.description ?? "View",
    alternates: {
      canonical: view.url,
    },
    openGraph: {
      title: view.title,
      description: view.description ?? "View",
      type: "article",
      url: view.url,
      modifiedTime: view.updatedAt,
    },
    twitter: {
      card: "summary",
      title: view.title,
      description: view.description ?? "View",
    },
  };
};

export const dynamic = "force-static";

export const generateStaticParams = async () => {
  const views = await getAllViews();
  return views.map((entry) => ({
    number: String(entry.number),
  }));
};

export default async function ViewPage({ params }: PageProps) {
  const { number } = await params;
  const view = await getViewByNumber(number);

  if (!view) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <section className="bg-[#f4f1ea] bg-opacity-70 px-6 pb-6 pt-12 dark:bg-slate-900">
        <div className="mx-auto w-full max-w-2xl">
          <BackLink />
          <h1
            className={`mt-6 text-4xl font-semibold sm:text-6xl ${playfairDisplay.className}`}
          >
            {view.title}
          </h1>
          <div className="mt-4 flex items-start gap-4">
            {view.author?.avatarUrl ? (
              <img
                src={view.author.avatarUrl}
                alt=""
                className="h-9 w-9 rounded-full border border-zinc-200 object-cover dark:border-slate-700"
                loading="lazy"
              />
            ) : null}
            <div className="flex flex-col gap-1">
              {view.author ? (
                view.author.url ? (
                  <a
                    className="text-base text-zinc-900 hover:text-zinc-700 dark:text-white dark:hover:text-zinc-200"
                    href={view.author.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {view.author.name}
                  </a>
                ) : (
                  <span className="text-base text-zinc-900 dark:text-white">
                    {view.author.name}
                  </span>
                )
              ) : null}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span>Updated {formatDate(view.updatedAt)}</span>
                <span aria-hidden="true">•</span>
                <a
                  className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  href={`https://github.com/${config.github.owner}/${config.github.repo}/issues/${view.number}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  View on GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="px-6 pb-16 pt-6 dark:bg-slate-800">
        <div className="mx-auto w-full max-w-2xl">
          {view.body ? (
            <article className="markdown-body mt-0">
              <Markdown content={view.body} />
            </article>
          ) : null}
          <section className="mt-10">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Explore line of thought
            </h2>
            {view.posts.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                No articles yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {view.posts.map((post) => (
                  <li
                    key={post.url}
                    className="relative pl-4 after:absolute after:left-0 after:top-0 after:h-[calc(100%+0.5rem)] after:w-px after:bg-zinc-200 last:after:h-3 dark:after:bg-slate-700"
                  >
                    <span className="absolute left-0 top-3 h-px w-3 bg-zinc-200 dark:bg-slate-700" />
                    <Link
                      href={`${post.url}?view=views`}
                      className="text-zinc-900 hover:text-black dark:text-zinc-100 dark:hover:text-white"
                    >
                      {post.title}
                    </Link>
                    <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">
                      {formatDate(post.publishedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
