import { cyan, dim, DIM, N } from '../lib/colors.js';
import { requireWorkspace, readStatus } from '../lib/workspace.js';

export function status(): void {
  const ws = requireWorkspace();
  const data = readStatus(ws);
  const entries = Object.entries(data.projects);

  if (entries.length === 0) {
    console.log(dim(`No projects. Run ${cyan('hive project create')} to get started.`));
    return;
  }

  console.log(cyan('Project Status'));
  console.log(
    `${DIM}${'NAME'.padEnd(20)} ${'AGENT'.padEnd(10)} ${'STATUS'.padEnd(12)} SUMMARY${N}`,
  );

  for (const [name, proj] of entries) {
    console.log(
      `${name.padEnd(20)} ${proj.agent.padEnd(10)} ${proj.status.padEnd(12)} ${proj.summary ?? '-'}`,
    );
  }
}
