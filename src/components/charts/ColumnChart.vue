<template>
  <figure class="column-chart">
    <figcaption class="chart-title">{{ title }}</figcaption>
    <p v-if="!hasData" class="chart-empty">{{ emptyText }}</p>
    <div v-else class="plot" @mouseleave="active = -1">
      <div class="y-axis" aria-hidden="true">
        <span>{{ maxValue }}</span>
        <span>{{ Math.round(maxValue / 2) }}</span>
        <span>0</span>
      </div>
      <div class="columns" role="list" :aria-label="title">
        <div
          v-for="(d, i) in data"
          :key="d.label"
          class="col"
          role="listitem"
          tabindex="0"
          :aria-label="`${formatLabel(d.label)}: ${d.value}`"
          @mouseenter="active = i"
          @focus="active = i"
          @blur="active = -1"
        >
          <div class="col-bar" :class="{ dim: active !== -1 && active !== i }" :style="{ '--h': `${(d.value / maxValue) * 100}%` }"></div>
          <span class="col-label">{{ formatLabel(d.label, true) }}</span>
          <div v-if="active === i" class="tip" role="status">
            <strong>{{ d.value }}</strong>
            <span>{{ formatLabel(d.label) }}</span>
          </div>
        </div>
      </div>
    </div>
  </figure>
</template>

<script setup>
import { computed, ref } from 'vue';
import { currentLocale } from '@/i18n';

// Change over time (months): single-series columns with a hover/focus tooltip.
const props = defineProps({
  title: { type: String, required: true },
  data: { type: Array, default: () => [] },
  emptyText: { type: String, default: '—' },
});
const active = ref(-1);
const hasData = computed(() => props.data.some((d) => d.value > 0));
const maxValue = computed(() => {
  const m = Math.max(1, ...props.data.map((d) => d.value));
  return m <= 4 ? 4 : Math.ceil(m / 4) * 4;
});
function formatLabel(key, short = false) {
  const [y, m] = String(key).split('-').map(Number);
  if (!y || !m) return key;
  const loc = currentLocale.value === 'kz' ? 'kk-KZ' : currentLocale.value === 'en' ? 'en-GB' : 'ru-RU';
  return new Date(y, m - 1, 1).toLocaleDateString(loc, short ? { month: 'short' } : { month: 'long', year: 'numeric' });
}
</script>

<style scoped>
.column-chart { margin: 0; }
.chart-title { font-size: 15px; font-weight: 600; margin-bottom: 14px; color: var(--apple-text-primary); }
.chart-empty { margin: 0; font-size: 14px; color: var(--apple-text-muted); }
.plot { display: grid; grid-template-columns: auto 1fr; gap: 8px; height: 220px; }
.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 11px;
  color: var(--apple-text-muted);
  padding-bottom: 22px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.columns {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 2px;
  align-items: end;
  border-bottom: 1px solid var(--line);
  background-image: none; background-color: var(--surface-2);
  background-size: 100% 50%;
  background-position: 0 -1px;
  padding-bottom: 0;
}
.col {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  outline-offset: 2px;
  border-radius: 6px;
}
.col-bar {
  width: min(70%, 28px);
  height: var(--h);
  min-height: 0;
  border-radius: 4px 4px 0 0;
  background: var(--apple-blue-light);
  transform-origin: bottom;
  animation: rise 0.7s var(--apple-spring) both;
  transition: opacity 0.2s;
}
.col-bar.dim { opacity: 0.45; }
.col-label {
  position: absolute;
  bottom: -20px;
  font-size: 11px;
  color: var(--apple-text-muted);
  white-space: nowrap;
}
.tip {
  position: absolute;
  bottom: calc(var(--h, 0%) + 8px);
  top: 0;
  height: max-content;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  padding: 6px 10px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--apple-glass-border);
  font-size: 12px;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}
.tip strong { font-size: 14px; color: var(--apple-text-primary); }
.tip span { color: var(--apple-text-secondary); }
@keyframes rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@media (prefers-reduced-motion: reduce) { .col-bar { animation: none; } }
@media (max-width: 640px) { .col:nth-child(even) .col-label { visibility: hidden; } }
</style>
