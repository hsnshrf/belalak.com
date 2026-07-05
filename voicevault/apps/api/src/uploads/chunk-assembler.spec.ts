import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { planAssembly, verifyChunkChecksum, type ChunkRef } from "./chunk-assembler";

const refs = (...seqs: number[]): ChunkRef[] => seqs.map((seq) => ({ seq, sha256: "0".repeat(64) }));

describe("planAssembly with declared total (clean finish)", () => {
  it("accepts a complete set in any arrival order", () => {
    const plan = planAssembly(refs(2, 0, 1), 3);
    expect(plan).toEqual({ ok: true, orderedSeqs: [0, 1, 2] });
  });

  it("reports exactly which chunks are missing", () => {
    const plan = planAssembly(refs(0, 3), 5);
    expect(plan.ok).toBe(false);
    if (!plan.ok) expect(plan.missing).toEqual([1, 2, 4]);
  });

  it("rejects chunks beyond the declared total", () => {
    const plan = planAssembly(refs(0, 1, 2, 7), 3);
    expect(plan.ok).toBe(false);
    if (!plan.ok) expect(plan.reason).toContain("beyond declared total");
  });

  it("rejects duplicates and negative seqs", () => {
    expect(planAssembly([...refs(0), ...refs(0)], 2).ok).toBe(false);
    expect(planAssembly(refs(-1), 1).ok).toBe(false);
  });
});

describe("planAssembly with unknown total (interruption recovery)", () => {
  it("salvages the contiguous prefix when the tail was lost", () => {
    // App was killed at chunk 5; chunk 4 upload never completed.
    const plan = planAssembly(refs(0, 1, 2, 3, 5), null);
    expect(plan).toEqual({ ok: true, orderedSeqs: [0, 1, 2, 3] });
  });

  it("salvages everything when all chunks arrived", () => {
    const plan = planAssembly(refs(0, 1, 2), null);
    expect(plan).toEqual({ ok: true, orderedSeqs: [0, 1, 2] });
  });

  it("fails loudly when chunk 0 is gone — no silent audio loss", () => {
    const plan = planAssembly(refs(1, 2), null);
    expect(plan.ok).toBe(false);
    if (!plan.ok) expect(plan.reason).toContain("chunk 0");
  });

  it("fails when nothing was uploaded", () => {
    expect(planAssembly([], null).ok).toBe(false);
  });
});

describe("verifyChunkChecksum", () => {
  it("accepts a correct digest (case-insensitive) and rejects a wrong one", () => {
    const body = Buffer.from("opus-bytes");
    const digest = createHash("sha256").update(body).digest("hex");
    expect(verifyChunkChecksum(body, digest)).toBe(true);
    expect(verifyChunkChecksum(body, digest.toUpperCase())).toBe(true);
    expect(verifyChunkChecksum(Buffer.from("tampered"), digest)).toBe(false);
  });
});
