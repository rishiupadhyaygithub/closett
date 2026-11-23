import { describe, it, expect } from 'vitest';
import { bookmarkletOrigin, LIVE_ORIGIN } from './bookmarklet';

describe('bookmarkletOrigin', () => {
  it('points buttons made on the live site at the live site', () => {
    expect(bookmarkletOrigin('https://closett-delta.vercel.app')).toBe(LIVE_ORIGIN);
  });
  it.each(['http://localhost:5173', 'http://127.0.0.1:5173', 'http://[::1]:5173', 'http://0.0.0.0:4173', 'http://macbook.local:5173'])(
    'never points a button at a test copy on this computer (%s)',
    o => { expect(bookmarkletOrigin(o)).toBe(LIVE_ORIGIN); },
  );
  it('keeps another real https host such as a future custom domain', () => {
    expect(bookmarkletOrigin('https://closett.in')).toBe('https://closett.in');
  });
  it('falls back to the live site for anything unparsable or non-https', () => {
    expect(bookmarkletOrigin('')).toBe(LIVE_ORIGIN);
    expect(bookmarkletOrigin('http://example.com')).toBe(LIVE_ORIGIN);
    expect(bookmarkletOrigin('null')).toBe(LIVE_ORIGIN);
  });
});
