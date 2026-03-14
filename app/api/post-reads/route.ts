import { getAllPosts } from "../../../lib/posts";
import { trackPostRead } from "../../../lib/post-popularity";

type RequestPayload = {
  postUrl?: string;
};

export async function POST(request: Request) {
  let payload: RequestPayload;

  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return Response.json(
      { error: "Invalid JSON payload" },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const postUrl = String(payload.postUrl ?? "").trim();
  if (!postUrl.startsWith("/")) {
    return Response.json(
      { error: "Invalid post URL" },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const posts = await getAllPosts();
  const post = posts.find((entry) => entry.url === postUrl);
  if (!post) {
    return Response.json(
      { error: "Post not found" },
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const popularity = await trackPostRead(postUrl);
  if (!popularity) {
    return Response.json(
      { enabled: false },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return Response.json(
    {
      enabled: true,
      ...popularity,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
