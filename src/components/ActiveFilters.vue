<template>
  <transition name="filters-row">
    <div v-if="chips.length" ref="root" class="active-filters" role="group" :aria-label="t('filters.label')">
      <transition-group name="filter-chip" tag="ul" class="chip-list">
        <li v-for="chip in chips" :key="chip.key">
          <span class="filter-chip">
            <span class="chip-text"><span class="chip-kind">{{ chip.kind }}:</span> {{ chip.value }}</span>
            <button
              type="button"
              class="chip-remove"
              :aria-label="t('filters.remove', { name: `${chip.kind}: ${chip.value}` })"
              @click="remove(chip.key)"
            >
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
            </button>
          </span>
        </li>
      </transition-group>
      <button v-if="chips.length > 1" type="button" class="clear-all" :aria-label="t('filters.clearAllAria')" @click="clearAll">{{ t('filters.clearAll') }}</button>
    </div>
  </transition>
</template>

<script setup>
import { nextTick, ref } from 'vue';
import { t } from '@/i18n';

// chips: [{ key, kind, value }] — one per applied filter, built by the page.
const props = defineProps({ chips: { type: Array, default: () => [] } });
const emit = defineEmits(['remove', 'clear', 'empty']);
const root = ref(null);

// The removed button disappears, so keyboard focus moves to the neighbouring
// chip; when none is left the page decides (it focuses the search field).
async function remove(key) {
  const index = props.chips.findIndex((c) => c.key === key);
  emit('remove', key);
  await nextTick();
  const buttons = [...(root.value?.querySelectorAll('li:not(.filter-chip-leave-active) .chip-remove') || [])];
  if (buttons.length) buttons[Math.min(index, buttons.length - 1)].focus();
  else emit('empty');
}

function clearAll() {
  emit('clear');
  emit('empty');
}
</script>

<style scoped>
.active-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; margin-bottom: 18px; }
.chip-list { position: relative; display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; min-width: 0; }
.chip-list > li { min-width: 0; max-width: 100%; }
.filter-chip {
  display: inline-flex; align-items: center; gap: 2px; max-width: 100%;
  min-height: 36px; padding-left: 13px; border-radius: var(--r-pill);
  border: 1px solid color-mix(in srgb, var(--accent-text) 28%, var(--line));
  background: var(--accent-soft); color: var(--accent-text);
  font-size: var(--fs-sm); font-weight: 600;
}
.chip-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.chip-kind { font-weight: 500; opacity: 0.82; }
.chip-remove {
  position: relative; flex: none; display: grid; place-items: center;
  width: 34px; height: 34px; border: none; border-radius: 50%;
  background: transparent; color: inherit; cursor: pointer;
  transition: background-color 180ms ease, color 180ms ease, transform 180ms var(--ease-out);
}
/* Hit area grows to 44 px without changing the chip size. */
.chip-remove::before { content: ''; position: absolute; inset: -5px; border-radius: 50%; }
.chip-remove:hover { background: color-mix(in srgb, var(--accent-text) 14%, transparent); }
.chip-remove:focus-visible { outline-offset: -2px; }
.clear-all {
  min-height: 44px; padding: 0 12px; border: none; border-radius: var(--r-sm);
  background: transparent; color: var(--text-2); font-size: var(--fs-sm); font-weight: 600;
  text-decoration: underline; text-underline-offset: 3px; cursor: pointer;
  transition: background-color 180ms ease, color 180ms ease;
}
.clear-all:hover { color: var(--text-1); background: var(--surface-2); }

.filters-row-enter-active { transition: opacity 260ms ease, transform 320ms var(--ease-out); }
.filters-row-leave-active { transition: opacity 160ms ease; }
.filters-row-enter-from { opacity: 0; transform: translateY(-4px); }
.filters-row-leave-to { opacity: 0; }
.filter-chip-enter-active { transition: opacity 220ms ease, transform 240ms var(--ease-out); }
.filter-chip-leave-active { transition: opacity 150ms ease, transform 150ms ease; position: absolute; }
.filter-chip-enter-from, .filter-chip-leave-to { opacity: 0; transform: scale(0.94); }
.filter-chip-move { transition: transform 240ms var(--ease-out); }

@media (prefers-reduced-motion: no-preference) {
  .chip-remove:active { transform: scale(0.9); }
}
@media (prefers-reduced-motion: reduce) {
  .filters-row-enter-from, .filter-chip-enter-from, .filter-chip-leave-to { transform: none; }
}
</style>
