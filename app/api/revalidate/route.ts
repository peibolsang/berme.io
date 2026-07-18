import { revalidatePath, revalidateTag } from "next/cache";
import { createHmac, timingSafeEqual } from "crypto";
import { getAllPosts } from "../../../lib/posts";
import { getAllViews } from "../../../lib/views";
import { getConferences } from "../../../lib/conferences";
import { parseFrontmatter } from "../../../lib/frontmatter";
import { slugify } from "../../../lib/slugify";
import { toMarkdownUrl } from "../../../lib/markdown-exports";
import { syncPostReadTracking } from "../../../lib/post-popularity";
import { config } from "../../../lib/config";
import { shouldShowIssueAsContent } from "../../../lib/content-status";

const verifySignature = (body: string, signature: string | null) => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET ?? "";
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  if (!signature) {
    return false;
  }
  const digest = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
};

const buildUrl = (date: Date, slug: string) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `/${year}/${month}/${day}/${slug}`;
};

const asDate = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const hasLabel = (
  labels: Array<{ name?: string | null }> | null | undefined,
  name: string,
) =>
  (labels ?? []).some(
    (label) => String(label?.name ?? "").toLowerCase() === name.toLowerCase(),
  );

const hasConferenceLabel = (
  labels: Array<{ name?: string | null }> | null | undefined,
) => hasLabel(labels, "conference");

type WebhookIssuePayload = {
  title?: string | null;
  body?: string | null;
  created_at?: string | null;
  labels?: Array<{ name?: string | null }> | null;
};

type IssueEditedChangesPayload = {
  title?: { from?: string | null } | null;
  body?: { from?: string | null } | null;
};

const getIssuePayloadAtPreviousRevision = (
  issue: WebhookIssuePayload,
  changes?: IssueEditedChangesPayload | null,
): WebhookIssuePayload | null => {
  if (!changes?.title && !changes?.body) {
    return null;
  }

  return {
    ...issue,
    title: changes.title ? changes.title.from ?? null : issue.title,
    body: changes.body ? changes.body.from ?? null : issue.body,
  };
};

const getPostUrlFromIssue = (issue: WebhookIssuePayload) => {
  if (!issue?.title) {
    return null;
  }
  if (hasConferenceLabel(issue.labels)) {
    return null;
  }
  const { data } = parseFrontmatter(issue.body ?? "");
  const publishedAt = asDate(data.publishedAt ?? issue.created_at);
  if (!publishedAt) {
    return null;
  }
  const slugSource = data.slug ? String(data.slug) : issue.title;
  const slug = slugify(slugSource);
  if (!slug) {
    return null;
  }
  return buildUrl(publishedAt, slug);
};

const getConferenceUrlFromIssue = (issue: WebhookIssuePayload) => {
  if (!issue?.title) {
    return null;
  }
  if (!hasConferenceLabel(issue.labels)) {
    return null;
  }
  const { data } = parseFrontmatter(issue.body ?? "");
  const event = String(data.event ?? "").trim();
  if (!event) {
    return null;
  }
  const slugSource = data.slug ? String(data.slug) : issue.title;
  const slug = slugify(slugSource);
  if (!slug) {
    return null;
  }
  return `/conferences/${slug}`;
};

const revalidatePostUrls = async (urls: Array<string | null | undefined>) => {
  const unique = Array.from(
    new Set(
      (urls.filter(Boolean) as string[]).flatMap((url) => [url, toMarkdownUrl(url)]),
    ),
  );
  await Promise.all(unique.map((url) => revalidatePath(url)));
  return unique;
};

const revalidateContentTags = async () => {
  await Promise.all([
    revalidateTag("posts", "max"),
    revalidateTag("views", "max"),
    revalidateTag("conferences", "max"),
    revalidateTag("github-issues", "max"),
    revalidateTag("github-issues-with-parents", "max"),
    revalidateTag("github-pinned-issues", "max"),
  ]);
};

