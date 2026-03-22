import { useEffect, useState } from "react";

type TabKey = "schema" | "types" | "query";

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
    command: "scratchorm dev",
    description:
      "Detects Docker socket, pulls postgres:latest, starts a container, and writes DATABASE_URL to .env.",
  },
  {
    command: "scratchorm generate",
    description:
      "Parses schema.scratch and generates TypeScript interfaces plus CreateInput types.",
  },
  {
    command: "scratchorm migrate",
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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("schema");
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
                  <span className="text-zinc-200">scratchorm dev</span>
                </div>
                <div className="text-zinc-500">Docker detected. Starting local PostgreSQL...</div>
                <div className="text-zinc-500">DATABASE_URL written to .env</div>
                <div>
                  <span className="text-accent">$ </span>
                  <span className="text-zinc-200">scratchorm generate</span>
                </div>
                <div className="text-zinc-500">Generated types to src/generated/types.ts</div>
                <div>
                  <span className="text-accent">$ </span>
                  <span className="text-zinc-200">scratchorm migrate</span>
                </div>
                <div className="text-zinc-500">Schema diff applied. Snapshot saved.</div>
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
