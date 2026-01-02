import { ImageResponse } from "next/og";
import { Playfair_Display } from "next/font/google";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
});

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
          alignItems: "center",
          textAlign: "center",
          padding: "80px",
          backgroundColor: "#0f172a",
          backgroundImage:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0b1120 100%)",
          color: "#f8fafc",
          fontFamily: playfair.style.fontFamily,
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>
          Pablo Bermejo
        </div>
        <div style={{ marginTop: 20, fontSize: 28, color: "#cbd5f5" }}>
          Notes and essays.
        </div>
      </div>
    ),
    size
  );
}
