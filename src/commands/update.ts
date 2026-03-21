import path from 'node:path';
import { execSync } from 'node:child_process';
import { success, error, cyan, dim } from '../lib/colors.js';

export function update(): void {
  const sourceDir = path.resolve(import.meta.dirname, '..', '..');

  console.log('Updating agents-hive...');

  try {
    execSync('git pull --ff-only', { cwd: sourceDir, stdio: 'pipe' });
  } catch {
    console.error(error('git pull failed — check for local changes or network issues'));
    process.exit(1);
  }

  try {
    execSync('bun install', { cwd: sourceDir, stdio: 'pipe' });
    execSync('bun run build', { cwd: sourceDir, stdio: 'pipe' });
  } catch {
    console.error(error('Build failed after update'));
    process.exit(1);
  }

  let version = 'unknown';
  try {
    const pkg = execSync('node -e "console.log(require(\'./package.json\').version)"', {
      cwd: sourceDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    version = pkg.trim();
  } catch {
    // ignore
  }

  console.log(success(`Updated to ${cyan(`v${version}`)}`));
  console.log(dim('    git pull → bun install → bun run build'));
}
