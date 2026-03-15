import type { Post } from "../types";
import { config } from "./config";
import {
  getPostPopularityCatalog,
  hasPublishedPostUrl,
  type PostPopularityCatalogEntry,
} from "./posts";
import { getRedisClient } from "./redis";

const POPULAR_POST_LIMIT = 3;
const POPULARITY_NAMESPACE_PREFIX = `site:${config.popularity.namespace}:post:reads`;
const POST_READS_RANKING_KEY = `${POPULARITY_NAMESPACE_PREFIX}:ranking`;
const POST_READS_KEY_PREFIX = `${POPULARITY_NAMESPACE_PREFIX}:`;

const numberFormatter = new Intl.NumberFormat("en-US");

type PopularityCatalog = {
  posts: PostPopularityCatalogEntry[];
  byUrl: Record<string, PostPopularityCatalogEntry>;
};

type RankedTrackedPost = PostPopularityCatalogEntry & {
  readCount: number;
};

type PostPopularity = {
  readCount: number;
  popularRank: number | null;
  isPopular: boolean;
};

const reportPopularityError = (message: string, error: unknown) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(message, error);
  }
};

const getPostReadsKey = (postUrl: string) => `${POST_READS_KEY_PREFIX}${postUrl}`;

const isValidPostUrl = (postUrl: string) =>
  postUrl.startsWith("/") &&
  !postUrl.includes("..") &&
  !postUrl.includes("?") &&
  !postUrl.includes("#");

const normalizeReadCount = (value: number | string | null | undefined) => {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? "0"), 10);

  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 0;
};

const compareRankedPosts = (left: RankedTrackedPost, right: RankedTrackedPost) => {
  const readDifference = right.readCount - left.readCount;
  if (readDifference !== 0) {
    return readDifference;
  }

  const leftPublished = new Date(left.publishedAt).getTime();
  const rightPublished = new Date(right.publishedAt).getTime();
  if (leftPublished !== rightPublished) {
    return rightPublished - leftPublished;
  }

  const titleComparison = left.title.localeCompare(right.title);
  if (titleComparison !== 0) {
    return titleComparison;
  }

  return left.url.localeCompare(right.url);
};

const toPostPopularity = (
  readCount: number,
  zeroBasedRank: number | null,
): PostPopularity => {
  const popularRank =
    zeroBasedRank !== null && zeroBasedRank < POPULAR_POST_LIMIT
      ? zeroBasedRank + 1
      : null;

  return {
    readCount,
    popularRank,
    isPopular: popularRank !== null,
  };
};

const withPopularity = (
  post: Post,
  readCount: number,
  zeroBasedRank: number | null,
): Post => ({
  ...post,
  ...toPostPopularity(readCount, zeroBasedRank),
});

const getEffectiveStoredCount = async (postUrl: string) => {
  const client = await getRedisClient();
  if (!client || !isValidPostUrl(postUrl)) {
    return 0;
  }

  const [counterValue, rankingScore] = await Promise.all([
    client.get(getPostReadsKey(postUrl)),
    client.zScore(POST_READS_RANKING_KEY, postUrl),
  ]);

  return Math.max(
    normalizeReadCount(counterValue),
    normalizeReadCount(rankingScore),
  );
};

const loadRankedPosts = async (
  trackedPosts: PostPopularityCatalogEntry[],
): Promise<RankedTrackedPost[]> => {
  const client = await getRedisClient();
  if (!client || trackedPosts.length === 0) {
    return [];
  }

  const readCountValues = await client.mGet(
    trackedPosts.map((post) => getPostReadsKey(post.url)),
  );

  return trackedPosts
    .map((post, index) => ({
      ...post,
      readCount: normalizeReadCount(readCountValues[index]),
    }))
    .filter((post) => post.readCount > 0)
    .sort(compareRankedPosts);
};

const resolvePopularitySnapshot = async (
  postUrl: string,
  trackedPosts: PostPopularityCatalogEntry[],
  readCountOverride?: number,
) => {
  const rankedPosts = await loadRankedPosts(trackedPosts);
  const zeroBasedRank = rankedPosts.findIndex((post) => post.url === postUrl);
  const readCount =
    typeof readCountOverride === "number"
      ? normalizeReadCount(readCountOverride)
      : rankedPosts.find((post) => post.url === postUrl)?.readCount ??
        (await getEffectiveStoredCount(postUrl));

  return toPostPopularity(readCount, zeroBasedRank >= 0 ? zeroBasedRank : null);
};

export const getPopularityCatalog = async (): Promise<PopularityCatalog> => {
  const posts = await getPostPopularityCatalog();
  return {
    posts,
    byUrl: Object.fromEntries(posts.map((post) => [post.url, post])),
  };
};

