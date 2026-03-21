import { Pool } from "pg";

export async function runMigrations(connectionString: string, sqls: string[]): Promise<void> {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const sql of sqls) {
      await client.query(sql);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
