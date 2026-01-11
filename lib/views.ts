import { unstable_cache } from "next/cache";
import { getGithubUser, getIssuesWithParents } from "./github";
import { parseFrontmatter } from "./frontmatter";
import { getAllPosts } from "./posts";
import { config } from "./config";
import type { Post, View } from "../types";
import type { GitHubIssueParent } from "./github";

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

const buildViewUrl = (number: number) => `/views/${number}`;

const resolveViewAuthor = async (
  parent: GitHubIssueParent,
): Promise<View["author"]> => {
  const login = parent.author?.login?.trim();
  if (!login) {
    return undefined;
  }

  const profile = await getGithubUser(login);
  const name = profile?.name?.trim() || login;
  const avatarUrl = profile?.avatar_url ?? parent.author?.avatarUrl ?? null;
  const url = profile?.html_url ?? parent.author?.url ?? `https://github.com/${login}`;

  return {
    name,
    login,
    avatarUrl,
    url,
  };
};

const fetchViews = async (): Promise<View[]> => {
  const [issues, posts] = await Promise.all([getIssuesWithParents(), getAllPosts()]);
  const postsByNumber = new Map<number, Post>(posts.map((post) => [post.number, post]));
  const viewsByNumber = new Map<number, View>();

  for (const issue of issues) {
    const parent = issue.parent;
    if (!parent) {
      continue;
    }
    if (!viewsByNumber.has(parent.number)) {
      const { body } = parseFrontmatter(parent.body ?? "");
      const trimmedBody = body.trim();
      const description = buildDescription(body);
      const author = await resolveViewAuthor(parent);
      viewsByNumber.set(parent.number, {
        number: parent.number,
        title: parent.title,
        description: description ? description : undefined,
        body: trimmedBody ? body : undefined,
        updatedAt: parent.updatedAt,
        author,
        url: buildViewUrl(parent.number),
        posts: [],
      });
    }
    const view = viewsByNumber.get(parent.number);
    const childPost = postsByNumber.get(issue.number);
    if (view && childPost) {
      view.posts.push(childPost);
    }
  }

  const views = Array.from(viewsByNumber.values()).map((entry) => {
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

  views.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return views;
};

export const getAllViews = unstable_cache(fetchViews, ["views"], {
  revalidate: config.revalidateSeconds,
  tags: ["views", "github-issues-with-parents", "posts"],
});

export const getViewByNumber = async (number: string): Promise<View | null> => {
  const views = await getAllViews();
  return views.find((entry) => String(entry.number) === number) ?? null;
};
