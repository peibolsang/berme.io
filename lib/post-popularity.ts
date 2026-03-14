import type { Post } from "../types";
import { getRedisClient } from "./redis";

const POPULAR_POST_LIMIT = 3;
const POST_READS_RANKING_KEY = "post:reads:ranking";
const POST_READS_KEY_PREFIX = "post:reads:";

const numberFormatter = new Intl.NumberFormat("en-US");

const reportPopularityError = (message: string, error: unknown) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(message, error);
  }
};

const getPostReadsKey = (postUrl: string) => `${POST_READS_KEY_PREFIX}${postUrl}`;

const toPostPopularity = (readCount: number, zeroBasedRank: number | null) => {
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

export const formatReadCount = (readCount: number) =>
  `${numberFormatter.format(readCount)} reads`;

export const ensurePostReadTracking = async (postUrl: string) => {
  if (!postUrl.startsWith("/")) {
    return false;
  }

  const client = await getRedisClient();
  if (!client) {
    return false;
  }

  const member = postUrl;

  try {
    await client.multi()
      .setNX(getPostReadsKey(postUrl), "0")
      .zAdd(
        POST_READS_RANKING_KEY,
        { score: 0, value: member },
        { condition: "NX" },
      )
      .exec();
  } catch (error) {
    reportPopularityError("Unable to ensure post read tracking", error);
    return false;
  }

  return true;
};

export const ensurePostsReadTracking = async (posts: Post[]) => {
  if (posts.length === 0) {
    return false;
  }

  const client = await getRedisClient();
  if (!client) {
    return false;
  }

  const transaction = client.multi();

  posts.forEach((post) => {
    const member = post.url;
    transaction.setNX(getPostReadsKey(post.url), "0");
    transaction.zAdd(
      POST_READS_RANKING_KEY,
      { score: 0, value: member },
      { condition: "NX" },
    );
  });

  try {
    await transaction.exec();
  } catch (error) {
    reportPopularityError("Unable to ensure post read tracking for all posts", error);
    return false;
  }

  return true;
};

export const trackPostRead = async (postUrl: string) => {
  if (!postUrl.startsWith("/")) {
    return null;
  }

  const client = await getRedisClient();
  if (!client) {
    return null;
  }

  const member = postUrl;
  const counterKey = getPostReadsKey(postUrl);

  try {
    const [readCount, , rank] = await client.multi()
      .incr(counterKey)
      .zIncrBy(POST_READS_RANKING_KEY, 1, member)
      .zRevRank(POST_READS_RANKING_KEY, member)
      .execTyped();

    return toPostPopularity(readCount, rank);
  } catch (error) {
    reportPopularityError("Unable to track post read", error);
    return null;
  }
};

export const getPopularPosts = async (posts: Post[], limit = POPULAR_POST_LIMIT) => {
  if (posts.length === 0 || limit <= 0) {
    return [];
  }

  const client = await getRedisClient();
  if (!client) {
    return [];
  }

  try {
    await ensurePostsReadTracking(posts);

    const rankings = await client.zRangeWithScores(POST_READS_RANKING_KEY, 0, -1, {
      REV: true,
    });

    const postsByUrl = new Map<string, Post>(posts.map((post) => [post.url, post]));

    return rankings
      .map((entry, index) => {
        const postUrl = String(entry.value);
        if (!postUrl.startsWith("/") || entry.score <= 0) {
          return null;
        }

        const post = postsByUrl.get(postUrl);
        if (!post) {
          return null;
        }

        return withPopularity(post, entry.score, index);
      })
      .filter((post): post is Post => post !== null)
      .sort((left, right) => {
        const readDifference = (right.readCount ?? 0) - (left.readCount ?? 0);
        if (readDifference !== 0) {
          return readDifference;
        }

        const leftPublished = new Date(left.publishedAt).getTime();
        const rightPublished = new Date(right.publishedAt).getTime();
        if (leftPublished !== rightPublished) {
          return rightPublished - leftPublished;
        }

        return left.title.localeCompare(right.title);
      })
      .slice(0, limit)
      .map((post, index) => ({
        ...post,
        popularRank: index + 1,
        isPopular: true,
      }));
  } catch (error) {
    reportPopularityError("Unable to fetch popular posts", error);
    return [];
  }
};
