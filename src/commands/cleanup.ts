import fs from 'node:fs';
import path from 'node:path';
import { success } from '../lib/colors.js';
import { requireWorkspace, decisionsFilePath } from '../lib/workspace.js';

function getWeekString(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const week = Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function cleanup(): void {
  const ws = requireWorkspace();
  const week = getWeekString();
  const archiveDir = path.join(ws, 'shared-memory', 'archive', week);

  fs.mkdirSync(archiveDir, { recursive: true });

  // Archive decisions
  const decisionsPath = decisionsFilePath(ws);
  if (fs.existsSync(decisionsPath)) {
    fs.copyFileSync(decisionsPath, path.join(archiveDir, 'decisions.md'));
  }

  let count = 0;
  const entries = fs.readdirSync(ws, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const memPath = path.join(ws, entry.name, '.claude', 'memory.md');
    if (!fs.existsSync(memPath)) continue;

    const content = fs.readFileSync(memPath, 'utf-8');
    const lines = content.split('\n');

    if (lines.length > 50) {
      // Archive full memory
      fs.copyFileSync(memPath, path.join(archiveDir, `${entry.name}-memory.md`));

      // Trim: keep first 3 lines + archive note + last 20 lines
      const head = lines.slice(0, 3);
      const tail = lines.slice(-20);
      const trimmed = [...head, '', `> Archived: ${week}`, '', ...tail].join('\n');
      fs.writeFileSync(memPath, trimmed);

      count++;
    }
  }

  console.log(success(`Cleanup done (${count} archived)`));
}
