<template>
  <div class="language-links">
    <router-link v-for="entry in languages" :key="entry.code" :to="entry.route" class="language-link" :class="`language-${entry.code}`">
      <span class="language-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path v-if="entry.code === 'kz'" d="M12 6.5C9.6 4.5 6.5 4 3.5 5v13c3-1 6.1-.5 8.5 1.5 2.4-2 5.5-2.5 8.5-1.5V5c-3-1-6.1-.5-8.5 1.5V19.5M6.5 8.5c1 0 1.7.2 2.5.6m6 .1c.8-.5 1.5-.7 2.5-.7" />
          <path v-else-if="entry.code === 'ru'" d="M7 5a2 2 0 0 1 2-2h11v16H9a2 2 0 0 0 0 4h11m-13-2V5m-2 1H3v14h2m5-13h7m-7 4h7m-7 4h4" transform="translate(1 0) scale(.92)" />
          <path v-else d="M6.5 3.5h12a2 2 0 0 1 2 2v15h-14a3 3 0 0 1 0-6h14M3.5 17.5v-11a3 3 0 0 1 3-3M9 3.5v8L12 9.6l3 1.9v-8" />
        </svg>
      </span>
      <span>{{ t(`home.lang.${entry.code}`) }}</span>
      <svg class="language-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12H19m-6-6 6 6-6 6" /></svg>
    </router-link>
  </div>
</template>

<script setup>
import { t } from '@/i18n';

const languages = [
  { code: 'kz', route: '/kazakh' },
  { code: 'ru', route: '/russian' },
  { code: 'en', route: '/english' },
];
</script>

<style scoped>
.language-links { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.language-link {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  min-height: 66px;
  padding: 11px 14px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--surface);
  color: var(--text-1);
  font-weight: 680;
  text-decoration: none;
  overflow-wrap: anywhere;
  transition: border-color var(--dur-1) ease, background-color var(--dur-1) ease;
}
.language-icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: var(--r-sm);
  background: var(--language-bg);
  color: var(--language-color);
}
.language-kz { --language-bg: var(--success-soft); --language-color: var(--success); }
.language-ru { --language-bg: var(--accent-soft); --language-color: var(--accent-text); }
.language-en { --language-bg: var(--warm-soft); --language-color: var(--warm); }
.language-arrow { flex: none; margin-left: auto; color: var(--language-color); transition: translate var(--dur-2) var(--ease-out); }
.language-link:is(:hover, :focus-visible) { border-color: var(--language-color); }
.language-link:active { background: var(--language-bg); }
@media (prefers-reduced-motion: no-preference) {
  .language-link:is(:hover, :focus-visible) .language-arrow { translate: 3px 0; }
}
@media (max-width: 680px) { .language-links { grid-template-columns: minmax(0, 1fr); } }
</style>
