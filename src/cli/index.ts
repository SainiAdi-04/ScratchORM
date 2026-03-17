import { generate } from "./generate";

function printUsage(): void {
  console.log(`ScratchORM CLI
Usage: scratchorm <command>
Commands:
  generate    Read schema.scratch and generate typed client`);
}

function run(): void {
  const command = process.argv[2];

  if (command === "generate") {
    generate();
    return;
  }

  printUsage();
}

run();
