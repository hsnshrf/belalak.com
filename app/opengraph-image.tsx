import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Belalak Milk — From Pure Belarusian Milk to Premium Milk Powder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  // Carlito = metric-compatible stand-in for Calibri (the site typeface);
  // the OG renderer (satori) needs an embedded font file.
  const [carlito, logo] = await Promise.all([
    fetch(new URL("./fonts/carlito-700.woff", import.meta.url)).then((res) => res.arrayBuffer()),
    fetch(new URL("./og-logo.png", import.meta.url)).then((res) => res.arrayBuffer()),
  ]);

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
          fontFamily: "Carlito",
        }}
      >
        {/* brand logo on a white plate for contrast */}
        <div
          style={{
            display: "flex",
            background: "#FFFFFF",
            borderRadius: 32,
            padding: "28px 44px",
            marginBottom: 40,
            boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo as unknown as string}
            alt=""
            width={310}
            height={260}
            style={{ objectFit: "contain" }}
          />
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#FFF7E8",
            textAlign: "center",
            maxWidth: 940,
            display: "flex",
          }}
        >
          From Pure Belarusian Milk to Premium Milk Powder
        </div>
        <div
          style={{
            marginTop: 24,
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
    {
      ...size,
      fonts: [{ name: "Carlito", data: carlito, style: "normal", weight: 700 }],
    }
  );
}
