<template>
  <figure class="bar-list">
    <figcaption class="chart-title">{{ title }}</figcaption>
    <p v-if="!rows.length" class="chart-empty">{{ emptyText }}</p>
    <ol v-else class="bars" :aria-label="title">
      <li v-for="row in rows" :key="row.label" class="bar-row" tabindex="0" :title="`${row.label}: ${row.value}`">
        <span class="bar-label">{{ row.label }}</span>
        <span class="bar-track" aria-hidden="true">
          <span class="bar-fill" :style="{ '--w': `${(row.value / maxValue) * 100}%` }"></span>
        </span>
        <span class="bar-value">{{ row.value }}</span>
      </li>
    </ol>
  </figure>
</template>

<script setup>
import { computed } from 'vue';

// Ranked magnitudes: a sorted horizontal bar list, one hue, values as text.
const props = defineProps({
  title: { type: String, required: true },
  data: { type: Array, default: () => [] },
  limit: { type: Number, default: 10 },
  emptyText: { type: String, default: '—' },
});
const rows = computed(() => props.data.filter((d) => d.value > 0).slice(0, props.limit));
const maxValue = computed(() => Math.max(1, ...rows.value.map((r) => r.value)));
</script>

<style scoped>
.bar-list { margin: 0; }
.chart-title { font-size: 15px; font-weight: 600; margin-bottom: 14px; color: var(--apple-text-primary); }
.chart-empty { margin: 0; font-size: 14px; color: var(--apple-text-muted); }
.bars { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.bar-row {
  display: grid;
  grid-template-columns: minmax(0, 38%) minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  outline-offset: 2px;
}
.bar-row:hover .bar-fill, .bar-row:focus .bar-fill { filter: brightness(1.2); }
.bar-label {
  font-size: 13px;
  color: var(--apple-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bar-track { height: 10px; border-radius: 4px; background: var(--surface-2); overflow: hidden; }
.bar-fill {
  display: block;
  height: 100%;
  width: var(--w);
  border-radius: 0 4px 4px 0;
  background: var(--apple-blue-light);
  transform-origin: left;
  animation: grow 0.7s var(--apple-spring) both;
  transition: filter 0.2s;
}
.bar-value { font-size: 13px; font-weight: 600; color: var(--apple-text-primary); font-variant-numeric: tabular-nums; min-width: 2ch; text-align: right; }
@keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@media (prefers-reduced-motion: reduce) { .bar-fill { animation: none; } }
</style>
