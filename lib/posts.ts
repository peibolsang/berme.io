import { unstable_cache } from "next/cache";
import { getAllBlogIssues, getIssuesWithParents, getPinnedIssueNumbers } from "./github";
import { parseFrontmatter } from "./frontmatter";
import { slugify } from "./slugify";
import { config } from "./config";
import type { Post } from "../types";

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

const fetchPosts = async (): Promise<Post[]> => {
  const [issues, pinnedNumbers, issuesWithParents] = await Promise.all([
    getAllBlogIssues(),
    getPinnedIssueNumbers(),
    getIssuesWithParents(),
  ]);
  const parentNumbers = new Set(
    issuesWithParents
      .map((issue) => issue.parent?.number)
      .filter((value): value is number => typeof value === "number"),
  );
  const childToParent = new Map<number, { number: number; title: string }>();
  const parentToChildren = new Map<number, number[]>();
  const parentTitles = new Map<number, string>();
  issuesWithParents.forEach((issue) => {
    const parent = issue.parent;
    if (!parent?.title) {
      return;
    }
    childToParent.set(issue.number, { number: parent.number, title: parent.title });
    parentTitles.set(parent.number, parent.title);
    const existing = parentToChildren.get(parent.number);
    if (existing) {
      existing.push(issue.number);
    } else {
      parentToChildren.set(parent.number, [issue.number]);
    }
  });
  const posts: Post[] = [];

  issues.forEach((issue) => {
    if (parentNumbers.has(issue.number)) {
      return;
    }
    const { data, body } = parseFrontmatter(issue.body ?? "");
    if (data.draft) {
      return;
    }

    const publishedAtRaw = data.publishedAt ?? issue.created_at;
    const publishedAtDate = asDate(publishedAtRaw);
    if (!publishedAtDate) {
      return;
    }

    const slug = data.slug ? slugify(data.slug) : slugify(issue.title);
    const url = buildUrl(publishedAtDate, slug);
    const labels = issue.labels
      .map((label) => (label.name ?? "").trim())
      .filter(Boolean);

    posts.push({
      id: String(issue.id),
      number: issue.number,
      title: issue.title,
      slug,
      publishedAt: publishedAtDate.toISOString(),
      updatedAt: issue.updated_at,
      excerpt: data.excerpt,
      image: data.image,
      pinned: pinnedNumbers.has(issue.number),
      seriesTitle: childToParent.get(issue.number)?.title,
      body,
      labels,
      url,
    });
  });

  const postsByNumber = new Map(posts.map((post) => [post.number, post]));
  parentToChildren.forEach((childNumbers, parentNumber) => {
    const parentTitle = parentTitles.get(parentNumber);
    if (!parentTitle) {
      return;
    }
    const seriesPosts = childNumbers
      .map((number) => postsByNumber.get(number))
      .filter((post): post is Post => Boolean(post))
      .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
    if (seriesPosts.length === 0) {
      return;
    }
    seriesPosts.forEach((post, index) => {
      post.seriesTitle = parentTitle;
      post.seriesPart = index + 1;
      post.seriesTotal = seriesPosts.length;
    });
  });

  posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return posts;
};

export const getAllPosts = unstable_cache(fetchPosts, ["posts"], {
  revalidate: config.revalidateSeconds,
  tags: ["posts"],
});

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
