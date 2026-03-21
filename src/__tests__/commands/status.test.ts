import { describe, expect, test, beforeEach, afterEach, spyOn } from 'bun:test';
import { status } from '../../commands/status.js';
import { createTmpWorkspace, cleanupTmp, withWorkspace } from '../helpers.js';

describe('status', () => {
  let ws: string;

  beforeEach(() => {
    spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanupTmp(ws);
  });

  test('shows project status', () => {
    ws = createTmpWorkspace({
      api: { agent: 'claude', description: 'Backend' },
    });
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});

    withWorkspace(ws, () => {
      status();
    });

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('api');
    expect(output).toContain('claude');
    expect(output).toContain('idle');
  });

  test('shows empty message when no projects', () => {
    ws = createTmpWorkspace();
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});

    withWorkspace(ws, () => {
      status();
    });

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('No projects');
  });
});
