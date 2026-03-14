import { unstable_cache } from "next/cache";
import type { Conference, Post, View } from "../types";
import { config } from "./config";
import { getConferences } from "./conferences";
import { getAllPosts } from "./posts";
import { getAllViews } from "./views";

type ContentNodeType = "post" | "view" | "conference";
export type ContentGraphNodeType = ContentNodeType | "topic";

export type ContentGraphNode = {
  id: string;
  type: ContentGraphNodeType;
  title: string;
  url?: string;
  meta: string;
  degree: number;
};

export type ContentGraphEdge = {
  id: string;
  source: string;
  target: string;
  kind: "label" | "membership";
};

export type ContentGraphNeighborhoodNode = ContentGraphNode & {
  distance: 0 | 1 | 2;
};

export type ContentGraphNeighborhood = {
  focusId: string;
  nodes: ContentGraphNeighborhoodNode[];
  edges: ContentGraphEdge[];
  focusOptions: Array<Pick<ContentGraphNode, "id" | "title" | "type" | "meta" | "url" | "degree">>;
  connectedTopics: string[];
  stats: {
    contentNodes: number;
    topicNodes: number;
    edges: number;
  };
};

type ContentSnapshot = {
  id: string;
  type: ContentNodeType;
  title: string;
  url: string;
  meta: string;
  sortDate: string;
  labelKeys: string[];
};

type CachedContentGraph = {
  nodes: ContentGraphNode[];
  edges: ContentGraphEdge[];
  focusOptions: Array<Pick<ContentGraphNode, "id" | "title" | "type" | "meta" | "url" | "degree">>;
  stats: {
    contentNodes: number;
    topicNodes: number;
    edges: number;
  };
};

const IGNORED_LABELS = new Set(["published", "conference", "now"]);
const MIN_TOPIC_CONNECTIONS = 2;
const MAX_TOPIC_CONNECTIONS = 6;
const MAX_SECONDARY_CONTENT_NODES = 10;
const MAX_FOCUS_OPTIONS = 10;

const normalizeLabel = (label: string) => label.trim().toLowerCase();

const isUsefulLabel = (label: string) => {
  const normalized = normalizeLabel(label);
  if (!normalized || IGNORED_LABELS.has(normalized)) {
    return false;
  }
  return normalized.length >= 2;
};

const formatPostMeta = (post: Post) =>
  new Date(post.publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });

const formatViewMeta = (view: View) =>
  `${view.posts.length} ${view.posts.length === 1 ? "post" : "posts"}`;

const formatConferenceMeta = (conference: Conference) =>
  [conference.event, conference.location].filter(Boolean).join(" · ");

const buildViewLabels = (view: View) => {
  const labels = new Map<string, string>();
  view.posts.forEach((post) => {
    post.labels.forEach((label) => {
      if (!isUsefulLabel(label)) {
        return;
      }
      const key = normalizeLabel(label);
      if (!labels.has(key)) {
        labels.set(key, label.trim());
      }
    });
  });
  return Array.from(labels.keys());
};

const toContentSnapshots = (
  posts: Post[],
  views: View[],
  conferences: Conference[],
) => {
  const postSnapshots: ContentSnapshot[] = posts.map((post) => ({
    id: `post:${post.number}`,
    type: "post",
    title: post.title,
    url: post.url,
    meta: formatPostMeta(post),
    sortDate: post.publishedAt,
    labelKeys: post.labels.filter(isUsefulLabel).map(normalizeLabel),
  }));

  const viewSnapshots: ContentSnapshot[] = views.map((view) => ({
    id: `view:${view.number}`,
    type: "view",
    title: view.title,
    url: view.url,
    meta: formatViewMeta(view),
    sortDate: view.updatedAt,
    labelKeys: buildViewLabels(view),
  }));

  const conferenceSnapshots: ContentSnapshot[] = conferences.map((conference) => ({
    id: `conference:${conference.number}`,
    type: "conference",
    title: conference.title,
    url: conference.url,
    meta: formatConferenceMeta(conference),
    sortDate: conference.date,
    labelKeys: conference.labels.filter(isUsefulLabel).map(normalizeLabel),
  }));

  return [...postSnapshots, ...viewSnapshots, ...conferenceSnapshots];
};

