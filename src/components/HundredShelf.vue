<template>
  <section class="shelf-section" aria-labelledby="shelf-title">
    <div class="shelf-head">
      <div class="shelf-copy">
        <p class="shelf-kicker">{{ t('hundred.tag') }}</p>
        <h2 id="shelf-title">{{ t('hundred.title') }}</h2>
        <p class="shelf-lead">{{ t('shelf.lead') }}</p>
      </div>
      <div class="shelf-actions">
        <button type="button" class="nav-btn" :aria-label="t('shelf.prev')" :disabled="atStart" @click="page(-1)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m14.5 6-6 6 6 6" /></svg>
        </button>
        <button type="button" class="nav-btn" :aria-label="t('shelf.next')" :disabled="atEnd" @click="page(1)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m9.5 6 6 6-6 6" /></svg>
        </button>
        <router-link to="/100-kitap" class="btn btn-secondary all-link">{{ t('hundred.viewAll') }}</router-link>
      </div>
    </div>

    <div class="shelf">
      <ul ref="track" class="shelf-track" :aria-label="t('hundred.title')" :aria-busy="!books.length" @scroll.passive="onScroll">
        <template v-if="books.length">
          <li v-for="e in books" :key="e.id" class="slot" :style="{ '--w': `${widthOf(e)}px` }">
            <router-link :to="{ name: 'HundredBook', params: { id: e.id } }" class="shelf-book hc-host" :aria-label="`${e.title} — ${e.author}`" draggable="false">
              <HundredCover :entry="e" size="shelf" />
            </router-link>
          </li>
        </template>
        <li v-for="n in 9" v-else :key="n" class="slot ghost" :style="{ '--w': `${112 + (n % 3) * 10}px` }" aria-hidden="true"><span class="skeleton" /></li>
      </ul>
      <div class="plank" aria-hidden="true" />
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import HundredCover from '@/components/HundredCover.vue';
import { t } from '@/i18n';
import { loadHundredBooks } from '@/services/hundredList';
import { useDragScroll } from '@/lib/dragScroll';

const track = ref(null);
const books = ref([]);
const atStart = ref(true);
const atEnd = ref(false);
let frame = 0;

useDragScroll(track);

// Books on a real shelf are not all the same size: a stable width per book.
const widthOf = (e) => 108 + ((Number(e.order) * 37) % 5) * 7;

// A mixed shelf: Kazakh, Russian and world literature in turn.
function pick(list) {
  const by = (s) => list.filter((e) => e.section === s && e.isActive !== false);
  const groups = [by('kazakh').slice(0, 10), by('russian').slice(0, 7), by('foreign').slice(0, 7)];
  const out = [];
  for (let i = 0; out.length < 24 && i < 10; i++) for (const g of groups) if (g[i]) out.push(g[i]);
  return out;
}

function update() {
  frame = 0;
  const el = track.value;
  if (!el) return;
  atStart.value = el.scrollLeft < 4;
  atEnd.value = el.scrollLeft + el.clientWidth > el.scrollWidth - 4;
}
function onScroll() {
  if (!frame) frame = requestAnimationFrame(update);
}
function page(dir) {
  const el = track.value;
  if (!el) return;
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: smooth ? 'smooth' : 'auto' });
}

onMounted(() => {
  loadHundredBooks()
    .then(({ books: list }) => { books.value = pick(list); requestAnimationFrame(update); })
    .catch(() => { books.value = []; });
});
onBeforeUnmount(() => cancelAnimationFrame(frame));
</script>

