import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { generateTypes } from "../generator";
import { parseScratchSchema } from "../parser/schema-parser";

export function generate(): void {
  try {
    const workingDirectory = process.cwd();
    const schemaPath = join(workingDirectory, "schema.scratch");
    const outputDirectory = join(workingDirectory,"src", "generated");
    const outputPath = join(outputDirectory, "types.ts");

    const schemaSource = readFileSync(schemaPath, "utf8");
    const parsedSchema = parseScratchSchema(schemaSource);
    const generatedSource = generateTypes(parsedSchema);

    mkdirSync(outputDirectory, { recursive: true });
    writeFileSync(outputPath, generatedSource, "utf8");

    console.log("✔ Generated types to src/generated/types.ts");
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred while generating types.";
    console.error(`ScratchORM generate failed: ${message}`);
    process.exit(1);
  }
}
