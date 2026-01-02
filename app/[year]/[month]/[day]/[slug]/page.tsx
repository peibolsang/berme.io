import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { getPostByPermalink } from "../../../../../lib/posts";
import { fetchIssueComments } from "../../../../../lib/github";
import { Markdown } from "../../../../../components/Markdown";
import { config } from "../../../../../lib/config";

type PageProps = {
  params: Promise<{
    year: string;
    month: string;
    day: string;
    slug: string;
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

const getReadingTime = (text: string) => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
};

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
});

const formatLabels = (labels: string[]) =>
  labels.filter((label) => label.toLowerCase() !== "published");

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { year, month, day, slug } = await params;
  try {
    const post = await getPostByPermalink(year, month, day, slug);
    if (!post) {
      return {};
    }

    const description = post.excerpt ?? "Blog post.";

    return {
      title: post.title,
      description,
      openGraph: {
        title: post.title,
        description,
        type: "article",
        url: post.url,
        publishedTime: post.publishedAt,
        modifiedTime: post.updatedAt,
      },
    };
  } catch {
    return {};
  }
};

export default async function PostPage({ params }: PageProps) {
  const { year, month, day, slug } = await params;
  try {
    const post = await getPostByPermalink(year, month, day, slug);

    if (!post) {
      notFound();
    }

    let comments = [];
    try {
      comments = await fetchIssueComments(post.number);
    } catch {
      comments = [];
    }

    return (
      <div className="min-h-screen">
        <section className="bg-[#f4f1ea] bg-opacity-70 px-6 pb-6 pt-12 dark:bg-slate-900">
          <div className="mx-auto w-full max-w-2xl">
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              ← Back
            </Link>
            <h1
              className={`mt-6 text-7xl font-semibold ${playfairDisplay.className}`}
            >
              {post.title}
            </h1>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              {formatDate(post.publishedAt)} • {getReadingTime(post.body)} •{" "}
              <a
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                href={`https://github.com/${config.github.owner}/${config.github.repo}/issues/${post.number}`}
                rel="noreferrer"
                target="_blank"
              >
                View on GitHub
              </a>
            </p>
            {formatLabels(post.labels).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formatLabels(post.labels).map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-zinc-200"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
        <section className="px-6 pb-16 pt-2 dark:bg-slate-800">
          <div className="mx-auto w-full max-w-2xl">
            <article className="markdown-body mt-0">
              <Markdown content={post.body} />
            </article>
            <section className="mt-10 border-t border-zinc-200 pt-8 dark:border-slate-700">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Comments ({comments.length})
              </h2>
              {comments.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                  No comments yet.
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                          {comment.user?.login ?? "Unknown"}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.2em]">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <div className="markdown-body mt-3">
                        <Markdown content={comment.body ?? ""} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load post.";
    const isDev = process.env.NODE_ENV !== "production";

    return (
      <div className="min-h-screen px-6 py-16">
        <main className="mx-auto w-full max-w-2xl dark:bg-slate-800">
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            ← Back
          </Link>
          <h1 className="mt-6 text-2xl font-semibold">Pablo</h1>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            {isDev
              ? message
              : "Service unavailable. Please check back soon."}
          </p>
        </main>
      </div>
    );
  }
}
