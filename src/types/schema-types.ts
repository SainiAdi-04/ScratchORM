export type FieldType = "String" | "Int" | "Boolean" | "DateTime";

export type FieldModifier =
  | { type: "id" }
  | { type: "unique" }
  | { type: "optional" }
  | {
      type: "default";
      value: string | number | boolean;
    };

export interface ParsedField {
  name: string;
  type: FieldType;
  modifiers: FieldModifier[];
}

export interface ParsedModel {
  name: string;
  fields: ParsedField[];
}

export interface ParsedSchema {
  models: ParsedModel[];
}
