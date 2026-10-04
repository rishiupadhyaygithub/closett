import { describe, it, expect } from 'vitest';
import { safeHttpUrl } from './url';

describe('safeHttpUrl', () => {
  it('keeps an https url', () => expect(safeHttpUrl('https://zara.com/a?b=1')).toBe('https://zara.com/a?b=1'));
  it('keeps an http url', () => expect(safeHttpUrl('http://example.com')).toBe('http://example.com/'));
  it('rejects javascript:', () => expect(safeHttpUrl('javascript:alert(1)')).toBeNull());
  it('rejects data:', () => expect(safeHttpUrl('data:text/html,<script>1</script>')).toBeNull());
  it('rejects mixed-case javascript:', () => expect(safeHttpUrl('JaVaScRiPt:alert(1)')).toBeNull());
  it('rejects garbage', () => expect(safeHttpUrl('not a url')).toBeNull());
  it('rejects empty', () => expect(safeHttpUrl('')).toBeNull());
});
