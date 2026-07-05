import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { config } from "../config";

/**
 * Thin query interface so services can be unit-tested against a fake without
 * a live Postgres. Everything data-access takes a `Db`, not a `Pool`.
 */
export interface Db {
  query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: R[]; rowCount: number }>;
}

@Injectable()
export class DbService implements Db, OnModuleDestroy {
  private readonly pool = new Pool({ connectionString: config().DATABASE_URL });

  async query<R extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) {
    const res = await this.pool.query<R>(text, params as never[]);
    return { rows: res.rows, rowCount: res.rowCount ?? 0 };
  }

  /** Run `fn` inside a transaction; rolls back on throw. */
  async tx<T>(fn: (client: Db) => Promise<T>): Promise<T> {
    const client: PoolClient = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const wrapped: Db = {
        query: async (text, params) => {
          const res = await client.query(text, params as never[]);
          return { rows: res.rows, rowCount: res.rowCount ?? 0 };
        },
      };
      const out = await fn(wrapped);
      await client.query("COMMIT");
      return out;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
