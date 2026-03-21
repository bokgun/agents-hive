import { execSync, type ExecSyncOptionsWithStringEncoding } from 'node:child_process';
import path from 'node:path';

const CLI_PATH = path.resolve(import.meta.dir, '../../../src/cli.ts');

interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export function runHive(args: string[], options?: { env?: Record<string, string> }): RunResult {
  const cmd = `bun ${CLI_PATH} ${args.join(' ')}`;
  const execOpts: ExecSyncOptionsWithStringEncoding = {
    encoding: 'utf-8',
    env: { ...process.env, ...options?.env },
    timeout: 10000,
  };

  try {
    const stdout = execSync(cmd, { ...execOpts, stdio: ['pipe', 'pipe', 'pipe'] });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (e: unknown) {
    const err = e as Error & { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      exitCode: err.status ?? 1,
    };
  }
}
