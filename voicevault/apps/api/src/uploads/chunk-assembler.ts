import { createHash } from "node:crypto";

/**
 * Pure logic for chunked-upload assembly — kept side-effect-free so the
 * "recordings survive connectivity loss" invariants are unit-testable.
 *
 * Chunks are sequential slices of ONE continuous encoded stream (MediaRecorder
 * timeslice blobs on web, file byte-ranges on mobile), so byte concatenation
 * in seq order reconstructs a valid audio file.
 */

export interface ChunkRef {
  seq: number;
  sha256: string;
}

export type AssemblyPlan =
  | { ok: true; orderedSeqs: number[] }
  | { ok: false; missing: number[]; reason: string };

/**
 * Decide whether a set of uploaded chunks is complete and in what order to
 * concatenate them.
 *
 * - `totalChunks` known (client finished cleanly): require exactly seqs
 *   0..totalChunks-1.
 * - `totalChunks` unknown (client died mid-recording — interruption recovery):
 *   accept any contiguous prefix 0..max; a gap means an unrecoverable hole, so
 *   assembly stops at the gap and the caller salvages the prefix.
 */
export function planAssembly(chunks: ChunkRef[], totalChunks: number | null): AssemblyPlan {
  if (chunks.length === 0) {
    return { ok: false, missing: totalChunks ? range(0, totalChunks) : [0], reason: "no chunks uploaded" };
  }
  const seqs = new Set<number>();
  for (const c of chunks) {
    if (!Number.isInteger(c.seq) || c.seq < 0) {
      return { ok: false, missing: [], reason: `invalid seq ${c.seq}` };
    }
    if (seqs.has(c.seq)) {
      return { ok: false, missing: [], reason: `duplicate seq ${c.seq}` };
    }
    seqs.add(c.seq);
  }

  if (totalChunks !== null) {
    const missing = range(0, totalChunks).filter((s) => !seqs.has(s));
    const extras = [...seqs].filter((s) => s >= totalChunks);
    if (extras.length > 0) {
      return { ok: false, missing, reason: `chunks beyond declared total: ${extras.join(",")}` };
    }
    if (missing.length > 0) {
      return { ok: false, missing, reason: "missing chunks" };
    }
    return { ok: true, orderedSeqs: range(0, totalChunks) };
  }

  // Unknown total: salvage the longest contiguous prefix from 0.
  let end = 0;
  while (seqs.has(end)) end += 1;
  if (end === 0) {
    return { ok: false, missing: [0], reason: "chunk 0 never arrived" };
  }
  return { ok: true, orderedSeqs: range(0, end) };
}

/** Integrity check for one uploaded chunk body against its declared digest. */
export function verifyChunkChecksum(body: Uint8Array, declaredSha256: string): boolean {
  const actual = createHash("sha256").update(body).digest("hex");
  return actual === declaredSha256.toLowerCase();
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from }, (_, i) => from + i);
}
