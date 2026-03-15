import { BackLink } from "../../components/BackLink";
import { ContentRelationshipGraph } from "../../components/ContentRelationshipGraph";
import { getContentGraph } from "../../lib/content-graph";

export const revalidate = 3600;

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
  const graph = await getContentGraph(focusId);

  return (
    <div className="min-h-screen px-6 py-16">
      <main className="mx-auto w-full max-w-[96rem]">
        <div className="max-w-3xl">
          <BackLink fallbackView="posts" />
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
            Explore how labels connect ideas across posts and conferences.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
            The graph turns content labels into a navigable map of the whole site.
            Pick any post or conference as the center and inspect how labels connect it
            to the rest of the network.
          </p>
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
