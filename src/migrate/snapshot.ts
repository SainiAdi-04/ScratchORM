import { Pool } from "pg";

import type { FieldModifier, FieldType, ParsedField, ParsedModel, ParsedSchema } from "../types/schema-types";

const MIGRATIONS_TABLE_NAME = "_scratchorm_migrations";

const CREATE_MIGRATIONS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE_NAME}" (
  "id" SERIAL PRIMARY KEY,
  "snapshot" JSONB NOT NULL,
  "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

type SnapshotRow = {
  snapshot: unknown;
};

type TableExistsRow = {
  regclass: string | null;
};

function isFieldType(value: unknown): value is FieldType {
  return value === "String" || value === "Int" || value === "Boolean" || value === "DateTime";
}

function isFieldModifier(value: unknown): value is FieldModifier {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const modifier = value as Record<string, unknown>;

  if (modifier.type === "id" || modifier.type === "unique" || modifier.type === "optional") {
    return true;
  }

  return (
    modifier.type === "default"
    && (
      typeof modifier.value === "string"
      || typeof modifier.value === "number"
      || typeof modifier.value === "boolean"
    )
  );
}

function isParsedField(value: unknown): value is ParsedField {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const field = value as Record<string, unknown>;

  return (
    typeof field.name === "string"
    && isFieldType(field.type)
    && Array.isArray(field.modifiers)
    && field.modifiers.every((modifier) => isFieldModifier(modifier))
  );
}

function isParsedModel(value: unknown): value is ParsedModel {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const model = value as Record<string, unknown>;

  return (
    typeof model.name === "string"
    && Array.isArray(model.fields)
    && model.fields.every((field) => isParsedField(field))
  );
}

function isParsedSchema(value: unknown): value is ParsedSchema {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const schema = value as Record<string, unknown>;

  return Array.isArray(schema.models) && schema.models.every((model) => isParsedModel(model));
}

export async function loadSnapshot(connectionString: string): Promise<ParsedSchema | null> {
  const pool = new Pool({ connectionString });

  try {
    const tableCheck = await pool.query<TableExistsRow>(
      "SELECT to_regclass($1) AS regclass",
      [MIGRATIONS_TABLE_NAME],
    );

    if (tableCheck.rows[0]?.regclass === null) {
      return null;
    }

    const result = await pool.query<SnapshotRow>(
      `SELECT "snapshot"
       FROM "${MIGRATIONS_TABLE_NAME}"
       ORDER BY "appliedAt" DESC, "id" DESC
       LIMIT 1`,
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    if (!isParsedSchema(row.snapshot)) {
      throw new Error("Stored schema snapshot is invalid.");
    }

    return row.snapshot;
  } finally {
    await pool.end();
  }
}

export async function saveSnapshot(connectionString: string, schema: ParsedSchema): Promise<void> {
  const pool = new Pool({ connectionString });

  try {
    await pool.query(CREATE_MIGRATIONS_TABLE_SQL);
    await pool.query(
      `INSERT INTO "${MIGRATIONS_TABLE_NAME}" ("snapshot") VALUES ($1)`,
      [JSON.stringify(schema)],
    );
  } finally {
    await pool.end();
  }
}
