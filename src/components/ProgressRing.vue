<template>
  <div class="ring" :style="{ width: `${size}px`, height: `${size}px` }" role="img" :aria-label="label">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" aria-hidden="true">
      <circle :cx="c" :cy="c" :r="r" class="ring-track" :stroke-width="stroke" />
      <circle
        :cx="c"
        :cy="c"
        :r="r"
        class="ring-value"
        :stroke-width="stroke"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        :transform="`rotate(-90 ${c} ${c})`"
      />
    </svg>
    <div class="ring-center">
      <strong>{{ value }}</strong>
      <span>/ {{ max }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  size: { type: Number, default: 132 },
  stroke: { type: Number, default: 10 },
  label: { type: String, default: '' },
});

const c = computed(() => props.size / 2);
const r = computed(() => props.size / 2 - props.stroke);
const circumference = computed(() => 2 * Math.PI * r.value);
const shown = ref(0);
const offset = computed(() => circumference.value * (1 - Math.min(1, shown.value / (props.max || 1))));

// Animate from 0 on first paint; the CSS transition does the easing.
onMounted(() => requestAnimationFrame(() => { shown.value = props.value; }));
watch(() => props.value, (v) => { shown.value = v; });
</script>

<style scoped>
.ring { position: relative; flex: 0 0 auto; }
.ring-track { fill: none; stroke: var(--text-3); }
.ring-value {
  fill: none;
  stroke: var(--apple-blue-light);
  stroke-linecap: round;
  transition: stroke-dashoffset 1.1s var(--apple-spring);
}
.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.1;
}
.ring-center strong { font-size: 30px; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.ring-center span { font-size: 12px; color: var(--apple-text-muted); }
@media (prefers-reduced-motion: reduce) {
  .ring-value { transition: none; }
}
</style>
