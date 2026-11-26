<template>
  <header class="site-header" :class="{ 'is-scrolled': scrolled }">
    <div class="bar container">
      <router-link to="/" class="brand" @click="open = false">
        <BrandMark />
        <span class="brand-name">NIS Kitap</span>
      </router-link>

      <nav class="nav-desktop" :aria-label="t('nav.menu')">
        <router-link v-for="l in links" :key="l.to" :to="l.to" class="nav-link">{{ t(l.label) }}</router-link>
      </nav>

      <div class="actions">
        <div class="lang" role="group" aria-label="Language">
          <button v-for="l in locales" :key="l" type="button" class="lang-btn" :aria-pressed="locale === l" @click="setLocale(l)">{{ l.toUpperCase() }}</button>
        </div>
        <button type="button" class="icon-btn theme-btn" :aria-label="theme === 'dark' ? t('theme.toLight') : t('theme.toDark')" :title="theme === 'dark' ? t('theme.toLight') : t('theme.toDark')" @click="toggleTheme">
          <svg v-if="theme === 'dark'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" /></svg>
          <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.2A8 8 0 0 1 9.8 4a8 8 0 1 0 10.2 10.2Z" /></svg>
        </button>
        <router-link v-if="isStaff" to="/admin" class="btn btn-sm btn-ghost staff-link">{{ t('nav.staff') }}</router-link>
        <router-link v-if="session.uid" to="/profile" class="account" :title="t('nav.cabinet')">
          <span class="avatar">{{ initials }}</span>
          <span class="account-label">{{ t('nav.cabinet') }}</span>
        </router-link>
        <button v-else-if="session.ready" type="button" class="btn btn-sm btn-primary signin" @click="openLogin()">{{ t('nav.signIn') }}</button>
        <button type="button" class="icon-btn burger" :aria-expanded="open" aria-controls="mobile-menu" :aria-label="open ? t('nav.close') : t('nav.menu')" @click="open = !open">
          <span class="burger-lines" :class="{ open }"><i /><i /><i /></span>
        </button>
      </div>
    </div>

    <transition name="menu">
      <div v-if="open" id="mobile-menu" class="mobile-menu" @click.self="open = false">
        <nav class="mobile-panel" :aria-label="t('nav.menu')">
          <router-link v-for="l in links" :key="l.to" :to="l.to" class="m-link" @click="open = false">{{ t(l.label) }}</router-link>
          <router-link v-if="isStaff" to="/admin" class="m-link" @click="open = false">{{ t('nav.staff') }}</router-link>
          <router-link v-if="session.uid" to="/profile" class="m-link" @click="open = false">{{ t('nav.cabinet') }}</router-link>
          <div class="m-row">
            <span class="m-label">{{ t('theme.label') }}</span>
            <div class="seg">
              <button type="button" :aria-pressed="themePref === 'light'" @click="setTheme('light')">{{ t('theme.toLight') }}</button>
              <button type="button" :aria-pressed="themePref === 'dark'" @click="setTheme('dark')">{{ t('theme.toDark') }}</button>
            </div>
          </div>
          <div class="m-row">
            <span class="m-label">Тіл · Язык · Language</span>
            <div class="seg">
              <button v-for="l in locales" :key="l" type="button" :aria-pressed="locale === l" @click="setLocale(l)">{{ l.toUpperCase() }}</button>
            </div>
          </div>
          <button v-if="!session.uid" type="button" class="btn btn-primary btn-block" @click="open = false; openLogin()">{{ t('nav.signIn') }}</button>
        </nav>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import BrandMark from '@/components/BrandMark.vue';
import { t, currentLocale, setLocale } from '@/i18n';
import { session } from '@/stores/session';
import { openLogin } from '@/stores/ui';
import { theme, themePref, setTheme, toggleTheme } from '@/stores/theme';

const links = [
  { to: '/', label: 'nav.home' },
  { to: '/catalog', label: 'nav.catalog' },
  { to: '/100-kitap', label: 'nav.hundred' },
  { to: '/leaderboard', label: 'nav.leaderboard' },
  { to: '/about-us', label: 'nav.about' },
];
const locales = ['kz', 'ru', 'en'];
const locale = currentLocale;
const open = ref(false);
const scrolled = ref(false);
const route = useRoute();

const isStaff = computed(() => (session.permissions || []).length > 0);
const initials = computed(() => {
  const p = session.profile;
  const base = p?.firstName ? `${p.firstName} ${p.lastName || ''}` : session.name || session.email;
  return String(base).trim().split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase() || '•';
});

const onScroll = () => { scrolled.value = window.scrollY > 4; };
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
watch(() => route.fullPath, () => { open.value = false; });
watch(open, (v) => document.body.classList.toggle('modal-open', v));
</script>

