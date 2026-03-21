# agents-hive — Claude Code Install Guide

This file is designed for Claude Code to read and automatically install & configure agents-hive.

## 1. Prerequisites Check

Verify required tools are installed:

```bash
command -v git && command -v bun
```

If bun is missing, install it first:

```bash
curl -fsSL https://bun.sh/install | bash
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
| `hive briefing` | Generate daily briefing |
| `hive cron add <name> <schedule> <cmd>` | Add a cron job |

## For Claude Code

After installing, add the following to your workspace's `CLAUDE.md` to integrate with agents-hive:

```markdown
## agents-hive Integration
- On task completion, write a summary to `.claude/memory.md`
- On status change, update `shared-memory/status.json`
- When referencing other projects, check `shared-memory/`
```

Source: https://github.com/bokgun/agents-hive