const compareContentSnapshots = (left: ContentSnapshot, right: ContentSnapshot) => {
  if (right.sortDate !== left.sortDate) {
    return right.sortDate.localeCompare(left.sortDate);
  }
  return left.title.localeCompare(right.title);
};

const buildGraphIndex = (
  snapshots: ContentSnapshot[],
  views: View[],
): CachedContentGraph => {
  const labelMembers = new Map<string, Set<string>>();

  snapshots.forEach((snapshot) => {
    const uniqueKeys = new Set(snapshot.labelKeys);
    uniqueKeys.forEach((key) => {
      if (!labelMembers.has(key)) {
        labelMembers.set(key, new Set());
      }
      labelMembers.get(key)?.add(snapshot.id);
    });
  });

  const validTopicKeys = new Set(
    Array.from(labelMembers.entries())
      .filter(([, members]) => {
        const size = members.size;
        return size >= MIN_TOPIC_CONNECTIONS && size <= MAX_TOPIC_CONNECTIONS;
      })
      .map(([key]) => key),
  );

  const nodes: ContentGraphNode[] = snapshots.map((snapshot) => ({
    id: snapshot.id,
    type: snapshot.type,
    title: snapshot.title,
    url: snapshot.url,
    meta: snapshot.meta,
    degree: 0,
  }));

  validTopicKeys.forEach((key) => {
    nodes.push({
      id: `topic:${key}`,
      type: "topic",
      title: key,
      meta: `${labelMembers.get(key)?.size ?? 0} connected items`,
      degree: 0,
    });
  });

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edges: ContentGraphEdge[] = [];
  const edgeIds = new Set<string>();

  const addEdge = (
    source: string,
    target: string,
    kind: ContentGraphEdge["kind"],
  ) => {
    const [left, right] = [source, target].sort((a, b) => a.localeCompare(b));
    const edgeId = `${kind}:${left}:${right}`;
    if (edgeIds.has(edgeId)) {
      return;
    }
    edgeIds.add(edgeId);
    edges.push({
      id: edgeId,
      source,
      target,
      kind,
    });
  };

  snapshots.forEach((snapshot) => {
    const uniqueKeys = new Set(snapshot.labelKeys);
    uniqueKeys.forEach((key) => {
      if (!validTopicKeys.has(key)) {
        return;
      }
      addEdge(snapshot.id, `topic:${key}`, "label");
    });
  });

  views.forEach((view) => {
    const viewId = `view:${view.number}`;
    if (!nodeById.has(viewId)) {
      return;
    }
    view.posts.forEach((post) => {
      const postId = `post:${post.number}`;
      if (!nodeById.has(postId)) {
        return;
      }
      addEdge(viewId, postId, "membership");
    });
  });

  const degreeByNodeId = new Map<string, number>();
  edges.forEach((edge) => {
    degreeByNodeId.set(edge.source, (degreeByNodeId.get(edge.source) ?? 0) + 1);
    degreeByNodeId.set(edge.target, (degreeByNodeId.get(edge.target) ?? 0) + 1);
  });

  const enrichedNodes = nodes.map((node) => ({
    ...node,
    degree: degreeByNodeId.get(node.id) ?? 0,
  }));

  const snapshotById = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]));
  const focusOptions = enrichedNodes
    .filter((node) => node.type !== "topic" && node.degree > 0)
    .sort((left, right) => {
      if (right.degree !== left.degree) {
        return right.degree - left.degree;
      }
      const leftSnapshot = snapshotById.get(left.id);
      const rightSnapshot = snapshotById.get(right.id);
      if (leftSnapshot && rightSnapshot) {
        return compareContentSnapshots(leftSnapshot, rightSnapshot);
      }
      return left.title.localeCompare(right.title);
    })
    .slice(0, MAX_FOCUS_OPTIONS)
    .map((node) => ({
      id: node.id,
      title: node.title,
      type: node.type,
      meta: node.meta,
      url: node.url,
      degree: node.degree,
    }));

  return {
    nodes: enrichedNodes,
    edges,
    focusOptions,
    stats: {
      contentNodes: snapshots.length,
      topicNodes: validTopicKeys.size,
      edges: edges.length,
    },
  };
};