<style scoped>
.site-header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 900;
  height: var(--nav-h);
  background: color-mix(in srgb, var(--bg) 92%, transparent);
  border-bottom: 1px solid transparent;
  transition: border-color var(--dur-2) ease, background-color var(--dur-2) ease;
}
.site-header.is-scrolled { border-bottom-color: var(--line); }
.bar { height: 100%; display: flex; align-items: center; gap: 20px; }
.brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--text-1); flex: none; }
.brand-name { font-family: var(--font-serif); font-weight: 650; font-size: 1.15rem; letter-spacing: -0.01em; }

.nav-desktop { display: flex; gap: 2px; margin-left: 8px; }
.nav-link {
  padding: 8px 12px;
  border-radius: var(--r-sm);
  color: var(--text-2);
  text-decoration: none;
  font-size: var(--fs-sm);
  font-weight: 550;
  transition: color var(--dur-1) ease, background-color var(--dur-1) ease;
}
.nav-link:hover { color: var(--text-1); background: var(--surface-2); }
.nav-link.router-link-exact-active { color: var(--text-1); background: var(--surface-2); }

.actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.lang { display: flex; border: 1px solid var(--line); border-radius: var(--r-sm); overflow: hidden; }
.lang-btn { border: none; background: none; color: var(--text-3); font-size: 12px; font-weight: 650; padding: 6px 8px; cursor: pointer; }
.lang-btn[aria-pressed='true'] { background: var(--surface-2); color: var(--text-1); }
.icon-btn {
  display: inline-grid; place-items: center; width: 40px; height: 40px;
  border-radius: var(--r-sm); border: none; background: none; color: var(--text-2); cursor: pointer;
}
.icon-btn:hover { background: var(--surface-2); color: var(--text-1); }
.theme-btn svg { transition: transform var(--dur-3) var(--ease-out); }
.theme-btn:active svg { transform: rotate(-30deg); }

.account { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-1); padding: 4px 10px 4px 4px; border-radius: var(--r-pill); border: 1px solid var(--line); }
.account:hover { background: var(--surface-2); }
.avatar { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: var(--accent-soft); color: var(--accent-text); font-size: 12px; font-weight: 700; }
.account-label { font-size: var(--fs-sm); font-weight: 600; }

.burger { display: none; }
.burger-lines { position: relative; width: 18px; height: 12px; display: block; }
.burger-lines i { position: absolute; left: 0; right: 0; height: 2px; border-radius: 2px; background: currentColor; transition: transform var(--dur-2) var(--ease-out), opacity var(--dur-1) ease; }
.burger-lines i:nth-child(1) { top: 0; }
.burger-lines i:nth-child(2) { top: 5px; }
.burger-lines i:nth-child(3) { top: 10px; }
.burger-lines.open i:nth-child(1) { transform: translateY(5px) rotate(45deg); }
.burger-lines.open i:nth-child(2) { opacity: 0; }
.burger-lines.open i:nth-child(3) { transform: translateY(-5px) rotate(-45deg); }

.mobile-menu { position: fixed; inset: var(--nav-h) 0 0 0; background: var(--backdrop); z-index: 899; }
.mobile-panel {
  background: var(--bg); border-bottom: 1px solid var(--line);
  padding: 8px var(--gutter) calc(20px + env(safe-area-inset-bottom));
  display: flex; flex-direction: column; gap: 2px; max-height: calc(100dvh - var(--nav-h)); overflow-y: auto;
}
.m-link { padding: 14px 4px; color: var(--text-1); text-decoration: none; font-size: 1.05rem; font-weight: 550; border-bottom: 1px solid var(--line); }
.m-link.router-link-exact-active { color: var(--accent-text); }
.m-row { display: flex; flex-direction: column; gap: 8px; padding: 14px 4px; }
.m-label { font-size: var(--fs-xs); color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 650; }
.seg { display: flex; border: 1px solid var(--line-strong); border-radius: var(--r-md); overflow: hidden; }
.seg button { flex: 1; min-height: 42px; border: none; background: var(--surface); color: var(--text-2); font-weight: 600; font-size: var(--fs-sm); cursor: pointer; }
.seg button + button { border-left: 1px solid var(--line-strong); }
.seg button[aria-pressed='true'] { background: var(--text-1); color: var(--bg); }
.mobile-panel .btn-block { margin-top: 8px; }

.menu-enter-active, .menu-leave-active { transition: opacity var(--dur-2) ease; }
.menu-enter-active .mobile-panel, .menu-leave-active .mobile-panel { transition: transform var(--dur-3) var(--ease-out); }
.menu-enter-from, .menu-leave-to { opacity: 0; }
.menu-enter-from .mobile-panel, .menu-leave-to .mobile-panel { transform: translateY(-12px); }

@media (max-width: 1060px) {
  .nav-desktop, .lang, .staff-link, .account-label { display: none; }
  .burger { display: inline-grid; }
  .account { padding: 2px; border: none; }
}
@media (max-width: 360px) {
  .brand-name { display: none; }
}
</style>
