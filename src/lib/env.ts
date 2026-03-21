import fs from 'node:fs';
import path from 'node:path';
import { resolveWorkspace } from './workspace.js';

export function loadEnv(): void {
  const ws = resolveWorkspace();
  if (!ws) return;

  const envPath = path.join(ws, '.env');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf-8');

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Don't overwrite existing env vars
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
