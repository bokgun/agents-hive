# 🐝 agents-hive

**Multi-agent workspace manager for Claude Code, Gemini CLI, and Codex CLI.**

Orchestrate multiple AI coding agents from a single workspace with shared memory, cron scheduling, and Telegram/Discord integration — no API keys needed, just your subscription.

```
hive init
hive project create backend claude "REST API server"
hive project create research gemini "Market analysis"
hive project create monitor codex "Health checks"
hive memo backend "Using Kotlin + Spring Boot, snake_case DB"
hive cron add tests '*/30 * * * *' 'cd $HIVE_WORKSPACE/backend && claude -p "npm test"'
hive session backend --channels plugin:telegram@claude-plugins-official
```

<!-- TODO: Replace with actual screenshot -->
<!-- ![demo](assets/demo.gif) -->

> [한국어](README.ko.md)

---

## Why?

AI coding agents are powerful alone. Together, they're a team:

| Agent | Best at | Auth |
|-------|---------|------|
| **Claude Code** | Coding, architecture, code review | claude.ai login (Pro/Max) |
| **Gemini CLI** | Research, bulk analysis, long context | Google login |
| **Codex CLI** | Async tasks, PR automation, Slack | ChatGPT login (Plus/Pro) |

But running them across multiple projects gets messy fast — scattered context, no shared memory, manual cron scripts. **agents-hive** gives you:

- 🗂️ **One workspace, many projects** — each with its own agent, memory, and config
- 🧠 **Shared memory** — cross-project context via file-based memory that survives sessions
- ⏰ **Cron management** — schedule and manage recurring tasks from a single CLI
- 📱 **Channel-ready** — use `--channels` to control sessions from Telegram/Discord
- 🔑 **No API keys** — works with subscription plan logins

## Install

```bash
# Option 1: Clone and install
git clone https://github.com/bokgun/agents-hive.git
cd agents-hive && bun install && bun run build && bun link

# Option 2: Quick install (requires bun + git)
curl -fsSL https://raw.githubusercontent.com/bokgun/agents-hive/main/install.sh | bash
```

### Uninstall

```bash
hive uninstall
```

### Prerequisites

