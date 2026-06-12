/**
 * Generates the downloadable product specification sheets in /public/specs.
 *
 * Writes minimal, valid single-page PDFs (Helvetica, hand-computed xref
 * table) so the project has zero PDF dependencies. Re-run with:
 *
 *   npm run generate:specs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "specs");
mkdirSync(outDir, { recursive: true });

// Keep in sync with lib/products.ts (script must stay runnable without a TS toolchain).
const PRODUCTS = [
  {
    file: "belalak-skim-milk-powder.pdf",
    name: "Skim Milk Powder",
    specs: [
      ["Milk fat", "max 1.25%"],
      ["Protein (dry basis)", "min 34%"],
      ["Moisture", "max 4.0%"],
      ["Titratable acidity", "max 0.15%"],
      ["Solubility index", "max 1.0 ml"],
      ["Heat classification", "Low / Medium / High"],
      ["Shelf life", "24 months"],
      ["Packaging", "25 kg kraft bags with PE liner"],
    ],
    applications: "Dairy, Bakery, Confectionery, Ice Cream",
  },
  {
    file: "belalak-whole-milk-powder.pdf",
    name: "Whole Milk Powder",
    specs: [
      ["Milk fat", "26 - 28%"],
      ["Protein (dry basis)", "min 24%"],
      ["Moisture", "max 4.0%"],
      ["Titratable acidity", "max 0.15%"],
      ["Solubility index", "max 1.0 ml"],
      ["Scorched particles", "Disc A / B"],
      ["Shelf life", "18 months"],
      ["Packaging", "25 kg kraft bags with PE liner"],
    ],
    applications: "Recombination, Dairy Products, Beverages",
  },
  {
    file: "belalak-instant-fat-filled-milk-powder.pdf",
    name: "Instant Fat Filled Milk Powder",
    specs: [
      ["Vegetable fat", "26 - 28%"],
      ["Protein (dry basis)", "min 20%"],
      ["Moisture", "max 4.0%"],
      ["Wettability", "max 60 s (instant)"],
      ["Lecithin", "max 0.5%"],
      ["Bulk density", "0.45 - 0.55 g/ml"],
      ["Shelf life", "18 months"],
      ["Packaging", "25 kg bags / consumer packs"],
    ],
    applications: "Instant Milk Drinks, Tea & Coffee Whiteners, Consumer Packs",
  },
  {
    file: "belalak-whey-powder.pdf",
    name: "Whey Powder",
    specs: [
      ["Protein (dry basis)", "min 11%"],
      ["Lactose", "min 70%"],
      ["Milk fat", "max 1.5%"],
      ["Moisture", "max 4.0%"],
      ["Ash", "max 9.5%"],
      ["pH (10% solution)", "6.0 - 6.6"],
      ["Shelf life", "12 months"],
      ["Packaging", "25 kg kraft bags with PE liner"],
    ],
    applications: "Bakery, Confectionery, Processed Foods",
  },
];

const escapePdfText = (s) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

/** Builds a one-page A4 PDF from positioned text lines. */
function buildPdf(lines) {
  const content = [
    "BT",
    ...lines.map(({ x, y, size, bold, text }) =>
      [`/${bold ? "F2" : "F1"} ${size} Tf`, `1 0 0 1 ${x} ${y} Tm`, `(${escapePdfText(text)}) Tj`].join("\n")
    ),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return pdf;
}

for (const product of PRODUCTS) {
  const lines = [
    { x: 60, y: 780, size: 22, bold: true, text: "BELALAK MILK" },
    { x: 60, y: 758, size: 10, bold: false, text: "Premium Dairy Ingredients - Made in Belarus - belalak.com" },
    { x: 60, y: 710, size: 16, bold: true, text: `Specification Sheet: ${product.name}` },
    { x: 60, y: 688, size: 10, bold: false, text: `Applications: ${product.applications}` },
    { x: 60, y: 650, size: 12, bold: true, text: "Parameter" },
    { x: 330, y: 650, size: 12, bold: true, text: "Specification" },
  ];

  product.specs.forEach(([label, value], i) => {
    const y = 626 - i * 24;
    lines.push({ x: 60, y, size: 11, bold: false, text: label });
    lines.push({ x: 330, y, size: 11, bold: false, text: value });
  });

  lines.push(
    { x: 60, y: 380, size: 9, bold: false, text: "Indicative values. Certificates of analysis accompany every consignment." },
    { x: 60, y: 364, size: 9, bold: false, text: "Inquiries: export@belalak.com" }
  );

  writeFileSync(join(outDir, product.file), buildPdf(lines), "latin1");
  console.log(`wrote public/specs/${product.file}`);
}
