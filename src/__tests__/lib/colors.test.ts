import { describe, expect, test } from 'bun:test';
import { G, R, Y, C, N, DIM, success, warn, error, cyan, dim } from '../../lib/colors.js';

describe('colors', () => {
  test('success wraps message with green check', () => {
    const result = success('done');
    expect(result).toBe(`${G}[✓]${N} done`);
  });

  test('warn wraps message with yellow bang', () => {
    const result = warn('caution');
    expect(result).toBe(`${Y}[!]${N} caution`);
  });

  test('error wraps message with red bang', () => {
    const result = error('fail');
    expect(result).toBe(`${R}[!]${N} fail`);
  });

  test('cyan wraps message with cyan color', () => {
    const result = cyan('text');
    expect(result).toBe(`${C}text${N}`);
  });

  test('dim wraps message with dim style', () => {
    const result = dim('faded');
    expect(result).toBe(`${DIM}faded${N}`);
  });
});
