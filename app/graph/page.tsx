import Link from "next/link";
import { ContentRelationshipGraph } from "../../components/ContentRelationshipGraph";
import { config } from "../../lib/config";
import { getContentGraphNeighborhood } from "../../lib/content-graph";

export const revalidate = config.revalidateSeconds;

type GraphPageProps = {
  searchParams?: Promise<{
    focus?: string | string[];
  }>;
};

const readFocusParam = async (searchParams?: GraphPageProps["searchParams"]) => {
  const resolved = await searchParams;
  const focus = resolved?.focus;
  return typeof focus === "string" ? focus : undefined;
};

export default async function GraphPage({ searchParams }: GraphPageProps) {
  const focusId = await readFocusParam(searchParams);
  const graph = await getContentGraphNeighborhood(focusId);

  return (
    <div className="min-h-screen px-6 py-16">
      <main className="mx-auto w-full max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            Graph
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
            Explore how ideas connect across posts, views, and conferences.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
            This route turns shared labels into a navigable map. The graph centers on a
            single piece, then shows its strongest one-hop relationships through topic
            labels and view membership without sending you to markdown export routes.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-slate-700 dark:bg-slate-900/70 dark:text-zinc-200 dark:hover:border-slate-600 dark:hover:text-white"
            >
              Back home
            </Link>
            <span className="text-zinc-400 dark:text-zinc-500">
              Pick a different center from the right rail to redraw the neighborhood.
            </span>
          </div>
        </div>

        <div className="mt-10">
          {graph ? (
            <ContentRelationshipGraph graph={graph} />
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-zinc-200 bg-white/70 px-6 py-10 text-sm text-zinc-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-zinc-400">
              The relationship graph is empty right now. Add more labeled content to
              generate connections.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
