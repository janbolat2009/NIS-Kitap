<template>
  <header class="site-header" :class="{ 'is-scrolled': scrolled, 'is-open': open }" @keydown.esc="closeMenu" @focusout="onFocusOut">
    <div class="bar container">
      <router-link to="/" class="brand" @click="open = false">
        <BrandMark />
        <span class="brand-name">NIS Kitap</span>
      </router-link>

      <nav class="nav-desktop" :aria-label="t('nav.menu')">
        <router-link v-for="l in links" :key="l.to" :to="l.to" class="nav-link">{{ t(l.label) }}</router-link>
      </nav>

      <div class="actions">
        <LangSwitch class="lang" />
        <ThemeSwitch class="theme-btn" />
        <router-link v-if="isStaff" to="/admin" class="btn btn-sm btn-ghost staff-link">{{ t('nav.staff') }}</router-link>
        <router-link v-if="session.uid" to="/profile" class="account" :title="t('nav.cabinet')">
          <span class="avatar">{{ initials }}</span>
          <span class="account-label">{{ t('nav.cabinet') }}</span>
        </router-link>
        <button v-else-if="session.ready" type="button" class="btn btn-sm btn-primary signin" @click="openLogin()">{{ t('nav.signIn') }}</button>
        <button ref="menuButton" type="button" class="icon-btn burger" :aria-expanded="open" aria-controls="mobile-menu" :aria-label="open ? t('nav.close') : t('nav.menu')" @click="open = !open">
          <span class="burger-lines" :class="{ open }"><i /><i /><i /></span>
        </button>
      </div>
    </div>

    <transition name="menu" @before-leave="disableMenu">
      <div v-if="open" id="mobile-menu" class="mobile-menu" @click.self="closeMenu">
        <nav class="mobile-panel" :aria-label="t('nav.menu')">
          <div class="m-links">
            <router-link v-for="l in links" :key="l.to" :to="l.to" class="m-link" @click="closeMenu">{{ t(l.label) }}</router-link>
            <router-link v-slot="{ href, navigate }" :to="{ path: '/', hash: '#how-to' }" custom>
              <a :href="href" class="m-link" @click="navigate($event); closeMenu()">{{ t('footer.howTo') }}</a>
            </router-link>
            <router-link v-if="isStaff" to="/admin" class="m-link" @click="closeMenu">{{ t('nav.staff') }}</router-link>
            <router-link v-if="session.uid" to="/profile" class="m-link" @click="closeMenu">{{ t('nav.cabinet') }}</router-link>
          </div>
          <div class="m-row">
            <span class="m-label">{{ t('theme.label') }}</span>
            <ThemeSwitch />
          </div>
          <div class="m-row m-row-col">
            <span class="m-label">Тіл · Язык · Language</span>
            <LangSwitch wide />
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
import LangSwitch from '@/components/LangSwitch.vue';
import ThemeSwitch from '@/components/ThemeSwitch.vue';
import { t } from '@/i18n';
import { session } from '@/stores/session';
import { openLogin } from '@/stores/ui';

const links = [
  { to: '/', label: 'nav.home' },
  { to: '/catalog', label: 'nav.catalog' },
  { to: '/100-kitap', label: 'nav.hundred' },
  { to: '/leaderboard', label: 'nav.leaderboard' },
  { to: '/about-us', label: 'nav.about' },
];
const open = ref(false);
const scrolled = ref(false);
const menuButton = ref(null);
const route = useRoute();

const isStaff = computed(() => (session.permissions || []).length > 0);
const initials = computed(() => {
  const p = session.profile;
  const base = p?.firstName ? `${p.firstName} ${p.lastName || ''}` : session.name || session.email;
  return String(base).trim().split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase() || '•';
});

const onScroll = () => { scrolled.value = window.scrollY > 4; };
function closeMenu() {
  if (!open.value) return;
  open.value = false;
  menuButton.value?.focus();
}

function onFocusOut(event) {
  if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) open.value = false;
}
function disableMenu(element) { element.inert = true; }

const desktopMenu = window.matchMedia('(min-width: 1121px)');
const onMenuResize = (event) => { if (event.matches) open.value = false; };
onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  desktopMenu.addEventListener('change', onMenuResize);
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  desktopMenu.removeEventListener('change', onMenuResize);
});
watch(() => route.fullPath, () => { open.value = false; });
</script>

<style scoped>
.site-header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 900;
  height: var(--nav-h);
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--line);
  transition: background-color var(--dur-2) ease, box-shadow var(--dur-2) ease;
}
.site-header.is-scrolled { box-shadow: 0 5px 18px color-mix(in srgb, var(--text-1) 7%, transparent); }
.site-header.is-scrolled:not(.is-open) { background: color-mix(in srgb, var(--bg-elevated) 97%, transparent); }
.bar { height: 100%; display: flex; align-items: center; gap: clamp(12px, 1.55vw, 22px); }
.brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--text-1); flex: none; }
.brand-name { font-family: var(--font-heading); font-weight: 650; font-size: 1.15rem; letter-spacing: -0.01em; }
.brand :deep(.mark) { transition: transform var(--dur-2) var(--ease-out); }

