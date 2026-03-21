import path from 'node:path';
import { execSync } from 'node:child_process';
import { success, warn, cyan, dim } from '../lib/colors.js';

export function uninstall(): void {
  const sourceDir = path.resolve(import.meta.dirname, '..', '..');

  // Unlink global binary
  try {
    execSync('bun unlink', { cwd: sourceDir, stdio: 'pipe' });
    console.log(success('Global binary unlinked'));
  } catch {
    console.log(warn('Could not unlink — binary may already be removed'));
  }

  console.log(`    Source directory: ${cyan(sourceDir)}`);
  console.log(`    Remove it manually: ${cyan(`rm -rf ${sourceDir}`)}`);
  console.log(dim('    Workspace data was not touched.'));
}
