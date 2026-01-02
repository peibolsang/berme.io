import { fetchAllBlogIssues } from "./github";
import { parseFrontmatter } from "./frontmatter";
import { slugify } from "./slugify";
import { config } from "./config";
import type { Post } from "../types";

type CacheState = {
  posts: Post[];
  updatedAt: number;
};

let cache: CacheState | null = null;

const buildUrl = (date: Date, slug: string) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `/${year}/${month}/${day}/${slug}`;
};

const asDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getAllPosts = async (): Promise<Post[]> => {
  const now = Date.now();
  if (cache && now - cache.updatedAt < config.revalidateSeconds * 1000) {
    return cache.posts;
  }

  try {
    const issues = await fetchAllBlogIssues();
    const posts = issues
      .map((issue) => {
        const { data, body } = parseFrontmatter(issue.body ?? "");
        if (data.draft) {
          return null;
        }

        const publishedAtRaw = data.publishedAt ?? issue.created_at;
        const publishedAtDate = asDate(publishedAtRaw);
        if (!publishedAtDate) {
          return null;
        }

        const slug = data.slug ? slugify(data.slug) : slugify(issue.title);
        const url = buildUrl(publishedAtDate, slug);
        const labels = issue.labels
          .map((label) => (label.name ?? "").trim())
          .filter(Boolean);

        return {
          id: String(issue.id),
          number: issue.number,
          title: issue.title,
          slug,
          publishedAt: publishedAtDate.toISOString(),
          updatedAt: issue.updated_at,
          excerpt: data.excerpt,
          body,
          labels,
          url,
        } satisfies Post;
      })
      .filter((post): post is Post => Boolean(post))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

    cache = {
      posts,
      updatedAt: now,
    };

    return posts;
  } catch (error) {
    if (cache) {
      return cache.posts;
    }
    throw error;
  }
};

export const getPostByPermalink = async (
  year: string,
  month: string,
  day: string,
  slug: string,
): Promise<Post | null> => {
  const posts = await getAllPosts();
  return (
    posts.find((post) => {
      const date = new Date(post.publishedAt);
      const y = String(date.getUTCFullYear());
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");
      return y === year && m === month && d === day && post.slug === slug;
    }) ?? null
  );
};
