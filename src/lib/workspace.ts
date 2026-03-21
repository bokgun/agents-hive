import fs from 'node:fs';
import path from 'node:path';
import { error, cyan } from './colors.js';

export interface ProjectEntry {
  agent: string;
  description: string;
  status: string;
  last_run: string | null;
  summary: string;
}

export interface StatusData {
  initialized: string;
  projects: Record<string, ProjectEntry>;
}

export function resolveWorkspace(): string | null {
  if (process.env.HIVE_WORKSPACE) {
    return process.env.HIVE_WORKSPACE;
  }

  const cwdStatus = path.join(process.cwd(), 'shared-memory', 'status.json');
  if (fs.existsSync(cwdStatus)) {
    return process.cwd();
  }

  const homeStatus = path.join(
    process.env.HOME ?? '',
    'agents-hive',
    'shared-memory',
    'status.json',
  );
  if (fs.existsSync(homeStatus)) {
    return path.join(process.env.HOME ?? '', 'agents-hive');
  }

  return null;
}

export function requireWorkspace(): string {
  const ws = resolveWorkspace();
  if (!ws) {
    console.error(error(`No workspace found. Run ${cyan('hive init')} first.`));
    process.exit(1);
  }
  return ws;
}

export function statusFilePath(workspace: string): string {
  return path.join(workspace, 'shared-memory', 'status.json');
}

export function memoFilePath(workspace: string): string {
  return path.join(workspace, 'shared-memory', 'memo.md');
}

export function decisionsFilePath(workspace: string): string {
  return path.join(workspace, 'shared-memory', 'decisions.md');
}

export function readStatus(workspace: string): StatusData {
  const raw = fs.readFileSync(statusFilePath(workspace), 'utf-8');
  return JSON.parse(raw) as StatusData;
}

export function writeStatus(workspace: string, data: StatusData): void {
  fs.writeFileSync(statusFilePath(workspace), JSON.stringify(data, null, 2) + '\n');
}

export function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
