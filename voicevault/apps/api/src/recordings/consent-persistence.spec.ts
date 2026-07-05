import { describe, expect, it } from "vitest";
import type { CreateRecordingInput } from "@voicevault/shared";
import type { Db } from "../db/db.service";
import { RecordingsService, defaultTitle, type UpdateRecordingPatch } from "./recordings.service";

/**
 * Consent flag persistence — the compliance requirement is that the per-
 * recording consent acknowledgment (a) is written atomically with the
 * recording row, (b) records WHEN it was acknowledged, and (c) can never be
 * flipped after the fact through the metadata-update path.
 */

interface Captured {
  sql: string;
  params: unknown[];
}

function fakeDb(rowsForSelect: Record<string, unknown>[] = [{ id: "rec-1" }]): { db: Db; captured: Captured[] } {
  const captured: Captured[] = [];
  const db: Db = {
    async query(sql: string, params: unknown[] = []) {
      captured.push({ sql, params });
      // SELECTs (ownership checks) return the stub row; writes echo it back.
      return { rows: rowsForSelect as never[], rowCount: rowsForSelect.length };
    },
  };
  return { db, captured };
}

const baseInput: CreateRecordingInput = {
  clientId: "3b6f8e46-0f0e-4b1e-9f6a-25c9a8c1d001",
  sourceType: "call",
  captureStrategy: "speakerphone",
  qualityPreset: "standard",
  recordedAt: "2026-07-04T10:00:00.000Z",
  consentAcknowledged: true,
  announcementPlayed: true,
};

const service = () => new RecordingsService(undefined as never, undefined as never);

describe("consent flag persistence", () => {
  it("writes consent acknowledgment in the same INSERT as the recording", async () => {
    const { db, captured } = fakeDb();
    await service().create("user-1", baseInput, db);

    expect(captured).toHaveLength(1);
    const insert = captured[0]!;
    expect(insert.sql).toContain("INSERT INTO recordings");
    expect(insert.sql).toContain("consent_acknowledged");
    // $10 = consentAcknowledged, $11 = announcementPlayed (see column list)
    expect(insert.params[9]).toBe(true);
    expect(insert.params[10]).toBe(true);
    // consent_acknowledged_at derives from the flag inside the same statement.
    expect(insert.sql).toContain("CASE WHEN $10 THEN now() ELSE NULL END");
  });

  it("persists consent=false without a timestamp for plain mic notes", async () => {
    const { db, captured } = fakeDb();
    await service().create("user-1", { ...baseInput, sourceType: "mic", captureStrategy: "mic", consentAcknowledged: false, announcementPlayed: false }, db);
    expect(captured[0]!.params[9]).toBe(false);
  });

  it("metadata updates can never touch consent columns", async () => {
    const { db, captured } = fakeDb();
    const patch: UpdateRecordingPatch & Record<string, unknown> = {
      title: "Renamed",
      isFavorite: true,
      // A malicious/buggy client sneaking consent fields into the patch:
      consentAcknowledged: false,
      consent_acknowledged: false,
    };
    await service().update("user-1", "rec-1", patch, db);
    const updates = captured.filter((c) => c.sql.startsWith("UPDATE"));
    expect(updates.length).toBeGreaterThan(0);
    for (const u of updates) {
      // Reading consent columns back (RETURNING) is fine; writing them is not.
      const setClause = u.sql.split(/\bWHERE\b/)[0]!;
      expect(setClause).not.toContain("consent");
      expect(u.params).not.toContain(false);
    }
  });

  it("idempotent re-create (offline retry) does not rewrite consent", async () => {
    const { db, captured } = fakeDb();
    await service().create("user-1", baseInput, db);
    const insert = captured[0]!;
    // The conflict clause must be a no-op update, not a consent overwrite.
    expect(insert.sql).toContain("ON CONFLICT (user_id, client_id)");
    const doUpdate = insert.sql.slice(insert.sql.indexOf("DO UPDATE"));
    expect(doUpdate.split("RETURNING")[0]).not.toContain("consent");
  });
});

describe("defaultTitle", () => {
  it("is date + time, zero-padded", () => {
    expect(defaultTitle(new Date(2026, 0, 5, 9, 7))).toBe("2026-01-05 09:07");
  });
});
