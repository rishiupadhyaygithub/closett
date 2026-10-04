import { describe, it, expect, vi } from 'vitest';
import { runAction } from './actions';

describe('runAction', () => {
  it('returns the value and does not call onError on success', async () => {
    const onError = vi.fn();
    expect(await runAction(async () => 42, onError)).toBe(42);
    expect(onError).not.toHaveBeenCalled();
  });

  it('reports the message and returns undefined on failure', async () => {
    const onError = vi.fn();
    expect(await runAction(async () => { throw new Error('nope'); }, onError)).toBeUndefined();
    expect(onError).toHaveBeenCalledWith('nope');
  });
});
