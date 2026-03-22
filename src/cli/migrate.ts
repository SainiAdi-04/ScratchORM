import fs from "node:fs";
import path from "node:path";

import { parseScratchSchema } from "../parser/schema-parser";
import {
  diffSchemas,
  generateMigrationSql,
  loadSnapshot,
  runMigrations,
  saveSnapshot,
} from "../migrate/index";
import type { ColumnChange, TableChange } from "../migrate/types";
import type { ParsedSchema } from "../types/schema-types";

function loadDatabaseUrl(): string {
  const envPath = path.resolve(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) {
    throw new Error(`Missing .env file at ${envPath}`);
  }

  const contents = fs.readFileSync(envPath, "utf8");
  const lines = contents.split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine === "" || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();

    if (key !== "DATABASE_URL") {
      continue;
    }

    return rawValue.replace(/^['"]|['"]$/g, "");
  }

  throw new Error(`DATABASE_URL was not found in ${envPath}`);
}

function formatColumnChange(modelName: string, change: ColumnChange): string {
  if (change.kind === "add") {
    return `  ~ alter table "${modelName}" — add column "${change.field.name}"`;
  }

  return `  ~ alter table "${modelName}" — drop column "${change.fieldName}"`;
}

function formatTableChange(change: TableChange): string[] {
  if (change.kind === "create") {
    return [`  + create table "${change.model.name}"`];
  }

  if (change.kind === "drop") {
    return [`  - drop table "${change.modelName}"`];
  }

  return change.changes.map((columnChange) => formatColumnChange(change.modelName, columnChange));
}

export async function migrate(): Promise<void> {
  try {
    const connectionString = loadDatabaseUrl();
    const schemaPath = path.resolve(process.cwd(), "schema.scratch");
    const schemaSource = fs.readFileSync(schemaPath, "utf8");
    const currentSchema = parseScratchSchema(schemaSource);
    const previousSnapshot = await loadSnapshot(connectionString);
    const previousSchema: ParsedSchema = previousSnapshot ?? { models: [] };
    const diff = diffSchemas(previousSchema, currentSchema);

    if (diff.changes.length === 0) {
      console.log("✔ Schema is up to date. No migrations needed.");
      return;
    }

    console.log("Changes detected:");

    for (const change of diff.changes) {
      const lines = formatTableChange(change);

      for (const line of lines) {
        console.log(line);
      }
    }

    const sqls = generateMigrationSql(diff);

    await runMigrations(connectionString, sqls);
    await saveSnapshot(connectionString, currentSchema);

    console.log(`✔ Migration complete. ${sqls.length} changes applied.`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown migration error.";
    console.error(`✖ ${message}`);
    process.exit(1);
  }
}
