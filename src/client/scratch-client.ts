import { Pool, type QueryResultRow } from "pg";

import { ModelClient } from "./query-builder";

export class ScratchClient {
  private readonly pool: Pool;

  public constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  public async connect(): Promise<void> {
    await this.pool.query("SELECT 1");
  }

  public async disconnect(): Promise<void> {
    await this.pool.end();
  }

  public getModelClient<T extends QueryResultRow, TCreate extends Record<string, unknown>>(
    tableName: string,
  ): ModelClient<T, TCreate> {
    return new ModelClient<T, TCreate>(this.pool, tableName);
  }
}
