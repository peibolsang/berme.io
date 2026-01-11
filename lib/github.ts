import { unstable_cache } from "next/cache";
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
  user?: {
    login?: string;
    avatar_url?: string;
    html_url?: string;
  };
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

export type GitHubUserProfile = {
  login: string;
  name: string | null;
  avatar_url: string | null;
  html_url: string | null;
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
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }

  return response.json();
};

const fetchGithubUser = async (
  login: string,
): Promise<GitHubUserProfile | null> => {
  if (!login) {
    return null;
  }
  try {
    const url = `https://api.github.com/users/${login}`;
    const user = (await githubFetch(url)) as GitHubUserProfile;
    return user ?? null;
  } catch {
    return null;
  }
};

export const getGithubUser = (login: string) =>
  unstable_cache(() => fetchGithubUser(login), ["github-user", login], {
    revalidate: config.revalidateSeconds,
    tags: ["github-user"],
  })();

const githubGraphqlFetch = async (
  query: string,
  variables: Record<string, string | null>,
) => {
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
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub GraphQL API error ${response.status}: ${text}`);
  }

  return response.json();
};

export type GitHubIssueParent = {
  number: number;
  title: string;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  author?: {
    login?: string | null;
    avatarUrl?: string | null;
    url?: string | null;
  } | null;
};

export type GitHubIssueWithParent = {
  number: number;
  title: string;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  author?: {
    login?: string | null;
    avatarUrl?: string | null;
    url?: string | null;
  } | null;
  parent?: GitHubIssueParent | null;
};

let lastIssuesWithParents: GitHubIssueWithParent[] | null = null;

type IssuesWithParentsResponse = {
  data?: {
    repository?: {
      issues?: {
        nodes?: (GitHubIssueWithParent | null)[];
        pageInfo?: {
          hasNextPage?: boolean | null;
          endCursor?: string | null;
        };
      };
    };
  };
  errors?: { message: string }[];
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

export const fetchIssuesWithParents = async (): Promise<GitHubIssueWithParent[]> => {
  const { owner, repo } = config.github;
  const issues: GitHubIssueWithParent[] = [];
  let cursor: string | null = null;

  const query = `
    query IssuesWithParents($owner: String!, $repo: String!, $cursor: String) {
      repository(owner: $owner, name: $repo) {
        issues(
          first: 50
          after: $cursor
          labels: ["published"]
          states: OPEN
          orderBy: { field: UPDATED_AT, direction: DESC }
        ) {
          nodes {
            number
            title
            body
            createdAt
            updatedAt
            author {
              login
              avatarUrl
              url
            }
            parent {
              number
              title
              body
              createdAt
              updatedAt
              author {
                login
                avatarUrl
                url
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;

  try {
    while (true) {
      const result = (await githubGraphqlFetch(query, {
        owner,
        repo,
        cursor,
      })) as IssuesWithParentsResponse | null;
      if (!result) {
        return lastIssuesWithParents ?? [];
      }
      const nodes = result?.data?.repository?.issues?.nodes ?? [];
      nodes.forEach((node) => {
        if (node) {
          issues.push(node);
        }
      });
      const pageInfo = result?.data?.repository?.issues?.pageInfo;
      if (!pageInfo?.hasNextPage || !pageInfo?.endCursor) {
        break;
      }
      cursor = pageInfo.endCursor;
    }
  } catch {
    return lastIssuesWithParents ?? [];
  }

  lastIssuesWithParents = issues;
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

export const getAllBlogIssues = unstable_cache(fetchAllBlogIssues, ["github-issues"], {
  revalidate: config.revalidateSeconds,
  tags: ["github-issues"],
});

export const getPinnedIssueNumbers = unstable_cache(
  fetchPinnedIssueNumbers,
  ["github-pinned-issues"],
  {
    revalidate: config.revalidateSeconds,
    tags: ["github-pinned-issues"],
  },
);

export const getIssuesWithParents = unstable_cache(
  fetchIssuesWithParents,
  ["github-issues-with-parents"],
  {
    revalidate: config.revalidateSeconds,
    tags: ["github-issues-with-parents"],
  },
);
