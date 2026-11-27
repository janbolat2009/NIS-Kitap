<template>
  <div
    class="hc"
    :class="[`hc-${size}`, { 'is-opening': opening, 'is-closing': closing }]"
    :style="{ '--hc-a': palette[0], '--hc-b': palette[1], '--open-x': openX, '--open-s': openScale }"
    aria-hidden="true"
  >
    <div class="hc-obj">
      <span class="hc-ground" />
      <span class="hc-pages" />
      <span class="hc-inside"><i v-for="n in 7" :key="n" /></span>
      <span v-for="n in 3" :key="n" class="hc-leaf" :class="`hc-leaf-${n}`" />
      <span class="hc-front">
        <span class="hc-face">
          <img v-if="image && !broken" :src="image" alt="" loading="lazy" decoding="async" @error="broken = true" />
          <template v-else>
            <span class="hc-top">
              <b class="tabular">№ {{ entry.order }}</b>
              <em>{{ entry.grade }}</em>
            </span>
            <span class="hc-title" :class="titleSize">{{ entry.title }}</span>
            <span class="hc-author">{{ entry.author }}</span>
          </template>
        </span>
        <span class="hc-back" />
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  entry: { type: Object, required: true },
  // card (100 kitap list), hero (book page), shelf (home page shelf)
  size: { type: String, default: 'card' },
  opening: { type: Boolean, default: false },
  closing: { type: Boolean, default: false },
  // Where the open book goes and how big it gets (see lib/bookFit.js).
  openX: { type: String, default: '0px' },
  openScale: { type: Number, default: 1 },
  // A real cover picture, when the catalog has one.
  image: { type: String, default: '' },
});
const broken = ref(false);

// Deep, calm jacket colours; a book always gets the same one.
const PALETTES = [
  ['#1c4f8f', '#0e2c57'], ['#7b2d3b', '#431621'], ['#1f6b57', '#0f3a30'], ['#5a3f8e', '#2f1f55'],
  ['#9a5b13', '#523006'], ['#26607a', '#10303f'], ['#6a3a1e', '#341b0b'], ['#3b4f8e', '#1b2650'],
];
const palette = computed(() => PALETTES[(Number(props.entry.order) || 0) % PALETTES.length]);
const titleSize = computed(() => {
  const n = String(props.entry.title || '').length;
  if (n > 34) return 'xs';
  if (n > 22) return 's';
  return 'm';
});
</script>

<style scoped>
/* One physical book: page block, first page, three loose leaves and the cover,
   all turning on the spine (the left edge). Only transform and opacity move. */
