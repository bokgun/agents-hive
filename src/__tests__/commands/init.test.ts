import { describe, expect, test, afterEach, spyOn } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { initWorkspace } from '../../commands/init.js';

describe('initWorkspace', () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('creates workspace with all required files', () => {
    tmpDir = path.join(os.tmpdir(), `hive-init-test-${Date.now()}`);
    spyOn(console, 'log').mockImplementation(() => {});

    initWorkspace(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'shared-memory', 'status.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'shared-memory', 'decisions.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'shared-memory', 'memo.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'shared-memory', 'daily-briefing.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'shared-memory', 'archive'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.env.example'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.gitignore'))).toBe(true);
  });

  test('status.json has correct structure', () => {
    tmpDir = path.join(os.tmpdir(), `hive-init-test-${Date.now()}`);
    spyOn(console, 'log').mockImplementation(() => {});

    initWorkspace(tmpDir);

    const status = JSON.parse(fs.readFileSync(path.join(tmpDir, 'shared-memory', 'status.json'), 'utf-8'));
    expect(status.initialized).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(status.projects).toEqual({});
  });

  test('creates git repo', () => {
    tmpDir = path.join(os.tmpdir(), `hive-init-test-${Date.now()}`);
    spyOn(console, 'log').mockImplementation(() => {});

    initWorkspace(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, '.git'))).toBe(true);
  });
});
