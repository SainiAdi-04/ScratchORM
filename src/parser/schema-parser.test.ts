import { describe, it, expect } from "vitest";
import { parseScratchSchema } from "./schema-parser";

describe("Schema Parser", () => {
  it("should parse a valid simple model", () => {
    const input = `
      model User {
        id Int @id @default(autoincrement())
        name String
      }
    `;
    const schema = parseScratchSchema(input);

    expect(schema.models).toHaveLength(1);
    expect(schema.models[0].name).toBe("User");
    expect(schema.models[0].fields).toHaveLength(2);

    const [idField, nameField] = schema.models[0].fields;
    
    expect(idField.name).toBe("id");
    expect(idField.type).toBe("Int");
    expect(idField.modifiers).toEqual([
      { type: "id" },
      { type: "default", value: "autoincrement()" }
    ]);

    expect(nameField.name).toBe("name");
    expect(nameField.type).toBe("String");
    expect(nameField.modifiers).toEqual([]);
  });

  it("should handle all valid data types", () => {
    const input = `
      model Types {
        text String
        num Int
        bool Boolean
        date DateTime
      }
    `;
    const schema = parseScratchSchema(input);
    const types = schema.models[0].fields.map(f => f.type);
    expect(types).toEqual(["String", "Int", "Boolean", "DateTime"]);
  });

  it("should parse different default values correctly", () => {
    const input = `
      model Post {
        title String @default("Untitled")
        views Int @default(0)
        published Boolean @default(false)
        createdAt DateTime @default(now())
      }
    `;
    const schema = parseScratchSchema(input);
    
    expect(schema.models[0].fields[0].modifiers[0]).toEqual({ type: "default", value: "Untitled" });
    expect(schema.models[0].fields[1].modifiers[0]).toEqual({ type: "default", value: 0 });
    expect(schema.models[0].fields[2].modifiers[0]).toEqual({ type: "default", value: false });
    expect(schema.models[0].fields[3].modifiers[0]).toEqual({ type: "default", value: "now()" });
  });

  it("should throw an error for malformed input", () => {
    const input = `
      model User {
        name String
    `; // Missing closing brace

    expect(() => parseScratchSchema(input)).toThrow(/Unterminated model "User"/);
  });
});
