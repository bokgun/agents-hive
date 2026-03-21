import fs from 'node:fs';
import path from 'node:path';
import { success } from '../lib/colors.js';
import { requireWorkspace, readStatus } from '../lib/workspace.js';

export function briefing(): void {
  const ws = requireWorkspace();
  const data = readStatus(ws);
  const briefPath = path.join(ws, 'shared-memory', 'daily-briefing.md');
  const date = new Date().toISOString().slice(0, 10);

  let content = `# Daily Briefing - ${date}\n\n`;

  for (const [name, proj] of Object.entries(data.projects)) {
    content += `## ${name}\n`;
    content += `- Status: ${proj.status}\n`;
    content += `- Agent: ${proj.agent}\n`;
    content += `- Last run: ${proj.last_run ?? 'never'}\n`;
    content += `- Summary: ${proj.summary}\n\n`;
  }

  // Append project memories
  const entries = fs.readdirSync(ws, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const memPath = path.join(ws, entry.name, '.claude', 'memory.md');
    if (!fs.existsSync(memPath)) continue;

    content += '---\n';
    content += `### ${entry.name}\n`;
    const lines = fs.readFileSync(memPath, 'utf-8').split('\n');
    content += lines.slice(-5).join('\n') + '\n\n';
  }

  fs.writeFileSync(briefPath, content);

  console.log(success('Briefing generated'));
  console.log(content);
}
