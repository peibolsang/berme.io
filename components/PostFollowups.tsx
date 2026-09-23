import type { GitHubComment } from "@/lib/github";
import type { Post } from "@/types";
import { Markdown } from "./Markdown";

type PostFollowupsProps = {
  comments: GitHubComment[];
  author: Post["author"];
};

export function PostFollowups({ comments, author }: PostFollowupsProps) {
  if (comments.length === 0) return null;

  return (
    <section
      id="followups"
      aria-labelledby="followups-title"
      className="mt-10 scroll-mt-8 border-t border-zinc-200 pt-8 dark:border-slate-700"
    >
      <div className="flex flex-wrap items-center gap-3.5">
        <h2 id="followups-title" className="text-2xl leading-[1.2] font-semibold">
          Followups
        </h2>
        <span className="inline-flex h-[26px] min-w-[26px] items-center justify-center rounded-full border border-zinc-200 bg-stone-50 px-2 text-xs font-medium text-zinc-600 dark:border-slate-700 dark:bg-slate-900 dark:text-zinc-400">
          {comments.length}
        </span>
      </div>
      <ol className="mt-8 list-none pl-5">
        {comments.map((followup, index) => (
          <li
            key={followup.id}
            className="relative grid grid-cols-1 gap-2 border-l border-zinc-200 pb-8 pl-7 last:pb-0 dark:border-slate-700"
          >
            <span
              aria-hidden="true"
              className="absolute top-1.5 -left-1 size-[7px] rounded-full bg-amber-800 dark:bg-amber-300"
            />
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="text-[10px] font-semibold tracking-[0.16em] text-amber-800 uppercase dark:text-amber-300">
                Followup {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                {author?.name ?? followup.user?.login ?? "Author"} on{" "}
                <time dateTime={followup.created_at}>
                  {new Date(followup.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </time>
              </span>
            </div>
            <article id={`followup-${followup.id}`} className="min-w-0 scroll-mt-6 pl-3">
              <div className="markdown-body detail-markdown wrap-anywhere [&>:first-child]:mt-0">
                <Markdown content={followup.body ?? ""} />
              </div>
              <a
                href={`#followup-${followup.id}`}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-sm text-xs text-zinc-600 hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-800 dark:text-zinc-400 dark:focus-visible:outline-amber-300"
              >
                <span aria-hidden="true">↗</span> Link to followup
              </a>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
