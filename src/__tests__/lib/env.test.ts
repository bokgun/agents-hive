import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { createTmpWorkspace, cleanupTmp } from '../helpers.js';
import { loadEnv } from '../../lib/env.js';

describe('loadEnv', () => {
  let ws: string;
  let savedEnv: string | undefined;
  const testKeys = ['TEST_ENV_FOO', 'TEST_ENV_BAR', 'TEST_ENV_QUOTED', 'TEST_ENV_EXISTING'];

  beforeEach(() => {
    ws = createTmpWorkspace();
    savedEnv = process.env.HIVE_WORKSPACE;
    process.env.HIVE_WORKSPACE = ws;
    // Clean test keys
    for (const k of testKeys) process.env[k] = undefined as unknown as string;
  });

  afterEach(() => {
    if (savedEnv !== undefined) {
      process.env.HIVE_WORKSPACE = savedEnv;
    } else {
      delete process.env.HIVE_WORKSPACE;
    }
    for (const k of testKeys) process.env[k] = undefined as unknown as string;
    cleanupTmp(ws);
  });

  test('loads KEY=VALUE from .env', () => {
    fs.writeFileSync(path.join(ws, '.env'), 'TEST_ENV_FOO=hello\nTEST_ENV_BAR=world\n');

    loadEnv();

    expect(process.env.TEST_ENV_FOO).toBe('hello');
    expect(process.env.TEST_ENV_BAR).toBe('world');
  });

  test('skips comments and empty lines', () => {
    fs.writeFileSync(path.join(ws, '.env'), '# comment\n\nTEST_ENV_FOO=yes\n');

    loadEnv();

    expect(process.env.TEST_ENV_FOO).toBe('yes');
  });

  test('strips surrounding quotes', () => {
    fs.writeFileSync(path.join(ws, '.env'), 'TEST_ENV_QUOTED="hello world"\n');

    loadEnv();

    expect(process.env.TEST_ENV_QUOTED).toBe('hello world');
  });

  test('does not overwrite existing env vars', () => {
    process.env.TEST_ENV_EXISTING = 'original';
    fs.writeFileSync(path.join(ws, '.env'), 'TEST_ENV_EXISTING=overwritten\n');

    loadEnv();

    expect(process.env.TEST_ENV_EXISTING).toBe('original');
  });

  test('does nothing when no .env file', () => {
    // No .env file in workspace
    loadEnv();
    // Should not throw
    expect(true).toBe(true);
  });

  test('does nothing when no workspace', () => {
    process.env.HIVE_WORKSPACE = '/nonexistent/path';
    delete process.env.HIVE_WORKSPACE;

    loadEnv();
    expect(true).toBe(true);
  });
});
