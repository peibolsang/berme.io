import videos from "../lib/videos.json";

const publicationDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function VideosIndex() {
  return (
    <div id="panel-videos" className="space-y-6">
      {[...videos]
        .sort((left, right) => right.publicationDate.localeCompare(left.publicationDate))
        .map((video) => (
          <article
            key={video.url}
            className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-slate-700 dark:bg-slate-900"
          >
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${new URL(video.url).searchParams.get("v")}`}
              title={video.title}
              className="aspect-video w-full border-0"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
            <div className="space-y-3 border-t border-zinc-200 bg-[#f4f1ea]/70 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/60">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                <a href={video.url} className="hover:underline underline-offset-4">
                  {video.title}
                </a>
              </h2>
              <time dateTime={video.publicationDate} className="block text-xs text-zinc-600 dark:text-zinc-400">
                {publicationDate.format(new Date(`${video.publicationDate}T00:00:00Z`))}
              </time>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {video.description}{" "}
                <a href={video.articleUrl} className="text-zinc-900 underline underline-offset-4 hover:text-black dark:text-zinc-100 dark:hover:text-white">
                  Don&apos;t miss the article.
                </a>
              </p>
            </div>
          </article>
        ))}
    </div>
  );
}
