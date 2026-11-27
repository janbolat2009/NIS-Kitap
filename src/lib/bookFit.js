// Where an opened book goes so that the whole spread stays on screen.
// The cover turns on its spine (the left edge of the book), so an open book
// spans [spine - width, spine + width]. The book moves only as far as needed
// to keep that spread inside the viewport, and shrinks on narrow screens.
// The turned cover's outer edge comes towards the viewer, and perspective makes
// the spread look about this much wider than its flat size.
const PERSPECTIVE_GROWTH = 1.08;

export function fitOpenBook(rect, viewportWidth, { margin = 12, maxScale = 1.08, minScale = 0.5 } = {}) {
  const width = (rect?.width || 0) * PERSPECTIVE_GROWTH;
  if (!width || !viewportWidth) return { x: '0px', s: 1 };
  const s = Math.max(minScale, Math.min(maxScale, (viewportWidth - margin * 2) / (width * 2)));
  const half = width * s;
  const lo = margin + half;
  const hi = viewportWidth - margin - half;
  const spine = lo > hi ? viewportWidth / 2 : Math.min(Math.max(rect.left, lo), hi);
  return { x: `${Math.round(spine - rect.left)}px`, s: Number(s.toFixed(3)) };
}

export function fitOpenBookFor(element, options) {
  if (!element) return { x: '0px', s: 1 };
  return fitOpenBook(element.getBoundingClientRect(), document.documentElement.clientWidth, options);
}
