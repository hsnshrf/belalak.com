import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Belalak Milk — From Pure Belarusian Milk to Premium Milk Powder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #041527 0%, #0A2E52 55%, #123A66 100%)",
          color: "#FAFAFA",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 36,
          }}
        >
          {/* Milk drop emblem */}
          <svg width="84" height="84" viewBox="0 0 64 64">
            <path
              d="M32 6c8 12 15 20 15 29a15 15 0 1 1-30 0c0-9 7-17 15-29z"
              fill="#FAFAFA"
            />
          </svg>
          <div style={{ fontSize: 64, letterSpacing: 10, display: "flex" }}>
            BELALAK
          </div>
        </div>
        <div
          style={{
            fontSize: 34,
            color: "#FFF7E8",
            textAlign: "center",
            maxWidth: 900,
            display: "flex",
          }}
        >
          From Pure Belarusian Milk to Premium Milk Powder
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 20,
            letterSpacing: 6,
            color: "#C9A96A",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Premium Dairy Ingredients · Made in Belarus
        </div>
      </div>
    ),
    { ...size }
  );
}