export const formatReadCount = (readCount: number) =>
  `${numberFormatter.format(readCount)} reads`;

export const popularityNamespace = config.popularity.namespace;

export const isKnownPostUrl = hasPublishedPostUrl;

export const ensurePostReadTracking = async (postUrl: string) => {
  if (!isValidPostUrl(postUrl)) {
    return false;
  }

  const client = await getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client
      .multi()
      .setNX(getPostReadsKey(postUrl), "0")
      .zAdd(
        POST_READS_RANKING_KEY,
        { score: 0, value: postUrl },
        { condition: "NX" },
      )
      .exec();
  } catch (error) {
    reportPopularityError("Unable to ensure post read tracking", error);
    return false;
  }

  return true;
};

export const syncPostReadTracking = async ({
  currentUrl,
  previousUrl,
}: {
  currentUrl?: string | null;
  previousUrl?: string | null;
}) => {
  const nextUrl = currentUrl && isValidPostUrl(currentUrl) ? currentUrl : null;
  const oldUrl =
    previousUrl && isValidPostUrl(previousUrl) && previousUrl !== nextUrl
      ? previousUrl
      : null;

  if (!nextUrl && !oldUrl) {
    return false;
  }

  const client = await getRedisClient();
  if (!client) {
    return false;
  }

  if (!nextUrl && oldUrl) {
    try {
      await client
        .multi()
        .del(getPostReadsKey(oldUrl))
        .zRem(POST_READS_RANKING_KEY, oldUrl)
        .exec();
    } catch (error) {
      reportPopularityError("Unable to remove stale post read tracking", error);
      return false;
    }

    return true;
  }

  if (!oldUrl) {
    return ensurePostReadTracking(nextUrl!);
  }

  const activeUrl = nextUrl!;
  const previousTrackedUrl = oldUrl;

  try {
    const [currentCount, previousCount] = await Promise.all([
      getEffectiveStoredCount(activeUrl),
      getEffectiveStoredCount(previousTrackedUrl),
    ]);
    const mergedCount = currentCount + previousCount;

    await client
      .multi()
      .set(getPostReadsKey(activeUrl), String(mergedCount))
      .zAdd(POST_READS_RANKING_KEY, { score: mergedCount, value: activeUrl })
      .del(getPostReadsKey(previousTrackedUrl))
      .zRem(POST_READS_RANKING_KEY, previousTrackedUrl)
      .exec();
  } catch (error) {
    reportPopularityError("Unable to sync post read tracking", error);
    return false;
  }

  return true;
};

export const getPostPopularitySnapshot = async (
  postUrl: string,
  trackedPosts?: PostPopularityCatalogEntry[],
) => {
  if (!isValidPostUrl(postUrl)) {
    return null;
  }

  try {
    return await resolvePopularitySnapshot(
      postUrl,
      trackedPosts ?? (await getPostPopularityCatalog()),
    );
  } catch (error) {
    reportPopularityError("Unable to fetch post popularity snapshot", error);
    return null;
  }
};

export const trackPostRead = async (
  postUrl: string,
  trackedPosts?: PostPopularityCatalogEntry[],
) => {
  if (!isValidPostUrl(postUrl)) {
    return null;
  }

  const client = await getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const resolvedTrackedPosts = trackedPosts ?? (await getPostPopularityCatalog());

    if (config.localDev) {
      return await resolvePopularitySnapshot(postUrl, resolvedTrackedPosts);
    }

    const [readCount] = await client
      .multi()
      .incr(getPostReadsKey(postUrl))
      .zIncrBy(POST_READS_RANKING_KEY, 1, postUrl)
      .execTyped();

    return await resolvePopularitySnapshot(postUrl, resolvedTrackedPosts, readCount);
  } catch (error) {
    reportPopularityError("Unable to track post read", error);
    return null;
  }
};

export const getPopularPosts = async (posts: Post[], limit = POPULAR_POST_LIMIT) => {
  if (posts.length === 0 || limit <= 0) {
    return [];
  }

  try {
    const rankedPosts = await loadRankedPosts(
      posts.map(({ number, title, publishedAt, url }) => ({
        number,
        title,
        publishedAt,
        url,
      })),
    );
    const postsByUrl = new Map<string, Post>(posts.map((post) => [post.url, post]));

    return rankedPosts
      .slice(0, limit)
      .map((rankedPost, index) => {
        const post = postsByUrl.get(rankedPost.url);
        if (!post) {
          return null;
        }

        return withPopularity(post, rankedPost.readCount, index);
      })
      .filter((post): post is Post => post !== null);
  } catch (error) {
    reportPopularityError("Unable to fetch popular posts", error);
    return [];
  }
};
