import { describe, expect, test, beforeEach, afterEach, spyOn } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { cleanup } from '../../commands/cleanup.js';
import { createTmpWorkspace, cleanupTmp, withWorkspace } from '../helpers.js';

describe('cleanup', () => {
  let ws: string;

  beforeEach(() => {
    spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanupTmp(ws);
  });

  test('does not archive short memory files', () => {
    ws = createTmpWorkspace({
      api: { agent: 'claude', description: 'Backend' },
    });

    withWorkspace(ws, () => {
      cleanup();
    });

    // Memory is short (< 50 lines), should not be archived
    const archiveEntries = fs.readdirSync(path.join(ws, 'shared-memory', 'archive'));
    const memoryArchives = archiveEntries.filter((e) => e.includes('api-memory'));
    expect(memoryArchives.length).toBe(0);
  });

  test('archives memory files over 50 lines', () => {
    ws = createTmpWorkspace({
      api: { agent: 'claude', description: 'Backend' },
    });

    // Write a long memory file (> 50 lines)
    const memPath = path.join(ws, 'api', '.claude', 'memory.md');
    const longContent = Array.from({ length: 60 }, (_, i) => `Line ${i + 1}`).join('\n');
    fs.writeFileSync(memPath, longContent);

    withWorkspace(ws, () => {
      cleanup();
    });

    // Check archive was created
    const archiveDir = fs.readdirSync(path.join(ws, 'shared-memory', 'archive'));
    const weekArchive = archiveDir.find((d) => d.match(/^\d{4}-W\d{2}$/));
    expect(weekArchive).toBeDefined();

    // Check memory was trimmed
    const trimmed = fs.readFileSync(memPath, 'utf-8');
    const trimmedLines = trimmed.split('\n');
    expect(trimmedLines.length).toBeLessThan(60);
    expect(trimmed).toContain('Archived:');
  });

  test('archives decisions.md', () => {
    ws = createTmpWorkspace();

    withWorkspace(ws, () => {
      cleanup();
    });

    const archiveDir = fs.readdirSync(path.join(ws, 'shared-memory', 'archive'));
    const weekArchive = archiveDir.find((d) => d.match(/^\d{4}-W\d{2}$/));
    expect(weekArchive).toBeDefined();

    if (!weekArchive) throw new Error('weekArchive not found');
    const archived = fs.existsSync(
      path.join(ws, 'shared-memory', 'archive', weekArchive, 'decisions.md'),
    );
    expect(archived).toBe(true);
  });
});
