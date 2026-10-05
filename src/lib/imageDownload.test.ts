// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { fetchImageAsDataUrl } from './imageProbe';

const respond = (blob: Blob, ok = true) => (async () => ({ ok, blob: async () => blob })) as unknown as typeof fetch;
const png = (bytes = 8) => new Blob([new Uint8Array(bytes).fill(7)], { type: 'image/png' });

describe('fetchImageAsDataUrl', () => {
  it('turns an allowed image into a data url', async () => {
    const url = await fetchImageAsDataUrl('https://cdn.x.com/a.png', respond(png()));
    expect(url).not.toBeNull();
    expect(url!.startsWith('data:image/png;base64,')).toBe(true);
  });
  it('asks for cors with no referrer', async () => {
    let init: RequestInit | undefined;
    const spy = (async (_u: string, i?: RequestInit) => { init = i; return { ok: true, blob: async () => png() }; }) as unknown as typeof fetch;
    await fetchImageAsDataUrl('https://cdn.x.com/a.png', spy);
    expect(init).toMatchObject({ mode: 'cors', referrerPolicy: 'no-referrer' });
  });
  it('returns null on a failed response', async () => expect(await fetchImageAsDataUrl('u', respond(png(), false))).toBeNull());
  it('returns null when the shop does not allow it (fetch throws)', async () => {
    const blocked = (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch;
    expect(await fetchImageAsDataUrl('u', blocked)).toBeNull();
  });
  it('returns null for something that is not an image', async () => {
    expect(await fetchImageAsDataUrl('u', respond(new Blob(['<html>'], { type: 'text/html' })))).toBeNull();
  });
  it('returns null for an empty body', async () => expect(await fetchImageAsDataUrl('u', respond(new Blob([], { type: 'image/png' })))).toBeNull());
  it('returns null for an oversized image', async () => {
    expect(await fetchImageAsDataUrl('u', respond(png(2000)), 1000)).toBeNull();
  });
});
