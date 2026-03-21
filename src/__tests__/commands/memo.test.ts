import { describe, expect, test, beforeEach, afterEach, spyOn } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { memo } from '../../commands/memo.js';
import { createTmpWorkspace, cleanupTmp, withWorkspace } from '../helpers.js';

describe('memo', () => {
  let ws: string;

  beforeEach(() => {
    ws = createTmpWorkspace({ api: { agent: 'claude', description: 'Backend' } });
    spyOn(console, 'log').mockImplementation(() => {});
    spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanupTmp(ws);
  });

  test('appends to global memo', () => {
    withWorkspace(ws, () => {
      memo('global', 'Sprint goal: finish MVP');
    });

    const content = fs.readFileSync(path.join(ws, 'shared-memory', 'memo.md'), 'utf-8');
    expect(content).toContain('Sprint goal: finish MVP');
  });

  test('reads global memo without content arg', () => {
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});

    withWorkspace(ws, () => {
      memo('global');
    });

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Global Memo');
  });

  test('appends to project memo', () => {
    withWorkspace(ws, () => {
      memo('api', 'Using PostgreSQL');
    });

    const content = fs.readFileSync(path.join(ws, 'api', '.claude', 'memory.md'), 'utf-8');
    expect(content).toContain('Using PostgreSQL');
  });

  test('reads project memo without content arg', () => {
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});

    withWorkspace(ws, () => {
      memo('api');
    });

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('api memory');
  });

  test('global alias "g" works', () => {
    withWorkspace(ws, () => {
      memo('g', 'test memo via alias');
    });

    const content = fs.readFileSync(path.join(ws, 'shared-memory', 'memo.md'), 'utf-8');
    expect(content).toContain('test memo via alias');
  });
});
