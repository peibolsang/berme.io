import { ImageResponse } from "next/og";
import { getPostByPermalink } from "../../../../../lib/posts";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { year: string; month: string; day: string; slug: string };
}) {
  const brandTitle = "Pablo Bermejo";
  let postTitle = brandTitle;
  let description = "Notes and essays.";

  try {
    const post = await getPostByPermalink(
      params.year,
      params.month,
      params.day,
      params.slug
    );
    if (typeof post?.title === "string" && post.title.trim()) {
      postTitle = post.title;
    }
    if (typeof post?.excerpt === "string" && post.excerpt.trim()) {
      description = post.excerpt;
    }
  } catch {
    // Use slug-based fallback if the post lookup fails.
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          backgroundColor: "#f4f1ea",
          backgroundImage:
            "radial-gradient(circle at 15% 20%, #ffffff 0%, #f4f1ea 55%, #e7e1d5 100%)",
          color: "#0f172a",
        }}
      >
        <div style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.15 }}>
          {brandTitle}
        </div>
        <div style={{ marginTop: 24, fontSize: 26, color: "#475569" }}>
          {description}
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 54,
            fontWeight: 800,
            lineHeight: 1.1,
            color: "#0f172a",
            maxWidth: "100%",
          }}
        >
          {postTitle}
        </div>
      </div>
    ),
    size
  );
}
