import { unstable_cache } from "next/cache";
import {
  getAllBlogIssues,
  getGithubUser,
  getIssuesWithParents,
  getPinnedIssueNumbers,
} from "./github";
import { parseFrontmatter } from "./frontmatter";
import { slugify } from "./slugify";
import { config } from "./config";
import type { Post } from "../types";
import type { GitHubIssue } from "./github";

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

const resolveAuthor = async (
  issue: GitHubIssue,
): Promise<Post["author"]> => {
  const login = issue.user?.login?.trim();
  if (!login) {
    return undefined;
  }

  const profile = await getGithubUser(login);
  const name = profile?.name?.trim() || login;
  const avatarUrl = profile?.avatar_url ?? issue.user?.avatar_url ?? null;
  const url =
    profile?.html_url ?? issue.user?.html_url ?? `https://github.com/${login}`;

  return {
    name,
    login,
    avatarUrl,
    url,
  };
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
  const postEntries: Array<Post | null> = await Promise.all(
    issues.map(async (issue) => {
      if (parentNumbers.has(issue.number)) {
        return null;
      }
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

      const author = await resolveAuthor(issue);

      return {
        id: String(issue.id),
        number: issue.number,
        title: issue.title,
        slug,
        publishedAt: publishedAtDate.toISOString(),
        updatedAt: issue.updated_at,
        author,
        excerpt: data.excerpt,
        image: data.image,
        pinned: pinnedNumbers.has(issue.number),
        seriesTitle: childToParent.get(issue.number)?.title,
        body,
        labels,
        url,
      };
    }),
  );

  const posts = postEntries.filter((post): post is Post => Boolean(post));

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
