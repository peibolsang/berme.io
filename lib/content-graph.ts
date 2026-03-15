import { unstable_cache } from "next/cache";
import type { Conference, Post } from "../types";
import { config } from "./config";
import { getConferences } from "./conferences";
import { getAllPosts } from "./posts";

type ContentNodeType = "post" | "conference";
export type ContentGraphNodeType = ContentNodeType;

export type ContentGraphNode = {
  id: string;
  type: ContentGraphNodeType;
  title: string;
  url?: string;
  meta: string;
  degree: number;
  labels?: string[];
};

export type ContentGraphEdge = {
  id: string;
  source: string;
  target: string;
  kind: "shared-labels";
  labels: string[];
  weight: number;
};

export type ContentGraphNeighborhoodNode = ContentGraphNode & {
  distance: number | null;
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

const formatConferenceMeta = (conference: Conference) =>
  [conference.event, conference.location].filter(Boolean).join(" · ");

const toContentSnapshots = (posts: Post[], conferences: Conference[]) => {
  const postSnapshots: ContentSnapshot[] = posts.map((post) => ({
    id: `post:${post.number}`,
    type: "post",
    title: post.title,
    url: post.url,
    meta: formatPostMeta(post),
    sortDate: post.publishedAt,
    labelKeys: Array.from(new Set(post.labels.filter(isUsefulLabel).map(normalizeLabel))),
  }));

  const conferenceSnapshots: ContentSnapshot[] = conferences.map((conference) => ({
    id: `conference:${conference.number}`,
    type: "conference",
    title: conference.title,
    url: conference.url,
    meta: formatConferenceMeta(conference),
    sortDate: conference.date,
    labelKeys: Array.from(new Set(conference.labels.filter(isUsefulLabel).map(normalizeLabel))),
  }));

  return [...postSnapshots, ...conferenceSnapshots];
};

const compareContentSnapshots = (left: ContentSnapshot, right: ContentSnapshot) => {
  if (right.sortDate !== left.sortDate) {
    return right.sortDate.localeCompare(left.sortDate);
  }
  return left.title.localeCompare(right.title);
};

const buildGraphIndex = (snapshots: ContentSnapshot[]): CachedContentGraph => {
  const labelMembers = new Map<string, Set<string>>();

  snapshots.forEach((snapshot) => {
    snapshot.labelKeys.forEach((key) => {
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
        return size >= MIN_TOPIC_CONNECTIONS;
      })
      .map(([key]) => key),
  );

const filteredSnapshots = snapshots.map((snapshot) => ({
    ...snapshot,
    labelKeys: snapshot.labelKeys.filter((key) => validTopicKeys.has(key)),
  }));

  const nodes: ContentGraphNode[] = filteredSnapshots.map((snapshot) => ({
    id: snapshot.id,
    type: snapshot.type,
    title: snapshot.title,
    url: snapshot.url,
    meta: snapshot.meta,
    degree: 0,
    labels: snapshot.labelKeys,
  }));

  const pairLabels = new Map<string, Set<string>>();

  filteredSnapshots.forEach((snapshot) => {
    snapshot.labelKeys.forEach((label) => {
      const members = Array.from(labelMembers.get(label) ?? []).filter((id) =>
        filteredSnapshots.some((item) => item.id === id),
      );

      for (let index = 0; index < members.length; index += 1) {
        for (let offset = index + 1; offset < members.length; offset += 1) {
          const [left, right] = [members[index], members[offset]].sort((a, b) =>
            a.localeCompare(b),
          );
          const pairKey = `${left}::${right}`;
          if (!pairLabels.has(pairKey)) {
            pairLabels.set(pairKey, new Set());
          }
          pairLabels.get(pairKey)?.add(label);
        }
      }
    });
  });

  const edges: ContentGraphEdge[] = Array.from(pairLabels.entries()).map(
    ([pairKey, labelsSet]) => {
      const [source, target] = pairKey.split("::");
      const labels = Array.from(labelsSet).sort((left, right) => left.localeCompare(right));
      return {
        id: `shared-labels:${source}:${target}`,
        source,
        target,
        kind: "shared-labels" as const,
        labels,
        weight: labels.length,
      };
    },
  );

  const degreeByNodeId = new Map<string, number>();
  edges.forEach((edge) => {
    degreeByNodeId.set(edge.source, (degreeByNodeId.get(edge.source) ?? 0) + 1);
    degreeByNodeId.set(edge.target, (degreeByNodeId.get(edge.target) ?? 0) + 1);
  });

  const enrichedNodes = nodes.map((node) => ({
    ...node,
    degree: degreeByNodeId.get(node.id) ?? 0,
  }));

  const snapshotById = new Map(filteredSnapshots.map((snapshot) => [snapshot.id, snapshot]));
  const focusOptions = enrichedNodes
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
      contentNodes: filteredSnapshots.length,
      topicNodes: validTopicKeys.size,
      edges: edges.length,
    },
  };
};

const fetchContentGraph = async (): Promise<CachedContentGraph> => {
  const [posts, conferences] = await Promise.all([getAllPosts(), getConferences()]);
  const snapshots = toContentSnapshots(posts, conferences);
  return buildGraphIndex(snapshots);
};

const getCachedContentGraph = unstable_cache(fetchContentGraph, ["content-graph-v2"], {
  revalidate: config.revalidateSeconds,
  tags: ["posts", "conferences"],
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
  if (right.degree !== left.degree) {
    return right.degree - left.degree;
  }
  return left.title.localeCompare(right.title);
};

export const getContentGraph = async (
  requestedFocusId?: string,
): Promise<ContentGraphNeighborhood | null> => {
  const graph = await getCachedContentGraph();
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const adjacency = buildAdjacency(graph.edges);

  const focusId =
    requestedFocusId && nodeById.has(requestedFocusId)
      ? requestedFocusId
      : graph.focusOptions[0]?.id;

  if (!focusId) {
    return null;
  }

  const distances = new Map<string, number>([[focusId, 0]]);
  const queue = [focusId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) {
      continue;
    }
    const currentDistance = distances.get(currentId) ?? 0;
    Array.from(adjacency.get(currentId) ?? []).forEach((neighborId) => {
      if (distances.has(neighborId)) {
        return;
      }
      distances.set(neighborId, currentDistance + 1);
      queue.push(neighborId);
    });
  }

  const nodes = graph.nodes
    .map((node) => ({
      ...node,
      distance: distances.get(node.id) ?? null,
    }))
    .sort((left, right) => {
      const leftDistance = left.distance ?? Number.MAX_SAFE_INTEGER;
      const rightDistance = right.distance ?? Number.MAX_SAFE_INTEGER;
      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }
      return compareGraphNodes(left, right);
    });

  const connectedTopics = graph.edges
    .filter((edge) => edge.source === focusId || edge.target === focusId)
    .flatMap((edge) => edge.labels ?? [])
    .filter((label, index, labels) => labels.indexOf(label) === index)
    .sort((left, right) => left.localeCompare(right));

  return {
    focusId,
    nodes,
    edges: graph.edges,
    focusOptions: graph.focusOptions,
    connectedTopics,
    stats: graph.stats,
  };
};
