import { describe, expect, test, beforeEach, afterEach, spyOn } from 'bun:test';
import { captureOutput } from '../../commands/bot.js';
import { stripAnsi } from '../../lib/telegram.js';
import { status } from '../../commands/status.js';
import { createTmpWorkspace, cleanupTmp, withWorkspace } from '../helpers.js';

describe('stripAnsi', () => {
  test('removes ANSI color codes', () => {
    expect(stripAnsi('\x1b[0;32m[✓]\x1b[0m Hello')).toBe('[✓] Hello');
  });

  test('returns plain text unchanged', () => {
    expect(stripAnsi('no colors here')).toBe('no colors here');
  });

  test('handles multiple color codes', () => {
    expect(stripAnsi('\x1b[1;33mWARN\x1b[0m: \x1b[2mdim text\x1b[0m')).toBe('WARN: dim text');
  });

  test('handles empty string', () => {
    expect(stripAnsi('')).toBe('');
  });
});

describe('captureOutput', () => {
  test('captures console.log output', async () => {
    const result = await captureOutput(() => {
      console.log('hello');
      console.log('world');
    });
    expect(result).toBe('hello\nworld');
  });

  test('captures console.error output', async () => {
    const result = await captureOutput(() => {
      console.error('error message');
    });
    expect(result).toBe('error message');
  });

  test('captures mixed log and error', async () => {
    const result = await captureOutput(() => {
      console.log('info');
      console.error('err');
    });
    expect(result).toBe('info\nerr');
  });

  test('survives process.exit calls', async () => {
    const result = await captureOutput(() => {
      console.log('before exit');
      process.exit(1);
    });
    expect(result).toBe('before exit');
  });

  test('strips ANSI codes from output', async () => {
    const result = await captureOutput(() => {
      console.log('\x1b[0;32m[✓]\x1b[0m Done');
    });
    expect(result).toBe('[✓] Done');
  });

  test('captures async function output', async () => {
    const result = await captureOutput(async () => {
      console.log('async output');
    });
    expect(result).toBe('async output');
  });

  test('restores console after capture', async () => {
    const origLog = console.log;
    await captureOutput(() => {
      console.log('captured');
    });
    expect(console.log).toBe(origLog);
  });
});

describe('captureOutput with real commands', () => {
  let ws: string;

  afterEach(() => {
    if (ws) cleanupTmp(ws);
  });

  test('captures status command output', async () => {
    ws = createTmpWorkspace({
      api: { agent: 'claude', description: 'Backend API' },
    });

    const result = await withWorkspace(ws, async () => {
      return await captureOutput(() => status());
    });

    expect(result).toContain('api');
    expect(result).toContain('claude');
  });
});
