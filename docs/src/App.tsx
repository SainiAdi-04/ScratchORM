import { useEffect, useState } from "react";

type TabKey = "schema" | "types" | "query";
type DocsTabKey = "quick-start" | "api-reference" | "config" | "schema-dsl";

type CodeToken = {
  text: string;
  className?: string;
};

type CodeLine = CodeToken[];

const codeTabs: Array<{
  id: TabKey;
  label: string;
  file: string;
  lines: CodeLine[];
}> = [
  {
    id: "schema",
    label: "Define Schema",
    file: "schema.scratch",
    lines: [
      [{ text: "model ", className: "text-sky-300" }, { text: "User", className: "text-emerald-300" }, { text: " {" }],
      [{ text: "  id        " }, { text: "Int", className: "text-cyan-300" }, { text: "      " }, { text: "@id", className: "text-amber-300" }, { text: " " }, { text: "@default", className: "text-amber-300" }, { text: "(autoincrement())", className: "text-orange-300" }],
      [{ text: "  email     " }, { text: "String", className: "text-cyan-300" }, { text: "   " }, { text: "@unique", className: "text-amber-300" }],
      [{ text: "  name      " }, { text: "String", className: "text-cyan-300" }, { text: "   " }, { text: "@optional", className: "text-amber-300" }],
      [{ text: "  isActive  " }, { text: "Boolean", className: "text-cyan-300" }, { text: "  " }, { text: "@default", className: "text-amber-300" }, { text: "(true)", className: "text-orange-300" }],
      [{ text: "  createdAt " }, { text: "DateTime", className: "text-cyan-300" }, { text: " " }, { text: "@default", className: "text-amber-300" }, { text: "(now())", className: "text-orange-300" }],
      [{ text: "}" }],
    ],
  },
  {
    id: "types",
    label: "Generated Types",
    file: "generated/types.ts",
    lines: [
      [{ text: "export interface ", className: "text-sky-300" }, { text: "User", className: "text-emerald-300" }, { text: " {" }],
      [{ text: "  id", className: "text-zinc-100" }, { text: ": ", className: "text-zinc-400" }, { text: "number", className: "text-cyan-300" }, { text: ";" }],
      [{ text: "  email", className: "text-zinc-100" }, { text: ": ", className: "text-zinc-400" }, { text: "string", className: "text-cyan-300" }, { text: ";" }],
      [{ text: "  name", className: "text-zinc-100" }, { text: "?: ", className: "text-zinc-400" }, { text: "string", className: "text-cyan-300" }, { text: ";" }],
      [{ text: "  isActive", className: "text-zinc-100" }, { text: ": ", className: "text-zinc-400" }, { text: "boolean", className: "text-cyan-300" }, { text: ";" }],
      [{ text: "  createdAt", className: "text-zinc-100" }, { text: ": ", className: "text-zinc-400" }, { text: "Date", className: "text-cyan-300" }, { text: ";" }],
      [{ text: "}" }],
      [{ text: "" }],
      [{ text: "export type ", className: "text-sky-300" }, { text: "CreateUserInput", className: "text-emerald-300" }, { text: " = {" }],
      [{ text: "  email", className: "text-zinc-100" }, { text: ": ", className: "text-zinc-400" }, { text: "string", className: "text-cyan-300" }, { text: ";" }],
      [{ text: "  name", className: "text-zinc-100" }, { text: "?: ", className: "text-zinc-400" }, { text: "string", className: "text-cyan-300" }, { text: ";" }],
      [{ text: "  isActive", className: "text-zinc-100" }, { text: "?: ", className: "text-zinc-400" }, { text: "boolean", className: "text-cyan-300" }, { text: ";" }],
      [{ text: "}" }],
    ],
  },
  {
    id: "query",
    label: "Query",
    file: "client.ts",
    lines: [
      [{ text: "const ", className: "text-sky-300" }, { text: "client", className: "text-zinc-100" }, { text: " = new ", className: "text-zinc-300" }, { text: "ScratchClient", className: "text-emerald-300" }, { text: "(" }, { text: "process.env.DATABASE_URL", className: "text-cyan-300" }, { text: ")" }],
      [{ text: "const ", className: "text-sky-300" }, { text: "users", className: "text-zinc-100" }, { text: " = client.getModelClient", className: "text-zinc-300" }, { text: "<User, CreateUserInput>", className: "text-cyan-300" }, { text: "(" }, { text: "\"users\"", className: "text-orange-300" }, { text: ")" }],
      [{ text: "" }],
      [{ text: "// Fully typed - TypeScript knows the shape", className: "text-zinc-500" }],
      [{ text: "const ", className: "text-sky-300" }, { text: "active", className: "text-zinc-100" }, { text: " = await users.findMany({", className: "text-zinc-300" }],
      [{ text: "  where", className: "text-zinc-100" }, { text: ": { " }, { text: "isActive", className: "text-zinc-100" }, { text: ": " }, { text: "true", className: "text-orange-300" }, { text: " }" }],
      [{ text: "})", className: "text-zinc-300" }],
      [{ text: "" }],
      [{ text: "const ", className: "text-sky-300" }, { text: "user", className: "text-zinc-100" }, { text: " = await users.create({", className: "text-zinc-300" }],
      [{ text: "  data", className: "text-zinc-100" }, { text: ": { " }, { text: "email", className: "text-zinc-100" }, { text: ": " }, { text: "\"alice@example.com\"", className: "text-orange-300" }, { text: ", " }, { text: "name", className: "text-zinc-100" }, { text: ": " }, { text: "\"Alice\"", className: "text-orange-300" }, { text: " }" }],
      [{ text: "})", className: "text-zinc-300" }],
    ],
  },
];

