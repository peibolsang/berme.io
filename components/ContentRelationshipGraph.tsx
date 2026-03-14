import Link from "next/link";
import type {
  ContentGraphEdge,
  ContentGraphNeighborhood,
  ContentGraphNeighborhoodNode,
} from "../lib/content-graph";

type PositionedNode = ContentGraphNeighborhoodNode & {
  x: number;
  y: number;
};

const typeLabel: Record<ContentGraphNeighborhoodNode["type"], string> = {
  post: "Post",
  view: "View",
  conference: "Conference",
  topic: "Topic",
};

const typeNodeClassName: Record<ContentGraphNeighborhoodNode["type"], string> = {
  post:
    "border-zinc-200 bg-white/95 text-zinc-900 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-950/95 dark:text-zinc-100",
  view:
    "border-sky-200 bg-sky-50/95 text-sky-950 shadow-[0_18px_40px_rgba(14,116,144,0.12)] dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-100",
  conference:
    "border-emerald-200 bg-emerald-50/95 text-emerald-950 shadow-[0_18px_40px_rgba(5,150,105,0.12)] dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100",
  topic:
    "border-amber-200 bg-amber-50/95 text-amber-950 shadow-[0_18px_40px_rgba(217,119,6,0.12)] dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const placeRing = (
  nodes: ContentGraphNeighborhoodNode[],
  radius: number,
  startAngle: number,
  endAngle: number,
) => {
  if (nodes.length === 0) {
    return [] as PositionedNode[];
  }

  if (nodes.length === 1) {
    const angle = (startAngle + endAngle) / 2;
    return [
      {
        ...nodes[0],
        x: 50 + Math.cos((angle * Math.PI) / 180) * radius,
        y: 50 + Math.sin((angle * Math.PI) / 180) * radius,
      },
    ];
  }

  return nodes.map((node, index) => {
    const angle =
      startAngle + ((endAngle - startAngle) * index) / (nodes.length - 1);
    return {
      ...node,
      x: 50 + Math.cos((angle * Math.PI) / 180) * radius,
      y: 50 + Math.sin((angle * Math.PI) / 180) * radius,
    };
  });
};

const buildLayout = (nodes: ContentGraphNeighborhoodNode[]) => {
  const focus = nodes.find((node) => node.distance === 0);
  const directTopics = nodes.filter(
    (node) => node.distance === 1 && node.type === "topic",
  );
  const directContent = nodes.filter(
    (node) => node.distance === 1 && node.type !== "topic",
  );
  const secondaryContent = nodes.filter((node) => node.distance === 2);

  const positioned: PositionedNode[] = [];

  if (focus) {
    positioned.push({
      ...focus,
      x: 50,
      y: 50,
    });
  }

  positioned.push(...placeRing(directTopics, 21, 210, 330));
  positioned.push(...placeRing(directContent, 35, 145, 395));
  positioned.push(...placeRing(secondaryContent, 46, 165, 375));

  return positioned.map((node) => ({
    ...node,
    x: clamp(node.x, 8, 92),
    y: clamp(node.y, 10, 90),
  }));
};

const buildEdgeKey = (edge: ContentGraphEdge) => edge.id;

