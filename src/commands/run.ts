import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { error } from '../lib/colors.js';
import { requireWorkspace, readStatus, writeStatus, timestamp } from '../lib/workspace.js';

function commandExists(cmd: string): boolean {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function run(project: string, command: string): void {
  const ws = requireWorkspace();
  const projectDir = path.join(ws, project);

  if (!fs.existsSync(projectDir)) {
    console.error(error(`Not found: ${project}`));
    process.exit(1);
  }

  const status = readStatus(ws);
  const agent = status.projects[project]?.agent ?? 'claude';
  const ts = timestamp();

  // Mark as running
  if (status.projects[project]) {
    status.projects[project].status = 'running';
    status.projects[project].last_run = ts;
    writeStatus(ws, status);
  }

  let result: string;

  try {
    switch (agent) {
      case 'gemini':
        if (commandExists('gemini')) {
          result = execSync(`gemini -p ${JSON.stringify(command)}`, {
            cwd: projectDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
          });
        } else {
          result = execSync(`claude -p ${JSON.stringify(command)} --output-format text`, {
            cwd: projectDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
          });
        }
        break;

      case 'codex':
        if (commandExists('codex')) {
          result = execSync(`codex exec ${JSON.stringify(command)}`, {
            cwd: projectDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
          });
        } else {
          result = execSync(`claude -p ${JSON.stringify(command)} --output-format text`, {
            cwd: projectDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
          });
        }
        break;

      default: {
        const prompt = `${command}\nWrite a summary to .claude/memory.md after completing.`;
        result = execSync(`claude -p ${JSON.stringify(prompt)} --output-format text`, {
          cwd: projectDir,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        break;
      }
    }
  } catch (e: unknown) {
    result =
      e instanceof Error ? ((e as Error & { stdout?: string }).stdout ?? e.message) : String(e);
  }

  // Update status
  const updatedStatus = readStatus(ws);
  if (updatedStatus.projects[project]) {
    updatedStatus.projects[project].status = 'completed';
    updatedStatus.projects[project].summary = result.split('\n').slice(0, 3).join('\n');
    writeStatus(ws, updatedStatus);
  }

  console.log(result);
}
