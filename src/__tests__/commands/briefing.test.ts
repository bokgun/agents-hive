import { describe, expect, test, beforeEach, afterEach, spyOn } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { briefing } from '../../commands/briefing.js';
import { createTmpWorkspace, cleanupTmp, withWorkspace } from '../helpers.js';

describe('briefing', () => {
  let ws: string;

  beforeEach(() => {
    spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanupTmp(ws);
  });

  test('generates briefing file with project info', () => {
    ws = createTmpWorkspace({
      api: { agent: 'claude', description: 'Backend API' },
      blog: { agent: 'gemini', description: 'Blog automation' },
    });

    withWorkspace(ws, () => {
      briefing();
    });

    const briefPath = path.join(ws, 'shared-memory', 'daily-briefing.md');
    const content = fs.readFileSync(briefPath, 'utf-8');

    expect(content).toContain('# Daily Briefing');
    expect(content).toContain('## api');
    expect(content).toContain('## blog');
    expect(content).toContain('claude');
    expect(content).toContain('gemini');
    expect(content).toContain('idle');
  });

  test('includes project memory in briefing', () => {
    ws = createTmpWorkspace({
      api: { agent: 'claude', description: 'Backend API' },
    });

    withWorkspace(ws, () => {
      briefing();
    });

    const briefPath = path.join(ws, 'shared-memory', 'daily-briefing.md');
    const content = fs.readFileSync(briefPath, 'utf-8');

    expect(content).toContain('### api');
    expect(content).toContain('Project created');
  });
});