const pipelineTop = ["schema.scratch", "Lexer + Parser", "AST", "Type Generator", "types.ts"];
const pipelineBottom = ["scratchorm dev", "Docker", "PostgreSQL", "ScratchClient", "Typed Queries"];

const commandCards = [
  {
    command: "npm run dev",
    description:
      "Detects Docker socket, pulls postgres:latest, starts a container, and writes DATABASE_URL to .env.",
  },
  {
    command: "npm run generate",
    description:
      "Parses schema.scratch and generates TypeScript interfaces plus CreateInput types.",
  },
  {
    command: "npm run migrate",
    description:
      "Diffs current schema against the saved snapshot, generates ALTER/CREATE SQL, runs it, and stores the new snapshot.",
  },
];

const techCallouts = [
  {
    title: "Recursive Descent Parser",
    text: "Hand-written lexer and parser. No parser generator libraries.",
  },
  {
    title: "AST-Driven Code Generation",
    text: "Schema parsed into a typed AST, then walked to emit TypeScript source.",
  },
  {
    title: "Docker SDK Integration",
    text: "Uses Dockerode to programmatically manage containers. No shell commands.",
  },
  {
    title: "Parameterized SQL",
    text: "All queries use $1/$2 placeholders. Zero string interpolation.",
  },
];

