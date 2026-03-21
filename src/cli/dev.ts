import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { loadScratchORMConfig } from "../config/loader";
import { DockerManager } from "../docker";

const POSTGRES_IMAGE = "postgres:latest";

function buildConnectionString(
  user: string,
  password: string,
  port: number,
  database: string,
): string {
  return `postgresql://${user}:${password}@localhost:${port}/${database}`;
}

function writeDatabaseUrlToEnv(connectionString: string): void {
  const envPath = join(process.cwd(), ".env");
  const nextLine = `DATABASE_URL=${connectionString}`;

  if (!existsSync(envPath)) {
    writeFileSync(envPath, `${nextLine}\n`, "utf8");
    return;
  }

  const existing = readFileSync(envPath, "utf8").replace(/\r\n/g, "\n");
  const lines = existing === "" ? [] : existing.split("\n");
  let didReplace = false;

  const updatedLines = lines.map((line) => {
    if (line.startsWith("DATABASE_URL=")) {
      didReplace = true;
      return nextLine;
    }

    return line;
  });

  if (!didReplace) {
    if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1] === "") {
      updatedLines.pop();
    }

    updatedLines.push(nextLine);
  }

  writeFileSync(envPath, `${updatedLines.join("\n")}\n`, "utf8");
}

export async function dev(): Promise<void> {
  try {
    const config = loadScratchORMConfig();
    const dockerManager = new DockerManager();
    const { containerName, port, name, user, password } = config.database;

    if (!(await dockerManager.isDockerRunning())) {
      console.error("✖ Docker is not running. Please start Docker Desktop and try again.");
      process.exit(1);
    }

    const connectionString = buildConnectionString(user, password, port, name);

    if (await dockerManager.isContainerRunning(containerName)) {
      writeDatabaseUrlToEnv(connectionString);
      console.log("✔ PostgreSQL is already running.");
      console.log(`→ Connection string: ${connectionString}`);
      return;
    }

    if (await dockerManager.containerExists(containerName)) {
      await dockerManager.startContainer(containerName);
      await dockerManager.waitForReady("127.0.0.1", port, 60);
      writeDatabaseUrlToEnv(connectionString);
      console.log("✔ PostgreSQL started.");
      console.log(`→ Connection string: ${connectionString}`);
      return;
    }

    await dockerManager.createAndStartPostgres({
      containerName,
      image: POSTGRES_IMAGE,
      port,
      database: name,
      user,
      password,
    });
    await dockerManager.waitForReady("127.0.0.1", port);
    writeDatabaseUrlToEnv(connectionString);
    console.log("✔ PostgreSQL provisioned and started.");
    console.log(`→ Connection string: ${connectionString}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    console.error(`✖ ${message}`);
    process.exit(1);
  }
}
