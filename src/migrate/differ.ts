import type { ParsedField, ParsedModel, ParsedSchema } from "../types/schema-types";

import type { ColumnChange, SchemaDiff, TableChange } from "./types";

function getModelMap(schema: ParsedSchema): Map<string, ParsedModel> {
  return new Map(schema.models.map((model) => [model.name, model]));
}

function getFieldMap(model: ParsedModel): Map<string, ParsedField> {
  return new Map(model.fields.map((field) => [field.name, field]));
}

function diffModelFields(previous: ParsedModel, current: ParsedModel): ColumnChange[] {
  const changes: ColumnChange[] = [];
  const previousFields = getFieldMap(previous);
  const currentFields = getFieldMap(current);

  for (const field of current.fields) {
    if (!previousFields.has(field.name)) {
      changes.push({ kind: "add", field });
    }
  }

  for (const field of previous.fields) {
    if (!currentFields.has(field.name)) {
      changes.push({ kind: "remove", fieldName: field.name });
    }
  }

  return changes;
}

export function diffSchemas(previous: ParsedSchema, current: ParsedSchema): SchemaDiff {
  const changes: TableChange[] = [];
  const previousModels = getModelMap(previous);
  const currentModels = getModelMap(current);

  for (const model of current.models) {
    const previousModel = previousModels.get(model.name);

    if (!previousModel) {
      changes.push({ kind: "create", model });
      continue;
    }

    const columnChanges = diffModelFields(previousModel, model);

    if (columnChanges.length > 0) {
      changes.push({
        kind: "alter",
        modelName: model.name,
        changes: columnChanges,
      });
    }
  }

  for (const model of previous.models) {
    if (!currentModels.has(model.name)) {
      changes.push({ kind: "drop", modelName: model.name });
    }
  }

  return { changes };
}
