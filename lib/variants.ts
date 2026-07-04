import type { FatChoice, ProductKey, TextureChoice } from "./journeyState";

export type Spec = { label: string; value: string };

export type Variant = {
  key: ProductKey;
  fat: FatChoice;
  texture: TextureChoice;
  name: string;
  shortName: string;
  /** one-line positioning for cards */
  tagline: string;
  description: string;
  applications: string[];
  /**
   * Typical industry specification ranges.
   * OWNER: verify every value against your plant's certificate of analysis
   * before publishing.
   */
  specs: Spec[];
  /** Tailwind classes for the bag's variant color band. */
  bandClass: string;
  specSheet?: string;
};

export const VARIANTS: Record<ProductKey, Variant> = {
  "smp-regular": {
    key: "smp-regular",
    fat: "skim",
    texture: "regular",
    name: "Skim Milk Powder",
    shortName: "SMP · Regular",
    tagline: "High-protein dairy base with a clean, neutral flavour.",
    description:
      "Cream is separated before evaporation and drying. The result is a single-ingredient, free-flowing powder for recombination and industrial formulation.",
    applications: ["Recombined dairy", "Bakery", "Confectionery", "Ice cream mixes"],
    specs: [
      { label: "Milk fat", value: "≤ 1.25 %" },
      { label: "Protein (MSNF)", value: "≥ 34 %" },
      { label: "Moisture", value: "≤ 4.0 %" },
      { label: "Titratable acidity", value: "≤ 0.15 %" },
      { label: "Solubility index", value: "≤ 1.0 ml" },
      { label: "Shelf life", value: "24 months" },
      { label: "Packaging", value: "25 kg kraft bag, PE liner" },
    ],
    bandClass: "bg-steel",
    specSheet: "/specs/belalak-skim-milk-powder.pdf",
  },
  "smp-instant": {
    key: "smp-instant",
    fat: "skim",
    texture: "instant",
    name: "Instant Skim Milk Powder",
    shortName: "SMP · Instant",
    tagline: "Lecithinated and agglomerated for immediate dispersion.",
    description:
      "Skim milk powder agglomerated with food-grade lecithin. Porous agglomerates wet and sink instantly — built for beverages and reconstitution.",
    applications: ["Beverages", "Vending & HoReCa", "Nutrition blends", "Reconstituted milk"],
    specs: [
      { label: "Milk fat", value: "≤ 1.25 %" },
      { label: "Protein (MSNF)", value: "≥ 34 %" },
      { label: "Moisture", value: "≤ 4.5 %" },
      { label: "Lecithin", value: "≤ 0.5 %" },
      { label: "Wettability", value: "≤ 60 s" },
      { label: "Solubility index", value: "≤ 1.0 ml" },
      { label: "Shelf life", value: "24 months" },
      { label: "Packaging", value: "25 kg kraft bag, PE liner" },
    ],
    bandClass: "bg-pasture",
  },
  "wmp-regular": {
    key: "wmp-regular",
    fat: "whole",
    texture: "regular",
    name: "Whole Milk Powder",
    shortName: "WMP · Regular",
    tagline: "Full milk fat captured at the source.",
    description:
      "Standardized whole milk, evaporated and spray-dried with its natural fat intact. Full dairy richness for recombination and manufacturing.",
    applications: ["Recombination", "Chocolate & confectionery", "Bakery", "Dairy products"],
    specs: [
      { label: "Milk fat", value: "26 – 28 %" },
      { label: "Protein (MSNF)", value: "≥ 34 %" },
      { label: "Moisture", value: "≤ 4.0 %" },
      { label: "Titratable acidity", value: "≤ 0.15 %" },
      { label: "Solubility index", value: "≤ 1.0 ml" },
      { label: "Shelf life", value: "18 months" },
      { label: "Packaging", value: "25 kg kraft bag, PE liner" },
    ],
    bandClass: "bg-cream",
    specSheet: "/specs/belalak-whole-milk-powder.pdf",
  },
  "wmp-instant": {
    key: "wmp-instant",
    fat: "whole",
    texture: "instant",
    name: "Instant Whole Milk Powder",
    shortName: "WMP · Instant",
    tagline: "Full-cream powder that dissolves straight into the cup.",
    description:
      "Whole milk powder agglomerated with lecithin for instant wettability — full dairy fat with beverage-grade dispersibility.",
    applications: ["Instant beverages", "Consumer repacking", "HoReCa", "Nutrition blends"],
    specs: [
      { label: "Milk fat", value: "26 – 28 %" },
      { label: "Protein (MSNF)", value: "≥ 34 %" },
      { label: "Moisture", value: "≤ 4.5 %" },
      { label: "Lecithin", value: "≤ 0.5 %" },
      { label: "Wettability", value: "≤ 60 s" },
      { label: "Solubility index", value: "≤ 1.0 ml" },
      { label: "Shelf life", value: "18 months" },
      { label: "Packaging", value: "25 kg kraft bag, PE liner" },
    ],
    bandClass: "bg-steel-deep",
  },
};

export const VARIANT_LIST: Variant[] = [
  VARIANTS["smp-regular"],
  VARIANTS["smp-instant"],
  VARIANTS["wmp-regular"],
  VARIANTS["wmp-instant"],
];