const revalidateAggregates = async () => {
  await Promise.all([
    revalidatePath("/"),
    revalidatePath("/feed.xml"),
    revalidatePath("/sitemap.xml"),
    revalidatePath("/sitemap.md"),
    revalidatePath("/sitemap.json"),
  ]);
};

const hasNowLabel = (
  labels: Array<{ name?: string | null }> | null | undefined,
) =>
  hasLabel(labels, "now");

const hasReadyLabel = (
  labels: Array<{ name?: string | null }> | null | undefined,
) =>
  hasLabel(labels, "ready");

const revalidateNow = async () => {
  await Promise.all([
    revalidatePath("/"),
    revalidatePath("/now"),
    revalidateTag("now", "max"),
  ]);
};

const revalidateCurrentlyWriting = async () => {
  await Promise.all([
    revalidatePath("/now"),
    revalidateTag("now-writing", "max"),
  ]);
};

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifySignature(body, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = request.headers.get("x-github-event") ?? "";
  const payload = JSON.parse(body);
  const revalidated: string[] = [];
  let posts: Awaited<ReturnType<typeof getAllPosts>> | null = null;
  let views: Awaited<ReturnType<typeof getAllViews>> | null = null;
  let conferences: Awaited<ReturnType<typeof getConferences>> | null = null;
  let contentTagsRevalidated = false;
  const ensureContentTagsRevalidated = async () => {
    if (contentTagsRevalidated) {
      return;
    }
    await revalidateContentTags();
    contentTagsRevalidated = true;
  };
  const getCachedPosts = async () => {
    if (posts) {
      return posts;
    }
    try {
      posts = await getAllPosts();
    } catch {
      posts = [];
    }
    return posts;
  };
  const getCachedViews = async () => {
    if (views) {
      return views;
    }
    try {
      views = await getAllViews();
    } catch {
      views = [];
    }
    return views;
  };
  const getCachedConferences = async () => {
    if (conferences) {
      return conferences;
    }
    try {
      conferences = await getConferences();
    } catch {
      conferences = [];
    }
    return conferences;
  };
  const revalidateViewUrlByIssueNumber = async (issueNumber: number) => {
    if (!Number.isFinite(issueNumber)) {
      return null;
    }
    const cachedViews = await getCachedViews();
    const viewUrl = cachedViews.find((item) => item.number === issueNumber)?.url;
    if (!viewUrl) {
      return null;
    }
    await Promise.all([revalidatePath(viewUrl), revalidatePath(toMarkdownUrl(viewUrl))]);
    return viewUrl;
  };
  const revalidateConferenceUrlByIssueNumber = async (issueNumber: number) => {
    if (!Number.isFinite(issueNumber)) {
      return null;
    }
    const cachedConferences = await getCachedConferences();
    const conferenceUrl = cachedConferences.find((item) => item.number === issueNumber)?.url;
    if (!conferenceUrl) {
      return null;
    }
    await Promise.all([
      revalidatePath(conferenceUrl),
      revalidatePath(toMarkdownUrl(conferenceUrl)),
    ]);
    return conferenceUrl;
  };
  const issueExistsInContentCaches = async (issueNumber: number) => {
    const [cachedPosts, cachedViews, cachedConferences] = await Promise.all([
      getCachedPosts(),
      getCachedViews(),
      getCachedConferences(),
    ]);
    return (
      cachedPosts.some((item) => item.number === issueNumber) ||
      cachedViews.some((item) => item.number === issueNumber) ||
      cachedConferences.some((item) => item.number === issueNumber)
    );
  };
  const revalidateIssueContent = async (
    issueNumber: number,
    issue: WebhookIssuePayload,
    previousIssue?: WebhookIssuePayload | null,
  ) => {
    const urlFromPayload = getPostUrlFromIssue(issue);
    const previousUrlFromPayload = previousIssue
      ? getPostUrlFromIssue(previousIssue)
      : null;
    const conferenceUrlFromPayload = getConferenceUrlFromIssue(issue);
    const previousConferenceUrlFromPayload = previousIssue
      ? getConferenceUrlFromIssue(previousIssue)
      : null;
    const cached = await getCachedPosts();
    const cachedUrl = cached.find((item) => item.number === issueNumber)?.url;
    await syncPostReadTracking({
      currentUrl: urlFromPayload ?? cachedUrl,
      previousUrl: previousUrlFromPayload ?? cachedUrl,
    });
    const urls = await revalidatePostUrls([
      urlFromPayload,
      previousUrlFromPayload,
      cachedUrl,
    ]);
    revalidated.push(...urls);
    const conferenceUrls = await revalidatePostUrls([
      conferenceUrlFromPayload,
      previousConferenceUrlFromPayload,
    ]);
    revalidated.push(...conferenceUrls);
    await ensureContentTagsRevalidated();
    const viewUrl = await revalidateViewUrlByIssueNumber(issueNumber);
    if (viewUrl) {
      revalidated.push(viewUrl);
    }
    const conferenceUrl = await revalidateConferenceUrlByIssueNumber(issueNumber);
    if (conferenceUrl) {
      revalidated.push(conferenceUrl);
    }
    await revalidateAggregates();
    revalidated.push("/", "/feed.xml", "/sitemap.xml", "/sitemap.md", "/sitemap.json");
  };

  if (event === "issues") {
    const action = String(payload.action ?? "");
    if (action === "labeled" || action === "unlabeled") {
      const label = String(payload.label?.name ?? "").toLowerCase();
      const issueNumber = Number(payload.issue?.number);
      if (Number.isFinite(issueNumber)) {
        const issueShouldBeContent = shouldShowIssueAsContent(
          payload.issue?.labels,
        );
        const issueCachedAsContent = await issueExistsInContentCaches(issueNumber);
        if (issueShouldBeContent || issueCachedAsContent) {
          await revalidateIssueContent(issueNumber, payload.issue);
        }
      }
      if (label === "now") {
        await revalidateNow();
        revalidated.push("/", "/now");
      }
      if (label === "ready") {
        await revalidateCurrentlyWriting();
        revalidated.push("/now");
      }
    }

    if (action === "opened" && config.showDrafts) {
      const issueNumber = Number(payload.issue?.number);
      if (
        Number.isFinite(issueNumber) &&
        shouldShowIssueAsContent(payload.issue?.labels)
      ) {
        await revalidateIssueContent(issueNumber, payload.issue);
      }
    }

    if (action === "pinned" || action === "unpinned") {
      await ensureContentTagsRevalidated();
      await revalidateAggregates();
      revalidated.push("/", "/feed.xml", "/sitemap.xml", "/sitemap.md", "/sitemap.json");
    }

    if (action === "edited" || action === "closed" || action === "reopened") {
      const issueNumber = Number(payload.issue?.number);
      if (Number.isFinite(issueNumber)) {
        const previousIssue = getIssuePayloadAtPreviousRevision(
          payload.issue,
          action === "edited" ? payload.changes : null,
        );
        await revalidateIssueContent(issueNumber, payload.issue, previousIssue);
        if (hasNowLabel(payload.issue?.labels)) {
          await revalidateNow();
          revalidated.push("/now");
        }
        if (hasReadyLabel(payload.issue?.labels)) {
          await revalidateCurrentlyWriting();
          revalidated.push("/now");
        }
      }
    }
  }

  if (event === "issue_comment" && payload.action === "created") {
    const issueNumber = Number(payload.issue?.number);
    if (Number.isFinite(issueNumber)) {
      const urlFromPayload = getPostUrlFromIssue(payload.issue);
      const cached = await getCachedPosts();
      const cachedUrl = cached.find((item) => item.number === issueNumber)?.url;
      const urls = await revalidatePostUrls([urlFromPayload, cachedUrl]);
      revalidated.push(...urls);
      await revalidateTag(`comments:${issueNumber}`, "max");
      if (hasNowLabel(payload.issue?.labels)) {
        await revalidateNow();
        revalidated.push("/now");
      }
    }
  }

  return Response.json({ revalidated });
}
