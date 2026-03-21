import { describe, expect, test } from 'bun:test';
import { runHive } from './helpers.js';

describe('CLI interface', () => {
  test('--version returns version number', () => {
    const { stdout, exitCode } = runHive(['--version']);
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toBe('0.1.0');
  });

  test('-v returns version number', () => {
    const { stdout, exitCode } = runHive(['-v']);
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toBe('0.1.0');
  });

  test('--help shows usage info', () => {
    const { stdout, exitCode } = runHive(['--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Usage: hive');
    expect(stdout).toContain('init');
    expect(stdout).toContain('project');
    expect(stdout).toContain('memo');
    expect(stdout).toContain('cron');
    expect(stdout).toContain('status');
  });

  test('project --help shows subcommands', () => {
    const { stdout, exitCode } = runHive(['project', '--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('create');
    expect(stdout).toContain('edit');
    expect(stdout).toContain('delete');
    expect(stdout).toContain('list');
  });

  test('cron --help shows subcommands', () => {
    const { stdout, exitCode } = runHive(['cron', '--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('add');
    expect(stdout).toContain('list');
    expect(stdout).toContain('remove');
    expect(stdout).toContain('apply');
  });

  test('start --help shows description', () => {
    const { stdout, exitCode } = runHive(['start', '--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('background');
  });

  test('stop --help shows description', () => {
    const { stdout, exitCode } = runHive(['stop', '--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Stop');
  });

  test('ps --help shows description', () => {
    const { stdout, exitCode } = runHive(['ps', '--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('running');
  });

  test('update --help shows description', () => {
    const { stdout, exitCode } = runHive(['update', '--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Update');
  });

  test('uninstall --help shows description', () => {
    const { stdout, exitCode } = runHive(['uninstall', '--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Uninstall');
  });

  test('--help includes uninstall command', () => {
    const { stdout } = runHive(['--help']);
    expect(stdout).toContain('uninstall');
  });
});
