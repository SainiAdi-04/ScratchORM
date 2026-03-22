import fs from "node:fs";
import path from "node:path";

import type { ModelClient } from "../client";
import { ScratchClient } from "../client";
import { runMigrations } from "../migrate/runner";
import type { CreatePostInput, CreateUserInput, Post, User } from "../generated/types";

const initialMigrationSqls = [
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "posts" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
];

function loadDatabaseUrl(): string {
  const envPath = path.resolve(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) {
    throw new Error(`Missing .env file at ${envPath}`);
  }

  const contents = fs.readFileSync(envPath, "utf8");
  const lines = contents.split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine === "" || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();

    if (key !== "DATABASE_URL") {
      continue;
    }

    return rawValue.replace(/^['"]|['"]$/g, "");
  }

  throw new Error(`DATABASE_URL was not found in ${envPath}`);
}

function logStep(label: string, value: unknown): void {
  console.log(label, value);
}

async function main(): Promise<void> {
  const connectionString = loadDatabaseUrl();
  const client = new ScratchClient(connectionString);

  await runMigrations(connectionString, initialMigrationSqls);

  try {
    await client.connect();

    const users: ModelClient<User, CreateUserInput> = client.getModelClient<User, CreateUserInput>("users");
    const posts: ModelClient<Post, CreatePostInput> = client.getModelClient<Post, CreatePostInput>("posts");

    const alice = await users.create({
      email: "alice@example.com",
      username: "alice",
      name: "Alice",
    });
    logStep("[create user]", alice);

    const bob = await users.create({
      email: "bob@example.com",
      username: "bob",
      name: "Bob",
    });
    logStep("[create second user]", bob);

    const allUsers = await users.findMany();
    logStep("[findMany users]", allUsers);

    const foundAlice = await users.findOne({
      where: { email: "alice@example.com" },
    });
    logStep("[findOne user]", foundAlice);

    const updatedAlice = await users.update(
      { email: "alice@example.com" },
      { isActive: false },
    );
    logStep("[update user]", updatedAlice);

    const post = await posts.create({
      title: "Hello ScratchORM",
    });
    logStep("[create post]", post);

    const allPosts = await posts.findMany();
    logStep("[findMany posts]", allPosts);

    const deletedPost = await posts.delete({
      id: post.id,
    });
    logStep("[delete post]", deletedPost);

    const finalUsers = await users.findMany();
    logStep("[findMany users again]", finalUsers);
  } finally {
    await client.disconnect();
  }
}

void main();
