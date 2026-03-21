# agents-hive

Multi-agent workspace manager CLI for Claude Code, Gemini CLI, and Codex CLI.

## Stack

TypeScript, bun, commander. Target: ES2022, Node16 modules, strict mode.

## Commands

```
bun run build          # tsc → dist/
bun run dev -- <args>  # run from source
bun test               # all tests
bun test --watch       # watch mode
bun run lint           # eslint
bun run lint:fix       # eslint --fix
bun run format         # prettier --write
bun run format:check   # prettier --check
```

## Structure

```
src/
├── cli.ts             # Entry point (commander setup)
├── commands/          # One file per command group
│   ├── init.ts        # hive init
│   ├── project.ts     # hive project create/edit/delete/list
│   ├── memo.ts        # hive memo
│   ├── cron.ts        # hive cron add/list/remove/apply/show
│   ├── run.ts         # hive run
│   ├── session.ts     # hive session
│   ├── status.ts      # hive status
│   ├── briefing.ts    # hive briefing
│   ├── cleanup.ts     # hive cleanup
│   └── notify.ts      # hive notify
├── lib/
│   ├── colors.ts      # ANSI color helpers
│   └── workspace.ts   # Workspace resolution, status.json I/O, types
└── __tests__/         # Excluded from tsc build
    ├── helpers.ts     # Shared test utilities (createTmpWorkspace, etc.)
    ├── lib/           # Unit tests for lib/
    ├── commands/      # Unit tests for commands/
    └── eval/          # E2E tests (runs actual CLI binary)
```

## Conventions

- One command per file in `src/commands/`. Shared utilities go in `src/lib/`.
- Prettier: singleQuote, trailingComma all, printWidth 100, semi true.
- ESLint: typescript-eslint strict. Prefix unused vars with `_` to suppress.
- ESM throughout (`"type": "module"` in package.json). Use `.js` extensions in imports.
- Minimal dependencies — only `commander` in production.

## Testing

- Framework: `bun:test` (built-in, no extra deps).
- Unit tests: `src/__tests__/lib/` and `src/__tests__/commands/` — test functions directly with temp workspaces.
- Eval tests: `src/__tests__/eval/` — spawn actual CLI process, verify stdout/stderr/exit codes.
- Run subset: `bun test src/__tests__/eval/` or `bun test src/__tests__/commands/`.
- Tests are excluded from `tsconfig.json` build. `@types/bun` provides type definitions.

## Commits

Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`.