export const ContentRelationshipGraph = ({
  graph,
}: {
  graph: ContentGraphNeighborhood;
}) => {
  const nodes = buildLayout(graph.nodes);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const focusNode = nodes.find((node) => node.id === graph.focusId);
  const suggestedFocusNodes = graph.focusOptions.filter(
    (node) => node.id !== graph.focusId,
  );

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-5">
        <div className="rounded-[2rem] border border-zinc-200/80 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(245,158,11,0.12),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,241,234,0.95))] p-4 shadow-[0_22px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/80 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(251,191,36,0.14),_transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.94),rgba(15,23,42,0.88))] sm:p-6">
          <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200/70 pb-4 dark:border-slate-700/80">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                Relationship Graph
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                One-hop map around {focusNode?.title ?? "this idea"}
              </h2>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              <span className="rounded-full border border-zinc-200 bg-white/70 px-3 py-1 dark:border-slate-700 dark:bg-slate-900/70">
                {graph.stats.contentNodes} items
              </span>
              <span className="rounded-full border border-zinc-200 bg-white/70 px-3 py-1 dark:border-slate-700 dark:bg-slate-900/70">
                {graph.stats.topicNodes} topics
              </span>
              <span className="rounded-full border border-zinc-200 bg-white/70 px-3 py-1 dark:border-slate-700 dark:bg-slate-900/70">
                {graph.stats.edges} edges
              </span>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white/55 p-2 sm:aspect-[16/10] dark:border-slate-700/80 dark:bg-slate-950/40">
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id="graph-edge-light"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="rgba(15,23,42,0.18)" />
                    <stop offset="100%" stopColor="rgba(14,165,233,0.22)" />
                  </linearGradient>
                  <linearGradient
                    id="graph-edge-dark"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="rgba(148,163,184,0.28)" />
                    <stop offset="100%" stopColor="rgba(251,191,36,0.28)" />
                  </linearGradient>
                </defs>
                {graph.edges.map((edge) => {
                  const source = nodeById.get(edge.source);
                  const target = nodeById.get(edge.target);
                  if (!source || !target) {
                    return null;
                  }

                  return (
                    <line
                      key={buildEdgeKey(edge)}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={edge.kind === "membership" ? "url(#graph-edge-dark)" : "url(#graph-edge-light)"}
                      strokeWidth={edge.kind === "membership" ? 0.55 : 0.4}
                      strokeLinecap="round"
                      className="dark:opacity-90"
                    />
                  );
                })}
              </svg>

              {nodes.map((node) => {
                const isFocus = node.distance === 0;
                const sizeClassName =
                  node.type === "topic"
                    ? "w-[7.2rem] px-3 py-2"
                    : isFocus
                      ? "w-[12rem] px-4 py-3 sm:w-[13rem]"
                      : node.distance === 1
                        ? "w-[10rem] px-3.5 py-3"
                        : "w-[9rem] px-3 py-2.5";

                const content = (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-70">
                        {typeLabel[node.type]}
                      </span>
                      {node.type !== "topic" ? (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-current/15 px-1.5 text-[10px] font-semibold">
                          {node.degree}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2">
                      <p
                        className={`text-left font-semibold leading-tight ${
                          node.type === "topic"
                            ? "line-clamp-2 text-sm"
                            : isFocus
                              ? "line-clamp-4 text-base"
                              : "line-clamp-3 text-sm"
                        }`}
                      >
                        {node.title}
                      </p>
                      <p className="mt-2 text-left text-[11px] uppercase tracking-[0.14em] opacity-70">
                        {node.meta}
                      </p>
                    </div>
                  </>
                );

                const style = {
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: "translate(-50%, -50%)",
                };

                if (node.type === "topic" || !node.url) {
                  return (
                    <div
                      key={node.id}
                      className={`absolute rounded-[1.35rem] border backdrop-blur ${sizeClassName} ${typeNodeClassName[node.type]}`}
                      style={style}
                    >
                      {content}
                    </div>
                  );
                }

                return (
                  <Link
                    key={node.id}
                    href={node.url}
                    className={`absolute rounded-[1.35rem] border backdrop-blur transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${sizeClassName} ${typeNodeClassName[node.type]}`}
                    style={style}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-zinc-200/80 bg-white/70 p-5 dark:border-slate-700/80 dark:bg-slate-950/50">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Connected topics
            </span>
            {graph.connectedTopics.length > 0 ? (
              graph.connectedTopics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-900 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100"
                >
                  {topic}
                </span>
              ))
            ) : (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                This focus node has no strong shared-label neighbors yet.
              </span>
            )}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-[1.75rem] border border-zinc-200/80 bg-white/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] dark:border-slate-700/80 dark:bg-slate-950/55">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Center node
          </p>
          {focusNode ? (
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                  {typeLabel[focusNode.type]}
                </p>
                <h3 className="mt-2 text-lg font-semibold leading-tight text-zinc-950 dark:text-zinc-50">
                  {focusNode.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {focusNode.meta}
                </p>
              </div>
              {focusNode.url ? (
                <Link
                  href={focusNode.url}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                >
                  Read the full piece
                  <span aria-hidden="true">→</span>
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.75rem] border border-zinc-200/80 bg-white/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] dark:border-slate-700/80 dark:bg-slate-950/55">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Recenter graph
          </p>
          <ul className="mt-3 space-y-2">
            {suggestedFocusNodes.length > 0 ? (
              suggestedFocusNodes.map((node) => (
                <li key={node.id}>
                  <Link
                    href={`/graph?focus=${encodeURIComponent(node.id)}`}
                    className="block rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 transition hover:border-zinc-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-slate-600 dark:hover:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                          {typeLabel[node.type]}
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                          {node.title}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {node.meta}
                        </p>
                      </div>
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-current/15 px-1.5 text-[10px] font-semibold text-zinc-500 dark:text-zinc-300">
                        {node.degree}
                      </span>
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-sm text-zinc-500 dark:text-zinc-400">
                No alternate centers available yet.
              </li>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
};
