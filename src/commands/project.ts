import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { success, error, cyan, dim } from '../lib/colors.js';
import { requireWorkspace, readStatus, writeStatus, timestamp } from '../lib/workspace.js';

export function projectCreate(name: string, agent: string, description: string): void {
  const ws = requireWorkspace();

  if (!['claude', 'gemini', 'codex'].includes(agent)) {
    console.error(error(`Unknown agent: ${agent} (claude|gemini|codex)`));
    process.exit(1);
  }

  const projectDir = path.join(ws, name);
  if (fs.existsSync(projectDir)) {
    console.error(error(`Already exists: ${name}`));
    process.exit(1);
  }

  fs.mkdirSync(path.join(projectDir, 'src'), { recursive: true });
  fs.mkdirSync(path.join(projectDir, '.claude'), { recursive: true });

  const ts = timestamp();

  // .claude/memory.md
  fs.writeFileSync(
    path.join(projectDir, '.claude', 'memory.md'),
    `# ${description} - Memory\n### ${ts}\n- Project created (agent: ${agent})\n`,
  );

  // CLAUDE.md
  fs.writeFileSync(
    path.join(projectDir, 'CLAUDE.md'),
    `# ${description}\n- Agent: ${agent}\n- Memory: write summaries to .claude/memory.md, update ../shared-memory/status.json\n`,
  );

  // Agent-specific setup
  switch (agent) {
    case 'claude':
      fs.writeFileSync(
        path.join(projectDir, '.claude', 'settings.json'),
        JSON.stringify(
          {
            permissions: {
              allow: [
                'Read',
                'Grep',
                'Glob',
                'Bash(npm *)',
                'Bash(git *)',
                'Bash(cat *)',
                'Bash(jq *)',
              ],
            },
          },
          null,
          2,
        ) + '\n',
      );
      break;
    case 'gemini':
      fs.writeFileSync(path.join(projectDir, 'GEMINI.md'), '');
      fs.mkdirSync(path.join(projectDir, 'output'), { recursive: true });
      break;
    case 'codex':
      fs.mkdirSync(path.join(projectDir, '.codex'), { recursive: true });
      fs.mkdirSync(path.join(projectDir, 'logs'), { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'AGENTS.md'), '');
      fs.writeFileSync(path.join(projectDir, '.codex', 'config.toml'), 'model = "gpt-5.4-mini"\n');
      break;
  }

  // Update status.json
  const status = readStatus(ws);
  status.projects[name] = {
    agent,
    description,
    status: 'idle',
    last_run: null,
    summary: 'Project created',
  };
  writeStatus(ws, status);

  console.log(success(`Created: ${cyan(name)} (${agent}) — ${description}`));
}

export function projectEdit(name: string, field: string, value: string): void {
  const ws = requireWorkspace();
  const status = readStatus(ws);

  if (!status.projects[name]) {
    console.error(error(`Not found: ${name}`));
    process.exit(1);
  }

  switch (field) {
    case 'description':
    case 'desc': {
      status.projects[name].description = value;
      writeStatus(ws, status);
      // Update CLAUDE.md first line
      const claudeMd = path.join(ws, name, 'CLAUDE.md');
      if (fs.existsSync(claudeMd)) {
        const content = fs.readFileSync(claudeMd, 'utf-8');
        const updated = content.replace(/^#.*$/m, `# ${value}`);
        fs.writeFileSync(claudeMd, updated);
      }
      break;
    }
    case 'agent':
      status.projects[name].agent = value;
      writeStatus(ws, status);
      break;
    default:
      console.error(error(`Unknown field: ${field} (description|agent)`));
      process.exit(1);
  }

  console.log(success(`Updated: ${name}.${field} = ${value}`));
}

export async function projectDelete(name: string): Promise<void> {
  const ws = requireWorkspace();
  const projectDir = path.join(ws, name);

  if (!fs.existsSync(projectDir)) {
    console.error(error(`Not found: ${name}`));
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question(`\x1b[1;33m[?]\x1b[0m Delete '${name}'? Memory will be archived. (y/N): `, resolve);
  });
  rl.close();

  if (answer.toLowerCase() !== 'y') {
    console.log(dim('Cancelled'));
    return;
  }

  // Archive memory
  const dateStr = new Date().toISOString().slice(0, 10);
  const archiveDir = path.join(ws, 'shared-memory', 'archive', `deleted-${name}-${dateStr}`);
  fs.mkdirSync(archiveDir, { recursive: true });

  const claudeDir = path.join(projectDir, '.claude');
  if (fs.existsSync(claudeDir)) {
    fs.cpSync(claudeDir, path.join(archiveDir, '.claude'), { recursive: true });
  }

  fs.rmSync(projectDir, { recursive: true, force: true });

  const status = readStatus(ws);
  const { [name]: _removed, ...rest } = status.projects;
  status.projects = rest;
  writeStatus(ws, status);

  console.log(success(`Deleted: ${name} (memory backed up)`));
}

export function projectList(): void {
  const ws = requireWorkspace();
  const status = readStatus(ws);
  const entries = Object.entries(status.projects);

  if (entries.length === 0) {
    console.log(dim('No projects.'));
    return;
  }

  console.log(cyan('Projects'));
  for (const [name, proj] of entries) {
    console.log(`  ${name.padEnd(20)} [${proj.agent}]  ${proj.description}`);
  }
}
