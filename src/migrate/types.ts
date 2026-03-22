import type { ParsedField, ParsedModel } from "../types/schema-types";

export type ColumnChange =
  | { kind: "add"; field: ParsedField }
  | { kind: "remove"; fieldName: string };

export type TableChange =
  | { kind: "create"; model: ParsedModel }
  | { kind: "drop"; modelName: string }
  | { kind: "alter"; modelName: string; changes: ColumnChange[] };

export interface SchemaDiff {
  changes: TableChange[];
}
