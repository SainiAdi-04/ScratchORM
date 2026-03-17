# ScratchORM

A lightweight, type-safe ORM for PostgreSQL built from scratch in TypeScript.
No Prisma. No magic. Just a custom schema parser, AST, and type generator — 
wired together into a developer-friendly CLI.

> Built as a deep-dive into how ORMs actually work under the hood.

---

## How It Works

You define your database schema in a `.scratch` file using ScratchORM's own DSL:

```scratch
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String   @optional
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}
```

Then run:

```bash
scratchorm generate
```

ScratchORM reads your schema, parses it into an AST, and generates a fully typed
TypeScript client in `generated/types.ts`:

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
}
```

No cloud. No cold starts. Just your local database and fully typed queries.

---

## The Pipeline

```
schema.scratch  →  Lexer  →  Tokens  →  Parser  →  AST  →  Type Generator  →  generated/types.ts
```

Every step is hand-built:
- **Lexer** — tokenizes the `.scratch` DSL character by character
- **Recursive descent parser** — builds a typed AST from tokens
- **Type generator** — walks the AST and emits valid TypeScript source

---

## Getting Started

**Prerequisites:** Node.js 18+, TypeScript 5+

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Generate types from your schema
npm run generate
```

---

## Project Structure

```
src/
├── parser/
│   └── schema-parser.ts     # Lexer + recursive descent parser
├── types/
│   └── schema-types.ts      # AST type definitions
├── generator/
│   └── type-generator.ts    # Walks AST, emits TypeScript source
├── cli/
│   ├── generate.ts          # generate command implementation
│   └── index.ts             # CLI entry point
└── index.ts                 # Public exports
schema.scratch                # Example schema
```

---

## Schema DSL

### Field Types
| .scratch type | TypeScript type |
|---|---|
| `String` | `string` |
| `Int` | `number` |
| `Boolean` | `boolean` |
| `DateTime` | `Date` |

### Field Modifiers
| Modifier | Effect |
|---|---|
| `@id` | Marks field as primary key |
| `@unique` | Enforces uniqueness constraint |
| `@optional` | Field becomes optional (`?`) |
| `@default(value)` | Sets a default value. Accepts `true`, `false`, numbers, strings, `autoincrement()`, `now()` |

---

## Roadmap

- [x] Phase 1 — Schema DSL, parser, type generator, CLI
- [ ] Phase 2 — Docker auto-provisioning (local PostgreSQL, zero config)
- [ ] Phase 3 — Type-safe query builder (`findMany`, `findOne`, `create`, `update`, `delete`)
- [ ] Phase 4 — Migration engine (schema diffing + SQL generation)

---

## Why I Built This

Every time I ran a backend with Neon (cloud PostgreSQL), I'd hit connection errors
8 out of 10 times on cold starts. I wanted an ORM that spins up a local PostgreSQL
instance automatically via Docker — no cloud dependency, no cold starts, no surprises.

ScratchORM is that tool, built from the ground up.

---

## Tech Stack

- **TypeScript** — strict mode throughout
- **node-postgres (pg)** — SQL driver (Phase 3)
- **dockerode** — Docker SDK for auto-provisioning 

