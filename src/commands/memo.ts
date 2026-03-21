import fs from 'node:fs';
import path from 'node:path';
import { success, error, cyan } from '../lib/colors.js';
import { requireWorkspace, memoFilePath, timestamp } from '../lib/workspace.js';

export function memo(target: string, content?: string): void {
  const ws = requireWorkspace();
  const ts = timestamp();

  if (target === 'global' || target === 'g') {
    const memoPath = memoFilePath(ws);
    if (!content) {
      console.log(cyan('=== Global Memo ==='));
      console.log(fs.readFileSync(memoPath, 'utf-8'));
      return;
    }
    fs.appendFileSync(memoPath, `### ${ts}\n- ${content}\n\n`);
    console.log(success('Saved to global memo'));
    return;
  }

  // Project memo
  const project = target;
  const pmemo = path.join(ws, project, '.claude', 'memory.md');

  if (!fs.existsSync(pmemo)) {
    console.error(error(`Not found: ${project}`));
    process.exit(1);
  }

  if (!content) {
    console.log(cyan(`=== ${project} memory ===`));
    console.log(fs.readFileSync(pmemo, 'utf-8'));
    return;
  }

  fs.appendFileSync(pmemo, `### ${ts}\n- ${content}\n\n`);
  console.log(success(`Saved to ${project} memory`));
}
