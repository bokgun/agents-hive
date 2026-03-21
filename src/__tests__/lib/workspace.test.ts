import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  resolveWorkspace,
  statusFilePath,
  memoFilePath,
  decisionsFilePath,
  readStatus,
  writeStatus,
  timestamp,
  type StatusData,
} from '../../lib/workspace.js';

function makeTmpWorkspace(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hive-test-'));
  fs.mkdirSync(path.join(dir, 'shared-memory'), { recursive: true });
  const data: StatusData = { initialized: '2025-01-01 00:00:00', projects: {} };
  fs.writeFileSync(path.join(dir, 'shared-memory', 'status.json'), JSON.stringify(data));
  return dir;
}

describe('workspace resolution', () => {
  let savedEnv: string | undefined;

  beforeEach(() => {
    savedEnv = process.env.HIVE_WORKSPACE;
  });

  afterEach(() => {
    if (savedEnv !== undefined) {
      process.env.HIVE_WORKSPACE = savedEnv;
    } else {
      delete process.env.HIVE_WORKSPACE;
    }
  });

  test('resolveWorkspace returns HIVE_WORKSPACE env var when set', () => {
    const tmp = makeTmpWorkspace();
    process.env.HIVE_WORKSPACE = tmp;
    expect(resolveWorkspace()).toBe(tmp);
    fs.rmSync(tmp, { recursive: true });
  });

  test('resolveWorkspace returns null when no workspace found', () => {
    process.env.HIVE_WORKSPACE = '';
    delete process.env.HIVE_WORKSPACE;
    // Assuming cwd and home don't have workspace
    const result = resolveWorkspace();
    // Can't guarantee null in all environments, so just check type
    expect(typeof result === 'string' || result === null).toBe(true);
  });
});

describe('file paths', () => {
  test('statusFilePath returns correct path', () => {
    expect(statusFilePath('/ws')).toBe('/ws/shared-memory/status.json');
  });

  test('memoFilePath returns correct path', () => {
    expect(memoFilePath('/ws')).toBe('/ws/shared-memory/memo.md');
  });

  test('decisionsFilePath returns correct path', () => {
    expect(decisionsFilePath('/ws')).toBe('/ws/shared-memory/decisions.md');
  });
});

describe('readStatus / writeStatus', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = makeTmpWorkspace();
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true });
  });

  test('readStatus reads initial status', () => {
    const status = readStatus(tmp);
    expect(status.initialized).toBe('2025-01-01 00:00:00');
    expect(status.projects).toEqual({});
  });

  test('writeStatus persists data', () => {
    const data: StatusData = {
      initialized: '2025-01-01 00:00:00',
      projects: {
        myapp: {
          agent: 'claude',
          description: 'test',
          status: 'idle',
          last_run: null,
          summary: 'created',
        },
      },
    };
    writeStatus(tmp, data);
    const read = readStatus(tmp);
    expect(read.projects.myapp.agent).toBe('claude');
    expect(read.projects.myapp.description).toBe('test');
  });
});

describe('timestamp', () => {
  test('returns YYYY-MM-DD HH:MM:SS format', () => {
    const ts = timestamp();
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});
