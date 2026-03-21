import { describe, expect, test, beforeEach, afterEach, spyOn } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { projectCreate, projectEdit, projectList } from '../../commands/project.js';
import { readStatus } from '../../lib/workspace.js';
import { createTmpWorkspace, cleanupTmp, withWorkspace } from '../helpers.js';

describe('projectCreate', () => {
  let ws: string;

  beforeEach(() => {
    ws = createTmpWorkspace();
    spyOn(console, 'log').mockImplementation(() => {});
    spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanupTmp(ws);
  });

  test('creates claude project with correct files', () => {
    withWorkspace(ws, () => {
      projectCreate('api', 'claude', 'Backend API');
    });

    expect(fs.existsSync(path.join(ws, 'api', 'src'))).toBe(true);
    expect(fs.existsSync(path.join(ws, 'api', '.claude', 'memory.md'))).toBe(true);
    expect(fs.existsSync(path.join(ws, 'api', '.claude', 'settings.json'))).toBe(true);
    expect(fs.existsSync(path.join(ws, 'api', 'CLAUDE.md'))).toBe(true);

    const status = readStatus(ws);
    expect(status.projects.api.agent).toBe('claude');
    expect(status.projects.api.description).toBe('Backend API');
    expect(status.projects.api.status).toBe('idle');
  });

  test('creates gemini project with GEMINI.md and output dir', () => {
    withWorkspace(ws, () => {
      projectCreate('research', 'gemini', 'Market research');
    });

    expect(fs.existsSync(path.join(ws, 'research', 'GEMINI.md'))).toBe(true);
    expect(fs.existsSync(path.join(ws, 'research', 'output'))).toBe(true);
  });

  test('creates codex project with .codex config', () => {
    withWorkspace(ws, () => {
      projectCreate('monitor', 'codex', 'Health checks');
    });

    expect(fs.existsSync(path.join(ws, 'monitor', '.codex', 'config.toml'))).toBe(true);
    expect(fs.existsSync(path.join(ws, 'monitor', 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(ws, 'monitor', 'logs'))).toBe(true);

    const config = fs.readFileSync(path.join(ws, 'monitor', '.codex', 'config.toml'), 'utf-8');
    expect(config).toContain('gpt-5.4-mini');
  });
});

describe('projectEdit', () => {
  let ws: string;

  beforeEach(() => {
    ws = createTmpWorkspace({ api: { agent: 'claude', description: 'Backend API' } });
    spyOn(console, 'log').mockImplementation(() => {});
    spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanupTmp(ws);
  });

  test('updates description in status.json and CLAUDE.md', () => {
    withWorkspace(ws, () => {
      projectEdit('api', 'description', 'New Backend API');
    });

    const status = readStatus(ws);
    expect(status.projects.api.description).toBe('New Backend API');

    const claudeMd = fs.readFileSync(path.join(ws, 'api', 'CLAUDE.md'), 'utf-8');
    expect(claudeMd).toContain('# New Backend API');
  });

  test('updates agent field', () => {
    withWorkspace(ws, () => {
      projectEdit('api', 'agent', 'gemini');
    });

    const status = readStatus(ws);
    expect(status.projects.api.agent).toBe('gemini');
  });
});

describe('projectList', () => {
  let ws: string;

  beforeEach(() => {
    spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanupTmp(ws);
  });

  test('lists projects', () => {
    ws = createTmpWorkspace({
      api: { agent: 'claude', description: 'Backend' },
      blog: { agent: 'gemini', description: 'Blog' },
    });
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});

    withWorkspace(ws, () => {
      projectList();
    });

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('api');
    expect(output).toContain('blog');
    expect(output).toContain('claude');
    expect(output).toContain('gemini');
  });

  test('shows message when no projects', () => {
    ws = createTmpWorkspace();
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});

    withWorkspace(ws, () => {
      projectList();
    });

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('No projects');
  });
});
