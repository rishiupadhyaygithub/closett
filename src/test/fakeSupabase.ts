import { vi } from 'vitest';

export type Result = { data?: unknown; error: { message: string } | null };

const CHAIN = ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'in', 'not', 'order'] as const;

export function makeBuilder(result: Result) {
  const b: Record<string, any> = {};
  for (const m of CHAIN) b[m] = vi.fn(() => b);
  b.maybeSingle = vi.fn(() => Promise.resolve(result));
  b.then = (resolve: (v: Result) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return b;
}

export const OK: Result = { data: null, error: null };
export const FAIL: Result = { data: null, error: { message: 'boom' } };
