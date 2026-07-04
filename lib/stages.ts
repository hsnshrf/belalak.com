/**
 * The nine stages of the production line, in order. Drives the header
 * pipeline progress indicator and keeps section ids consistent.
 */
export type StageMeta = {
  id: string;
  num: string;
  short: string;
  title: string;
};

export const STAGES: StageMeta[] = [
  { id: "stage-farm", num: "01", short: "Farm", title: "The dairy farm" },
  { id: "stage-transport", num: "02", short: "Transport", title: "Cold-chain transport" },
  { id: "stage-testing", num: "03", short: "Testing", title: "Milk reception & testing" },
  { id: "stage-pasteurization", num: "04", short: "Pasteurize", title: "Pasteurization" },
  { id: "stage-separation", num: "05", short: "Separate", title: "Separation — skim or whole" },
  { id: "stage-evaporation", num: "06", short: "Evaporate", title: "Evaporation" },
  { id: "stage-instantizing", num: "07", short: "Instantize", title: "Instantized or regular" },
  { id: "stage-spray-drying", num: "08", short: "Spray dry", title: "Spray drying" },
  { id: "stage-product", num: "09", short: "Product", title: "The final product" },
];
