import { config, getGithubToken } from "./config";

export type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  created_at: string;
  updated_at: string;
  labels: {
    name?: string;
  }[];
  pull_request?: Record<string, unknown>;
};

export type GitHubComment = {
  id: number;
  body: string | null;
  created_at: string;
  user?: {
    login?: string;
  };
};

const githubFetch = async (url: string) => {
  const token = getGithubToken();
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: {
      revalidate: config.revalidateSeconds,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }

  return response.json();
};

export const fetchAllBlogIssues = async (): Promise<GitHubIssue[]> => {
  const issues: GitHubIssue[] = [];
  const { owner, repo } = config.github;
  const label = "published";
  let page = 1;

  while (true) {
    const url =
      `https://api.github.com/repos/${owner}/${repo}/issues` +
      `?state=all&labels=${encodeURIComponent(label)}&per_page=100&page=${page}`;

    const batch = (await githubFetch(url)) as GitHubIssue[];
    const filtered = batch.filter((issue) => !issue.pull_request);
    issues.push(...filtered);

    if (batch.length < 100) {
      break;
    }
    page += 1;
  }

  return issues;
};

export const fetchIssueComments = async (
  issueNumber: number,
): Promise<GitHubComment[]> => {
  const comments: GitHubComment[] = [];
  const { owner, repo } = config.github;
  let page = 1;

  while (true) {
    const url =
      `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments` +
      `?per_page=100&page=${page}`;

    const batch = (await githubFetch(url)) as GitHubComment[];
    comments.push(...batch);

    if (batch.length < 100) {
      break;
    }
    page += 1;
  }

  return comments;
};
