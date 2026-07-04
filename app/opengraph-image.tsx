import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Belalak — Belarusian Milk Powder, From Farm to Spray Drier";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social-share card. Colors mirror the design tokens in app/globals.css
 * (satori can't read CSS variables, so they're inlined here — keep in
 * sync). The bundled Carlito woff stands in for the display face because
 * the OG renderer needs an embedded font file.
 */
export default async function OpengraphImage() {
  const carlito = await fetch(
    new URL("./fonts/carlito-700.woff", import.meta.url)
  ).then((res) => res.arrayBuffer());

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
          background: "#16202B", // --c-steel-deep
          color: "#FDFCF7", // --c-milk
          fontFamily: "Carlito",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 12, color: "#D9A63F" }}>
          01 → 09
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 132,
            fontWeight: 700,
            letterSpacing: 10,
            marginTop: 8,
          }}
        >
          BELALAK
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 34,
            color: "#F3EDDF", // --c-ivory
            textAlign: "center",
            maxWidth: 940,
          }}
        >
          Belarusian milk powder, from farm to spray drier
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 20,
            letterSpacing: 6,
            color: "#D9A63F", // --c-cream
            textTransform: "uppercase",
          }}
        >
          SMP · WMP · Regular · Instant
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Carlito", data: carlito, style: "normal", weight: 700 }],
    }
  );
}
