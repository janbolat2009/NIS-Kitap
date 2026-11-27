<template>
  <div class="ls" :class="{ 'ls-wide': wide }" role="group" :aria-label="t('langSwitch.label')" :style="{ '--i': index }">
    <span class="ls-thumb" aria-hidden="true" />
    <button v-for="l in locales" :key="l" type="button" class="ls-btn" :aria-pressed="current === l" :lang="l === 'kz' ? 'kk' : l" @click="choose(l)">{{ l.toUpperCase() }}</button>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { t, currentLocale, setLocale } from '@/i18n';

defineProps({ wide: { type: Boolean, default: false } });

const locales = ['kz', 'ru', 'en'];
// The thumb moves at once; the text swaps half-way through the fade.
const pending = ref('');
const current = computed(() => pending.value || currentLocale.value);
const index = computed(() => locales.indexOf(current.value));
const timers = [];

function choose(l) {
  if (l === current.value) return;
  const root = document.documentElement;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setLocale(l);
    return;
  }
  pending.value = l;
  root.classList.add('lang-swap');
  timers.push(setTimeout(() => { setLocale(l); pending.value = ''; }, 170));
  timers.push(setTimeout(() => root.classList.remove('lang-swap'), 480));
}
onBeforeUnmount(() => timers.forEach(clearTimeout));
</script>

<style scoped>
.ls {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 3px;
  border-radius: var(--r-pill);
  background: var(--surface-3);
  box-shadow: inset 0 1px 2px color-mix(in srgb, var(--text-1) 12%, transparent);
  isolation: isolate;
}
.ls-thumb {
  position: absolute;
  inset: 3px auto 3px 3px;
  width: calc((100% - 6px) / 3);
  border-radius: var(--r-pill);
  background: var(--surface);
  box-shadow: 0 1px 3px color-mix(in srgb, var(--text-1) 28%, transparent), 0 0 0 0.5px color-mix(in srgb, var(--text-1) 10%, transparent);
  transform: translateX(calc(var(--i) * 100%));
  /* A touch of overshoot, like the iOS switch. */
  transition: transform 420ms cubic-bezier(0.3, 1.35, 0.5, 1);
  z-index: -1;
}
.ls-btn {
  min-width: 38px;
  padding: 6px 8px;
  border: none;
  border-radius: var(--r-pill);
  background: none;
  color: var(--text-2);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: color 260ms ease;
}
.ls-btn[aria-pressed='true'] { color: var(--accent-text); }
.ls-btn:not([aria-pressed='true']):hover { color: var(--text-1); }
.ls-btn:focus-visible { outline-offset: 1px; }
.ls-wide .ls-btn { min-height: 40px; font-size: var(--fs-sm); }
@media (prefers-reduced-motion: reduce) { .ls-thumb { transition-duration: 1ms; } }
</style>
