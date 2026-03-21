import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { success, error, warn, cyan, dim, DIM, N } from '../lib/colors.js';
import { requireWorkspace, readStatus, writeStatus } from '../lib/workspace.js';

function tmuxSessionExists(name: string): boolean {
  try {
    execSync(`tmux has-session -t ${name}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function start(project: string, extra: string[]): void {
  const ws = requireWorkspace();
  const projectDir = path.join(ws, project);

  if (!fs.existsSync(projectDir)) {
    console.error(error(`Not found: ${project}`));
    process.exit(1);
  }

  const sessionName = `hive-${project}`;

  if (tmuxSessionExists(sessionName)) {
    console.error(warn(`Already running: ${sessionName}`));
    console.log(`    Attach: ${cyan(`tmux attach -t ${sessionName}`)}`);
    return;
  }

  const status = readStatus(ws);
  const agent = status.projects[project]?.agent ?? 'claude';

  // Build the command to run inside tmux
  let cmd: string;
  const extraArgs = extra.length > 0 ? ' ' + extra.join(' ') : '';

  switch (agent) {
    case 'gemini':
      cmd = commandExists('gemini')
        ? `gemini${extraArgs}`
        : `claude${extraArgs}`;
      break;
    case 'codex':
      cmd = commandExists('codex')
        ? `codex${extraArgs}`
        : `claude${extraArgs}`;
      break;
    default:
      cmd = `claude${extraArgs}`;
      break;
  }

  try {
    execSync(`tmux new-session -d -s ${sessionName}`, { stdio: 'pipe' });
    execSync(
      `tmux send-keys -t ${sessionName} "cd ${projectDir} && CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 ${cmd}" Enter`,
      { stdio: 'pipe' },
    );
  } catch (e) {
    console.error(error(`Failed to start tmux session: ${e}`));
    process.exit(1);
  }

  // Update status
  if (status.projects[project]) {
    status.projects[project].status = 'running';
    writeStatus(ws, status);
  }

  console.log(success(`Started: ${cyan(project)} (${agent})`));
  console.log(`    tmux session: ${cyan(sessionName)}`);
  console.log(`    Attach: ${cyan(`tmux attach -t ${sessionName}`)}`);
}

export function stop(project: string): void {
  const ws = requireWorkspace();
  const sessionName = `hive-${project}`;

  if (!tmuxSessionExists(sessionName)) {
    console.error(warn(`Not running: ${sessionName}`));
    return;
  }

  try {
    execSync(`tmux kill-session -t ${sessionName}`, { stdio: 'pipe' });
  } catch {
    console.error(error(`Failed to stop: ${sessionName}`));
    process.exit(1);
  }

  const status = readStatus(ws);
  if (status.projects[project]) {
    status.projects[project].status = 'idle';
    writeStatus(ws, status);
  }

  console.log(success(`Stopped: ${cyan(project)}`));
}

export function ps(): void {
  const ws = requireWorkspace();
  const status = readStatus(ws);

  let sessions: string[] = [];
  try {
    const output = execSync('tmux list-sessions -F "#{session_name}"', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    sessions = output
      .trim()
      .split('\n')
      .filter((s) => s.startsWith('hive-'));
  } catch {
    // tmux not running or no sessions
  }

  if (sessions.length === 0) {
    console.log(dim('No running sessions.'));
    return;
  }

  console.log(cyan('Running Sessions'));
  console.log(`${DIM}${'PROJECT'.padEnd(20)} ${'AGENT'.padEnd(10)} TMUX SESSION${N}`);

  for (const session of sessions) {
    const project = session.replace('hive-', '');
    const agent = status.projects[project]?.agent ?? '?';
    console.log(`${project.padEnd(20)} ${agent.padEnd(10)} ${session}`);
  }
}

function commandExists(cmd: string): boolean {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}
