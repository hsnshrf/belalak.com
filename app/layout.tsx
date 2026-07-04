import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import MotionProvider from "@/components/MotionProvider";
import SmoothScroll from "@/components/SmoothScroll";

/**
 * Type system (see DESIGN.md):
 *  - Archivo        display — industrial grotesque for stage titles/numbers
 *  - IBM Plex Sans  body — engineered, highly readable
 *  - IBM Plex Mono  data — every instrument readout and spec table
 * Loaded through next/font so they are self-hosted with zero layout shift.
 */
const display = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = "https://belalak.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Belalak — Belarusian Milk Powder, From Farm to Spray Drier",
    template: "%s | Belalak",
  },
  description:
    "Belalak supplies spray-dried Belarusian milk powder to food manufacturers worldwide: skim and whole milk powder, regular or instantized. Follow the full production line — milking, cold chain, lab testing, pasteurization, separation, evaporation and spray drying.",
  keywords: [
    "Belalak",
    "milk powder supplier",
    "skim milk powder",
    "whole milk powder",
    "instant milk powder",
    "SMP",
    "WMP",
    "Belarus milk powder",
    "dairy ingredients",
    "spray dried milk",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Belalak",
    title: "Belalak — Belarusian Milk Powder, From Farm to Spray Drier",
    description:
      "Skim and whole milk powder, regular or instantized — spray-dried in Belarus and supplied to food manufacturers worldwide.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Belalak — Belarusian Milk Powder",
    description:
      "Skim and whole milk powder, regular or instantized — spray-dried in Belarus for B2B buyers.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#16202B",
  width: "device-width",
  initialScale: 1,
};

/** Organization + WebSite structured data, rendered once for every page. */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Belalak",
      url: SITE_URL,
      description:
        "Belarusian milk powder brand supplying spray-dried skim and whole milk powder — regular or instantized — to food manufacturers worldwide.",
      email: "export@belalak.com",
      areaServed: "Worldwide",
      knowsAbout: [
        "Skim Milk Powder",
        "Whole Milk Powder",
        "Instant Milk Powder",
        "Spray Drying",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Belalak",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <SmoothScroll>
          <MotionProvider>{children}</MotionProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
