import type { FieldModifier, FieldType, ParsedField, ParsedModel } from "../types/schema-types";

import type { ColumnChange, SchemaDiff, TableChange } from "./types";

function escapeIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, "\"\"")}"`;
}

function hasModifier(field: ParsedField, modifierType: FieldModifier["type"]): boolean {
  return field.modifiers.some((modifier) => modifier.type === modifierType);
}

function getDefaultModifier(field: ParsedField): Extract<FieldModifier, { type: "default" }> | null {
  return (
    field.modifiers.find(
      (modifier): modifier is Extract<FieldModifier, { type: "default" }> =>
        modifier.type === "default",
    ) ?? null
  );
}

function mapFieldType(fieldType: FieldType): string {
  if (fieldType === "String") {
    return "TEXT";
  }

  if (fieldType === "Int") {
    return "INTEGER";
  }

  if (fieldType === "Boolean") {
    return "BOOLEAN";
  }

  return "TIMESTAMPTZ";
}

function formatDefaultValue(value: string | number | boolean): string {
  if (typeof value === "string") {
    if (value === "now()") {
      return "now()";
    }

    return `'${value.replace(/'/g, "''")}'`;
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

function resolveColumnType(field: ParsedField): string {
  const isIntId = field.type === "Int" && hasModifier(field, "id");
  const defaultModifier = getDefaultModifier(field);

  if (isIntId || defaultModifier?.value === "autoincrement()") {
    return "SERIAL";
  }

  return mapFieldType(field.type);
}

function buildColumnDefinition(field: ParsedField): string {
  const parts: string[] = [escapeIdentifier(field.name), resolveColumnType(field)];
  const defaultModifier = getDefaultModifier(field);

  if (hasModifier(field, "id")) {
    parts.push("PRIMARY KEY");
  }

  if (hasModifier(field, "unique")) {
    parts.push("UNIQUE");
  }

  if (defaultModifier && defaultModifier.value !== "autoincrement()") {
    parts.push(`DEFAULT ${formatDefaultValue(defaultModifier.value)}`);
  }

  if (!hasModifier(field, "optional") && !defaultModifier && !hasModifier(field, "id")) {
    parts.push("NOT NULL");
  }

  return parts.join(" ");
}

function generateCreateTableSql(model: ParsedModel): string {
  const columns = model.fields.map((field) => `  ${buildColumnDefinition(field)}`).join(",\n");
  return `CREATE TABLE ${escapeIdentifier(model.name)} (\n${columns}\n)`;
}

function generateAlterColumnSql(modelName: string, change: ColumnChange): string {
  if (change.kind === "add") {
    return `ALTER TABLE ${escapeIdentifier(modelName)} ADD COLUMN ${buildColumnDefinition(change.field)}`;
  }

  return `ALTER TABLE ${escapeIdentifier(modelName)} DROP COLUMN IF EXISTS ${escapeIdentifier(change.fieldName)}`;
}

function generateTableChangeSql(change: TableChange): string[] {
  if (change.kind === "create") {
    return [generateCreateTableSql(change.model)];
  }

  if (change.kind === "drop") {
    return [`DROP TABLE IF EXISTS ${escapeIdentifier(change.modelName)}`];
  }

  return change.changes.map((columnChange) => generateAlterColumnSql(change.modelName, columnChange));
}

export function generateMigrationSql(diff: SchemaDiff): string[] {
  return diff.changes.flatMap((change) => generateTableChangeSql(change));
}
