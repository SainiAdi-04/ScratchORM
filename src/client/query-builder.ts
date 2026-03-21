import type { Pool, QueryResultRow } from "pg";

import type { FindManyOptions, FindOneOptions, SelectClause, WhereClause } from "./types";

type SqlFragment = {
  text: string;
  values: readonly unknown[];
};

function escapeIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, "\"\"")}"`;
}

function getTypedKeys<T extends object>(value: T): Array<Extract<keyof T, string>> {
  return Object.keys(value) as Array<Extract<keyof T, string>>;
}

function buildSelectClause<T extends QueryResultRow>(select?: SelectClause<T>): string {
  if (!select) {
    return "*";
  }

  const selectedColumns = getTypedKeys(select).filter((key) => select[key] === true);

  if (selectedColumns.length === 0) {
    return "*";
  }

  return selectedColumns.map((column) => escapeIdentifier(column)).join(", ");
}

function buildWhereClause<T extends QueryResultRow>(
  where: WhereClause<T> | undefined,
  startingIndex = 1,
): SqlFragment {
  if (!where) {
    return { text: "", values: [] };
  }

  const keys = getTypedKeys(where);

  if (keys.length === 0) {
    return { text: "", values: [] };
  }

  const conditions = keys.map((key, index) => `${escapeIdentifier(key)} = $${startingIndex + index}`);
  const values = keys.map((key) => where[key]);

  return {
    text: ` WHERE ${conditions.join(" AND ")}`,
    values,
  };
}

function assertWhereClauseHasFields<T extends QueryResultRow>(where: WhereClause<T>, operation: string): void {
  if (getTypedKeys(where).length === 0) {
    throw new Error(`${operation} requires at least one where field.`);
  }
}

export class ModelClient<T extends QueryResultRow, TCreate extends Record<string, unknown>> {
  public constructor(
    private readonly pool: Pool,
    private readonly tableName: string,
  ) {}

  public async findMany(options?: FindManyOptions<T>): Promise<T[]> {
    const values: unknown[] = [];
    let query = `SELECT ${buildSelectClause(options?.select)} FROM ${escapeIdentifier(this.tableName)}`;

    const whereClause = buildWhereClause(options?.where);
    query += whereClause.text;
    values.push(...whereClause.values);

    if (options?.orderBy) {
      const direction = options.orderBy.direction.toUpperCase();
      query += ` ORDER BY ${escapeIdentifier(String(options.orderBy.field))} ${direction}`;
    }

    if (options?.limit !== undefined) {
      values.push(options.limit);
      query += ` LIMIT $${values.length}`;
    }

    const result = await this.pool.query<T>(query, values);
    return result.rows;
  }

  public async findOne(options: FindOneOptions<T>): Promise<T | null> {
    assertWhereClauseHasFields(options.where, "findOne");

    const values: unknown[] = [];
    let query = `SELECT ${buildSelectClause(options.select)} FROM ${escapeIdentifier(this.tableName)}`;

    const whereClause = buildWhereClause(options.where);
    query += whereClause.text;
    values.push(...whereClause.values);
    query += " LIMIT 1";

    const result = await this.pool.query<T>(query, values);
    return result.rows[0] ?? null;
  }

  public async create(data: TCreate): Promise<T> {
    const keys = getTypedKeys(data);
    let query = `INSERT INTO ${escapeIdentifier(this.tableName)}`;
    let values: unknown[] = [];

    if (keys.length === 0) {
      query += " DEFAULT VALUES RETURNING *";
    } else {
      const columns = keys.map((key) => escapeIdentifier(key)).join(", ");
      const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");

      values = keys.map((key) => data[key]);
      query += ` (${columns}) VALUES (${placeholders}) RETURNING *`;
    }

    const result = await this.pool.query<T>(query, values);
    const row = result.rows[0];

    if (!row) {
      throw new Error(`Failed to create row in ${this.tableName}.`);
    }

    return row;
  }

  public async update(where: WhereClause<T>, data: Partial<TCreate>): Promise<T | null> {
    assertWhereClauseHasFields(where, "update");

    const dataKeys = getTypedKeys(data);

    if (dataKeys.length === 0) {
      throw new Error("update requires at least one data field.");
    }

    const setClause = dataKeys
      .map((key, index) => `${escapeIdentifier(key)} = $${index + 1}`)
      .join(", ");
    const setValues = dataKeys.map((key) => data[key]);
    const whereClause = buildWhereClause(where, dataKeys.length + 1);
    const query = `UPDATE ${escapeIdentifier(this.tableName)} SET ${setClause}${whereClause.text} RETURNING *`;

    const result = await this.pool.query<T>(query, [...setValues, ...whereClause.values]);
    return result.rows[0] ?? null;
  }

  public async delete(where: WhereClause<T>): Promise<boolean> {
    assertWhereClauseHasFields(where, "delete");

    const whereClause = buildWhereClause(where);
    const query = `DELETE FROM ${escapeIdentifier(this.tableName)}${whereClause.text} RETURNING *`;
    const result = await this.pool.query<T>(query, [...whereClause.values]);

    return result.rowCount !== null && result.rowCount > 0;
  }
}
