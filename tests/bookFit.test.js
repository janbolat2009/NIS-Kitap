import { describe, it, expect } from 'vitest';
import { fitOpenBook } from '../src/lib/bookFit.js';

// The open spread spans [spine - w*g*s, spine + w*g*s], g = perspective growth (1.08).
// The shift is rounded to whole pixels, so the 12px margin may come out 1px smaller.
function spread(rect, vw, opts) {
  const { x, s } = fitOpenBook(rect, vw, opts);
  const spine = rect.left + parseFloat(x);
  const half = rect.width * 1.08 * s;
  return { left: spine - half, right: spine + half, s, x: parseFloat(x) };
}

describe('fitOpenBook keeps the open book on screen', () => {
  it('opens in place when there is room on the left', () => {
    const r = spread({ left: 500, width: 200 }, 1440);
    expect(r.x).toBe(0);
    expect(r.left).toBeGreaterThanOrEqual(12);
  });

  it('moves a book at the left edge only as far as needed', () => {
    const r = spread({ left: 18, width: 160 }, 375);
    expect(r.left).toBeGreaterThanOrEqual(11);
    expect(r.right).toBeLessThanOrEqual(375 - 11);
  });

  it('shrinks the spread on narrow phones', () => {
    for (const vw of [320, 375, 390, 430]) {
      const r = spread({ left: 16, width: vw * 0.44 }, vw);
      expect(r.s).toBeLessThanOrEqual(1.08);
      expect(r.left).toBeGreaterThanOrEqual(11);
      expect(r.right).toBeLessThanOrEqual(vw - 11);
    }
  });

  it('never scales up beyond the limit and handles empty input', () => {
    expect(fitOpenBook({ left: 300, width: 100 }, 1920).s).toBe(1.08);
    expect(fitOpenBook(null, 1000)).toEqual({ x: '0px', s: 1 });
  });
});
