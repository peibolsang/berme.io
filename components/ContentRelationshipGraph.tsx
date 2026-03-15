"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { select } from "d3-selection";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import type { ContentGraphEdge, ContentGraphNeighborhood, ContentGraphNeighborhoodNode } from "../lib/content-graph";

type ForceNode = ContentGraphNeighborhoodNode &
  Omit<SimulationNodeDatum, "x" | "y"> & {
    radius: number;
    x: number;
    y: number;
  };

type ForceLink = SimulationLinkDatum<ForceNode> &
  ContentGraphEdge & {
    source: string | ForceNode;
    target: string | ForceNode;
  };

type GraphBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type ViewTransform = {
  x: number;
  y: number;
  scale: number;
};

type HoverState =
  | {
      type: "node";
      x: number;
      y: number;
      node: ForceNode;
    }
  | {
      type: "edge";
      x: number;
      y: number;
      edge: ForceLink;
      sourceNode: ForceNode;
      targetNode: ForceNode;
    };

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 980;
const MIN_SCALE = 0.45;
const MAX_SCALE = 2.2;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const nodeRadius = (node: ContentGraphNeighborhoodNode) => {
  const base = node.type === "conference" ? 10 : 7;
  return clamp(base + node.degree * 0.8, base, 18);
};

const sortNodesStable = (
  left: ContentGraphNeighborhoodNode,
  right: ContentGraphNeighborhoodNode,
) => {
  if (left.type !== right.type) {
    return left.type.localeCompare(right.type);
  }
  return left.id.localeCompare(right.id);
};

const resolveNodeId = (endpoint: string | ForceNode) =>
  typeof endpoint === "string" ? endpoint : endpoint.id;

const buildQueryPath = (
  pathname: string,
  searchParams: URLSearchParams,
  focusId: string,
) => {
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set("focus", focusId);
  const query = nextParams.toString();
  return query ? `${pathname}?${query}` : pathname;
};

const buildGraphLayout = (graph: ContentGraphNeighborhood) => {
  const nodes: ForceNode[] = graph.nodes
    .slice()
    .sort(sortNodesStable)
    .map((node, index, collection) => {
      const angle = (Math.PI * 2 * index) / Math.max(collection.length, 1);
      const orbit = 240 + (index % 7) * 30 + node.degree * 10;
      return {
        ...node,
        radius: nodeRadius(node),
        x: WORLD_WIDTH / 2 + Math.cos(angle) * orbit,
        y: WORLD_HEIGHT / 2 + Math.sin(angle) * orbit * 0.72,
      };
    });

  const links: ForceLink[] = graph.edges.map((edge) => ({
    ...edge,
    labels: edge.labels ?? [],
    weight: edge.weight ?? Math.max(edge.labels?.length ?? 0, 1),
    source: edge.source,
    target: edge.target,
  }));

  const simulation = forceSimulation(nodes)
    .force(
      "link",
      forceLink<ForceNode, ForceLink>(links)
        .id((node) => node.id)
        .distance((link) => 190 - (link.weight - 1) * 28)
        .strength((link) => 0.12 + Math.min(link.weight, 3) * 0.12),
    )
    .force("charge", forceManyBody<ForceNode>().strength(-220))
    .force("center", forceCenter(WORLD_WIDTH / 2, WORLD_HEIGHT / 2))
    .force("x", forceX<ForceNode>(WORLD_WIDTH / 2).strength(0.015))
    .force("y", forceY<ForceNode>(WORLD_HEIGHT / 2).strength(0.015))
    .force("collide", forceCollide<ForceNode>((node) => node.radius + 16).iterations(2))
    .stop();

  for (let tick = 0; tick < 320; tick += 1) {
    simulation.tick();
  }
  simulation.stop();

  const resolvedNodes = nodes.map((node) => ({
    ...node,
    x: node.x ?? WORLD_WIDTH / 2,
    y: node.y ?? WORLD_HEIGHT / 2,
  }));
  const nodeById = new Map(resolvedNodes.map((node) => [node.id, node]));
  const resolvedEdges = links.filter((edge) => {
    const sourceId = resolveNodeId(edge.source);
    const targetId = resolveNodeId(edge.target);
    return nodeById.has(sourceId) && nodeById.has(targetId);
  });

  const bounds = resolvedNodes.reduce<GraphBounds>(
    (accumulator, node) => ({
      minX: Math.min(accumulator.minX, node.x - node.radius),
      maxX: Math.max(accumulator.maxX, node.x + node.radius),
      minY: Math.min(accumulator.minY, node.y - node.radius),
      maxY: Math.max(accumulator.maxY, node.y + node.radius),
    }),
    {
      minX: WORLD_WIDTH / 2,
      maxX: WORLD_WIDTH / 2,
      minY: WORLD_HEIGHT / 2,
      maxY: WORLD_HEIGHT / 2,
    },
  );

  return {
    nodes: resolvedNodes,
    edges: resolvedEdges,
    nodeById,
    bounds,
  };
};