<style scoped>
.shelf-section {
  --plank-top: #ddd2bf;
  --plank-face: #c9bba3;
  --plank-edge: #b3a389;
  --wall: color-mix(in srgb, var(--surface-2) 70%, var(--bg));
}
:root[data-theme='dark'] .shelf-section {
  --plank-top: #343c49;
  --plank-face: #262d37;
  --plank-edge: #1b2028;
  --wall: color-mix(in srgb, var(--surface) 60%, var(--bg));
}
.shelf-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px 24px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.shelf-copy { max-width: 60ch; }
.shelf-kicker { font-size: var(--fs-xs); font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--warm); }
.shelf-copy h2 { font-size: var(--fs-3xl); margin-top: 4px; }
.shelf-lead { margin-top: 8px; color: var(--text-2); }
.shelf-actions { display: flex; align-items: center; gap: 8px; }
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
  transition: border-color var(--dur-1) ease, color var(--dur-1) ease, opacity var(--dur-1) ease;
}
.nav-btn:hover:not(:disabled) { border-color: var(--accent-text); color: var(--accent-text); }
.nav-btn:disabled { opacity: 0.35; cursor: default; }
.all-link { margin-left: 4px; }

/* The shelf: books stand on one plank against a quiet wall. */
.shelf {
  position: relative;
  border-radius: var(--r-lg) var(--r-lg) 0 0;
  background: linear-gradient(to bottom, transparent, var(--wall) 70%);
}
.shelf-track {
  display: flex;
  align-items: flex-end;
  gap: clamp(10px, 1.6vw, 18px);
  margin: 0;
  /* Room above for the lift on hover, and at the sides for the edge fade. */
  padding: clamp(24px, 3vw, 40px) clamp(16px, 4vw, 40px) 18px;
  list-style: none;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  cursor: grab;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 28px, #000 calc(100% - 28px), transparent);
  mask-image: linear-gradient(to right, transparent, #000 28px, #000 calc(100% - 28px), transparent);
}
.shelf-track::-webkit-scrollbar { display: none; }
.shelf-track.is-dragging { cursor: grabbing; }
.shelf-track.is-dragging .shelf-book { pointer-events: none; }
.slot { position: relative; flex: none; width: var(--w); }
/* Each book's own shadow on the plank. */
.slot::after {
  content: '';
  position: absolute;
  inset: auto 6% -6px 2%;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(10, 14, 22, 0.42), transparent);
  transition: transform 320ms var(--ease-out), opacity 320ms ease;
}
.ghost .skeleton { display: block; aspect-ratio: 2 / 3; border-radius: 3px 8px 8px 3px; }
.shelf-book { display: block; border-radius: 4px; outline-offset: 6px; -webkit-tap-highlight-color: transparent; }
.plank {
  position: relative;
  height: 16px;
  margin-top: -10px;
  border-radius: 2px;
  background: linear-gradient(to bottom, var(--plank-top) 0 5px, var(--plank-face) 5px calc(100% - 2px), var(--plank-edge) calc(100% - 2px));
  box-shadow: 0 10px 18px -10px rgba(10, 14, 22, 0.45);
}

/* Books stand straighter on the shelf than in the list. Hover: off the plank. */
.shelf-book :deep(.hc-obj) { transform: translateX(0) rotateY(-8deg) rotateX(0deg) scale(1); transition: transform 380ms var(--ease-out); }
.shelf-book :deep(.hc-ground) { display: none; }
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .shelf-track .shelf-book:is(:hover, :focus-visible) :deep(.hc-obj) { transform: translateY(-14px) rotateY(-14deg) rotateX(0deg) scale(1.05); }
  .slot:has(.shelf-book:is(:hover, :focus-visible))::after { transform: scaleX(0.82); opacity: 0.55; }
}
@media (hover: none), (prefers-reduced-motion: reduce) {
  .shelf-track .shelf-book:focus-visible :deep(.hc-obj) { transform: translateY(-8px) rotateY(-8deg) scale(1.02); }
}

@media (max-width: 640px) {
  .shelf-copy h2 { font-size: var(--fs-2xl); }
  .shelf-actions { width: 100%; }
  .all-link { margin-left: auto; }
  .slot { width: calc(var(--w) * 0.82); }
}
</style>
