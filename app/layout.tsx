import type { Metadata, Viewport } from "next";
// Carlito: metric-compatible open-source fallback for Calibri, used when
// the visitor's system doesn't ship Calibri itself.
import "@fontsource/carlito/400.css";
import "@fontsource/carlito/400-italic.css";
import "@fontsource/carlito/700.css";
import "@fontsource/carlito/700-italic.css";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const SITE_URL = "https://belalak.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Belalak Milk — Premium Belarusian Milk Powder Supplier",
    template: "%s | Belalak Milk",
  },
  description:
    "Belalak Milk is a premium milk powder supplier sourcing and manufacturing in Belarus. Skim milk powder, whole milk powder, instant fat filled milk powder and whey powder — exported worldwide, distributed from the UAE.",
  keywords: [
    "Belalak Milk",
    "Milk Powder Supplier",
    "Skim Milk Powder",
    "Whole Milk Powder",
    "Whey Powder",
    "Instant Fat Filled Milk Powder",
    "Belarus Milk Powder",
    "Dairy Ingredients UAE",
    "Milk Powder UAE",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Belalak Milk",
    title: "Belalak Milk — From Pure Belarusian Milk to Premium Milk Powder",
    description:
      "Premium dairy ingredients crafted in Belarus through advanced spray-drying technology. Trusted by food manufacturers worldwide.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Belalak Milk — Premium Belarusian Milk Powder",
    description:
      "Skim, whole, fat filled and whey powders crafted in Belarus. Exported worldwide.",
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
  themeColor: "#0A2E52",
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
      name: "Belalak Milk",
      url: SITE_URL,
      description:
        "Premium dairy ingredients brand sourcing and manufacturing high-quality milk powders in the Republic of Belarus.",
      email: "export@belalak.com",
      areaServed: "Worldwide",
      knowsAbout: [
        "Skim Milk Powder",
        "Whole Milk Powder",
        "Instant Fat Filled Milk Powder",
        "Whey Powder",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Belalak Milk",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
