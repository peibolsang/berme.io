import { createClient } from "redis";
import { config } from "../lib/config";
import { parseFrontmatter } from "../lib/frontmatter";
import {
  fetchAllBlogIssues,
  fetchIssuesWithParents,
  type GitHubIssue,
} from "../lib/github";
import { slugify } from "../lib/slugify";

type CanonicalPost = {
  number: number;
  title: string;
  slug: string;
  url: string;
};

type RankedEntry = {
  value: string;
  score: number;
};

const POPULARITY_NAMESPACE_PREFIX = `site:${config.popularity.namespace}:post:reads`;
const POST_READS_RANKING_KEY = `${POPULARITY_NAMESPACE_PREFIX}:ranking`;
const POST_READS_KEY_PREFIX = `${POPULARITY_NAMESPACE_PREFIX}:`;

const isWriteMode = process.argv.includes("--write");

const buildUrl = (date: Date, slug: string) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `/${year}/${month}/${day}/${slug}`;
};

const hasConferenceLabel = (labels: Array<{ name?: string }>) =>
  labels.some(
    (label) => String(label.name ?? "").trim().toLowerCase() === "conference",
  );

const asDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getPostReadsKey = (postUrl: string) => `${POST_READS_KEY_PREFIX}${postUrl}`;

const normalizeReadCount = (value: number | string | null | undefined) => {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? "0"), 10);

  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 0;
};

const getEffectiveStoredCount = async (
  client: ReturnType<typeof createClient>,
  postUrl: string,
) => {
  const [counterValue, rankingScore] = await Promise.all([
    client.get(getPostReadsKey(postUrl)),
    client.zScore(POST_READS_RANKING_KEY, postUrl),
  ]);

  return Math.max(
    normalizeReadCount(counterValue),
    normalizeReadCount(rankingScore),
  );
};

const getCanonicalPosts = async (): Promise<CanonicalPost[]> => {
  const [issues, issuesWithParents] = await Promise.all([
    fetchAllBlogIssues(),
    fetchIssuesWithParents(),
  ]);
  const parentNumbers = new Set(
    issuesWithParents
      .map((issue) => issue.parent?.number)
      .filter((value): value is number => typeof value === "number"),
  );

  return issues
    .filter((issue: GitHubIssue) => !hasConferenceLabel(issue.labels))
    .filter((issue: GitHubIssue) => !parentNumbers.has(issue.number))
    .map((issue: GitHubIssue) => {
      const { data } = parseFrontmatter(issue.body ?? "");
      if (data.draft) {
        return null;
      }

      const publishedAtRaw = String(data.publishedAt ?? issue.created_at ?? "");
      const publishedAt = asDate(publishedAtRaw);
      if (!publishedAt) {
        return null;
      }

      const slugSource = data.slug ? String(data.slug) : issue.title;
      const slug = slugify(slugSource);
      if (!slug) {
        return null;
      }

      return {
        number: issue.number,
        title: issue.title,
        slug,
        url: buildUrl(publishedAt, slug),
      };
    })
    .filter((post): post is CanonicalPost => post !== null);
};

const getSlugFromUrl = (url: string) => {
  const parts = url.split("/").filter(Boolean);
  return parts.at(-1) ?? null;
};

const main = async () => {
  if (!config.redis.url.trim()) {
    throw new Error("Missing REDIS_URL environment variable");
  }

  const canonicalPosts = await getCanonicalPosts();
  const canonicalUrls = new Set(canonicalPosts.map((post) => post.url));
  const canonicalPostsBySlug = new Map<string, CanonicalPost[]>();

  canonicalPosts.forEach((post) => {
    const existing = canonicalPostsBySlug.get(post.slug) ?? [];
    existing.push(post);
    canonicalPostsBySlug.set(post.slug, existing);
  });

  const client = createClient({ url: config.redis.url });
  await client.connect();

  try {
    const rankedEntries = (await client.zRangeWithScores(
      POST_READS_RANKING_KEY,
      0,
      -1,
    )) as RankedEntry[];

    const repairPlan = rankedEntries
      .filter((entry) => !canonicalUrls.has(entry.value))
      .map((entry) => {
        const slug = getSlugFromUrl(entry.value);
        const candidates = slug ? canonicalPostsBySlug.get(slug) ?? [] : [];
        if (candidates.length !== 1) {
          return null;
        }

        return {
          staleUrl: entry.value,
          canonicalUrl: candidates[0].url,
          title: candidates[0].title,
        };
      })
      .filter(
        (
          entry,
        ): entry is { staleUrl: string; canonicalUrl: string; title: string } =>
          entry !== null,
      );

    if (repairPlan.length === 0) {
      console.log(
        JSON.stringify(
          {
            mode: isWriteMode ? "write" : "dry-run",
            rankingKey: POST_READS_RANKING_KEY,
            repaired: [],
            message: "No stale post popularity entries matched a unique canonical slug.",
          },
          null,
          2,
        ),
      );
      return;
    }

    const repaired = [];

    for (const entry of repairPlan) {
      const staleCount = await getEffectiveStoredCount(client, entry.staleUrl);
      const canonicalCount = await getEffectiveStoredCount(client, entry.canonicalUrl);
      const mergedCount = staleCount + canonicalCount;

      if (isWriteMode) {
        await client
          .multi()
          .set(getPostReadsKey(entry.canonicalUrl), String(mergedCount))
          .zAdd(POST_READS_RANKING_KEY, {
            score: mergedCount,
            value: entry.canonicalUrl,
          })
          .del(getPostReadsKey(entry.staleUrl))
          .zRem(POST_READS_RANKING_KEY, entry.staleUrl)
          .exec();
      }

      repaired.push({
        title: entry.title,
        staleUrl: entry.staleUrl,
        canonicalUrl: entry.canonicalUrl,
        staleCount,
        canonicalCount,
        mergedCount,
      });
    }

    console.log(
      JSON.stringify(
        {
          mode: isWriteMode ? "write" : "dry-run",
          rankingKey: POST_READS_RANKING_KEY,
          repaired,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.quit();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