const quickStartSteps = [
  {
    title: "Step 1 - Install",
    file: "bash",
    code: `npm install scratch-orm`,
  },
  {
    title: "Step 2 - Create config file scratchorm.config.json",
    file: "scratchorm.config.json",
    code: `{
  "database": {
    "containerName": "myapp-postgres",
    "port": 5432,
    "name": "myapp",
    "user": "myapp",
    "password": "myapp"
  }
}`,
  },
  {
    title: "Step 3 - Define your schema schema.scratch",
    file: "schema.scratch",
    code: `model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String   @optional
  createdAt DateTime @default(now())
}`,
  },
  {
    title: "Step 4 - Add scripts to package.json",
    file: "package.json",
    code: `"scripts": {
  "dev":      "scratchorm dev",
  "generate": "scratchorm generate",
  "migrate":  "scratchorm migrate"
}`,
  },
  {
    title: "Step 5 - Run the workflow",
    file: "bash",
    code: `npm run dev       # boots PostgreSQL via Docker
npm run generate  # generates TypeScript types
npm run migrate   # creates tables from schema`,
  },
  {
    title: "Step 6 - Query your database",
    file: "app.ts",
    code: `import { ScratchClient } from 'scratch-orm'
import type { User, CreateUserInput } from './src/generated/types'

const client = new ScratchClient(process.env.DATABASE_URL!)
const users = client.getModelClient<User, CreateUserInput>('User')

const alice = await users.create({ email: 'alice@example.com', name: 'Alice' })
const all = await users.findMany({ where: { isActive: true } })`,
  },
] as const;

const apiReferenceItems = [
  {
    name: "findMany",
    signature: `findMany(options?: {
  where?: WhereClause<T>
  select?: SelectClause<T>
  orderBy?: { field: keyof T; direction: 'asc' | 'desc' }
  limit?: number
}): Promise<T[]>`,
    example: `const users = await db.findMany({
  where: { isActive: true },
  orderBy: { field: 'createdAt', direction: 'desc' },
  limit: 10
})`,
  },
  {
    name: "findOne",
    signature: `findOne(options: { where: WhereClause<T> }): Promise<T | null>`,
    example: `const user = await db.findOne({ where: { email: 'alice@example.com' } })`,
  },
  {
    name: "create",
    signature: `create(data: TCreate): Promise<T>`,
    example: `const user = await db.create({ email: 'alice@example.com', name: 'Alice' })`,
  },
  {
    name: "update",
    signature: `update(where: WhereClause<T>, data: Partial<TCreate>): Promise<T | null>`,
    example: `const updated = await db.update(
  { email: 'alice@example.com' },
  { name: 'Alice Updated' }
)`,
  },
  {
    name: "delete",
    signature: `delete(where: WhereClause<T>): Promise<boolean>`,
    example: `const deleted = await db.delete({ email: 'alice@example.com' })`,
  },
] as const;

const configRows = [
  {
    name: "containerName",
    type: "string",
    description: "Docker container name",
    example: "\"myapp-postgres\"",
  },
  {
    name: "port",
    type: "number",
    description: "Host port to bind",
    example: "5432",
  },
  {
    name: "name",
    type: "string",
    description: "Database name",
    example: "\"myapp\"",
  },
  {
    name: "user",
    type: "string",
    description: "PostgreSQL user",
    example: "\"myapp\"",
  },
  {
    name: "password",
    type: "string",
    description: "PostgreSQL password",
    example: "\"myapp\"",
  },
] as const;

const configExample = `{
  "database": {
    "containerName": "myapp-postgres",
    "port": 5432,
    "name": "myapp",
    "user": "myapp",
    "password": "myapp"
  }
}`;

const schemaFieldTypes = [
  { scratch: "String", typescript: "string", sql: "TEXT" },
  { scratch: "Int", typescript: "number", sql: "INTEGER" },
  { scratch: "Boolean", typescript: "boolean", sql: "BOOLEAN" },
  { scratch: "DateTime", typescript: "Date", sql: "TIMESTAMPTZ" },
] as const;

const schemaModifiers = [
  { modifier: "@id", description: "Primary key" },
  { modifier: "@unique", description: "Unique constraint" },
  { modifier: "@optional", description: "Nullable field" },
  {
    modifier: "@default(value)",
    description: "Default value. Accepts true, false, numbers, strings, autoincrement(), now()",
  },
] as const;

const schemaExample = `model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String   @optional
  createdAt DateTime @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String   @optional
  published Boolean  @default(false)
  createdAt DateTime @default(now())
}`;

function TerminalIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 text-accent"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 5h16v14H4z" />
      <path d="m8 9 3 3-3 3" />
      <path d="M13 15h3" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.42-4.04-1.42-.55-1.38-1.34-1.75-1.34-1.75-1.1-.74.08-.73.08-.73 1.21.09 1.84 1.22 1.84 1.22 1.08 1.82 2.83 1.3 3.52.99.11-.77.42-1.3.76-1.6-2.66-.3-5.47-1.31-5.47-5.86 0-1.3.47-2.36 1.23-3.2-.12-.3-.53-1.5.12-3.12 0 0 1.01-.32 3.3 1.22a11.58 11.58 0 0 1 6 0c2.29-1.54 3.29-1.22 3.29-1.22.66 1.62.25 2.82.13 3.12.76.84 1.22 1.9 1.22 3.2 0 4.56-2.81 5.55-5.49 5.84.43.37.81 1.1.81 2.22v3.3c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

function SectionHeading({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div className="mb-10 space-y-3">
      <p className="text-xs uppercase tracking-[0.24em] text-accent">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">{title}</h2>
    </div>
  );
}

function PipelineRow({ items }: { items: string[] }) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
      {items.map((item, index) => (
        <div
          key={item}
          className="flex flex-col md:flex-row items-center"
        >
          {/* Node */}
          <div className="w-[180px] h-[100px] flex items-center justify-center rounded-2xl border border-border bg-panel text-sm text-zinc-100 shadow-panel text-center px-3">
            {item}
          </div>

          {/* Arrow */}
          {index !== items.length - 1 && (
            <>
              {/* Desktop arrow (right) */}
              <div className="hidden md:flex items-center justify-center text-zinc-500 mx-3">
                <span className="text-lg">→</span>
              </div>

              {/* Mobile arrow (down, centered) */}
              <div className="flex md:hidden items-center justify-center text-zinc-500 my-2">
                <span className="text-lg">↓</span>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function CodeBlock({ file, lines }: { file: string; lines: CodeLine[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[#1b1b1c] shadow-panel">
      <div className="flex items-center justify-between border-b border-border bg-panel px-4 py-3 text-xs text-zinc-400">
        <span>{file}</span>
        <span>UTF-8</span>
      </div>
      <pre className="overflow-x-auto px-4 py-5 text-sm leading-7 text-zinc-200">
        <code>
          {lines.map((line, lineIndex) => (
            <div key={`${file}-${lineIndex}`} className="min-h-[1.75rem]">
              {line.map((token, tokenIndex) => (
                <span key={`${file}-${lineIndex}-${tokenIndex}`} className={token.className}>
                  {token.text}
                </span>
              ))}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

function tokenizeLine(
  line: string,
  patterns: Array<{ regex: RegExp; className: string }>,
): CodeLine {
  const tokens: CodeLine = [];
  let currentIndex = 0;

  while (currentIndex < line.length) {
    let matched = false;

    for (const pattern of patterns) {
      pattern.regex.lastIndex = currentIndex;
      const match = pattern.regex.exec(line);

      if (!match || match.index !== currentIndex) {
        continue;
      }

      tokens.push({
        text: match[0],
        className: pattern.className,
      });
      currentIndex += match[0].length;
      matched = true;
      break;
    }

    if (!matched) {
      tokens.push({ text: line[currentIndex] ?? "" });
      currentIndex += 1;
    }
  }

  if (tokens.length === 0) {
    tokens.push({ text: "" });
  }

  return tokens;
}

function getDocsPatterns(file: string): Array<{ regex: RegExp; className: string }> {
  if (file === "bash") {
    return [
      { regex: /#.*/y, className: "text-zinc-500" },
      { regex: /\b(npm|npx|scratchorm)\b/y, className: "text-sky-300" },
      { regex: /\b(run|install|dev|generate|migrate)\b/y, className: "text-emerald-300" },
      { regex: /\b\d+\b/y, className: "text-orange-300" },
      { regex: /"[^"]*"/y, className: "text-orange-300" },
      { regex: /'[^']*'/y, className: "text-orange-300" },
    ];
  }

  if (file.endsWith(".json")) {
    return [
      { regex: /"[^"]+"(?=\s*:)/y, className: "text-sky-300" },
      { regex: /"[^"]*"/y, className: "text-orange-300" },
      { regex: /\b\d+\b/y, className: "text-orange-300" },
      { regex: /\b(true|false|null)\b/y, className: "text-orange-300" },
    ];
  }

  if (file.endsWith(".scratch")) {
    return [
      { regex: /\bmodel\b/y, className: "text-sky-300" },
      { regex: /\b(User|Post)\b/y, className: "text-emerald-300" },
      { regex: /\b(String|Int|Boolean|DateTime)\b/y, className: "text-cyan-300" },
      { regex: /@[A-Za-z]+/y, className: "text-amber-300" },
      { regex: /\((autoincrement\(\)|now\(\)|true|false)\)/y, className: "text-orange-300" },
    ];
  }

  return [
    { regex: /\/\/.*/y, className: "text-zinc-500" },
    { regex: /\b(import|from|const|await|export|interface|type|return|new)\b/y, className: "text-sky-300" },
    { regex: /\b(ScratchClient|User|Post|CreateUserInput|CreatePostInput|Promise|WhereClause|SelectClause|Partial|T|TCreate|Date)\b/y, className: "text-cyan-300" },
    { regex: /\b(findMany|findOne|create|update|delete|getModelClient)\b/y, className: "text-emerald-300" },
    { regex: /\b(true|false)\b/y, className: "text-orange-300" },
    { regex: /\b\d+\b/y, className: "text-orange-300" },
    { regex: /"[^"]*"/y, className: "text-orange-300" },
    { regex: /'[^']*'/y, className: "text-orange-300" },
  ];
}

function DocsPreBlock({ file, code }: { file: string; code: string }) {
  const patterns = getDocsPatterns(file);
  const lines = code.split("\n").map((line) => tokenizeLine(line, patterns));
  return <CodeBlock file={file} lines={lines} />;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("schema");
  const [activeDocsTab, setActiveDocsTab] = useState<DocsTabKey>("quick-start");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCopied(false);
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [copied]);

  const currentTab = codeTabs.find((tab) => tab.id === activeTab) ?? codeTabs[0];

  async function handleCopyInstall(): Promise<void> {
    await navigator.clipboard.writeText("npm install scratch-orm");
    setCopied(true);
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3 text-sm font-semibold tracking-wide text-zinc-100">
            <TerminalIcon />
            <span>ScratchORM</span>
          </a>
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <a
              href="https://github.com/SainiAdi-04/ScratchORM"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-zinc-300 transition hover:border-accent hover:text-zinc-100"
            >
              <GitHubIcon />
              <span>GitHub</span>
            </a>
            <a
              href="https://www.npmjs.com/package/scratch-orm"
              className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-accent transition hover:bg-accent/15"
            >
              npm i scratch-orm
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:px-8 lg:py-28">
            <div className="space-y-8">
              <div className="space-y-5">
                <p className="text-xs uppercase tracking-[0.28em] text-accent">TypeScript ORM</p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
                  The ORM you actually understand
                </h1>
                <p className="max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
                  Type-safe. Local-first. No cloud cold starts. Built from scratch in TypeScript.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="https://github.com/SainiAdi-04/ScratchORM"
                  className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-sm text-zinc-200 transition hover:border-accent hover:text-zinc-50"
                >
                  View on GitHub
                </a>
                <button
                  type="button"
                  onClick={() => {
                    void handleCopyInstall();
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-canvas transition hover:bg-sky-400"
                >
                  {copied ? "✔ Copied!" : "npm install scratch-orm"}
                </button>
              </div>

              <p className="text-sm text-zinc-500">
                PostgreSQL via Docker. Zero config. Works on first run.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-panel p-5 shadow-panel">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3 text-xs text-zinc-500">
                <span>terminal</span>
                <span>scratchorm</span>
              </div>
              <div className="space-y-3 text-sm leading-7">
                <div>
                  <span className="text-accent">$ </span>
                  <span className="text-zinc-200">npm run dev</span>
                </div>
                <div className="text-zinc-500">✔ PostgreSQL provisioned and started.</div>
                <div className="text-zinc-500">→ Connection string: postgresql://user@localhost:5432/db</div>
                <div>
                  <span className="text-accent">$ </span>
                  <span className="text-zinc-200">npm run generate</span>
                </div>
                <div className="text-zinc-500">✔ Generated types to src/generated/types.ts</div>
                <div>
                  <span className="text-accent">$ </span>
                  <span className="text-zinc-200">npm run migrate</span>
                </div>
                <div className="text-zinc-500">✔ Migration complete. 2 changes applied.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="The Problem" title="Why I built this" />
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
              <p className="max-w-3xl text-base leading-8 text-zinc-400">
                Cloud PostgreSQL (Neon) failed with connection errors 8 out of 10 times during
                development. I wanted an ORM that spins up a local PostgreSQL instance
                automatically, no cloud dependency, no cold starts, no surprises.
              </p>
              <div className="grid gap-4 sm:grid-cols-3 ">
                {[
                  ["8/10", "failed requests"],
                  ["0", "cloud dependencies"],
                  ["1", "command setup"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-xl border border-border bg-panel p-5 shadow-panel">
                    <div className="text-2xl font-semibold text-accent">{value}</div>
                    <div className="mt-3 text-sm text-zinc-400">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Architecture" title="The Pipeline" />
            <div className="space-y-4">
              <PipelineRow items={pipelineTop} />
              <PipelineRow items={pipelineBottom} />
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Code Demo" title="See the shape all the way through" />
            <div className="mb-6 flex flex-wrap gap-3">
              {codeTabs.map((tab) => {
                const isActive = tab.id === activeTab;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-lg border px-4 py-2 text-sm transition ${
                      isActive
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-panel text-zinc-400 hover:text-zinc-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <CodeBlock file={currentTab.file} lines={currentTab.lines} />
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Docs" title="Everything you need to get running" />

            <div className="mb-6 flex flex-wrap gap-3">
              {[
                { id: "quick-start", label: "Quick Start" },
                { id: "api-reference", label: "API Reference" },
                { id: "config", label: "Config" },
                { id: "schema-dsl", label: "Schema DSL" },
              ].map((tab) => {
                const isActive = tab.id === activeDocsTab;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveDocsTab(tab.id as DocsTabKey)}
                    className={`rounded-lg border px-4 py-2 text-sm transition ${
                      isActive
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-panel text-zinc-400 hover:text-zinc-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeDocsTab === "quick-start" && (
              <div className="space-y-6">
                {quickStartSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="rounded-2xl border border-border bg-panel p-6 shadow-panel"
                  >
                    <div className="mb-4 flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-sm font-semibold text-accent">
                        {index + 1}
                      </div>
                      <h3 className="text-base font-semibold text-zinc-100">{step.title}</h3>
                    </div>
                    <DocsPreBlock file={step.file} code={step.code} />
                  </div>
                ))}
              </div>
            )}

            {activeDocsTab === "api-reference" && (
              <div className="space-y-6">
                {apiReferenceItems.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-2xl border border-border bg-panel p-6 shadow-panel"
                  >
                    <h3 className="mb-4 text-base font-semibold text-zinc-100">{item.name}</h3>

                    <div className="mb-4">
                      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-accent">
                        Method Signature
                      </p>
                      <DocsPreBlock file={`${item.name}.ts`} code={item.signature} />
                    </div>

                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-accent">Example</p>
                      <DocsPreBlock file="example.ts" code={item.example} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeDocsTab === "config" && (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl border border-border bg-panel shadow-panel">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-left text-sm">
                      <thead className="bg-[#1b1b1c] text-zinc-300">
                        <tr>
                          <th className="border-b border-border px-4 py-3">Field</th>
                          <th className="border-b border-border px-4 py-3">Type</th>
                          <th className="border-b border-border px-4 py-3">Description</th>
                          <th className="border-b border-border px-4 py-3">Example</th>
                        </tr>
                      </thead>
                      <tbody>
                        {configRows.map((row) => (
                          <tr key={row.name} className="text-zinc-400">
                            <td className="border-b border-border px-4 py-3 text-zinc-100">{row.name}</td>
                            <td className="border-b border-border px-4 py-3 text-accent">{row.type}</td>
                            <td className="border-b border-border px-4 py-3">{row.description}</td>
                            <td className="border-b border-border px-4 py-3 text-zinc-200">{row.example}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <DocsPreBlock file="scratchorm.config.json" code={configExample} />
              </div>
            )}

            {activeDocsTab === "schema-dsl" && (
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="overflow-hidden rounded-2xl border border-border bg-panel shadow-panel">
                    <div className="border-b border-border bg-[#1b1b1c] px-4 py-3 text-sm font-semibold text-zinc-100">
                      Field Types
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-left text-sm">
                        <thead className="text-zinc-300">
                          <tr>
                            <th className="border-b border-border px-4 py-3">.scratch type</th>
                            <th className="border-b border-border px-4 py-3">TypeScript type</th>
                            <th className="border-b border-border px-4 py-3">SQL type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schemaFieldTypes.map((row) => (
                            <tr key={row.scratch} className="text-zinc-400">
                              <td className="border-b border-border px-4 py-3 text-zinc-100">{row.scratch}</td>
                              <td className="border-b border-border px-4 py-3 text-accent">{row.typescript}</td>
                              <td className="border-b border-border px-4 py-3 text-zinc-200">{row.sql}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-border bg-panel shadow-panel">
                    <div className="border-b border-border bg-[#1b1b1c] px-4 py-3 text-sm font-semibold text-zinc-100">
                      Modifiers
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-left text-sm">
                        <thead className="text-zinc-300">
                          <tr>
                            <th className="border-b border-border px-4 py-3">Modifier</th>
                            <th className="border-b border-border px-4 py-3">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schemaModifiers.map((row) => (
                            <tr key={row.modifier} className="text-zinc-400">
                              <td className="border-b border-border px-4 py-3 text-accent">{row.modifier}</td>
                              <td className="border-b border-border px-4 py-3">{row.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <DocsPreBlock file="schema.scratch" code={schemaExample} />
              </div>
            )}
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="CLI" title="Three commands. Full workflow." />
            <div className="grid gap-4 lg:grid-cols-3">
              {commandCards.map((card) => (
                <div key={card.command} className="rounded-2xl border border-border bg-panel p-6 shadow-panel">
                  <div className="mb-4 text-sm font-semibold text-accent">{card.command}</div>
                  <p className="text-sm leading-7 text-zinc-400">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Implementation" title="Built properly. Not abstracted away." />
            <div className="grid gap-4 md:grid-cols-2">
              {techCallouts.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-panel p-6 shadow-panel">
                  <h3 className="mb-3 text-base font-semibold text-zinc-100">{item.title}</h3>
                  <p className="text-sm leading-7 text-zinc-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-zinc-500 sm:px-6 md:flex-row lg:px-8">
        <div className="text-zinc-300">ScratchORM - built from scratch</div>
        <div>MIT License</div>
        <div className="flex items-center gap-4">
          <a href="https://github.com/SainiAdi-04/ScratchORM" className="hover:text-zinc-200">
            GitHub
          </a>
          <a href="https://www.npmjs.com/package/scratch-orm" className="hover:text-zinc-200">
            npm
          </a>
        </div>
      </footer>
    </div>
  );
}
