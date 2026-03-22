#!/usr/bin/env node
import { dev } from "./dev";
import { generate } from "./generate";
import { migrate } from "./migrate";

function printUsage(): void {
  console.log(`ScratchORM CLI
Usage: scratchorm <command>
Commands:
  dev         Start local PostgreSQL for ScratchORM
  generate    Read schema.scratch and generate typed client
  migrate     Diff schema, run SQL migrations, and save a snapshot`);
}

async function run(): Promise<void> {
  const command = process.argv[2];

  if (command === "generate") {
    generate();
    return;
  }

  if (command === "dev") {
    await dev();
    return;
  }

  if (command === "migrate") {
    await migrate();
    return;
  }

  printUsage();
}

void run();
