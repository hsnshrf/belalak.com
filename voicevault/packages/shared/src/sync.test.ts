import { describe, expect, it } from "vitest";
import { mergeRecords, resolveConflict, type SyncableRow } from "./sync";

const row = (over: Partial<SyncableRow> = {}): SyncableRow => ({
  id: "r1",
  updatedAt: "2026-07-04T10:00:00.000Z",
  version: 1,
  deletedAt: null,
  ...over,
});

describe("resolveConflict (last-write-wins with tombstones)", () => {
  it("newer updatedAt wins regardless of version", () => {
    const newer = row({ updatedAt: "2026-07-04T10:00:01.000Z", version: 1 });
    const older = row({ updatedAt: "2026-07-04T10:00:00.000Z", version: 99 });
    expect(resolveConflict(newer, older)).toBe("local");
    expect(resolveConflict(older, newer)).toBe("remote");
  });

  it("same timestamp: higher version wins", () => {
    expect(resolveConflict(row({ version: 3 }), row({ version: 2 }))).toBe("local");
    expect(resolveConflict(row({ version: 2 }), row({ version: 3 }))).toBe("remote");
  });

  it("same timestamp and version: tombstone wins", () => {
    const dead = row({ deletedAt: "2026-07-04T10:00:00.000Z" });
    expect(resolveConflict(dead, row())).toBe("local");
    expect(resolveConflict(row(), dead)).toBe("remote");
  });

  it("identical rows are equal (no write)", () => {
    expect(resolveConflict(row(), row())).toBe("equal");
  });

  it("a delete on one device beats a stale edit on another", () => {
    const staleEdit = row({ updatedAt: "2026-07-04T09:59:00.000Z", version: 5 });
    const laterDelete = row({
      updatedAt: "2026-07-04T10:01:00.000Z",
      version: 2,
      deletedAt: "2026-07-04T10:01:00.000Z",
    });
    expect(resolveConflict(laterDelete, staleEdit)).toBe("local");
  });

  it("rejects mismatched ids and unparseable timestamps", () => {
    expect(() => resolveConflict(row(), row({ id: "other" }))).toThrow(/different rows/);
    expect(() => resolveConflict(row({ updatedAt: "garbage" }), row())).toThrow(/invalid updatedAt/);
  });
});

describe("mergeRecords", () => {
  it("applies unknown rows, including tombstones for never-seen rows", () => {
    const tombstone = row({ id: "never-seen", deletedAt: "2026-07-04T10:00:00.000Z" });
    const res = mergeRecords([tombstone], new Map());
    expect(res.toApply).toEqual([tombstone]);
    expect(res.rejected).toEqual([]);
  });

  it("partitions a mixed batch into apply/reject/unchanged", () => {
    const current = new Map<string, SyncableRow>([
      ["a", row({ id: "a", updatedAt: "2026-07-04T10:00:00.000Z" })],
      ["b", row({ id: "b", updatedAt: "2026-07-04T12:00:00.000Z" })],
      ["c", row({ id: "c" })],
    ]);
    const incoming = [
      row({ id: "a", updatedAt: "2026-07-04T11:00:00.000Z" }), // newer → apply
      row({ id: "b", updatedAt: "2026-07-04T11:00:00.000Z" }), // older → reject
      row({ id: "c" }), // identical → unchanged
      row({ id: "d" }), // new → apply
    ];
    const res = mergeRecords(incoming, current);
    expect(res.toApply.map((r) => r.id)).toEqual(["a", "d"]);
    expect(res.rejected.map((r) => r.id)).toEqual(["b"]);
    expect(res.unchanged.map((r) => r.id)).toEqual(["c"]);
  });
});
