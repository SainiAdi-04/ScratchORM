import { readFileSync } from "fs";
import { join } from "path";
import type { ScratchORMConfig } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRequiredString(
  source: Record<string, unknown>,
  key: string,
  parentKey: string,
): string {
  const value = source[key];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing or invalid "${parentKey}.${key}" in scratchorm.config.json.`);
  }

  return value;
}

function getRequiredNumber(
  source: Record<string, unknown>,
  key: string,
  parentKey: string,
): number {
  const value = source[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Missing or invalid "${parentKey}.${key}" in scratchorm.config.json.`);
  }

  return value;
}

export function loadScratchORMConfig(): ScratchORMConfig {
  const configPath = join(process.cwd(), "scratchorm.config.json");
  let fileContents: string;

  try {
    fileContents = readFileSync(configPath, "utf8");
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw new Error("Missing scratchorm.config.json in the current working directory.");
    }

    throw new Error(`Failed to read scratchorm.config.json: ${String(error)}`);
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(fileContents) as unknown;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid JSON.";
    throw new Error(`Failed to parse scratchorm.config.json: ${message}`);
  }

  if (!isRecord(parsed)) {
    throw new Error('Invalid scratchorm.config.json: expected a top-level "database" object.');
  }

  const databaseValue = parsed.database;

  if (!isRecord(databaseValue)) {
    throw new Error('Invalid scratchorm.config.json: missing required "database" object.');
  }

  return {
    database: {
      containerName: getRequiredString(databaseValue, "containerName", "database"),
      port: getRequiredNumber(databaseValue, "port", "database"),
      name: getRequiredString(databaseValue, "name", "database"),
      user: getRequiredString(databaseValue, "user", "database"),
      password: getRequiredString(databaseValue, "password", "database"),
    },
  };
}
