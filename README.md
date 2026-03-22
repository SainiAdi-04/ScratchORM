# ScratchORM
[![npm version](https://img.shields.io/npm/v/scratch-orm.svg)](https://www.npmjs.com/package/scratch-orm)
[![npm downloads](https://img.shields.io/npm/dm/scratch-orm.svg)](https://www.npmjs.com/package/scratch-orm)

A lightweight, type-safe PostgreSQL ORM built from scratch in TypeScript.

ScratchORM currently includes:
- A custom schema DSL and parser
- Generated TypeScript model and create-input types
- A generic query builder for CRUD operations
- Schema diffing and SQL migration generation
- A migration runner and snapshot system backed by `pg`
- Local PostgreSQL bootstrapping via Docker

The goal is simple: understand how an ORM works end to end without hiding the moving parts.


## Final Workflow

```text
1. Edit schema.scratch
2. npm run generate
3. npm run migrate
4. Use typed queries
```

That means your schema, database tables, migration snapshot, and generated TypeScript types stay in sync through one simple loop.

## How It Works

You define models in `schema.scratch`:

```scratch
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String   @optional
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String   @optional
  published Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

Then generate TypeScript types:

```bash
npm run generate
```

After that, apply schema changes to PostgreSQL and save a snapshot:

```bash
npm run migrate
```

That produces typed model definitions in [`src/generated/types.ts`](/home/aditya-saini/Desktop/ScratchORM/src/generated/types.ts), for example:

```ts
export interface User {
  id: number;
  email: string;
  name?: string;
  isActive: boolean;
  createdAt: Date;
}

export type CreateUserInput = {
  email: string;
  name?: string;
  isActive?: boolean;
  createdAt?: Date;
};
```

Those generated types plug directly into the query builder:

```ts
import { ScratchClient, type ModelClient } from "scratchorm";
import type { User, CreateUserInput } from "./src/generated/types";

const client = new ScratchClient(process.env.DATABASE_URL!);
const users: ModelClient<User, CreateUserInput> =
  client.getModelClient<User, CreateUserInput>("users");
```

## Query Builder

`ModelClient<T, TCreate>` currently supports:
- `findMany(options?)`
- `findOne(options)`
- `create(data)`
- `update(where, data)`
- `delete(where)`

All queries use parameterized SQL with `$1`, `$2`, and so on. Values are never interpolated into SQL strings.

Example:

```ts
const user = await users.create({
  email: "alice@example.com",
  name: "Alice",
});

const found = await users.findOne({
  where: { email: "alice@example.com" },
});

const updated = await users.update(
  { email: "alice@example.com" },
  { isActive: false },
);
```

Supported query options today:
- Equality-only `where`
- Field-level `select`
- Single-field `orderBy`
- `limit`

## Migrations

ScratchORM now has a full schema-to-migration pipeline:
- Parse the current `schema.scratch`
- Load the most recent saved schema snapshot from PostgreSQL
- Diff previous vs current schema
- Generate SQL for table and column changes
- Run all SQL in a transaction
- Save the new schema snapshot

The migration system lives under [`src/migrate/`](/home/aditya-saini/Desktop/ScratchORM/src/migrate) and includes:
- [`differ.ts`](/home/aditya-saini/Desktop/ScratchORM/src/migrate/differ.ts) for schema diffs
- [`sql-generator.ts`](/home/aditya-saini/Desktop/ScratchORM/src/migrate/sql-generator.ts) for SQL generation
- [`runner.ts`](/home/aditya-saini/Desktop/ScratchORM/src/migrate/runner.ts) for transactional execution
- [`snapshot.ts`](/home/aditya-saini/Desktop/ScratchORM/src/migrate/snapshot.ts) for migration history and latest-schema storage

Supported diff operations today:
- Create table
- Drop table
- Add column
- Drop column

Run the migration workflow with:

```bash
npm run migrate
```

Typical CLI output:

```text
Changes detected:
  + create table "User"
  ~ alter table "User" — add column "age"
  ~ alter table "User" — drop column "oldField"
  - drop table "Post"
```

If nothing changed, the CLI exits cleanly with:

```text
✔ Schema is up to date. No migrations needed.
```

## End-To-End Example

A runnable example is available at [`src/example/index.ts`](/home/aditya-saini/Desktop/ScratchORM/src/example/index.ts).

It does the following:
- Reads `DATABASE_URL` from `.env` using `fs` and `path`
- Runs the initial migrations
- Connects to PostgreSQL
- Creates typed model clients for `users` and `posts`
- Executes create, read, update, and delete operations
- Logs each step clearly
- Disconnects in a `finally` block

Expected `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/scratchorm
```

Run it with:

```bash
npm run example
```

## Getting Started

Prerequisites:
- Node.js 18+
- Docker, if you want local PostgreSQL provisioning
- A PostgreSQL connection string in `.env` for the example flow

Install and build:

```bash
npm install
npm run build
```

Useful scripts:

```bash
npm run generate
npm run migrate
npm run check
npm run build
npm run example
```

## Architecture

Build pipeline:

```text
schema.scratch -> parser -> ParsedSchema AST -> type generator -> src/generated/types.ts
```

Migration pipeline:

```text
schema.scratch -> parse -> load snapshot -> diff -> generate SQL -> run SQL -> save snapshot
```

Runtime pieces:
- Parser: reads the ScratchORM DSL and builds typed schema objects
- Generator: converts schema definitions into TypeScript interfaces and create inputs
- Docker manager: starts a local PostgreSQL instance
- Scratch client: owns a `pg.Pool` and returns typed `ModelClient`s
- Model client: builds parameterized SQL for CRUD operations
- Schema differ: compares previous and current schema models
- SQL generator: turns schema changes into PostgreSQL statements
- Migration runner: executes raw SQL arrays transactionally
- Snapshot store: persists schema history in `_scratchorm_migrations`

## Project Structure

```text
src/
├── cli/                    # CLI commands
├── client/                 # ScratchClient, ModelClient, query option types
├── config/                 # Config loading
├── docker/                 # Docker-backed PostgreSQL management
├── example/                # Runnable end-to-end example
├── generator/              # Type generation from parsed schema
├── migrate/                # Diff engine, SQL generator, snapshots, migration runner
├── parser/                 # Scratch DSL parser
├── generated/              # Generated TypeScript model types
├── types/                  # Shared AST/schema types
└── index.ts                # Public exports

migrations/                 # SQL migration definitions
schema.scratch              # Example schema
```

## Schema DSL

### Field Types

| `.scratch` type | TypeScript type |
| --- | --- |
| `String` | `string` |
| `Int` | `number` |
| `Boolean` | `boolean` |
| `DateTime` | `Date` |

### Field Modifiers

| Modifier | Effect |
| --- | --- |
| `@id` | Marks a field as the primary key |
| `@unique` | Marks a field as unique |
| `@optional` | Makes the field optional in generated types |
| `@default(value)` | Sets a default value such as `true`, `false`, numbers, `autoincrement()`, or `now()` |

## Tech Stack

- TypeScript with `strict` mode
- `pg` for PostgreSQL access
- `dockerode` for local container management

## Why Build It This Way

ScratchORM is a learning project, but it is also trying to be practical:
- local-first development
- explicit SQL behavior
- generated types without hidden runtime magic
- schema-aware migration tracking
- a small enough codebase to understand completely

That combination is the whole point.
