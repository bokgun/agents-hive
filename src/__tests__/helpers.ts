import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { StatusData } from '../lib/workspace.js';

export function createTmpWorkspace(projects?: Record<string, { agent: string; description: string }>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hive-test-'));
  fs.mkdirSync(path.join(dir, 'shared-memory', 'archive'), { recursive: true });

  const data: StatusData = {
    initialized: '2025-01-01 00:00:00',
    projects: {},
  };

  if (projects) {
    for (const [name, info] of Object.entries(projects)) {
      data.projects[name] = {
        agent: info.agent,
        description: info.description,
        status: 'idle',
        last_run: null,
        summary: 'Project created',
      };

      // Create project directory structure
      fs.mkdirSync(path.join(dir, name, 'src'), { recursive: true });
      fs.mkdirSync(path.join(dir, name, '.claude'), { recursive: true });
      fs.writeFileSync(
        path.join(dir, name, '.claude', 'memory.md'),
        `# ${info.description} - Memory\n### 2025-01-01 00:00:00\n- Project created (agent: ${info.agent})\n`,
      );
      fs.writeFileSync(
        path.join(dir, name, 'CLAUDE.md'),
        `# ${info.description}\n- Agent: ${info.agent}\n`,
      );
    }
  }

  fs.writeFileSync(
    path.join(dir, 'shared-memory', 'status.json'),
    JSON.stringify(data, null, 2) + '\n',
  );
  fs.writeFileSync(path.join(dir, 'shared-memory', 'memo.md'), '# Global Memo\n');
  fs.writeFileSync(
    path.join(dir, 'shared-memory', 'decisions.md'),
    '# Decision Log\n## 2025-01-01 00:00:00 - Workspace initialized\n',
  );
  fs.writeFileSync(path.join(dir, 'shared-memory', 'daily-briefing.md'), '');

  return dir;
}

export function cleanupTmp(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

export function withWorkspace(
  dir: string,
  fn: () => void | Promise<void>,
): void | Promise<void> {
  const prev = process.env.HIVE_WORKSPACE;
  process.env.HIVE_WORKSPACE = dir;
  try {
    return fn();
  } finally {
    if (prev !== undefined) {
      process.env.HIVE_WORKSPACE = prev;
    } else {
      delete process.env.HIVE_WORKSPACE;
    }
  }
}