.nav-desktop { display: flex; gap: 2px; margin-left: 8px; }
.nav-link {
  position: relative;
  padding: 8px 12px;
  border-radius: var(--r-sm);
  color: var(--text-2);
  text-decoration: none;
  font-size: var(--fs-sm);
  font-weight: 550;
  transition: color var(--dur-1) ease, background-color var(--dur-1) ease;
}
.nav-link::after {
  content: '';
  position: absolute;
  inset: auto 12px 3px;
  border-bottom: 2px solid currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--dur-2) var(--ease-out);
}
.nav-link:is(:hover, :focus-visible, .router-link-exact-active) { color: var(--accent-text); background: var(--accent-soft); }
.nav-link:is(:hover, :focus-visible, .router-link-exact-active)::after { transform: scaleX(1); }
.nav-link:active { background: var(--surface-3); }

.actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.icon-btn {
  display: inline-grid; place-items: center; width: 40px; height: 40px;
  border-radius: var(--r-sm); border: 1px solid var(--line); background: var(--surface); color: var(--text-2); cursor: pointer;
}
.icon-btn:hover, .icon-btn[aria-expanded='true'] { border-color: var(--accent-text); background: var(--accent-soft); color: var(--accent-text); }
.icon-btn:active { background: var(--surface-3); }
.icon-btn, .account, .seg button, .m-link {
  transition: background-color var(--dur-1) ease, color var(--dur-1) ease, border-color var(--dur-1) ease, transform var(--dur-1) var(--ease-out);
}

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

.mobile-menu {
  position: fixed;
  inset: var(--nav-h) 0 0 0;
  z-index: 899;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 9px var(--gutter);
  background: color-mix(in srgb, var(--backdrop) 58%, transparent);
  overflow: hidden;
}
.mobile-panel {
  width: min(100%, 410px);
  max-height: calc(100dvh - var(--nav-h) - 18px - env(safe-area-inset-bottom));
  padding: 11px 12px 15px;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-lg);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-2);
}
.m-links { display: grid; gap: 3px; padding-bottom: 8px; }
.m-link { display: flex; align-items: center; min-height: 44px; padding: 7px 11px; color: var(--text-1); text-decoration: none; font-weight: 610; border-radius: var(--r-sm); }
.m-link.router-link-exact-active { background: var(--accent-soft); color: var(--accent-text); font-weight: 720; }
.m-link:is(:hover, :active) { background: var(--accent-soft); color: var(--accent-text); }
.m-row { display: flex; flex-direction: column; gap: 7px; padding: 10px 3px; border-top: 1px solid var(--line); }
.m-row:not(.m-row-col) { flex-direction: row; align-items: center; justify-content: space-between; }
.m-label { font-size: var(--fs-xs); color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 650; }
/* Theme and language switches share the primary blue of «Войти» (--button-fill /
   --accent-text): the selected option is a tinted blue segment, «Войти» stays the
   only solid blue button, so the hierarchy is kept while the hue is one. */
.seg {
  display: flex; gap: 4px; padding: 4px;
  border: 1px solid color-mix(in srgb, var(--accent-text) 22%, var(--line));
  border-radius: var(--r-md);
  background: var(--surface);
}
.seg button {
  flex: 1; min-height: 44px; border: 1px solid transparent; border-radius: calc(var(--r-md) - 4px);
  background: transparent; color: var(--text-2); font-weight: 600; font-size: var(--fs-sm); cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.seg button[aria-pressed='true'] {
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--button-fill) 55%, transparent);
  color: var(--accent-text);
  font-weight: 700;
}
.seg button:hover:not([aria-pressed='true']) { background: color-mix(in srgb, var(--accent-soft) 70%, transparent); color: var(--accent-text); }
.seg button:active { background: color-mix(in srgb, var(--button-fill) 22%, var(--accent-soft)); color: var(--accent-text); }
.seg button:focus-visible { outline-offset: 1px; }
.mobile-panel .btn-block { margin-top: 8px; min-height: 48px; }
.menu-leave-active { pointer-events: none; }

/* Panel: fade + slight drop from the burger corner (transform/opacity only). */
.menu-enter-active { transition: background-color 300ms ease; }
.menu-leave-active { transition: background-color 180ms ease; }
.menu-enter-active .mobile-panel { transition: opacity 260ms ease, transform 340ms var(--ease-out); }
.menu-leave-active .mobile-panel { transition: opacity 160ms ease, transform 180ms ease-in; }
.menu-enter-from, .menu-leave-to { background-color: transparent; }
.menu-enter-from .mobile-panel, .menu-leave-to .mobile-panel { opacity: 0; transform: translateY(-8px) scale(0.98); }
.mobile-panel { transform-origin: top right; }

@media (prefers-reduced-motion: no-preference) {
  .bar { animation: mark-header 480ms var(--ease-out) backwards; }
  .brand:active :deep(.mark), .icon-btn:active, .account:active { transform: scale(0.92); }

  @keyframes mark-header {
    from { opacity: 0.76; transform: translateY(-7px); }
    to { opacity: 1; transform: translateY(0); }
  }
}

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .brand:hover:not(:active) :deep(.mark) { transform: rotate(-7deg); }
}
@media (prefers-reduced-motion: reduce) {
  .menu-enter-from .mobile-panel, .menu-leave-to .mobile-panel { transform: none; }
}
@media (max-width: 1120px) {
  .nav-desktop, .lang, .staff-link, .account-label { display: none; }
  .burger { display: inline-grid; min-height: 44px; min-width: 44px; }
  .account { padding: 2px; border: none; }
}
@media (max-width: 420px) {
  .bar { gap: 12px; }
  .brand { gap: 6px; }
  .brand-name { font-size: 1rem; }
  .actions { gap: 5px; }
  .icon-btn { width: 36px; }
  .signin { padding-inline: 9px; }
}
</style>
