<template>
  <button type="button" class="ts" role="switch" :aria-checked="theme === 'dark'" :aria-label="t('theme.label')" :title="theme === 'dark' ? t('theme.toLight') : t('theme.toDark')" @click="toggleTheme">
    <span class="ts-track" aria-hidden="true">
      <svg class="ts-sun" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></svg>
      <svg class="ts-moon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M20 14.2A8 8 0 0 1 9.8 4a8 8 0 1 0 10.2 10.2Z" /></svg>
      <span class="ts-knob" />
    </span>
  </button>
</template>

<script setup>
import { t } from '@/i18n';
import { theme, toggleTheme } from '@/stores/theme';
</script>

<style scoped>
.ts {
  display: inline-grid;
  place-items: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ts-track {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 54px;
  height: 30px;
  padding: 0 8px;
  border-radius: var(--r-pill);
  background: color-mix(in srgb, var(--text-1) 16%, var(--surface-3));
  color: var(--text-3);
  box-shadow: inset 0 1px 3px color-mix(in srgb, var(--text-1) 22%, transparent);
  transition: background-color 420ms var(--ease-out);
}
:root[data-theme='dark'] .ts-track { background: var(--accent); color: #fff; }
.ts-sun, .ts-moon { transition: opacity 320ms ease, transform 420ms var(--ease-out); }
.ts-knob {
  position: absolute;
  inset: 3px auto 3px 3px;
  width: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  transition: transform 420ms cubic-bezier(0.3, 1.35, 0.5, 1), width 220ms ease;
}
.ts:active .ts-knob { width: 29px; }
:root[data-theme='dark'] .ts:active .ts-knob { transform: translateX(19px); }
:root[data-theme='dark'] .ts-knob { transform: translateX(24px); }
/* Icons sit under the free end of the track and fade out where the knob passes. */
:root:not([data-theme='dark']) .ts-sun { opacity: 0; transform: rotate(-60deg) scale(0.6); }
:root[data-theme='dark'] .ts-moon { opacity: 0; transform: rotate(40deg) scale(0.6); }
.ts:focus-visible .ts-track { outline: 2px solid var(--focus); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .ts-knob, .ts-track, .ts-sun, .ts-moon { transition-duration: 1ms; }
}
</style>
