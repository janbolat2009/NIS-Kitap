// Drag-to-scroll with the mouse for horizontal tracks (book shelf, carousel).
// Touch and pen keep native scrolling, so swipes have their usual momentum.
// A drag longer than a few pixels cancels the click on the book under it.
import { onBeforeUnmount, onMounted } from 'vue';

export function useDragScroll(trackRef, { onStart, onEnd } = {}) {
  let pointerId = null;
  let startX = 0;
  let startLeft = 0;
  let moved = false;

  function down(event) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const el = trackRef.value;
    if (!el) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startLeft = el.scrollLeft;
    moved = false;
    onStart?.();
  }

  function move(event) {
    if (event.pointerId !== pointerId) return;
    const el = trackRef.value;
    const dx = event.clientX - startX;
    if (!moved && Math.abs(dx) > 5) {
      moved = true;
      el.classList.add('is-dragging');
      try { el.setPointerCapture(pointerId); } catch { /* pointer already gone */ }
    }
    if (moved) {
      el.scrollLeft = startLeft - dx;
      event.preventDefault();
    }
  }

  function up(event) {
    if (event.pointerId !== pointerId) return;
    const el = trackRef.value;
    pointerId = null;
    el?.classList.remove('is-dragging');
    onEnd?.();
  }

  // Runs in the capture phase, before the router link sees the click.
  function click(event) {
    if (!moved) return;
    event.preventDefault();
    event.stopPropagation();
    moved = false;
  }

  // Links and images would otherwise start the browser's own drag-and-drop.
  const noNativeDrag = (event) => event.preventDefault();

  onMounted(() => {
    const el = trackRef.value;
    if (!el) return;
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('click', click, true);
    el.addEventListener('dragstart', noNativeDrag);
  });
  onBeforeUnmount(() => {
    const el = trackRef.value;
    if (!el) return;
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', up);
    el.removeEventListener('click', click, true);
    el.removeEventListener('dragstart', noNativeDrag);
  });
}