- **Node.js** 18+, [**bun**](https://bun.sh), **git**
- At least one agent CLI:
  - [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview) — `npm i -g @anthropic-ai/claude-code`
  - [Codex CLI](https://github.com/openai/codex) — `npm i -g @openai/codex`
  - [Gemini CLI](https://github.com/google-gemini/gemini-cli) — `npm i -g @anthropic-ai/gemini-cli`

## Quick Start

```bash
# 1. Initialize workspace
hive init ~/my-workspace
export HIVE_WORKSPACE=~/my-workspace

# 2. Create projects
hive project create api claude "Backend API"
hive project create blog gemini "Blog automation"

# 3. Add some memory
hive memo api "PostgreSQL, 6 tables, snake_case convention"
hive memo global "Sprint goal: MVP by Friday"

# 4. Schedule cron jobs
hive cron add api-test '*/30 * * * *' 'cd $HIVE_WORKSPACE/api && claude -p "run tests"'
hive cron add blog-research '0 9 * * *' 'cd $HIVE_WORKSPACE/blog && gemini -p "trending keywords"'
hive cron apply

# 5. Start a session with Telegram
hive session api --channels plugin:telegram@claude-plugins-official
```

## Commands

### Workspace

| Command | Description |
|---------|-------------|
| `hive init [path]` | Initialize a new workspace |
| `hive status` | Show all projects and their status |
| `hive briefing` | Generate a daily briefing from all projects |
| `hive cleanup` | Archive memory entries older than 50 lines |

### Projects

```bash
hive project create <name> <claude|gemini|codex> <description>
hive project edit   <name> <description|agent> <value>
hive project delete <name>
hive project list
```

### Memory

```bash
hive memo <project> <content>     # Save to project memory
hive memo global <content>        # Save to global memo
hive memo <project>               # View project memory
hive memo global                  # View global memo
```

Memory is stored as markdown files:
- **Project memory**: `<project>/.claude/memory.md` — auto-loaded by Claude Code
- **Global memo**: `shared-memory/memo.md` — cross-project notes
- **Decision log**: `shared-memory/decisions.md` — architectural decisions
- **Status**: `shared-memory/status.json` — machine-readable project status

### Cron

```bash
hive cron add <name> <'schedule'> <command>
hive cron list
hive cron remove <name>
hive cron show                    # Show generated crontab
hive cron apply                   # Install to system crontab
```

### Execution

```bash
hive run <project> <command>      # Run command via the assigned agent
hive session <project> [flags]    # Start interactive Claude Code session
hive session all                  # Start all projects in tmux splits
hive notify <message>             # Send Telegram notification
```

### Sessions (background)

```bash
hive start [project] [-t] [-d]   # Start in background tmux session
hive stop [project]               # Stop a running session
hive ps                           # List running sessions
```

Options: `-t, --telegram` enables Telegram channel, `-d, --discord` enables Discord channel.
Without a project, runs at workspace root.

### Setup & Maintenance

```bash
hive setup telegram               # Interactive Telegram configuration
hive update                       # Update to latest version
hive uninstall                    # Remove agents-hive CLI
```

## Architecture

```
~/my-workspace/
├── CLAUDE.md                  # Workspace-level context (auto-loaded)
├── shared-memory/
│   ├── status.json            # Project status (updated by hive & agents)
│   ├── memo.md                # Global memo
│   ├── decisions.md           # Decision log
│   ├── daily-briefing.md      # Auto-generated briefing
│   └── archive/               # Weekly memory archives
├── api/                       # Project: Claude Code
│   ├── CLAUDE.md              # Project rules (auto-loaded)
│   ├── .claude/
│   │   ├── memory.md          # Persistent memory
│   │   └── settings.json      # Permissions
│   └── src/
├── blog/                      # Project: Gemini CLI
│   ├── CLAUDE.md
│   ├── GEMINI.md              # Gemini-specific config
│   ├── .claude/memory.md
│   └── output/
├── monitor/                   # Project: Codex CLI
│   ├── CLAUDE.md
│   ├── AGENTS.md
│   ├── .codex/config.toml     # Codex model config
│   ├── .claude/memory.md
│   └── logs/
├── .claude/
│   └── settings.json          # Pre-approved permissions
└── .hive/
    └── crontab.generated      # Managed cron jobs
```

### How Memory Works

The key insight: **Claude Code auto-loads `CLAUDE.md` and `.claude/memory.md`** from the working directory. So when you run `hive run api "fix tests"`, it `cd`s into the project directory first — Claude Code picks up the project context automatically, even in headless mode.

Cross-project memory lives in `shared-memory/` and agents are instructed (via CLAUDE.md rules) to read/write it. This creates a lightweight coordination layer without requiring the agents to be in the same session.

### Hybrid Strategy

```
┌─ Persistent session (main project) ──────┐
│ hive session api --channels telegram      │
│ + /loop for real-time monitoring          │
│ + Swarms for complex design tasks         │
└───────────────────────────────────────────┘

┌─ System cron (background projects) ───────┐
│ hive cron: blog → gemini (free quota)     │
│ hive cron: monitor → codex (lightweight)  │
│ On failure → hive notify                  │
└───────────────────────────────────────────┘

┌─ Ad-hoc commands ─────────────────────────┐
│ hive run api "review PR #42"              │
│ hive run blog "analyze today's trends"    │
└───────────────────────────────────────────┘
```

## Configuration

### Telegram Notifications (Optional)

```bash
cp ~/my-workspace/.env.example ~/my-workspace/.env
# Edit .env with your bot token and chat ID
```

### Agent Authentication

agents-hive uses **subscription plan login** — no API keys:

- **Claude Code**: `claude` → login with claude.ai account
- **Codex CLI**: `codex` → login with ChatGPT account
- **Gemini CLI**: `gemini` → login with Google account

### Shell Integration

```bash
# Add to ~/.bashrc or ~/.zshrc
export HIVE_WORKSPACE=~/my-workspace

# Or: auto-detect from current directory
# hive looks for shared-memory/status.json in cwd
```

## Comparison with OpenClaw

| Feature | agents-hive | OpenClaw |
|---------|-------------|----------|
| Messaging channels | Telegram, Discord (via `--channels`) | 20+ platforms |
| Always-on daemon | tmux/background terminal | Native gateway daemon |
| Coding quality | Native Claude Code / Codex | Depends on backend LLM |
| Model freedom | Claude + Gemini + Codex | Any model + Ollama |
| Cost | Subscriptions ($20-200/mo) | Open source + API costs |
| Setup | One command | Self-hosted gateway |
| Multi-project | Built-in | Single gateway routing |

**agents-hive** is best when coding quality matters most and you want a lightweight, file-based coordination layer. **OpenClaw** is better for always-on personal assistants with broad platform coverage.

## Claude Code Integration

To install agents-hive from another Claude Code session, have it read [`CLAUDE-INSTALL.md`](CLAUDE-INSTALL.md):

```
Read and follow this: https://raw.githubusercontent.com/bokgun/agents-hive/main/CLAUDE-INSTALL.md
```

Or install in one line:

```bash
git clone https://github.com/bokgun/agents-hive.git ~/.agents-hive && cd ~/.agents-hive && bun install && bun run build && bun link
```

> [한국어 설치 가이드](CLAUDE-INSTALL.ko.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
