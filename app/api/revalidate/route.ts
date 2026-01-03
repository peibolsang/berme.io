import { revalidatePath } from "next/cache";
import { createHmac, timingSafeEqual } from "crypto";
import { getAllPosts } from "../../../lib/posts";

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

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifySignature(body, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = request.headers.get("x-github-event") ?? "";
  const payload = JSON.parse(body);
  const revalidated: string[] = [];
  let posts: Awaited<ReturnType<typeof getAllPosts>> = [];
  try {
    posts = await getAllPosts();
  } catch {
    posts = [];
  }

  if (event === "issues") {
    const action = String(payload.action ?? "");
    if (action === "labeled") {
      const label = String(payload.label?.name ?? "").toLowerCase();
      if (label === "published") {
        const issueNumber = Number(payload.issue?.number);
        const post = posts.find((item) => item.number === issueNumber);
        if (post) {
          await revalidatePath(post.url);
          revalidated.push(post.url);
        }
        await revalidatePath("/");
        revalidated.push("/");
      }
    }

    if (action === "edited") {
      const issueNumber = Number(payload.issue?.number);
      const post = posts.find((item) => item.number === issueNumber);
      if (post) {
        await revalidatePath(post.url);
        revalidated.push(post.url);
      }
      await revalidatePath("/");
      revalidated.push("/");
    }
  }

  if (event === "issue_comment" && payload.action === "created") {
    const issueNumber = Number(payload.issue?.number);
    if (Number.isFinite(issueNumber)) {
      const post = posts.find((item) => item.number === issueNumber);
      if (post) {
        await revalidatePath(post.url);
        revalidated.push(post.url);
      }
    }
  }

  return Response.json({ revalidated });
}
