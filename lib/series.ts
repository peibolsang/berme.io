import { unstable_cache } from "next/cache";
import { getIssuesWithParents } from "./github";
import { parseFrontmatter } from "./frontmatter";
import { getAllPosts } from "./posts";
import { config } from "./config";
import type { Post, Series } from "../types";

const buildDescription = (body: string) => {
  const compact = body.replace(/\s+/g, " ").trim();
  if (!compact) {
    return "";
  }
  if (compact.length <= 180) {
    return compact;
  }
  return `${compact.slice(0, 177)}...`;
};

const getLatestTimestamp = (timestamps: string[]) => {
  const valid = timestamps
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()));
  if (valid.length === 0) {
    return "";
  }
  const latest = valid.sort((a, b) => b.getTime() - a.getTime())[0];
  return latest.toISOString();
};

const fetchSeries = async (): Promise<Series[]> => {
  const [issues, posts] = await Promise.all([getIssuesWithParents(), getAllPosts()]);
  const postsByNumber = new Map<number, Post>(posts.map((post) => [post.number, post]));
  const seriesByNumber = new Map<number, Series>();

  issues.forEach((issue) => {
    const parent = issue.parent;
    if (!parent) {
      return;
    }
    if (!seriesByNumber.has(parent.number)) {
      const { body } = parseFrontmatter(parent.body ?? "");
      seriesByNumber.set(parent.number, {
        number: parent.number,
        title: parent.title,
        description: buildDescription(body),
        updatedAt: parent.updatedAt,
        posts: [],
      });
    }
    const series = seriesByNumber.get(parent.number);
    const childPost = postsByNumber.get(issue.number);
    if (series && childPost) {
      series.posts.push(childPost);
    }
  });

  const series = Array.from(seriesByNumber.values()).map((entry) => {
    const updatedAt = getLatestTimestamp([
      entry.updatedAt,
      ...entry.posts.map((post) => post.updatedAt),
    ]);
    const postsSorted = [...entry.posts].sort((a, b) =>
      a.publishedAt.localeCompare(b.publishedAt),
    );
    return {
      ...entry,
      updatedAt,
      posts: postsSorted,
    };
  });

  series.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return series;
};

export const getAllSeries = unstable_cache(fetchSeries, ["series"], {
  revalidate: config.revalidateSeconds,
  tags: ["series"],
});
