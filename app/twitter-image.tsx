import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
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
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
          Pablo Bermejo
        </div>
        <div style={{ marginTop: 24, fontSize: 28, color: "#cbd5f5" }}>
          Notes and essays.
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 20,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "#94a3b8",
          }}
        >
          berme.io
        </div>
      </div>
    ),
    size
  );
}