const fitBounds = (
  bounds: GraphBounds,
  width: number,
  height: number,
): ViewTransform => {
  const padding = 120;
  const graphWidth = Math.max(bounds.maxX - bounds.minX, 320) + padding * 2;
  const graphHeight = Math.max(bounds.maxY - bounds.minY, 240) + padding * 2;
  const scale = clamp(Math.min(width / graphWidth, height / graphHeight), 0.52, 1.08);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  return {
    x: width / 2 - centerX * scale,
    y: height / 2 - centerY * scale,
    scale,
  };
};

export const ContentRelationshipGraph = ({
  graph,
}: {
  graph: ContentGraphNeighborhood;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewportRef = useRef<HTMLDivElement>(null);
  const zoomSurfaceRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState<ViewTransform>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [labelFilterState, setLabelFilterState] = useState<{
    focusId: string;
    labels: string[];
  }>({
    focusId: graph.focusId,
    labels: [],
  });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [hoverState, setHoverState] = useState<HoverState | null>(null);

  const selectedConnectingLabels = useMemo(
    () => (labelFilterState.focusId === graph.focusId ? labelFilterState.labels : []),
    [graph.focusId, labelFilterState.focusId, labelFilterState.labels],
  );
  const selectedConnectingLabelSet = useMemo(
    () => new Set(selectedConnectingLabels),
    [selectedConnectingLabels],
  );
  const layout = useMemo(() => buildGraphLayout(graph), [graph]);
  const adjacency = useMemo(() => {
    const entries = new Map<string, Set<string>>();
    graph.edges.forEach((edge) => {
      if (!entries.has(edge.source)) {
        entries.set(edge.source, new Set());
      }
      if (!entries.has(edge.target)) {
        entries.set(edge.target, new Set());
      }
      entries.get(edge.source)?.add(edge.target);
      entries.get(edge.target)?.add(edge.source);
    });
    return entries;
  }, [graph.edges]);

  const focusNeighborIds = useMemo(
    () => new Set(adjacency.get(graph.focusId) ?? []),
    [adjacency, graph.focusId],
  );
  const edgeByPair = useMemo(() => {
    const entries = new Map<string, ForceLink>();
    layout.edges.forEach((edge) => {
      const sourceId = resolveNodeId(edge.source);
      const targetId = resolveNodeId(edge.target);
      const pairKey = [sourceId, targetId].sort((left, right) => left.localeCompare(right)).join("::");
      entries.set(pairKey, edge);
    });
    return entries;
  }, [layout.edges]);
  const fittedTransform = useMemo(
    () =>
      viewportSize.width && viewportSize.height
        ? fitBounds(layout.bounds, viewportSize.width, viewportSize.height)
        : { x: 0, y: 0, scale: 1 },
    [layout.bounds, viewportSize.height, viewportSize.width],
  );

  const getPointerWithinViewport = (clientX: number, clientY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: clientX, y: clientY };
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      setViewportSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const surface = zoomSurfaceRef.current;
    if (!surface || !viewportSize.width || !viewportSize.height) {
      return;
    }

    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_SCALE, MAX_SCALE])
      .clickDistance(8)
      .on("zoom", (event) => {
        setTransform({
          x: event.transform.x,
          y: event.transform.y,
          scale: event.transform.k,
        });
      });

    zoomBehaviorRef.current = behavior;

    const selection = select(surface);
    selection.call(behavior).on("dblclick.zoom", null);
    selection.call(
      behavior.transform,
      zoomIdentity.translate(fittedTransform.x, fittedTransform.y).scale(fittedTransform.scale),
    );

    return () => {
      selection.on(".zoom", null);
    };
  }, [fittedTransform, viewportSize.height, viewportSize.width]);

  const applyZoom = (factor: number) => {
    const surface = zoomSurfaceRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!surface || !behavior) {
      return;
    }
    select(surface).call(behavior.scaleBy, factor);
  };

  const resetZoom = () => {
    const surface = zoomSurfaceRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!surface || !behavior) {
      return;
    }
    select(surface).call(
      behavior.transform,
      zoomIdentity.translate(fittedTransform.x, fittedTransform.y).scale(fittedTransform.scale),
    );
  };

  const setFocus = (focusId: string) => {
    router.push(buildQueryPath(pathname, searchParams, focusId), {
      scroll: false,
    });
  };
  const toggleConnectingLabel = (label: string) => {
    setLabelFilterState((current) => {
      if (graph.connectedTopics.length <= 1) {
        return {
          focusId: graph.focusId,
          labels: [],
        };
      }
      const currentLabels = current.focusId === graph.focusId ? current.labels : [];
      const nextLabels = currentLabels.includes(label)
        ? currentLabels.filter((entry) => entry !== label)
        : [...currentLabels, label];
      return {
        focusId: graph.focusId,
        labels: nextLabels,
      };
    });
  };

  const activeNodeIds = new Set<string>(
    [graph.focusId, hoveredNodeId].filter(Boolean) as string[],
  );
  const visuallyMatchedNodeIds = new Set<string>([graph.focusId]);
  const visuallyMatchedEdgeIds = new Set<string>();

  const activeEdgeIds = new Set<string>();
  layout.edges.forEach((edge) => {
    const sourceId = resolveNodeId(edge.source);
    const targetId = resolveNodeId(edge.target);
    const matchesSelectedLabels =
      selectedConnectingLabelSet.size === 0 ||
      edge.labels.some((label) => selectedConnectingLabelSet.has(label));

    if (
      matchesSelectedLabels &&
      (sourceId === graph.focusId || targetId === graph.focusId)
    ) {
      visuallyMatchedEdgeIds.add(edge.id);
      visuallyMatchedNodeIds.add(sourceId);
      visuallyMatchedNodeIds.add(targetId);
    }

    if (
      edge.id === hoveredEdgeId ||
      sourceId === graph.focusId ||
      targetId === graph.focusId ||
      sourceId === hoveredNodeId ||
      targetId === hoveredNodeId
    ) {
      activeEdgeIds.add(edge.id);
      activeNodeIds.add(sourceId);
      activeNodeIds.add(targetId);
    }
  });

  const focusNode = layout.nodeById.get(graph.focusId);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          {focusNode ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <span className="inline-flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    focusNode.type === "conference"
                      ? "bg-amber-400"
                      : "bg-zinc-500 dark:bg-zinc-300"
                  }`}
                />
                {focusNode.url ? (
                  <Link
                    href={focusNode.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
                  >
                    {focusNode.title}
                  </Link>
                ) : (
                  <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                    {focusNode.title}
                  </span>
                )}
              </span>
              <span>{graph.connectedTopics.length} connecting labels</span>
              <span>{focusNeighborIds.size} direct connections</span>
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <div className="flex items-center gap-2 whitespace-nowrap pr-2">
              {graph.connectedTopics.map((label) => {
                const isSelected = selectedConnectingLabelSet.has(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleConnectingLabel(label)}
                    className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                      isSelected
                        ? "border-amber-300/80 bg-amber-50 text-amber-900 dark:border-amber-300/45 dark:bg-amber-300/10 dark:text-amber-100"
                        : "border-zinc-300/80 bg-white/75 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-slate-700/80 dark:bg-slate-900/60 dark:text-zinc-300 dark:hover:border-slate-600 dark:hover:text-zinc-100"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-zinc-700 dark:bg-zinc-100" />
            <span>Post</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="relative inline-flex h-3 w-3 items-center justify-center">
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="absolute inset-[-3px] rounded-full border border-amber-400/70" />
            </span>
            <span>Conference</span>
          </span>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="relative h-[72vh] min-h-[36rem] overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(240,244,249,0.88))] shadow-[0_20px_60px_rgba(15,23,42,0.07)] dark:border-slate-700/80 dark:bg-[radial-gradient(circle_at_top,_rgba(30,41,59,0.30),_rgba(2,6,23,0.15))]"
      >
        <div className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-30">
          <svg className="h-full w-full" aria-hidden="true">
            <defs>
              <pattern
                id="graph-grid"
                width="48"
                height="48"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 48 0 L 0 0 0 48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  className="text-zinc-200 dark:text-slate-700"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#graph-grid)" />
          </svg>
        </div>

        <div className="absolute right-5 top-5 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => applyZoom(1.15)}
            className="rounded-full border border-zinc-200/80 bg-white/85 px-3 py-2 text-sm font-semibold text-zinc-700 backdrop-blur transition hover:border-zinc-300 hover:text-zinc-950 dark:border-slate-700/80 dark:bg-slate-950/75 dark:text-zinc-200 dark:hover:border-slate-600 dark:hover:text-white"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => applyZoom(1 / 1.15)}
            className="rounded-full border border-zinc-200/80 bg-white/85 px-3 py-2 text-sm font-semibold text-zinc-700 backdrop-blur transition hover:border-zinc-300 hover:text-zinc-950 dark:border-slate-700/80 dark:bg-slate-950/75 dark:text-zinc-200 dark:hover:border-slate-600 dark:hover:text-white"
          >
            -
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="rounded-full border border-zinc-200/80 bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-700 backdrop-blur transition hover:border-zinc-300 hover:text-zinc-950 dark:border-slate-700/80 dark:bg-slate-950/75 dark:text-zinc-200 dark:hover:border-slate-600 dark:hover:text-white"
          >
            Reset
          </button>
        </div>

        <svg
          ref={zoomSurfaceRef}
          className="absolute inset-0 h-full w-full touch-none"
          aria-label="Content relationship graph"
        >
          <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
            {layout.edges.map((edge) => {
              const sourceId = resolveNodeId(edge.source);
              const targetId = resolveNodeId(edge.target);
              const sourceNode = layout.nodeById.get(sourceId);
              const targetNode = layout.nodeById.get(targetId);
              if (!sourceNode || !targetNode) {
                return null;
              }

              const isActive = activeEdgeIds.has(edge.id);
              const matchesSelectedLabels =
                selectedConnectingLabelSet.size === 0 ||
                edge.labels.some((label) => selectedConnectingLabelSet.has(label));

              return (
                <g key={edge.id}>
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={
                      isActive || visuallyMatchedEdgeIds.has(edge.id)
                        ? "rgba(245,158,11,0.62)"
                        : "rgba(100,116,139,0.28)"
                    }
                    strokeWidth={
                      isActive || visuallyMatchedEdgeIds.has(edge.id)
                        ? 2.3 / transform.scale
                        : 1.2 / transform.scale
                    }
                    strokeLinecap="round"
                    opacity={
                      selectedConnectingLabelSet.size > 0 && !matchesSelectedLabels ? 0.08 : 1
                    }
                  />
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke="transparent"
                    strokeWidth={18 / transform.scale}
                    onPointerEnter={(event) => {
                      const pointer = getPointerWithinViewport(event.clientX, event.clientY);
                      setHoveredEdgeId(edge.id);
                      setHoverState({
                        type: "edge",
                        x: pointer.x,
                        y: pointer.y,
                        edge,
                        sourceNode,
                        targetNode,
                      });
                    }}
                    onPointerMove={(event) => {
                      const pointer = getPointerWithinViewport(event.clientX, event.clientY);
                      setHoverState({
                        type: "edge",
                        x: pointer.x,
                        y: pointer.y,
                        edge,
                        sourceNode,
                        targetNode,
                      });
                    }}
                    onPointerLeave={() => {
                      setHoveredEdgeId((current) => (current === edge.id ? null : current));
                      setHoverState((current) =>
                        current?.type === "edge" && current.edge.id === edge.id ? null : current,
                      );
                    }}
                  />
                </g>
              );
            })}

            {layout.nodes.map((node) => {
              const isFocus = node.id === graph.focusId;
              const isNeighbor = focusNeighborIds.has(node.id);
              const isHovered = hoveredNodeId === node.id;
              const dimmed = activeNodeIds.size > 0 && !activeNodeIds.has(node.id);
              const matchesSelectedLabels =
                selectedConnectingLabelSet.size === 0 || visuallyMatchedNodeIds.has(node.id);
              const fill =
                node.type === "conference"
                  ? "rgba(245,158,11,0.82)"
                  : "rgba(15,23,42,0.82)";
              const darkFill =
                node.type === "conference"
                  ? "rgba(251,191,36,0.88)"
                  : "rgba(226,232,240,0.92)";
              const opacity =
                selectedConnectingLabelSet.size > 0 && !matchesSelectedLabels
                  ? 0.14
                  : dimmed
                    ? 0.18
                    : isNeighbor || isFocus || isHovered
                      ? 1
                      : 0.72;

              return (
                <g key={node.id} transform={`translate(${node.x} ${node.y})`} opacity={opacity}>
                  {isFocus ? (
                    <circle
                      r={(node.radius + 9) / transform.scale}
                      fill="rgba(245,158,11,0.16)"
                    />
                  ) : null}
                  <circle
                    r={node.radius / transform.scale}
                    fill={fill}
                    className="dark:hidden"
                    stroke={isFocus ? "rgba(245,158,11,0.95)" : "rgba(255,255,255,0.85)"}
                    strokeWidth={isFocus ? 3 / transform.scale : 1.5 / transform.scale}
                    onPointerDown={(event) => event.stopPropagation()}
                    onPointerEnter={(event) => {
                      const pointer = getPointerWithinViewport(event.clientX, event.clientY);
                      setHoveredNodeId(node.id);
                      setHoverState({
                        type: "node",
                        x: pointer.x,
                        y: pointer.y,
                        node,
                      });
                    }}
                    onPointerMove={(event) => {
                      const pointer = getPointerWithinViewport(event.clientX, event.clientY);
                      setHoverState({
                        type: "node",
                        x: pointer.x,
                        y: pointer.y,
                        node,
                      });
                    }}
                    onPointerLeave={() => {
                      setHoveredNodeId((current) => (current === node.id ? null : current));
                      setHoverState((current) =>
                        current?.type === "node" && current.node.id === node.id ? null : current,
                      );
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (node.id === graph.focusId) {
                        return;
                      }
                      setFocus(node.id);
                    }}
                  />
                  <circle
                    r={node.radius / transform.scale}
                    fill={darkFill}
                    className="hidden dark:block"
                    stroke={isFocus ? "rgba(251,191,36,0.95)" : "rgba(15,23,42,0.9)"}
                    strokeWidth={isFocus ? 3 / transform.scale : 1.5 / transform.scale}
                    onPointerDown={(event) => event.stopPropagation()}
                    onPointerEnter={(event) => {
                      const pointer = getPointerWithinViewport(event.clientX, event.clientY);
                      setHoveredNodeId(node.id);
                      setHoverState({
                        type: "node",
                        x: pointer.x,
                        y: pointer.y,
                        node,
                      });
                    }}
                    onPointerMove={(event) => {
                      const pointer = getPointerWithinViewport(event.clientX, event.clientY);
                      setHoverState({
                        type: "node",
                        x: pointer.x,
                        y: pointer.y,
                        node,
                      });
                    }}
                    onPointerLeave={() => {
                      setHoveredNodeId((current) => (current === node.id ? null : current));
                      setHoverState((current) =>
                        current?.type === "node" && current.node.id === node.id ? null : current,
                      );
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (node.id === graph.focusId) {
                        return;
                      }
                      setFocus(node.id);
                    }}
                  />
                  {node.type === "conference" ? (
                    <circle
                      r={(node.radius + 4) / transform.scale}
                      fill="none"
                      stroke="rgba(245,158,11,0.55)"
                      strokeWidth={1.4 / transform.scale}
                    />
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>

        {hoverState ? (
          <div
            className="pointer-events-none absolute z-20 max-w-xs rounded-[1.25rem] border border-zinc-200/80 bg-white/92 px-4 py-3 text-sm text-zinc-700 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur dark:border-slate-700/80 dark:bg-slate-950/90 dark:text-zinc-200"
            style={{
              left: clamp(hoverState.x + 16, 16, Math.max((viewportSize.width || 320) - 280, 16)),
              top: clamp(hoverState.y + 16, 16, Math.max((viewportSize.height || 320) - 150, 16)),
            }}
          >
            {hoverState.type === "node" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  <span>{hoverState.node.degree} connections</span>
                </div>
                <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {hoverState.node.title}
                </p>
                <p className="text-zinc-500 dark:text-zinc-400">{hoverState.node.meta}</p>
                {(() => {
                  if (hoverState.node.id === graph.focusId) {
                    const ownLabels = hoverState.node.labels ?? [];
                    if (ownLabels.length === 0) {
                      return null;
                    }
                    return (
                      <div className="flex flex-wrap gap-2">
                        {ownLabels.map((label) => (
                          <span
                            key={label}
                            className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-900 dark:border-amber-300/35 dark:bg-amber-300/10 dark:text-amber-100"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    );
                  }

                  const pairKey = [hoverState.node.id, graph.focusId]
                    .sort((left, right) => left.localeCompare(right))
                    .join("::");
                  const pairLabels = edgeByPair.get(pairKey)?.labels ?? [];
                  const sharedLabels =
                    selectedConnectingLabelSet.size > 0
                      ? pairLabels.filter((label) => selectedConnectingLabelSet.has(label))
                      : pairLabels;
                  if (sharedLabels.length === 0) {
                    return null;
                  }
                  return (
                    <div className="flex flex-wrap gap-2">
                      {sharedLabels.map((label) => (
                        <span
                          key={label}
                          className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-900 dark:border-amber-300/35 dark:bg-amber-300/10 dark:text-amber-100"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {hoverState.sourceNode.title} ↔ {hoverState.targetNode.title}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(selectedConnectingLabelSet.size > 0
                    ? hoverState.edge.labels.filter((label) => selectedConnectingLabelSet.has(label))
                    : hoverState.edge.labels
                  ).map((label) => (
                    <span
                      key={label}
                      className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-900 dark:border-amber-300/35 dark:bg-amber-300/10 dark:text-amber-100"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
};
