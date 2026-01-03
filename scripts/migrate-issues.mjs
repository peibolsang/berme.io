#!/usr/bin/env node

const token = process.env.GITHUB_TOKEN;
const sourceRepo = process.env.SOURCE_REPO ?? "peibolsang/octotype";
const targetRepo = process.env.TARGET_REPO ?? "peibolsang/peibolsang";

if (!token) {
  console.error("Missing GITHUB_TOKEN in environment.");
  process.exit(1);
}

const [sourceOwner, sourceName] = sourceRepo.split("/");
const [targetOwner, targetName] = targetRepo.split("/");

if (!sourceOwner || !sourceName || !targetOwner || !targetName) {
  console.error("SOURCE_REPO and TARGET_REPO must be in owner/name format.");
  process.exit(1);
}

const githubFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }

  return response.json();
};

const paginate = async (url) => {
  const results = [];
  let page = 1;

  while (true) {
    const pageUrl = `${url}${url.includes("?") ? "&" : "?"}per_page=100&page=${page}`;
    const batch = await githubFetch(pageUrl);
    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }
    results.push(...batch);
    if (batch.length < 100) {
      break;
    }
    page += 1;
  }

  return results;
};

const ensureLabels = async (labels) => {
  const existing = await paginate(
    `https://api.github.com/repos/${targetOwner}/${targetName}/labels`
  );
  const existingSet = new Set(existing.map((label) => label.name));

  for (const label of labels) {
    if (existingSet.has(label.name)) {
      continue;
    }
    await githubFetch(
      `https://api.github.com/repos/${targetOwner}/${targetName}/labels`,
      {
        method: "POST",
        body: JSON.stringify({
          name: label.name,
          color: label.color ?? "ededed",
          description: label.description ?? "",
        }),
      }
    );
    existingSet.add(label.name);
  }
};

const ensureMilestones = async (milestones) => {
  const existing = await paginate(
    `https://api.github.com/repos/${targetOwner}/${targetName}/milestones?state=all`
  );
  const existingMap = new Map(existing.map((ms) => [ms.title, ms.number]));

  for (const milestone of milestones) {
    if (existingMap.has(milestone.title)) {
      continue;
    }
    const payload = {
      title: milestone.title,
      description: milestone.description ?? "",
      state: milestone.state,
    };
    if (milestone.due_on) {
      payload.due_on = milestone.due_on;
    }
    const created = await githubFetch(
      `https://api.github.com/repos/${targetOwner}/${targetName}/milestones`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    existingMap.set(created.title, created.number);
  }

  return existingMap;
};

const fetchCollaborators = async () => {
  const collaborators = await paginate(
    `https://api.github.com/repos/${targetOwner}/${targetName}/collaborators`
  );
  return new Set(collaborators.map((user) => user.login));
};

const formatIssueBody = (issue) => {
  const metadata = [
    `> Migrated from ${issue.html_url}`,
    `> Author: ${issue.user?.login ?? "unknown"}`,
    `> Created: ${issue.created_at}`,
    `> Updated: ${issue.updated_at}`,
  ].join("\n");

  return `${metadata}\n\n${issue.body ?? ""}`.trim();
};

const formatCommentBody = (comment) => {
  const metadata = [
    `> Original comment by ${comment.user?.login ?? "unknown"}`,
    `> Created: ${comment.created_at}`,
  ].join("\n");

  return `${metadata}\n\n${comment.body ?? ""}`.trim();
};

const run = async () => {
  console.log(`Fetching issues from ${sourceRepo}...`);
  const issues = await paginate(
    `https://api.github.com/repos/${sourceOwner}/${sourceName}/issues?state=all`
  );
  const filteredIssues = issues.filter((issue) => !issue.pull_request);

  console.log(`Fetching labels and milestones from ${sourceRepo}...`);
  const labels = await paginate(
    `https://api.github.com/repos/${sourceOwner}/${sourceName}/labels`
  );
  const milestones = await paginate(
    `https://api.github.com/repos/${sourceOwner}/${sourceName}/milestones?state=all`
  );

  await ensureLabels(labels);
  const milestoneMap = await ensureMilestones(milestones);
  const collaborators = await fetchCollaborators();

  for (const issue of filteredIssues) {
    const labelNames = (issue.labels ?? [])
      .map((label) => label.name)
      .filter(Boolean);

    const assignees = (issue.assignees ?? [])
      .map((assignee) => assignee.login)
      .filter((login) => collaborators.has(login));

    const milestoneNumber = issue.milestone
      ? milestoneMap.get(issue.milestone.title)
      : undefined;

    const payload = {
      title: issue.title,
      body: formatIssueBody(issue),
      labels: labelNames,
      assignees,
      milestone: milestoneNumber,
    };

    console.log(`Creating issue: ${issue.title}`);
    const created = await githubFetch(
      `https://api.github.com/repos/${targetOwner}/${targetName}/issues`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    if (issue.state === "closed") {
      await githubFetch(
        `https://api.github.com/repos/${targetOwner}/${targetName}/issues/${created.number}`,
        {
          method: "PATCH",
          body: JSON.stringify({ state: "closed" }),
        }
      );
    }

    const comments = await paginate(
      `https://api.github.com/repos/${sourceOwner}/${sourceName}/issues/${issue.number}/comments`
    );

    for (const comment of comments) {
      await githubFetch(
        `https://api.github.com/repos/${targetOwner}/${targetName}/issues/${created.number}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ body: formatCommentBody(comment) }),
        }
      );
    }
  }

  console.log("Migration complete.");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
