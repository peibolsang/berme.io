import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { BackLink } from "../../../components/BackLink";
import { CommandActionsPalette } from "../../../components/CommandActionsPalette";
import { ConferencePdfViewerClient } from "../../../components/ConferencePdfViewerClient";
import { getConferenceBySlug, getConferences } from "../../../lib/conferences";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    timeZone: "UTC",
  });

const DEFAULT_AUTHOR = {
  name: "Pablo Bermejo",
  avatarUrl: "https://github.com/peibolsang.png",
  url: "https://github.com/peibolsang",
};

const getConferenceReadingTime = (
  pageCount: number,
  density: "light" | "medium" | "dense",
) => {
  const minutesPerPage =
    density === "dense" ? 1.25 : density === "light" ? 0.6 : 0.9;
  const minutes = Math.max(1, Math.ceil(pageCount * minutesPerPage));
  return `${minutes} min read`;
};

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
});

export const dynamic = "force-static";

export const generateStaticParams = async () =>
  getConferences().map((conference) => ({
    slug: conference.slug,
  }));

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { slug } = await params;
  const conference = getConferenceBySlug(slug);
  if (!conference) {
    return {};
  }

  return {
    title: `${conference.title} · Conference`,
    description: conference.summary,
    alternates: {
      canonical: `/conferences/${conference.slug}`,
    },
    openGraph: {
      title: conference.title,
      description: conference.summary,
      type: "article",
      url: `/conferences/${conference.slug}`,
    },
    twitter: {
      card: "summary",
      title: conference.title,
      description: conference.summary,
    },
  };
};

export default async function ConferenceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const conference = getConferenceBySlug(slug);
  if (!conference) {
    notFound();
  }

  const readingTime = getConferenceReadingTime(
    conference.pageCount,
    conference.contentDensity,
  );

  return (
    <div className="min-h-screen">
      <CommandActionsPalette
        title={conference.title}
        url={`/conferences/${conference.slug}`}
        markdown={conference.summary}
        readingTime={readingTime}
        metadataLines={[
          `Title: ${conference.title}`,
          `Presented: ${formatDate(conference.date)} at ${conference.event}`,
          `Reading time: ${readingTime}`,
          `Pages: ${conference.pageCount}`,
          `Density: ${conference.contentDensity}`,
          `URL: /conferences/${conference.slug}`,
          `PDF: ${conference.pdfPath}`,
        ]}
        linkCommands={[
          {
            id: "open-pdf",
            label: "Open PDF in new tab",
            letter: "P",
            url: conference.pdfPath,
            mode: "open",
          },
          {
            id: "download-pdf",
            label: "Download PDF",
            letter: "D",
            url: conference.pdfPath,
            mode: "download",
          },
        ]}
        enableCopyMarkdown={false}
        enableRelatedPosts={false}
      />

      <section className="bg-[#f4f1ea] bg-opacity-70 px-6 pb-6 pt-12 dark:bg-slate-900">
        <div className="mx-auto w-full max-w-2xl">
          <BackLink fallbackView="conferences" />
          <h1
            className={`mt-6 text-4xl font-semibold sm:text-6xl ${playfairDisplay.className}`}
          >
            {conference.title}
          </h1>
          <div className="mt-4 flex items-start gap-4">
            <img
              src={DEFAULT_AUTHOR.avatarUrl}
              alt=""
              className="h-9 w-9 rounded-full border border-zinc-200 object-cover dark:border-slate-700"
              loading="lazy"
            />
            <div className="flex flex-col gap-1">
              <a
                className="text-base text-zinc-900 hover:text-zinc-700 dark:text-white dark:hover:text-zinc-200"
                href={DEFAULT_AUTHOR.url}
                target="_blank"
                rel="noreferrer"
              >
                {DEFAULT_AUTHOR.name}
              </a>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span>
                  Presented on {formatDate(conference.date)} at {conference.event}
                </span>
                <span aria-hidden="true">•</span>
                <span>{readingTime}</span>
                <span aria-hidden="true">•</span>
                <a
                  className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  href={conference.pdfPath}
                  download
                >
                  Download PDF
                </a>
                {conference.location ? (
                  <>
                    <span aria-hidden="true">•</span>
                    <span>{conference.location}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 pt-6 dark:bg-slate-800">
        <div className="mx-auto w-full max-w-2xl">
          <article className="markdown-body mt-0">
            <p>{conference.summary}</p>
          </article>
          <section className="mt-8">
            <div>
              <ConferencePdfViewerClient
                pdfPath={conference.pdfPath}
                title={conference.title}
              />
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
