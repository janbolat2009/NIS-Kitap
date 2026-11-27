<template>
  <section class="rec" aria-labelledby="rec-title">
    <div class="rec-head">
      <div>
        <h2 id="rec-title">{{ t('recommended.title') }}</h2>
        <p class="rec-lead">{{ t('recommended.lead') }}</p>
      </div>
      <div class="rec-actions">
        <button type="button" class="nav-btn" :aria-label="t('shelf.prev')" @click="nudge(-1)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m14.5 6-6 6 6 6" /></svg>
        </button>
        <button type="button" class="nav-btn" :aria-label="t('shelf.next')" @click="nudge(1)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m9.5 6 6 6-6 6" /></svg>
        </button>
        <button type="button" class="nav-btn" :aria-pressed="!auto" :aria-label="auto ? t('recommended.pause') : t('recommended.play')" :title="auto ? t('recommended.pause') : t('recommended.play')" @click="toggleAuto">
          <svg v-if="auto" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="3.6" height="14" rx="1" /><rect x="13.9" y="5" width="3.6" height="14" rx="1" /></svg>
          <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
        </button>
      </div>
    </div>

    <div
      ref="track"
      class="rec-track"
      :aria-busy="!books.length"
      @scroll.passive="onScroll"
      @pointerenter="onEnter"
      @pointerleave="onLeave"
      @pointerdown="hold()"
      @wheel.passive="hold()"
      @touchstart.passive="hold()"
      @focusin="focused = true"
      @focusout="onFocusOut"
    >
      <ul ref="list" class="rec-list" :aria-label="t('recommended.title')">
        <template v-if="books.length">
          <li v-for="(b, i) in loop" :key="i" class="rec-item" :aria-hidden="i >= books.length || undefined">
            <router-link :to="{ name: 'BookDetail', params: { title: b.title } }" class="rec-book" :tabindex="i >= books.length ? -1 : undefined" draggable="false">
              <BookCover :book="b" class="rec-cover" />
              <span class="rec-title">{{ b.title }}</span>
              <span class="rec-author">{{ b.author }}</span>
            </router-link>
          </li>
        </template>
        <li v-for="n in 8" v-else :key="n" class="rec-item" aria-hidden="true"><span class="skeleton rec-ghost" /></li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import BookCover from '@/components/BookCover.vue';
import { t } from '@/i18n';
import { getBooks } from '@/services/bookService';
import { useDragScroll } from '@/lib/dragScroll';

const SPEED = 26; // px per second: slow and even
const RESUME_AFTER = 2600; // ms after the last manual touch
const COUNT = 16;
const PREF_KEY = 'nk_rec_auto';

const track = ref(null);
const list = ref(null);
const books = ref([]);
const hovered = ref(false);
const focused = ref(false);
const held = ref(false);
const visible = ref(false);
const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const auto = ref(!reduce && readPref() !== 'off');

// Two copies side by side: when the first copy has scrolled away, jump back by
// exactly its width, which looks the same, so the loop has no visible seam.
const loop = computed(() => [...books.value, ...books.value]);

let raf = 0;
let last = 0;
let pos = 0;
let setWidth = 0;
let resumeTimer = 0;
let observer = null;

useDragScroll(track, {
  onStart: () => hold(),
  onEnd: () => {
    hold();
    if (track.value) { pos = track.value.scrollLeft; wrap(track.value); }
  },
});

function readPref() {
  try { return localStorage.getItem(PREF_KEY); } catch { return null; }
}
function toggleAuto() {
  auto.value = !auto.value;
  try { localStorage.setItem(PREF_KEY, auto.value ? 'on' : 'off'); } catch { /* private mode */ }
  sync();
}