.hc {
  --turn: cubic-bezier(0.62, 0.02, 0.22, 1); /* lift slowly, swing, settle softly */
  --glide: cubic-bezier(0.22, 1, 0.36, 1);
  --t-cover: 900ms;
  --t-leaf: 820ms;
  position: relative;
  container-type: inline-size;
  width: 100%;
  aspect-ratio: 2 / 3;
  perspective: 1400px;
  perspective-origin: 50% 40%;
}
.hc-hero { max-width: 340px; }
.hc-obj {
  position: absolute;
  inset: 0;
  transform-origin: left center;
  transform: translateX(0) rotateY(-14deg) rotateX(3deg) scale(1);
  transform-style: preserve-3d;
  transition: transform 600ms var(--glide);
}
.hc-ground, .hc-pages, .hc-inside, .hc-leaf, .hc-front, .hc-face, .hc-back {
  position: absolute;
  inset: 0;
  border-radius: 3px 8px 8px 3px;
}
/* Soft contact shadow under the book; it widens as the book opens. */
.hc-ground {
  inset: auto 2% -5% 2%;
  height: 9%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(8, 16, 30, 0.38), transparent);
  transform: translateZ(-8px);
}
/* Page block: the cream edge to the right and below. */
.hc-pages {
  inset: 2% -2.2% 1.6% 1.2%;
  background: repeating-linear-gradient(90deg, #efe6d2 0 1.5px, #cfc2a4 1.5px 2.5px);
  transform: translateZ(-3px);
  box-shadow: 0 14px 22px -12px rgba(8, 16, 30, 0.5);
}
/* First page, seen once the cover and leaves have turned. */
.hc-inside {
  inset: 1.5% 0.5% 1.5% 0;
  padding: 16% 12%;
  display: flex;
  flex-direction: column;
  gap: 5%;
  overflow: hidden;
  background: linear-gradient(90deg, #d9c9a4, #faf4e6 12%);
  border: 1px solid #e0d0b4;
  transform: translateZ(0.5px);
}
.hc-inside i { display: block; height: 2px; border-radius: 2px; background: rgba(120, 100, 60, 0.28); }
.hc-inside i:nth-child(3n) { width: 76%; }
.hc-inside i:last-child { width: 52%; }
/* Shadow the turning cover casts on the page, strongest by the spine. */
.hc-inside::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(40, 28, 10, 0.5), rgba(40, 28, 10, 0.12) 30%, transparent 65%);
  opacity: 0;
}
.hc-leaf {
  inset: 1.8% 0.8% 1.8% 0;
  transform-origin: left center;
  background: linear-gradient(90deg, #e2d4b4, #fbf6ea 10%, #f6efdf);
  border: 1px solid #e6d8bc;
  opacity: 0;
}
.hc-leaf-1 { --z: 1.2px; --leaf-to: -163deg; }
.hc-leaf-2 { --z: 1.8px; --leaf-to: -159deg; }
.hc-leaf-3 { --z: 2.4px; --leaf-to: -155deg; }
.hc-leaf { transform: translateZ(var(--z)) rotateY(0deg); }
.hc-front {
  transform-origin: left center;
  transform-style: preserve-3d;
  transform: translateZ(3.5px) rotateY(0deg);
}
.hc-face, .hc-back { backface-visibility: hidden; -webkit-backface-visibility: hidden; overflow: hidden; }
.hc-face {
  display: flex;
  flex-direction: column;
  padding: 11% 9% 10% 14%;
  color: #fff7e6;
  background:
    linear-gradient(90deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0) 4%, rgba(255, 255, 255, 0.2) 6.5%, rgba(0, 0, 0, 0) 9%),
    linear-gradient(155deg, var(--hc-a), var(--hc-b));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.07);
}
.hc-face img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
/* Light: a sheen on hover, and the face darkens as it turns away. */
.hc-face::after, .hc-face::before { content: ''; position: absolute; inset: 0; pointer-events: none; }
.hc-face::after {
  background: linear-gradient(115deg, transparent 38%, rgba(255, 255, 255, 0.16) 50%, transparent 62%);
  transform: translateX(-70%);
  transition: transform 900ms var(--glide);
}
.hc-face::before { z-index: 1; background: #050a14; opacity: 0; }
.hc-top { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; font-size: 6.4cqw; opacity: 0.85; }
.hc-top b { font-weight: 700; letter-spacing: 0.04em; }
.hc-top em { font-style: normal; font-weight: 700; padding: 0 2.2cqw; border: 1px solid rgba(255, 233, 190, 0.6); border-radius: 99px; font-size: 5.6cqw; }
.hc-title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 6;
  overflow: hidden;
  overflow-wrap: anywhere;
  margin-block: auto 6%;
  padding-top: 8%;
  font-family: var(--font-heading);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.01em;
  text-wrap: balance;
}
.hc-title.m { font-size: 11.5cqw; }
.hc-title.s { font-size: 9.6cqw; }
.hc-title.xs { font-size: 8.2cqw; }
.hc-title::before { content: ''; display: block; width: 18%; margin-bottom: 7%; border-top: 2px solid #e5c47a; }
.hc-author {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-size: 6.8cqw;
  font-weight: 600;
  color: #f2dcae;
}
/* Inside of the cover: endpaper, in shade until it faces the light. */
.hc-back {
  transform: rotateY(180deg);
  background: linear-gradient(270deg, color-mix(in srgb, var(--hc-a) 70%, #e9dcc0), color-mix(in srgb, var(--hc-a) 45%, #e9dcc0));
}
.hc-back::after { content: ''; position: absolute; inset: 0; background: #050a14; opacity: 0.55; }

/* Hover: the book turns a little towards you. */
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  /* Plain descendant selectors: Vue scopes only the last part (.hc-obj), so the
     parent link can be matched without :global (which would drop the rest). */
  .hc-host:is(:hover, :focus-visible) .hc-obj { transform: translateX(0) rotateY(-24deg) rotateX(3deg) scale(1.02); }
  .hc-host:is(:hover, :focus-visible) .hc-face::after { transform: translateX(70%); }
}

/* ---------- opening and closing ----------
   The same keyframes run forwards to open (list page) and backwards to close
   (book page), so both feel the same. */
@media (prefers-reduced-motion: no-preference) {
  .is-opening .hc-obj, .is-closing .hc-obj { will-change: transform; }
  .is-opening .hc-obj { animation: hc-move 860ms var(--glide) both; }
  .is-opening .hc-front { animation: hc-cover var(--t-cover) var(--turn) 60ms both; }
  .is-opening .hc-face::before { animation: hc-face-dim var(--t-cover) var(--turn) 60ms both; }
  .is-opening .hc-back::after { animation: hc-back-light var(--t-cover) var(--turn) 60ms both; }
  .is-opening .hc-inside::after { animation: hc-cast var(--t-cover) var(--turn) 60ms both; }
  .is-opening .hc-leaf { animation: hc-leaf var(--t-leaf) var(--turn) both; }
  .is-opening .hc-leaf-1 { animation-delay: 150ms; }
  .is-opening .hc-leaf-2 { animation-delay: 210ms; }
  .is-opening .hc-leaf-3 { animation-delay: 270ms; }
  .is-opening .hc-ground { animation: hc-ground var(--t-cover) var(--turn) 60ms both; }

  .is-closing .hc-obj { animation: hc-move 860ms var(--glide) 380ms reverse both; }
  .is-closing .hc-front { animation: hc-cover var(--t-cover) var(--turn) 200ms reverse both; }
  .is-closing .hc-face::before { animation: hc-face-dim var(--t-cover) var(--turn) 200ms reverse both; }
  .is-closing .hc-back::after { animation: hc-back-light var(--t-cover) var(--turn) 200ms reverse both; }
  .is-closing .hc-inside::after { animation: hc-cast var(--t-cover) var(--turn) 200ms reverse both; }
  .is-closing .hc-leaf { animation: hc-leaf var(--t-leaf) var(--turn) reverse both; }
  .is-closing .hc-leaf-3 { animation-delay: 0ms; }
  .is-closing .hc-leaf-2 { animation-delay: 60ms; }
  .is-closing .hc-leaf-1 { animation-delay: 120ms; }
  .is-closing .hc-ground { animation: hc-ground var(--t-cover) var(--turn) 200ms reverse both; }
}

@keyframes hc-move {
  from { transform: translateX(0) rotateY(-14deg) rotateX(3deg) scale(1); }
  to { transform: translateX(var(--open-x)) rotateY(-3deg) rotateX(7deg) scale(var(--open-s)); }
}
@keyframes hc-cover {
  from { transform: translateZ(3.5px) rotateY(0deg); }
  to { transform: translateZ(3.5px) rotateY(-167deg); }
}
@keyframes hc-leaf {
  0% { opacity: 0; transform: translateZ(var(--z)) rotateY(0deg); }
  6% { opacity: 1; }
  100% { opacity: 1; transform: translateZ(var(--z)) rotateY(var(--leaf-to)); }
}
@keyframes hc-face-dim {
  0% { opacity: 0; }
  55% { opacity: 0.5; }
  100% { opacity: 0.6; }
}
@keyframes hc-back-light {
  0%, 45% { opacity: 0.55; }
  100% { opacity: 0.08; }
}
@keyframes hc-cast {
  0% { opacity: 0; }
  40% { opacity: 1; }
  100% { opacity: 0.35; }
}
@keyframes hc-ground {
  from { transform: translateZ(-8px); opacity: 1; }
  to { transform: translateZ(-8px) translateX(-50%) scaleX(2); opacity: 0.8; }
}
</style>
