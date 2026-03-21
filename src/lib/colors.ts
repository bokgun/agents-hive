export const G = '\x1b[0;32m';
export const B = '\x1b[0;34m';
export const C = '\x1b[0;36m';
export const Y = '\x1b[1;33m';
export const R = '\x1b[0;31m';
export const N = '\x1b[0m';
export const DIM = '\x1b[2m';

export function success(msg: string): string {
  return `${G}[✓]${N} ${msg}`;
}

export function warn(msg: string): string {
  return `${Y}[!]${N} ${msg}`;
}

export function error(msg: string): string {
  return `${R}[!]${N} ${msg}`;
}

export function cyan(msg: string): string {
  return `${C}${msg}${N}`;
}

export function dim(msg: string): string {
  return `${DIM}${msg}${N}`;
}
