import { unstable_cache } from "next/cache";
import { getGithubUser, getIssuesWithParents } from "./github";
import { parseFrontmatter } from "./frontmatter";
import { getAllPosts } from "./posts";
import { config } from "./config";
import type { Post, Series } from "../types";
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

const buildSeriesUrl = (number: number) => `/series/${number}`;

const resolveSeriesAuthor = async (
  parent: GitHubIssueParent,
): Promise<Series["author"]> => {
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

const fetchSeries = async (): Promise<Series[]> => {
  const [issues, posts] = await Promise.all([getIssuesWithParents(), getAllPosts()]);
  const postsByNumber = new Map<number, Post>(posts.map((post) => [post.number, post]));
  const seriesByNumber = new Map<number, Series>();

  for (const issue of issues) {
    const parent = issue.parent;
    if (!parent) {
      continue;
    }
    if (!seriesByNumber.has(parent.number)) {
      const { body } = parseFrontmatter(parent.body ?? "");
      const trimmedBody = body.trim();
      const description = buildDescription(body);
      const author = await resolveSeriesAuthor(parent);
      seriesByNumber.set(parent.number, {
        number: parent.number,
        title: parent.title,
        description: description ? description : undefined,
        body: trimmedBody ? body : undefined,
        updatedAt: parent.updatedAt,
        author,
        url: buildSeriesUrl(parent.number),
        posts: [],
      });
    }
    const series = seriesByNumber.get(parent.number);
    const childPost = postsByNumber.get(issue.number);
    if (series && childPost) {
      series.posts.push(childPost);
    }
  }

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

export const getSeriesByNumber = async (number: string): Promise<Series | null> => {
  const series = await getAllSeries();
  return series.find((entry) => String(entry.number) === number) ?? null;
};
