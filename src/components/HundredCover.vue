<template>
  <div class="hc" :class="[`hc-${size}`, { 'is-opening': opening, 'is-closing': closing }]" :style="{ '--hc-a': palette[0], '--hc-b': palette[1] }" aria-hidden="true">
    <div class="hc-shadow" />
    <div class="hc-obj">
      <span class="hc-pages" />
      <span class="hc-inside"><i v-for="n in 7" :key="n" /></span>
      <span class="hc-front">
        <span class="hc-face">
          <span class="hc-top">
            <b class="tabular">№ {{ entry.order }}</b>
            <em>{{ entry.grade }}</em>
          </span>
          <span class="hc-title" :class="titleSize">{{ entry.title }}</span>
          <span class="hc-author">{{ entry.author }}</span>
        </span>
        <span class="hc-back" />
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  entry: { type: Object, required: true },
  size: { type: String, default: 'card' },
  opening: { type: Boolean, default: false },
  closing: { type: Boolean, default: false },
});

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
.hc {
  position: relative;
  container-type: inline-size;
  width: 100%;
  aspect-ratio: 2 / 3;
  perspective: 1100px;
}
.hc-hero { max-width: 340px; }
.hc-shadow {
  position: absolute;
  inset: auto 6% -3% 6%;
  height: 8%;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(8, 16, 30, 0.42), transparent 70%);
  filter: blur(4px);
  transition: transform 700ms var(--ease-out), opacity 700ms var(--ease-out);
}
.hc-obj {
  position: absolute;
  inset: 0;
  transform: rotateY(-16deg) rotateX(3deg);
  transform-style: preserve-3d;
  transition: transform 700ms var(--ease-out);
}
.hc-pages, .hc-inside, .hc-front, .hc-face, .hc-back {
  position: absolute;
  inset: 0;
  border-radius: 3px 8px 8px 3px;
}
/* Page block: the cream edge you see to the right and below. */
.hc-pages {
  inset: 2% -2.4% 1.6% 1.5%;
  background: repeating-linear-gradient(90deg, #efe6d2 0 1.5px, #cfc2a4 1.5px 2.5px);
  transform: translateZ(-3px);
  box-shadow: 0 14px 22px -10px rgba(8, 16, 30, 0.5);
}
/* First page, visible once the cover swings open. */
.hc-inside {
  inset: 1.5% 0.5% 1.5% 0;
  padding: 16% 12%;
  display: flex;
  flex-direction: column;
  gap: 5%;
  background: linear-gradient(90deg, #d9c9a4, #faf4e6 12%);
  border: 1px solid #e0d0b4;
  transform: translateZ(1px);
}
.hc-inside i { display: block; height: 2px; border-radius: 2px; background: rgba(120, 100, 60, 0.28); }
.hc-inside i:nth-child(3n) { width: 76%; }
.hc-inside i:last-child { width: 52%; }
.hc-front {
  transform-origin: left center;
  transform-style: preserve-3d;
  transform: translateZ(3px);
  transition: transform 800ms var(--ease-out);
}
.hc-face, .hc-back { backface-visibility: hidden; overflow: hidden; }
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
/* A soft sheen that slides over the cover as it tilts. */
.hc-face::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(115deg, transparent 38%, rgba(255, 255, 255, 0.16) 50%, transparent 62%);
  transform: translateX(-70%);
  transition: transform 900ms var(--ease-out);
}
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
.hc-back {
  transform: rotateY(180deg);
  background: linear-gradient(270deg, var(--hc-b), var(--hc-a));
}

/* Hover: the book turns a little towards you. */
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  :global(.hc-host:hover) .hc-obj, :global(.hc-host:focus-visible) .hc-obj { transform: rotateY(-27deg) rotateX(2deg) translateY(-3%); }
  :global(.hc-host:hover) .hc-face::after, :global(.hc-host:focus-visible) .hc-face::after { transform: translateX(70%); }
  :global(.hc-host:hover) .hc-shadow { transform: scaleX(1.06) translateY(4px); }
}

/* Click: the cover swings open on its spine and the book comes forward. */
.is-opening .hc-obj { transform: rotateY(-6deg) rotateX(0deg) translateX(34%) scale(1.14); transition-duration: 760ms; }
.is-opening .hc-front { transform: translateZ(3px) rotateY(-158deg); transition-duration: 760ms; }
.is-opening .hc-shadow { opacity: 0.4; transform: translateX(34%) scaleX(1.5); }

/* Detail page: the book arrives open and settles closed. */
@media (prefers-reduced-motion: no-preference) {
  .is-closing .hc-front { animation: hc-close 1100ms var(--ease-out) 120ms both; }
  .is-closing .hc-obj { animation: hc-settle 1100ms var(--ease-out) 120ms both; }
  @keyframes hc-close {
    from { transform: translateZ(3px) rotateY(-158deg); }
    to { transform: translateZ(3px) rotateY(0deg); }
  }
  @keyframes hc-settle {
    from { transform: rotateY(-6deg) translateX(34%) scale(1.1); }
    to { transform: rotateY(-16deg) rotateX(3deg); }
  }
}
@media (prefers-reduced-motion: reduce) {
  .is-opening .hc-obj { transform: rotateY(-16deg) rotateX(3deg); }
  .is-opening .hc-front { transform: translateZ(3px); }
}
</style>
