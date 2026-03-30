# agents-hive — Claude Code Install Guide

This file is designed for Claude Code to read and automatically install & configure agents-hive.

## 1. Prerequisites Check

Verify required tools are installed:

```bash
command -v git && command -v bun && command -v tmux
```

If bun is missing, install it first:

```bash
curl -fsSL https://bun.sh/install | bash
```

If tmux is missing (required for `hive start` / `hive session all`):

```bash
# macOS
brew install tmux

# Ubuntu/Debian
sudo apt install tmux
```

## 2. Install agents-hive

```bash
git clone https://github.com/bokgun/agents-hive.git ~/.agents-hive
cd ~/.agents-hive && bun install && bun run build && bun link
```

## 3. Initialize Workspace

```bash
hive init ~/agents-workspace
```

Add the environment variable to your shell config:

```bash
echo 'export HIVE_WORKSPACE=~/agents-workspace' >> ~/.zshrc
export HIVE_WORKSPACE=~/agents-workspace
```

## 4. Create Your First Project

Register a project with an assigned agent:

```bash
hive project create my-project claude "Project description"
```

Agent options: `claude` (coding), `gemini` (research), `codex` (async tasks)

## 5. Verify

```bash
hive status
hive --version
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `hive project create <name> <agent> <desc>` | Create a project |
| `hive project list` | List all projects |
| `hive memo <project> <content>` | Save project memo |
| `hive memo global <content>` | Save global memo |
| `hive status` | Show all project status |
| `hive run <project> <command>` | Run command via agent |
| `hive session <project>` | Start interactive session |
| `hive start [project] [-t] [-d] [-a] [-b]` | Start background tmux session |
| `hive stop [project]` | Stop a running session |
| `hive ps` | List running sessions |
| `hive bot` | Start Telegram bot (foreground) |
| `hive briefing` | Generate daily briefing |
| `hive notify <message>` | Send Telegram notification |
| `hive cron add <name> <schedule> <cmd>` | Add a cron job |
| `hive setup telegram` | Interactive Telegram bot setup |
| `hive update` | Update to latest version |

## For Claude Code

After installing, add the following to your workspace's `CLAUDE.md` to integrate with agents-hive:

```markdown
## agents-hive Integration
- On task completion, write a summary to `.claude/memory.md`
- On status change, update `shared-memory/status.json`
- When referencing other projects, check `shared-memory/`
```

## Telegram Plugin (optional, for `-t` flag)

To use `hive start -t` or `--channels plugin:telegram`, set up the Claude Code Telegram plugin on each machine:

```bash
claude plugins add telegram@claude-plugins-official
claude --channels plugin:telegram@claude-plugins-official
```

The plugin config is stored in `~/.claude/channels/telegram/` (machine-local, not synced via git).

## Telegram Bot (optional, for `hive bot`)

To receive hive commands from Telegram chat:

```bash
hive setup telegram               # Configure bot token & chat ID
hive bot                          # Start bot (foreground)
hive start --bot                  # Start bot (background tmux)
```

Supported commands: `/status`, `/ps`, `/projects`, `/briefing`, `/memo`, `/start`, `/stop`, `/run`.

Source: https://github.com/bokgun/agents-hive
