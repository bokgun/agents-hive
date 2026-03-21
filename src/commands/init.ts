import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { success, warn, cyan } from '../lib/colors.js';
import { timestamp } from '../lib/workspace.js';

export function initWorkspace(target?: string): void {
  const dir = target ?? path.join(process.env.HOME ?? '', 'agents-hive');
  const statusPath = path.join(dir, 'shared-memory', 'status.json');

  if (fs.existsSync(statusPath)) {
    console.error(warn(`Workspace already exists: ${dir}`));
    process.exit(1);
  }

  fs.mkdirSync(path.join(dir, 'shared-memory', 'archive'), { recursive: true });

  // CLAUDE.md
  fs.writeFileSync(
    path.join(dir, 'CLAUDE.md'),
    `# Agents Hive Workspace

## Memory Rules
- On task completion, write a summary to the project's \`.claude/memory.md\`
- On status change, update \`shared-memory/status.json\` using jq
- When referencing other projects, check \`shared-memory/\`

## Status JSON Schema
\`\`\`json
{
  "project": "name",
  "timestamp": "ISO 8601",
  "agent": "claude|gemini|codex",
  "status": "idle|running|error|completed",
  "summary": "latest work summary"
}
\`\`\`
`,
  );

  // status.json
  const ts = timestamp();
  fs.writeFileSync(statusPath, JSON.stringify({ initialized: ts, projects: {} }, null, 2) + '\n');

  // decisions.md
  fs.writeFileSync(
    path.join(dir, 'shared-memory', 'decisions.md'),
    `# Decision Log\n## ${ts} - Workspace initialized\n`,
  );

  // memo.md
  fs.writeFileSync(path.join(dir, 'shared-memory', 'memo.md'), '# Global Memo\n');

  // daily-briefing.md
  fs.writeFileSync(path.join(dir, 'shared-memory', 'daily-briefing.md'), '');

  // .env.example
  fs.writeFileSync(
    path.join(dir, '.env.example'),
    `# Optional: Telegram notifications
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# All agents use subscription plan login (no API keys needed)
# claude  → claude.ai login (Max/Pro)
# codex   → ChatGPT login (Plus/Pro)
# gemini  → Google login
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
`,
  );

  // .gitignore
  fs.writeFileSync(
    path.join(dir, '.gitignore'),
    `.env
*.log
/shared-memory/archive/
node_modules/
__pycache__/
.DS_Store
`,
  );

  // .claude/settings.json — pre-approve permissions for autonomous operation
  fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.claude', 'settings.json'),
    JSON.stringify(
      {
        permissions: {
          allow: [
            'mcp__plugin_telegram_telegram__reply',
            'mcp__plugin_telegram_telegram__react',
            'mcp__plugin_telegram_telegram__download_attachment',
            'mcp__plugin_telegram_telegram__edit_message',
            'Read',
            'Grep',
            'Glob',
            'Bash(git *)',
            'Bash(jq *)',
            'Bash(cat *)',
            'Bash(npm *)',
            'Bash(ls *)',
            'Bash(head *)',
            'Bash(tail *)',
          ],
        },
      },
      null,
      2,
    ) + '\n',
  );

  // git init
  if (!fs.existsSync(path.join(dir, '.git'))) {
    try {
      execSync('git init -q', { cwd: dir, stdio: 'pipe' });
      execSync('git add -A', { cwd: dir, stdio: 'pipe' });
      execSync('git commit -q -m "init: agents-hive workspace"', {
        cwd: dir,
        stdio: 'pipe',
      });
    } catch {
      // ignore git errors
    }
  }

  console.log(success(`Workspace initialized: ${cyan(dir)}`));
  console.log('');
  console.log('  Next steps:');
  console.log(`  ${cyan(`export HIVE_WORKSPACE=${dir}`)}`);
  console.log(`  ${cyan('hive project create my-app claude "My first project"')}`);
}
