<template>
  <div class="jacket" :class="`jacket-${size}`" :style="{ '--jacket-ink': sampledColor || fallbackColor }" aria-hidden="true">
    <div class="jacket-object">
      <div class="jacket-face">
        <img v-if="image && !failed" :src="image" alt="" :loading="size === 'large' ? 'eager' : 'lazy'" decoding="async" @load="sampleCover" @error="failed = true" />
        <div v-else class="jacket-type">
          <span class="jacket-title">{{ book.title }}</span>
          <span v-if="book.author" class="jacket-author">{{ book.author }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  book: { type: Object, required: true },
  size: { type: String, default: 'small' },
});

const palette = ['#294d74', '#744134', '#285549', '#534370', '#735320'];
const fallbackColor = computed(() => {
  let hash = 0;
  for (const character of String(props.book.title || '')) hash = (hash * 31 + character.codePointAt(0)) % palette.length;
  return palette[hash];
});
const image = computed(() => typeof props.book.cover_image === 'string' ? props.book.cover_image.trim() : '');
const failed = ref(false);
const sampledColor = ref('');
watch(image, () => { failed.value = false; sampledColor.value = ''; });

function sampleCover(event) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 8;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;

  // Cross-origin covers can still display when their pixels are unavailable.
  try {
    context.drawImage(event.target, 0, 0, 8, 8);
    const pixels = context.getImageData(0, 0, 8, 8).data;
    const sums = [0, 0, 0];
    let weightSum = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const channels = [pixels[i], pixels[i + 1], pixels[i + 2]];
      const weight = (Math.max(...channels) - Math.min(...channels)) * (pixels[i + 3] / 255);
      for (let channel = 0; channel < sums.length; channel++) sums[channel] += channels[channel] * weight;
      weightSum += weight;
    }
    if (weightSum > 250) sampledColor.value = `rgb(${sums.map((n) => Math.round(n / weightSum)).join(', ')})`;
  } catch {
    sampledColor.value = '';
  }
}
</script>

<style scoped>
.jacket {
  --jacket-edge: color-mix(in srgb, var(--jacket-ink) 70%, #102538);
  --jacket-depth: 9px;
  display: grid;
  place-items: center;
  width: 100%;
  padding: 14px calc(16px + var(--jacket-depth)) 16px 16px;
  background: color-mix(in srgb, var(--jacket-ink) 14%, var(--surface-2));
  perspective: 850px;
}
.jacket-object {
  position: relative;
  width: min(100%, 136px);
  aspect-ratio: 2 / 3;
  transform: rotateY(-9deg);
  transform-style: preserve-3d;
  transition: transform var(--dur-2) var(--ease-out);
}
.jacket-object::before, .jacket-object::after {
  content: '';
  position: absolute;
  inset: 2px calc(-1 * var(--jacket-depth)) 1px 5px;
  border-radius: 3px 7px 7px 3px;
  background: var(--jacket-edge);
  transform: translateZ(-2px);
  box-shadow: 2px 6px 13px #07152345;
}
.jacket-object::after {
  inset: 5px calc(1px - var(--jacket-depth)) 5px 6px;
  border-radius: 2px 5px 5px 2px;
  transform: translateZ(-1px);
  background: repeating-linear-gradient(90deg, #e8dfcd 0 2px, #ccbea5 2px 3px);
  box-shadow: none;
}
.jacket-face {
  position: absolute;
  z-index: 1;
  inset: 0;
  overflow: hidden;
  border-radius: 3px 6px 6px 3px;
  background: var(--jacket-edge);
  color: #fff;
}
.jacket-face::after {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
  background: linear-gradient(90deg, #060b27a0, transparent 5% 7%, #fff2 8%, transparent 10%);
}
.jacket-face img { width: 100%; height: 100%; object-fit: contain; }
.jacket-type {
  display: grid;
  align-content: end;
  gap: 6px;
  height: 100%;
  padding: 13% 12% 15% 15%;
  background: linear-gradient(145deg, var(--jacket-ink), var(--jacket-edge));
}
.jacket-type::before { content: ''; width: 22px; border-top: 1px solid #fff9; margin-bottom: 4px; }
.jacket-title, .jacket-author { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.jacket-title { font: 780 clamp(0.78rem, 0.5rem + 0.5vw, 1.05rem) / 1.17 var(--font-heading); -webkit-line-clamp: 4; }
.jacket-author { color: #fff1e0; font-size: 0.65rem; -webkit-line-clamp: 2; }
.jacket-large { --jacket-depth: 15px; padding: 19px 29px 22px 18px; border-radius: var(--r-lg); }
.jacket-large .jacket-object { width: min(100%, 205px); }
.jacket-large .jacket-title { font-size: clamp(0.94rem, 1.7vw, 1.55rem); }
.jacket-large .jacket-author { font-size: clamp(0.65rem, 1vw, 0.86rem); }

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .jacket-large:hover .jacket-object { transform: translateY(-3px) rotateY(-16deg); }
}
</style>
