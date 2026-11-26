<template>
  <footer class="site-footer">
    <div class="container grid">
      <div class="about">
        <router-link to="/" class="brand"><BrandMark /><span>NIS Kitap</span></router-link>
        <p>{{ t('footer.lead') }}</p>
        <p class="made">{{ t('footer.made') }}</p>
      </div>
      <nav class="col" :aria-label="t('footer.sections')">
        <h2>{{ t('footer.sections') }}</h2>
        <router-link to="/catalog">{{ t('nav.catalog') }}</router-link>
        <router-link to="/100-kitap">{{ t('nav.hundred') }}</router-link>
        <router-link to="/leaderboard">{{ t('nav.leaderboard') }}</router-link>
        <router-link to="/about-us">{{ t('nav.about') }}</router-link>
      </nav>
      <nav class="col" :aria-label="t('footer.help')">
        <h2>{{ t('footer.help') }}</h2>
        <router-link :to="{ path: '/', hash: '#how-to' }">{{ t('footer.howTo') }}</router-link>
        <router-link to="/certificate/check">{{ t('footer.certificate') }}</router-link>
        <a href="mailto:janbolatique.kz@gmail.com">janbolatique.kz@gmail.com</a>
        <a href="https://instagram.com/nis.kitap" target="_blank" rel="noopener noreferrer">Instagram · nis.kitap</a>
      </nav>
    </div>
    <div class="container bottom">
      <span>© {{ year }} NIS Kitap</span>
      <span>{{ t('footer.rights') }}</span>
    </div>
  </footer>
</template>

<script setup>
import BrandMark from '@/components/BrandMark.vue';
import { t } from '@/i18n';

const year = new Date().getFullYear();
</script>

<style scoped>
.site-footer { margin-top: auto; border-top: 1px solid var(--line); background: var(--bg-elevated); padding: 48px 0 24px; }
.grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 32px; }
.brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--text-1); font-family: var(--font-serif); font-weight: 650; font-size: 1.1rem; }
.about p { margin-top: 14px; color: var(--text-2); font-size: var(--fs-sm); max-width: 420px; }
.about .made { color: var(--text-3); }
.col { display: flex; flex-direction: column; gap: 10px; }
.col h2 { font-family: var(--font-sans); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); margin-bottom: 4px; }
.col a { color: var(--text-2); text-decoration: none; font-size: var(--fs-sm); overflow-wrap: anywhere; }
.col a:hover { color: var(--text-1); text-decoration: underline; }
.bottom { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 36px; padding-top: 18px; border-top: 1px solid var(--line); color: var(--text-3); font-size: var(--fs-xs); }
@media (max-width: 760px) {
  .grid { grid-template-columns: 1fr 1fr; }
  .about { grid-column: 1 / -1; }
}
</style>
