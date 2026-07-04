import { create } from "zustand";

/** Decision point #1 — separation. */
export type FatChoice = "skim" | "whole";
/** Decision point #2 — instantizing. */
export type TextureChoice = "instant" | "regular";

export type ProductKey =
  | "smp-regular"
  | "smp-instant"
  | "wmp-regular"
  | "wmp-instant";

/**
 * Defaults applied when a visitor scrolls past a decision point without
 * choosing (whole + regular = the most common commodity spec). The floating
 * line-setup chip and stage 09 both let them change it afterwards.
 */
export const FALLBACK_FAT: FatChoice = "whole";
export const FALLBACK_TEXTURE: TextureChoice = "regular";

type JourneyState = {
  /** null until the visitor reaches decision point #1 */
  fat: FatChoice | null;
  /** null until the visitor reaches decision point #2 */
  texture: TextureChoice | null;
  /** true when the value was applied automatically (scrolled past) */
  fatDefaulted: boolean;
  textureDefaulted: boolean;
  setFat: (fat: FatChoice, defaulted?: boolean) => void;
  setTexture: (texture: TextureChoice, defaulted?: boolean) => void;
};

/**
 * The single branching store for the journey. Decision stages write it;
 * the stream connectors, evaporation/drying visuals, stage 09 and the
 * products grid read it.
 */
export const useJourneyState = create<JourneyState>()((set) => ({
  fat: null,
  texture: null,
  fatDefaulted: false,
  textureDefaulted: false,
  setFat: (fat, defaulted = false) => set({ fat, fatDefaulted: defaulted }),
  setTexture: (texture, defaulted = false) =>
    set({ texture, textureDefaulted: defaulted }),
}));

/** Resolve the four-way product outcome (falling back to defaults). */
export function resolveProductKey(
  fat: FatChoice | null,
  texture: TextureChoice | null
): ProductKey {
  const f = fat ?? FALLBACK_FAT;
  const t = texture ?? FALLBACK_TEXTURE;
  return `${f === "skim" ? "smp" : "wmp"}-${t}` as ProductKey;
}
