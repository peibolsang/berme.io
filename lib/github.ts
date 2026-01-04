import { config, getGithubToken } from "./config";

export type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
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

type PinnedIssueResponse = {
  data?: {
    repository?: {
      pinnedIssues?: {
        nodes?: { issue?: { number?: number | null } | null }[];
      };
    };
  };
  errors?: { message: string }[];
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

const githubGraphqlFetch = async (query: string, variables: Record<string, string>) => {
  const token = getGithubToken();
  if (!token) {
    return null;
  }

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ query, variables }),
    next: {
      revalidate: config.revalidateSeconds,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub GraphQL API error ${response.status}: ${text}`);
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
      `?state=open&labels=${encodeURIComponent(label)}&per_page=100&page=${page}`;

    const batch = (await githubFetch(url)) as GitHubIssue[];
    const filtered = batch.filter(
      (issue) => !issue.pull_request && issue.state === "open",
    );
    issues.push(...filtered);

    if (batch.length < 100) {
      break;
    }
    page += 1;
  }

  return issues;
};

export const fetchPinnedIssueNumbers = async (): Promise<Set<number>> => {
  const { owner, repo } = config.github;
  if (!owner || !repo) {
    return new Set<number>();
  }

  const query = `
    query PinnedIssues($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        pinnedIssues(first: 3) {
          nodes {
            issue {
              number
            }
          }
        }
      }
    }
  `;

  try {
    const result = (await githubGraphqlFetch(query, { owner, repo })) as
      | PinnedIssueResponse
      | null;
    const nodes = result?.data?.repository?.pinnedIssues?.nodes ?? [];
    const numbers = nodes
      .map((node) => node?.issue?.number)
      .filter((value): value is number => typeof value === "number");
    return new Set(numbers);
  } catch {
    return new Set<number>();
  }
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
