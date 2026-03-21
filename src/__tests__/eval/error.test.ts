import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runHive } from './helpers.js';

describe('error handling', () => {
  let ws: string;

  beforeAll(() => {
    ws = path.join(os.tmpdir(), `hive-eval-err-${Date.now()}`);
    // Init workspace for some tests
    runHive(['init', ws]);
  });

  afterAll(() => {
    if (ws && fs.existsSync(ws)) {
      fs.rmSync(ws, { recursive: true, force: true });
    }
  });

  test('status without workspace exits with error', () => {
    const nonExistent = path.join(os.tmpdir(), `hive-no-ws-${Date.now()}`);
    const { stderr, exitCode } = runHive(['status'], {
      env: { HIVE_WORKSPACE: nonExistent },
    });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('No workspace found');
  });

  test('init on existing workspace exits with error', () => {
    const { stderr, exitCode } = runHive(['init', ws]);
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('already exists');
  });

  test('create duplicate project exits with error', () => {
    runHive(['project', 'create', 'dup', 'claude', 'test'], {
      env: { HIVE_WORKSPACE: ws },
    });
    const { stderr, exitCode } = runHive(['project', 'create', 'dup', 'claude', 'test'], {
      env: { HIVE_WORKSPACE: ws },
    });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('Already exists');
  });

  test('create with invalid agent exits with error', () => {
    const { stderr, exitCode } = runHive(
      ['project', 'create', 'bad', 'unknown-agent', 'test'],
      { env: { HIVE_WORKSPACE: ws } },
    );
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('Unknown agent');
  });

  test('edit nonexistent project exits with error', () => {
    const { stderr, exitCode } = runHive(
      ['project', 'edit', 'nonexistent', 'description', 'new'],
      { env: { HIVE_WORKSPACE: ws } },
    );
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('Not found');
  });

  test('memo for nonexistent project exits with error', () => {
    const { stderr, exitCode } = runHive(['memo', 'nonexistent', 'some content'], {
      env: { HIVE_WORKSPACE: ws },
    });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('Not found');
  });

  test('cron remove without cron file exits with error', () => {
    // Use a fresh workspace without any cron jobs
    const freshWs = path.join(os.tmpdir(), `hive-fresh-${Date.now()}`);
    runHive(['init', freshWs]);

    const { stderr, exitCode } = runHive(['cron', 'remove', 'nonexistent'], {
      env: { HIVE_WORKSPACE: freshWs },
    });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('No cron file');

    fs.rmSync(freshWs, { recursive: true, force: true });
  });
});
