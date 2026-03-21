import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runHive } from './helpers.js';

describe('full workflow', () => {
  let ws: string;

  beforeAll(() => {
    ws = path.join(os.tmpdir(), `hive-eval-${Date.now()}`);
  });

  afterAll(() => {
    if (ws && fs.existsSync(ws)) {
      fs.rmSync(ws, { recursive: true, force: true });
    }
  });

  test('1. init workspace', () => {
    const { stdout, exitCode } = runHive(['init', ws]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Workspace initialized');

    expect(fs.existsSync(path.join(ws, 'shared-memory', 'status.json'))).toBe(true);
    expect(fs.existsSync(path.join(ws, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(ws, 'shared-memory', 'memo.md'))).toBe(true);
  });

  test('2. create claude project', () => {
    const { stdout, exitCode } = runHive(['project', 'create', 'api', 'claude', 'Backend API'], {
      env: { HIVE_WORKSPACE: ws },
    });
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Created');
    expect(stdout).toContain('api');

    expect(fs.existsSync(path.join(ws, 'api', '.claude', 'settings.json'))).toBe(true);
  });

  test('3. create gemini project', () => {
    const { stdout, exitCode } = runHive(
      ['project', 'create', 'research', 'gemini', 'Market analysis'],
      { env: { HIVE_WORKSPACE: ws } },
    );
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Created');

    expect(fs.existsSync(path.join(ws, 'research', 'GEMINI.md'))).toBe(true);
  });

  test('4. project list shows both projects', () => {
    const { stdout, exitCode } = runHive(['project', 'list'], {
      env: { HIVE_WORKSPACE: ws },
    });
    expect(exitCode).toBe(0);
    expect(stdout).toContain('api');
    expect(stdout).toContain('research');
    expect(stdout).toContain('claude');
    expect(stdout).toContain('gemini');
  });

  test('5. add project memo', () => {
    const { stdout, exitCode } = runHive(['memo', 'api', 'PostgreSQL', 'setup', 'done'], {
      env: { HIVE_WORKSPACE: ws },
    });
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Saved to api memory');

    const mem = fs.readFileSync(path.join(ws, 'api', '.claude', 'memory.md'), 'utf-8');
    expect(mem).toContain('PostgreSQL setup done');
  });

  test('6. add global memo', () => {
    const { stdout, exitCode } = runHive(['memo', 'global', 'Sprint', '1', 'kickoff'], {
      env: { HIVE_WORKSPACE: ws },
    });
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Saved to global memo');

    const memo = fs.readFileSync(path.join(ws, 'shared-memory', 'memo.md'), 'utf-8');
    expect(memo).toContain('Sprint 1 kickoff');
  });

  test('7. status shows projects', () => {
    const { stdout, exitCode } = runHive(['status'], {
      env: { HIVE_WORKSPACE: ws },
    });
    expect(exitCode).toBe(0);
    expect(stdout).toContain('api');
    expect(stdout).toContain('research');
    expect(stdout).toContain('idle');
  });

  test('8. briefing generates report', () => {
    const { stdout, exitCode } = runHive(['briefing'], {
      env: { HIVE_WORKSPACE: ws },
    });
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Briefing generated');
    expect(stdout).toContain('Daily Briefing');
    expect(stdout).toContain('api');

    const brief = fs.readFileSync(path.join(ws, 'shared-memory', 'daily-briefing.md'), 'utf-8');
    expect(brief.length).toBeGreaterThan(0);
  });

  test('9. project edit updates description', () => {
    const { stdout, exitCode } = runHive(
      ['project', 'edit', 'api', 'description', 'Updated API'],
      { env: { HIVE_WORKSPACE: ws } },
    );
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Updated');

    const status = JSON.parse(
      fs.readFileSync(path.join(ws, 'shared-memory', 'status.json'), 'utf-8'),
    );
    expect(status.projects.api.description).toBe('Updated API');
  });

  test('10. cron add creates job', () => {
    const { stdout, exitCode } = runHive(
      ['cron', 'add', 'test-job', '*/30 * * * *', 'echo', 'hello'],
      { env: { HIVE_WORKSPACE: ws } },
    );
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Cron added');

    expect(fs.existsSync(path.join(ws, '.hive', 'crontab.generated'))).toBe(true);
  });

  test('11. cron list shows jobs', () => {
    const { stdout, exitCode } = runHive(['cron', 'list'], {
      env: { HIVE_WORKSPACE: ws },
    });
    expect(exitCode).toBe(0);
    expect(stdout).toContain('test-job');
  });

  test('12. cron remove deletes job', () => {
    const { stdout, exitCode } = runHive(['cron', 'remove', 'test-job'], {
      env: { HIVE_WORKSPACE: ws },
    });
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Removed');
  });

  test('13. cleanup runs without error', () => {
    const { stdout, exitCode } = runHive(['cleanup'], {
      env: { HIVE_WORKSPACE: ws },
    });
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Cleanup done');
  });
});
