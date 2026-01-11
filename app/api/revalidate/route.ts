import { revalidatePath, revalidateTag } from "next/cache";
import { createHmac, timingSafeEqual } from "crypto";
import { getAllPosts } from "../../../lib/posts";
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

const getPostUrlFromIssue = (issue: {
  title?: string | null;
  body?: string | null;
  created_at?: string | null;
}) => {
  if (!issue?.title) {
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

const revalidatePostUrls = async (urls: Array<string | null | undefined>) => {
  const unique = Array.from(new Set(urls.filter(Boolean))) as string[];
  await Promise.all(unique.map((url) => revalidatePath(url)));
  return unique;
};

const revalidateContentTags = async () => {
  await Promise.all([
    revalidateTag("posts", "max"),
    revalidateTag("views", "max"),
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
  ]);
};

const hasNowLabel = (
  labels: Array<{ name?: string | null }> | null | undefined,
) =>
  (labels ?? []).some(
    (label) => String(label?.name ?? "").toLowerCase() === "now",
  );

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

  if (event === "issues") {
    const action = String(payload.action ?? "");
    if (action === "labeled" || action === "unlabeled") {
      const label = String(payload.label?.name ?? "").toLowerCase();
      if (label === "published") {
        const issueNumber = Number(payload.issue?.number);
        const urlFromPayload = getPostUrlFromIssue(payload.issue);
        const cached = await getCachedPosts();
        const cachedUrl = cached.find((item) => item.number === issueNumber)?.url;
        const urls = await revalidatePostUrls([urlFromPayload, cachedUrl]);
        revalidated.push(...urls);
        await ensureContentTagsRevalidated();
        await revalidateAggregates();
        revalidated.push("/", "/feed.xml", "/sitemap.xml");
      }
      if (label === "now") {
        await revalidateNow();
        revalidated.push("/", "/now");
      }
    }

    if (action === "edited" || action === "closed" || action === "reopened") {
      const issueNumber = Number(payload.issue?.number);
      const urlFromPayload = getPostUrlFromIssue(payload.issue);
      const cached = await getCachedPosts();
      const cachedUrl = cached.find((item) => item.number === issueNumber)?.url;
      const urls = await revalidatePostUrls([urlFromPayload, cachedUrl]);
      revalidated.push(...urls);
      await ensureContentTagsRevalidated();
      await revalidateAggregates();
      revalidated.push("/", "/feed.xml", "/sitemap.xml");
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
