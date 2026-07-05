import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { AuthTokens, LoginInput, SignupInput } from "@voicevault/shared";
import { DEFAULT_CATEGORIES } from "@voicevault/shared";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../config";
import type { Db } from "../db/db.service";
import { DbService } from "../db/db.service";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

@Injectable()
export class AuthService {
  constructor(private readonly db: DbService) {}

  async signup(input: SignupInput): Promise<AuthTokens> {
    const hash = await bcrypt.hash(input.password, 12);
    return this.db.tx(async (tx) => {
      const existing = await tx.query("SELECT id FROM users WHERE lower(email) = lower($1) AND deleted_at IS NULL", [
        input.email,
      ]);
      if (existing.rowCount > 0) throw new ConflictException("Email already registered");
      const { rows } = await tx.query<{ id: string }>(
        `INSERT INTO users (email, password_hash, display_name, provider)
         VALUES ($1, $2, $3, 'email') RETURNING id`,
        [input.email, hash, input.displayName],
      );
      const userId = rows[0]!.id;
      await seedDefaultCategories(tx, userId);
      return this.issueTokens(tx, userId);
    });
  }

  async login(input: LoginInput): Promise<AuthTokens> {
    const { rows } = await this.db.query<{ id: string; password_hash: string | null }>(
      "SELECT id, password_hash FROM users WHERE lower(email) = lower($1) AND deleted_at IS NULL",
      [input.email],
    );
    const user = rows[0];
    // Compare against a constant hash when the user is unknown so the timing
    // of the response doesn't leak which emails exist.
    const targetHash = user?.password_hash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
    const ok = await bcrypt.compare(input.password, targetHash);
    if (!user || !user.password_hash || !ok) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return this.issueTokens(this.db, user.id);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { rows } = await this.db.query<{ id: string; user_id: string; expires_at: Date; revoked_at: Date | null }>(
      "SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1",
      [sha256(refreshToken)],
    );
    const row = rows[0];
    if (!row || row.revoked_at || row.expires_at.getTime() < Date.now()) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    // Rotate: revoke the used token, issue a fresh pair.
    await this.db.query("UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1", [row.id]);
    return this.issueTokens(this.db, row.user_id);
  }

  /** Called by OAuth callback after the provider verified identity. */
  async loginOrSignupOAuth(params: {
    provider: "google" | "microsoft" | "apple";
    subject: string;
    email: string;
    displayName: string;
  }): Promise<AuthTokens> {
    return this.db.tx(async (tx) => {
      const bySubject = await tx.query<{ id: string }>(
        "SELECT id FROM users WHERE provider = $1 AND provider_subject = $2 AND deleted_at IS NULL",
        [params.provider, params.subject],
      );
      let userId = bySubject.rows[0]?.id;
      if (!userId) {
        const { rows } = await tx.query<{ id: string }>(
          `INSERT INTO users (email, display_name, provider, provider_subject)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [params.email, params.displayName, params.provider, params.subject],
        );
        userId = rows[0]!.id;
        await seedDefaultCategories(tx, userId);
      }
      return this.issueTokens(tx, userId);
    });
  }

  private async issueTokens(db: Db, userId: string): Promise<AuthTokens> {
    const cfg = config();
    const accessToken = jwt.sign({}, cfg.JWT_SECRET, {
      subject: userId,
      expiresIn: cfg.JWT_ACCESS_TTL_SECONDS,
    });
    const refreshToken = randomBytes(32).toString("hex");
    await db.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() + $3 * interval '1 second')",
      [userId, sha256(refreshToken), cfg.JWT_REFRESH_TTL_SECONDS],
    );
    return { accessToken, refreshToken, expiresInSeconds: cfg.JWT_ACCESS_TTL_SECONDS };
  }
}

async function seedDefaultCategories(db: Db, userId: string): Promise<void> {
  for (const name of DEFAULT_CATEGORIES) {
    await db.query(
      "INSERT INTO categories (user_id, name, is_default) VALUES ($1, $2, true) ON CONFLICT DO NOTHING",
      [userId, name],
    );
  }
}