// ---------- the day's selection: stable per day, no duplicates ----------
// There is no public popularity data yet, so this is labelled «recommended»,
// never «bestsellers». The seed is the date, so re-renders keep the same books.
let cachedPick = null;
function seeded(seed) {
  let a = 0;
  for (const ch of seed) a = (Math.imul(a ^ ch.charCodeAt(0), 2654435761) >>> 0);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
function choose(all) {
  const day = new Date().toISOString().slice(0, 10);
  if (cachedPick?.day === day) return cachedPick.books;
  const norm = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const seen = new Set();
  const pool = all.filter((b) => {
    if (b.visible === false || !(Number(b.copies) > 0)) return false;
    if (!b.title || !b.author || b.author === 'Не указан' || String(b.description || '').length < 80) return false;
    const key = norm(b.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const rand = seeded(day);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  cachedPick = { day, books: pool.slice(0, COUNT) };
  return cachedPick.books;
}

// ---------- motion ----------
const running = () => auto.value && visible.value && !hovered.value && !focused.value && !held.value && !document.hidden && setWidth > 0;

function measure() {
  const items = list.value?.children;
  if (!items || items.length <= books.value.length) { setWidth = 0; return; }
  setWidth = items[books.value.length].offsetLeft - items[0].offsetLeft;
}
function wrap(el) {
  if (!setWidth) return;
  if (pos >= setWidth) pos -= setWidth;
  else if (pos < 1) pos += setWidth;
  el.scrollLeft = pos;
}
function tick(now) {
  raf = 0;
  const el = track.value;
  if (!el || !running()) { last = 0; return; }
  if (last) {
    pos += (SPEED * Math.min(64, now - last)) / 1000;
    if (pos >= setWidth) pos -= setWidth;
    el.scrollLeft = pos;
  }
  last = now;
  raf = requestAnimationFrame(tick);
}
function sync() {
  if (running() && !raf) { last = 0; raf = requestAnimationFrame(tick); }
  if (!running() && raf) { cancelAnimationFrame(raf); raf = 0; }
}
// Manual scrolling (swipe, drag, wheel, buttons) takes over; keep the loop endless.
function onScroll() {
  const el = track.value;
  if (!el || raf) return;
  pos = el.scrollLeft;
  // While the mouse drags, the jump waits until release (the drag keeps its own origin).
  if (el.classList.contains('is-dragging')) return;
  if (pos >= setWidth || pos < 1) wrap(el);
}
function hold() {
  held.value = true;
  sync();
  clearTimeout(resumeTimer);
  resumeTimer = setTimeout(() => { held.value = false; sync(); }, RESUME_AFTER);
}
function onEnter(event) {
  if (event.pointerType !== 'mouse') return;
  hovered.value = true;
  sync();
}
function onLeave() {
  hovered.value = false;
  sync();
}
function onFocusOut(event) {
  if (!track.value?.contains(event.relatedTarget)) { focused.value = false; sync(); }
}
function nudge(dir) {
  const el = track.value;
  if (!el) return;
  hold();
  const step = (list.value?.children[0]?.offsetWidth || 160) * 2;
  if (dir < 0 && el.scrollLeft < step) { pos = el.scrollLeft + setWidth; el.scrollLeft = pos; }
  el.scrollBy({ left: dir * step, behavior: reduce ? 'auto' : 'smooth' });
}
const onVisibility = () => sync();

onMounted(async () => {
  observer = new IntersectionObserver(([entry]) => { visible.value = entry.isIntersecting; sync(); }, { threshold: 0.15 });
  if (track.value) observer.observe(track.value);
  document.addEventListener('visibilitychange', onVisibility);
  try {
    books.value = choose(await getBooks());
  } catch {
    books.value = [];
  }
  requestAnimationFrame(() => {
    measure();
    pos = track.value?.scrollLeft || 0;
    sync();
  });
  window.addEventListener('resize', measure, { passive: true });
});
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  clearTimeout(resumeTimer);
  observer?.disconnect();
  document.removeEventListener('visibilitychange', onVisibility);
  window.removeEventListener('resize', measure);
});
</script>

<style scoped>
.rec-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px 24px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.rec-head h2 { font-size: var(--fs-2xl); }
.rec-lead { margin-top: 6px; color: var(--text-2); }
.rec-actions { display: flex; gap: 8px; }
.nav-btn {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  background: var(--surface);
  color: var(--text-1);
  cursor: pointer;
  transition: border-color var(--dur-1) ease, color var(--dur-1) ease;
}
.nav-btn:hover, .nav-btn[aria-pressed='true'] { border-color: var(--accent-text); color: var(--accent-text); }

.rec-track {
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  cursor: grab;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 32px, #000 calc(100% - 32px), transparent);
  mask-image: linear-gradient(to right, transparent, #000 32px, #000 calc(100% - 32px), transparent);
}
.rec-track::-webkit-scrollbar { display: none; }
.rec-track.is-dragging { cursor: grabbing; }
.rec-track.is-dragging .rec-book { pointer-events: none; }
.rec-list {
  display: flex;
  gap: clamp(16px, 2.2vw, 28px);
  width: max-content;
  margin: 0;
  padding: 10px 0 6px;
  list-style: none;
}
.rec-item { flex: none; width: clamp(128px, 15vw, 164px); }
.rec-ghost { display: block; aspect-ratio: 2 / 3.4; border-radius: 4px; }
.rec-book {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--text-1);
  text-decoration: none;
  border-radius: 6px;
  outline-offset: 4px;
  -webkit-tap-highlight-color: transparent;
}
/* Only the book itself: no card, no tinted box around the cover. */
.rec-book .rec-cover { padding: 0 9px 10px 0; background: none; border-radius: 0; }
.rec-book :deep(.jacket-object) { width: 100%; transition: transform 320ms var(--ease-out); }
.rec-title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  margin-top: 6px;
  font-family: var(--font-heading);
  font-size: var(--fs-sm);
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}
.rec-author {
  overflow: hidden;
  color: var(--text-3);
  font-size: var(--fs-xs);
  white-space: nowrap;
  text-overflow: ellipsis;
}
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .rec-book:is(:hover, :focus-visible) :deep(.jacket-object) { transform: rotateY(-14deg) translateY(-4px); }
}
.rec-book:hover .rec-title { color: var(--accent-text); }
</style>
