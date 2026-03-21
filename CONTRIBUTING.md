# Contributing to agents-hive

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/bokgun/agents-hive.git
cd agents-hive

# Install dependencies
bun install

# Run in dev mode (no build needed)
bun run dev -- help
bun run dev -- init /tmp/test-workspace

# Or build and run
bun run build
bun run start -- help
```

### Project Structure

```
src/
├── cli.ts              # CLI entry point (commander)
├── commands/           # One file per command group
│   ├── init.ts
│   ├── project.ts
│   ├── memo.ts
│   ├── cron.ts
│   ├── run.ts
│   ├── session.ts
│   ├── status.ts
│   ├── briefing.ts
│   ├── cleanup.ts
│   └── notify.ts
└── lib/
    ├── colors.ts       # ANSI color helpers
    └── workspace.ts    # Workspace resolution & status file I/O
```

## How to Contribute

### Bug Reports

Open an issue using the **Bug Report** template. Include:
- Your OS and bun version (`bun --version`)
- Which agent CLIs you have installed
- Steps to reproduce
- Expected vs actual behavior

### Feature Requests

Open an issue using the **Feature Request** template. Describe:
- The problem you're trying to solve
- Your proposed solution
- Alternative approaches you've considered

### Pull Requests

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes in `src/`
4. Test locally: `bun run dev -- init /tmp/test && bun run dev -- project create test claude "test"`
5. Build check: `bun run build`
6. Commit with conventional commits: `feat:`, `fix:`, `docs:`
7. Open a PR against `main`

## Code Style

- TypeScript with `strict` mode enabled
- ESM (`"type": "module"` in package.json)
- One command per file in `src/commands/`
- Shared utilities go in `src/lib/`
- Add comments for non-obvious logic

## Areas for Contribution

- **New agent integrations**: Aider, Continue, Cursor CLI, etc.
- **Channel plugins**: Custom `--channels` plugin templates
- **Memory backends**: SQLite, Redis, or cloud storage alternatives
- **Platform support**: Windows (WSL/Git Bash), NixOS
- **Documentation**: Tutorials, recipes, translations
- **Testing**: Test suite (vitest or bun:test)

## Commit Convention

```
feat: add support for aider agent
fix: handle spaces in project names
docs: add Korean translation
refactor: extract status update function
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
