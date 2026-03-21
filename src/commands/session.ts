import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawn } from 'node:child_process';
import { error } from '../lib/colors.js';
import { requireWorkspace, readStatus } from '../lib/workspace.js';

export function session(project: string, extra: string[]): void {
  const ws = requireWorkspace();

  if (project === 'all') {
    const status = readStatus(ws);
    const projects = Object.keys(status.projects);

    if (projects.length === 0) {
      console.error(error('No projects'));
      process.exit(1);
    }

    execSync('tmux new-session -d -s hive', { stdio: 'pipe' });

    let first = true;
    for (const name of projects) {
      if (first) {
        execSync(
          `tmux send-keys -t hive "cd ${ws}/${name} && CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude" Enter`,
          { stdio: 'pipe' },
        );
        first = false;
      } else {
        execSync('tmux split-window -v -t hive', { stdio: 'pipe' });
        execSync(
          `tmux send-keys -t hive "cd ${ws}/${name} && CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude" Enter`,
          { stdio: 'pipe' },
        );
      }
    }

    execSync('tmux select-layout -t hive tiled', { stdio: 'pipe' });
    spawn('tmux', ['attach', '-t', 'hive'], { stdio: 'inherit' });
    return;
  }

  const projectDir = path.join(ws, project);
  if (!fs.existsSync(projectDir)) {
    console.error(error(`Not found: ${project}`));
    process.exit(1);
  }

  const args = extra.length > 0 ? extra : [];
  spawn('claude', args, {
    cwd: projectDir,
    stdio: 'inherit',
    env: { ...process.env, CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1' },
  });
}