const fetchContentGraph = async (): Promise<CachedContentGraph> => {
  const [posts, views, conferences] = await Promise.all([
    getAllPosts(),
    getAllViews(),
    getConferences(),
  ]);

  const snapshots = toContentSnapshots(posts, views, conferences);
  return buildGraphIndex(snapshots, views);
};

const getCachedContentGraph = unstable_cache(fetchContentGraph, ["content-graph"], {
  revalidate: config.revalidateSeconds,
  tags: ["posts", "views", "conferences"],
});

const buildAdjacency = (edges: ContentGraphEdge[]) => {
  const adjacency = new Map<string, Set<string>>();

  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, new Set());
    }
    if (!adjacency.has(edge.target)) {
      adjacency.set(edge.target, new Set());
    }
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  });

  return adjacency;
};

const compareGraphNodes = (left: ContentGraphNode, right: ContentGraphNode) => {
  if (left.type === "topic" && right.type !== "topic") {
    return -1;
  }
  if (left.type !== "topic" && right.type === "topic") {
    return 1;
  }
  if (right.degree !== left.degree) {
    return right.degree - left.degree;
  }
  return left.title.localeCompare(right.title);
};

export const getContentGraphNeighborhood = async (
  requestedFocusId?: string,
): Promise<ContentGraphNeighborhood | null> => {
  const graph = await getCachedContentGraph();
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const adjacency = buildAdjacency(graph.edges);

  const focusId =
    requestedFocusId && nodeById.has(requestedFocusId) && nodeById.get(requestedFocusId)?.type !== "topic"
      ? requestedFocusId
      : graph.focusOptions[0]?.id;

  if (!focusId) {
    return null;
  }

  const visibleIds = new Set<string>([focusId]);
  const distances = new Map<string, 0 | 1 | 2>([[focusId, 0]]);
  const directNeighborIds = Array.from(adjacency.get(focusId) ?? [])
    .sort((leftId, rightId) =>
      compareGraphNodes(nodeById.get(leftId) as ContentGraphNode, nodeById.get(rightId) as ContentGraphNode),
    );

  directNeighborIds.forEach((nodeId) => {
    visibleIds.add(nodeId);
    distances.set(nodeId, 1);
  });

  const secondaryCandidates = new Map<string, ContentGraphNode>();
  directNeighborIds.forEach((neighborId) => {
    Array.from(adjacency.get(neighborId) ?? []).forEach((candidateId) => {
      if (candidateId === focusId || visibleIds.has(candidateId)) {
        return;
      }
      const candidate = nodeById.get(candidateId);
      if (!candidate || candidate.type === "topic") {
        return;
      }
      secondaryCandidates.set(candidateId, candidate);
    });
  });

  Array.from(secondaryCandidates.values())
    .sort(compareGraphNodes)
    .slice(0, MAX_SECONDARY_CONTENT_NODES)
    .forEach((candidate) => {
      visibleIds.add(candidate.id);
      distances.set(candidate.id, 2);
    });

  const nodes = graph.nodes
    .filter((node) => visibleIds.has(node.id))
    .map((node) => ({
      ...node,
      distance: distances.get(node.id) ?? 2,
    }))
    .sort((left, right) => {
      if (left.distance !== right.distance) {
        return left.distance - right.distance;
      }
      return compareGraphNodes(left, right);
    });

  const edges = graph.edges.filter(
    (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target),
  );

  const connectedTopics = nodes
    .filter((node) => node.type === "topic" && node.distance === 1)
    .map((node) => node.title)
    .sort((left, right) => left.localeCompare(right));

  return {
    focusId,
    nodes,
    edges,
    focusOptions: graph.focusOptions,
    connectedTopics,
    stats: graph.stats,
  };
};
