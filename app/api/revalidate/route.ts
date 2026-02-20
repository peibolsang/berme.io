import { revalidatePath, revalidateTag } from "next/cache";
import { createHmac, timingSafeEqual } from "crypto";
import { getAllPosts } from "../../../lib/posts";
import { getAllViews } from "../../../lib/views";
import { getConferences } from "../../../lib/conferences";
import { parseFrontmatter } from "../../../lib/frontmatter";
import { slugify } from "../../../lib/slugify";

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

const getPostUrlFromIssue = (issue: {
  title?: string | null;
  body?: string | null;
  created_at?: string | null;
  labels?: Array<{ name?: string | null }> | null;
}) => {
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

const getConferenceUrlFromIssue = (issue: {
  title?: string | null;
  body?: string | null;
  labels?: Array<{ name?: string | null }> | null;
}) => {
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
  const unique = Array.from(new Set(urls.filter(Boolean))) as string[];
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
    revalidatePath("/sitemap.md"),
  ]);
};

const hasNowLabel = (
  labels: Array<{ name?: string | null }> | null | undefined,
) =>
  hasLabel(labels, "now");

const revalidateNow = async () => {
  await Promise.all([
    revalidatePath("/"),
    revalidatePath("/now"),
    revalidateTag("now", "max"),
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
    await revalidatePath(viewUrl);
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
    await revalidatePath(conferenceUrl);
    return conferenceUrl;
  };

  if (event === "issues") {
    const action = String(payload.action ?? "");
    if (action === "labeled" || action === "unlabeled") {
      const label = String(payload.label?.name ?? "").toLowerCase();
      if (label === "published" || label === "conference") {
        const issueNumber = Number(payload.issue?.number);
        const urlFromPayload = getPostUrlFromIssue(payload.issue);
        const conferenceUrlFromPayload = getConferenceUrlFromIssue(payload.issue);
        const cached = await getCachedPosts();
        const cachedUrl = cached.find((item) => item.number === issueNumber)?.url;
        const urls = await revalidatePostUrls([urlFromPayload, cachedUrl]);
        revalidated.push(...urls);
        const conferenceUrls = await revalidatePostUrls([conferenceUrlFromPayload]);
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
        revalidated.push("/", "/feed.xml", "/sitemap.md");
      }
      if (label === "now") {
        await revalidateNow();
        revalidated.push("/", "/now");
      }
    }

    if (action === "pinned" || action === "unpinned") {
      await ensureContentTagsRevalidated();
      await revalidateAggregates();
      revalidated.push("/", "/feed.xml", "/sitemap.md");
    }

    if (action === "edited" || action === "closed" || action === "reopened") {
      const issueNumber = Number(payload.issue?.number);
      const urlFromPayload = getPostUrlFromIssue(payload.issue);
      const conferenceUrlFromPayload = getConferenceUrlFromIssue(payload.issue);
      const cached = await getCachedPosts();
      const cachedUrl = cached.find((item) => item.number === issueNumber)?.url;
      const urls = await revalidatePostUrls([urlFromPayload, cachedUrl]);
      revalidated.push(...urls);
      const conferenceUrls = await revalidatePostUrls([conferenceUrlFromPayload]);
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
      revalidated.push("/", "/feed.xml", "/sitemap.md");
      if (hasNowLabel(payload.issue?.labels)) {
        await revalidateNow();
        revalidated.push("/now");
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
