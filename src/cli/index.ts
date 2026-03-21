import { dev } from "./dev";
import { generate } from "./generate";

function printUsage(): void {
  console.log(`ScratchORM CLI
Usage: scratchorm <command>
Commands:
  dev         Start local PostgreSQL for ScratchORM
  generate    Read schema.scratch and generate typed client`);
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

  printUsage();
}

void run();
