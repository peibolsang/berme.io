import { unstable_cache } from "next/cache";
import { config, getGithubToken } from "./config";
import { parseFrontmatter } from "./frontmatter";
import { slugify } from "./slugify";
import { getGithubUser } from "./github";
import type { Post } from "../types";
import type { GitHubIssue } from "./github";

const NOW_LABEL = "NOW";

const githubFetch = async (url: string) => {
  const token = getGithubToken();
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }

  return response.json();
};

const asDate = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }
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

const fetchNowPost = async (): Promise<Post | null> => {
  const { owner, repo } = config.github;
  if (!owner || !repo) {
    return null;
  }

  const url =
    `https://api.github.com/repos/${owner}/${repo}/issues` +
    `?state=open&labels=${encodeURIComponent(NOW_LABEL)}` +
    `&per_page=1&sort=updated&direction=desc`;

  const batch = (await githubFetch(url)) as GitHubIssue[];
  const issue = batch.find((entry) => !entry.pull_request);
  if (!issue) {
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
  const labels = issue.labels
    .map((label) => (label.name ?? "").trim())
    .filter(Boolean);
  const author = await resolveAuthor(issue);

  return {
    id: String(issue.id),
    number: issue.number,
    title: issue.title,
    slug: slug || "now",
    publishedAt: publishedAtDate.toISOString(),
    updatedAt: issue.updated_at,
    author,
    excerpt: data.excerpt,
    image: data.image,
    pinned: false,
    body,
    labels,
    url: "/now",
  };
};

export const getNowPost = unstable_cache(fetchNowPost, ["now"], {
  revalidate: config.revalidateSeconds,
  tags: ["now"],
});
