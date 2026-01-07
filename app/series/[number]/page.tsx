import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { getAllSeries, getSeriesByNumber } from "../../../lib/series";
import { Markdown } from "../../../components/Markdown";
import { BackLink } from "../../../components/BackLink";

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
  const series = await getSeriesByNumber(number);
  if (!series) {
    return {};
  }

  return {
    title: `${series.title} · Series`,
    description: series.description ?? "Series",
    alternates: {
      canonical: series.url,
    },
    openGraph: {
      title: series.title,
      description: series.description ?? "Series",
      type: "article",
      url: series.url,
      modifiedTime: series.updatedAt,
    },
    twitter: {
      card: "summary",
      title: series.title,
      description: series.description ?? "Series",
    },
  };
};

export const dynamic = "force-static";

export const generateStaticParams = async () => {
  const series = await getAllSeries();
  return series.map((entry) => ({
    number: String(entry.number),
  }));
};

export default async function SeriesPage({ params }: PageProps) {
  const { number } = await params;
  const series = await getSeriesByNumber(number);

  if (!series) {
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
            {series.title}
          </h1>
          <div className="mt-4 flex items-start gap-4">
            {series.author?.avatarUrl ? (
              <img
                src={series.author.avatarUrl}
                alt=""
                className="h-9 w-9 rounded-full border border-zinc-200 object-cover dark:border-slate-700"
                loading="lazy"
              />
            ) : null}
            <div className="flex flex-col gap-1">
              {series.author ? (
                series.author.url ? (
                  <a
                    className="text-base text-zinc-900 hover:text-zinc-700 dark:text-white dark:hover:text-zinc-200"
                    href={series.author.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {series.author.name}
                  </a>
                ) : (
                  <span className="text-base text-zinc-900 dark:text-white">
                    {series.author.name}
                  </span>
                )
              ) : null}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span>Series</span>
                <span aria-hidden="true">•</span>
                <span>{series.posts.length} parts</span>
                <span aria-hidden="true">•</span>
                <span>Updated {formatDate(series.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="px-6 pb-16 pt-6 dark:bg-slate-800">
        <div className="mx-auto w-full max-w-2xl">
          {series.body ? (
            <article className="markdown-body mt-0">
              <Markdown content={series.body} />
            </article>
          ) : null}
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Parts ({series.posts.length})
            </h2>
            {series.posts.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                No articles yet.
              </p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <ol className="divide-y divide-zinc-200 text-sm dark:divide-slate-700">
                  {series.posts.map((post, index) => (
                    <li
                      key={post.url}
                      className="grid gap-2 px-4 py-3 sm:grid-cols-[4.5rem_minmax(0,1fr)_7rem] sm:items-center"
                    >
                      <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                        Part {index + 1}
                      </span>
                      <Link
                        href={`${post.url}?view=series`}
                        className="font-semibold text-zinc-900 hover:text-black dark:text-zinc-100 dark:hover:text-white"
                      >
                        {post.title}
                      </Link>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-right">
                        {formatDate(post.publishedAt)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
