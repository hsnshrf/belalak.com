import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { AuthGuard, CurrentUser, type AuthUser } from "../common/auth.guard";
import { ZodPipe } from "../common/zod.pipe";
import { DbService } from "../db/db.service";

const createFolderSchema = z.object({
  name: z.string().min(1).max(120),
  parentId: z.string().uuid().nullable().optional(),
});
const patchFolderSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  parentId: z.string().uuid().nullable().optional(),
});
const createTagSchema = z.object({ name: z.string().min(1).max(60) });
const tagQuerySchema = z.object({ q: z.string().max(60).optional() });

@Controller("v1")
@UseGuards(AuthGuard)
export class OrganizationController {
  constructor(private readonly db: DbService) {}

  // ── Folders (nested, user-created) ──────────────────────────────────────────

  @Get("folders")
  async listFolders(@CurrentUser() user: AuthUser) {
    const { rows } = await this.db.query(
      `SELECT id, parent_id AS "parentId", name, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM folders WHERE user_id = $1 AND deleted_at IS NULL ORDER BY name`,
      [user.userId],
    );
    return rows;
  }

  @Post("folders")
  async createFolder(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(createFolderSchema)) body: z.infer<typeof createFolderSchema>,
  ) {
    if (body.parentId) await this.requireFolder(user.userId, body.parentId);
    const { rows } = await this.db.query(
      `INSERT INTO folders (user_id, name, parent_id) VALUES ($1, $2, $3)
       RETURNING id, parent_id AS "parentId", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [user.userId, body.name.trim(), body.parentId ?? null],
    );
    return rows[0];
  }

  @Patch("folders/:id")
  async updateFolder(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodPipe(patchFolderSchema)) body: z.infer<typeof patchFolderSchema>,
  ) {
    await this.requireFolder(user.userId, id);
    if (body.parentId) {
      await this.requireFolder(user.userId, body.parentId);
      await this.assertNoCycle(user.userId, id, body.parentId);
    }
    const { rows } = await this.db.query(
      `UPDATE folders SET
         name = coalesce($3, name),
         parent_id = CASE WHEN $4 THEN $5::uuid ELSE parent_id END,
         version = version + 1
       WHERE id = $1 AND user_id = $2
       RETURNING id, parent_id AS "parentId", name, updated_at AS "updatedAt"`,
      [id, user.userId, body.name?.trim() ?? null, body.parentId !== undefined, body.parentId ?? null],
    );
    return rows[0];
  }

  /** Delete folder; contained recordings move to the parent (or root). */
  @Delete("folders/:id")
  @HttpCode(204)
  async deleteFolder(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    const folder = await this.requireFolder(user.userId, id);
    await this.db.query("UPDATE recordings SET folder_id = $2, version = version + 1 WHERE folder_id = $1", [
      id,
      (folder as { parentId: string | null }).parentId,
    ]);
    await this.db.query("UPDATE folders SET parent_id = $2, version = version + 1 WHERE parent_id = $1", [
      id,
      (folder as { parentId: string | null }).parentId,
    ]);
    await this.db.query(
      "UPDATE folders SET deleted_at = now(), version = version + 1 WHERE id = $1 AND user_id = $2",
      [id, user.userId],
    );
  }

  // ── Categories (single-select, defaults seeded per user) ───────────────────

  @Get("categories")
  async listCategories(@CurrentUser() user: AuthUser) {
    const { rows } = await this.db.query(
      `SELECT id, name, is_default AS "isDefault" FROM categories WHERE user_id = $1 ORDER BY is_default DESC, name`,
      [user.userId],
    );
    return rows;
  }

  // ── Tags (multi-select, free-form, autocomplete) ────────────────────────────

  @Get("tags")
  async listTags(@CurrentUser() user: AuthUser, @Query(new ZodPipe(tagQuerySchema)) q: z.infer<typeof tagQuerySchema>) {
    if (q.q) {
      // pg_trgm-backed fuzzy autocomplete
      const { rows } = await this.db.query(
        `SELECT id, name FROM tags
         WHERE user_id = $1 AND deleted_at IS NULL AND (name ILIKE $2 OR similarity(name, $3) > 0.3)
         ORDER BY (name ILIKE $2) DESC, similarity(name, $3) DESC, name LIMIT 20`,
        [user.userId, `${q.q}%`, q.q],
      );
      return rows;
    }
    const { rows } = await this.db.query(
      "SELECT id, name FROM tags WHERE user_id = $1 AND deleted_at IS NULL ORDER BY name LIMIT 200",
      [user.userId],
    );
    return rows;
  }

  /** Idempotent on case-insensitive name — retries and races return the row. */
  @Post("tags")
  async createTag(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(createTagSchema)) body: z.infer<typeof createTagSchema>,
  ) {
    const name = body.name.trim();
    const existing = await this.db.query(
      "SELECT id, name FROM tags WHERE user_id = $1 AND lower(name) = lower($2) AND deleted_at IS NULL",
      [user.userId, name],
    );
    if (existing.rows[0]) return existing.rows[0];
    const { rows } = await this.db.query(
      "INSERT INTO tags (user_id, name) VALUES ($1, $2) RETURNING id, name",
      [user.userId, name],
    );
    return rows[0];
  }

  private async requireFolder(userId: string, id: string) {
    const { rows } = await this.db.query(
      `SELECT id, parent_id AS "parentId" FROM folders WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId],
    );
    if (!rows[0]) throw new NotFoundException("Folder not found");
    return rows[0];
  }

  /** Prevent a folder becoming its own ancestor. */
  private async assertNoCycle(userId: string, folderId: string, newParentId: string): Promise<void> {
    let cursor: string | null = newParentId;
    for (let depth = 0; cursor && depth < 100; depth++) {
      if (cursor === folderId) {
        throw new NotFoundException("Cannot move a folder into its own subtree");
      }
      const res: { rows: { parent_id: string | null }[] } = await this.db.query<{ parent_id: string | null }>(
        "SELECT parent_id FROM folders WHERE id = $1 AND user_id = $2",
        [cursor, userId],
      );
      cursor = res.rows[0]?.parent_id ?? null;
    }
  }
}
