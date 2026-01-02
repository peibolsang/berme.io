import { ImageResponse } from "next/og";
import { getPostByPermalink } from "../../../../../lib/posts";

export const runtime = "edge";

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
  const post = await getPostByPermalink(
    params.year,
    params.month,
    params.day,
    params.slug
  );

  const title = post?.title ?? "Pablo Bermejo";
  const description = post?.excerpt ?? "Notes and essays.";

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
          backgroundColor: "#0f172a",
          backgroundImage:
            "radial-gradient(circle at 15% 20%, #1e293b 0%, #0f172a 70%, #020617 100%)",
          color: "#f8fafc",
        }}
      >
        <div style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.15 }}>
          {title}
        </div>
        <div style={{ marginTop: 24, fontSize: 26, color: "#cbd5f5" }}>
          {description}
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 18,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "#94a3b8",
          }}
        >
          Pablo Bermejo
        </div>
      </div>
    ),
    size
  );
}
