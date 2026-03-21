import { describe, expect, test, beforeEach, afterEach, spyOn } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { cronAdd, cronList, cronRemove, cronShow } from '../../commands/cron.js';
import { createTmpWorkspace, cleanupTmp, withWorkspace } from '../helpers.js';

describe('cron', () => {
  let ws: string;

  beforeEach(() => {
    ws = createTmpWorkspace();
    spyOn(console, 'log').mockImplementation(() => {});
    spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanupTmp(ws);
  });

  test('cronAdd creates cron file with header and entry', () => {
    withWorkspace(ws, () => {
      cronAdd('test-job', '*/30 * * * *', 'echo hello');
    });

    const cronFile = path.join(ws, '.hive', 'crontab.generated');
    expect(fs.existsSync(cronFile)).toBe(true);

    const content = fs.readFileSync(cronFile, 'utf-8');
    expect(content).toContain('agents-hive crontab');
    expect(content).toContain('# [test-job]');
    expect(content).toContain('*/30 * * * * echo hello');
  });

  test('cronAdd appends multiple jobs', () => {
    withWorkspace(ws, () => {
      cronAdd('job1', '0 9 * * *', 'echo first');
      cronAdd('job2', '0 18 * * *', 'echo second');
    });

    const cronFile = path.join(ws, '.hive', 'crontab.generated');
    const content = fs.readFileSync(cronFile, 'utf-8');
    expect(content).toContain('# [job1]');
    expect(content).toContain('# [job2]');
  });

  test('cronList shows job names', () => {
    withWorkspace(ws, () => {
      cronAdd('my-task', '0 * * * *', 'echo test');
    });

    const logSpy = spyOn(console, 'log').mockImplementation(() => {});

    withWorkspace(ws, () => {
      cronList();
    });

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('my-task');
  });

  test('cronRemove removes a job', () => {
    withWorkspace(ws, () => {
      cronAdd('keep', '0 9 * * *', 'echo keep');
      cronAdd('remove-me', '0 18 * * *', 'echo remove');
      cronRemove('remove-me');
    });

    const cronFile = path.join(ws, '.hive', 'crontab.generated');
    const content = fs.readFileSync(cronFile, 'utf-8');
    expect(content).toContain('# [keep]');
    expect(content).not.toContain('# [remove-me]');
    expect(content).not.toContain('echo remove');
  });

  test('cronShow prints cron file contents', () => {
    withWorkspace(ws, () => {
      cronAdd('show-test', '* * * * *', 'echo show');
    });

    const logSpy = spyOn(console, 'log').mockImplementation(() => {});

    withWorkspace(ws, () => {
      cronShow();
    });

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('show-test');
  });

  test('cronList shows message when no cron file', () => {
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});

    withWorkspace(ws, () => {
      cronList();
    });

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('No cron jobs');
  });
});
