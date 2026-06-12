export type ProductSpec = { label: string; value: string };

export type Product = {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  applications: string[];
  specs: ProductSpec[];
  /** Tailwind gradient classes used by the packaging mockup. */
  bagGradient: string;
  accent: string;
  specSheet: string;
};

export const products: Product[] = [
  {
    slug: "skim-milk-powder",
    name: "Skim Milk Powder",
    shortName: "SMP",
    tagline: "The industry workhorse — high protein, clean flavour.",
    description:
      "Spray-dried from fresh pasteurized skimmed Belarusian milk. A consistent, high-protein dairy base with excellent solubility and a clean, neutral flavour profile.",
    applications: ["Dairy", "Bakery", "Confectionery", "Ice Cream"],
    specs: [
      { label: "Milk fat", value: "≤ 1.25%" },
      { label: "Protein (dry basis)", value: "≥ 34%" },
      { label: "Moisture", value: "≤ 4.0%" },
      { label: "Titratable acidity", value: "≤ 0.15%" },
      { label: "Solubility index", value: "≤ 1.0 ml" },
      { label: "Heat classification", value: "Low / Medium / High" },
      { label: "Shelf life", value: "24 months" },
      { label: "Packaging", value: "25 kg kraft bags, PE liner" },
    ],
    bagGradient: "from-deep-50 via-white to-deep-100",
    accent: "#4F86C0",
    specSheet: "/specs/belalak-skim-milk-powder.pdf",
  },
  {
    slug: "whole-milk-powder",
    name: "Whole Milk Powder",
    shortName: "WMP",
    tagline: "Full cream richness, captured at the source.",
    description:
      "Whole Belarusian milk, standardized and spray-dried to lock in natural milk fat, flavour and nutrition. Ideal wherever full dairy richness is required.",
    applications: ["Recombination", "Dairy Products", "Beverages"],
    specs: [
      { label: "Milk fat", value: "26 – 28%" },
      { label: "Protein (dry basis)", value: "≥ 24%" },
      { label: "Moisture", value: "≤ 4.0%" },
      { label: "Titratable acidity", value: "≤ 0.15%" },
      { label: "Solubility index", value: "≤ 1.0 ml" },
      { label: "Scorched particles", value: "Disc A / B" },
      { label: "Shelf life", value: "18 months" },
      { label: "Packaging", value: "25 kg kraft bags, PE liner" },
    ],
    bagGradient: "from-cream via-white to-gold-light/40",
    accent: "#C9A96A",
    specSheet: "/specs/belalak-whole-milk-powder.pdf",
  },
  {
    slug: "instant-fat-filled-milk-powder",
    name: "Instant Fat Filled Milk Powder",
    shortName: "IFFMP",
    tagline: "Instant solubility, engineered for the cup.",
    description:
      "Skimmed milk enriched with premium vegetable fat and lecithinated for instant dispersion. Built for consumer-facing applications where convenience matters.",
    applications: ["Instant Milk Drinks", "Tea & Coffee Whiteners", "Consumer Packs"],
    specs: [
      { label: "Vegetable fat", value: "26 – 28%" },
      { label: "Protein (dry basis)", value: "≥ 20%" },
      { label: "Moisture", value: "≤ 4.0%" },
      { label: "Wettability", value: "≤ 60 s (instant)" },
      { label: "Lecithin", value: "≤ 0.5%" },
      { label: "Bulk density", value: "0.45 – 0.55 g/ml" },
      { label: "Shelf life", value: "18 months" },
      { label: "Packaging", value: "25 kg bags / consumer packs" },
    ],
    bagGradient: "from-deep-100 via-white to-cream",
    accent: "#2D659F",
    specSheet: "/specs/belalak-instant-fat-filled-milk-powder.pdf",
  },
  {
    slug: "whey-powder",
    name: "Whey Powder",
    shortName: "SWP",
    tagline: "Functional sweet whey for cost-smart formulation.",
    description:
      "Sweet whey from Belarusian cheese production, concentrated and spray-dried. A functional, economical dairy solid for bakery and processed food systems.",
    applications: ["Bakery", "Confectionery", "Processed Foods"],
    specs: [
      { label: "Protein (dry basis)", value: "≥ 11%" },
      { label: "Lactose", value: "≥ 70%" },
      { label: "Milk fat", value: "≤ 1.5%" },
      { label: "Moisture", value: "≤ 4.0%" },
      { label: "Ash", value: "≤ 9.5%" },
      { label: "pH (10% solution)", value: "6.0 – 6.6" },
      { label: "Shelf life", value: "12 months" },
      { label: "Packaging", value: "25 kg kraft bags, PE liner" },
    ],
    bagGradient: "from-silver/40 via-white to-cream",
    accent: "#8FA8BF",
    specSheet: "/specs/belalak-whey-powder.pdf",
  },
];
