<template>
  <a class="skip-link" href="#main">{{ t('nav.skip') }}</a>
  <SiteHeader />
  <main id="main" class="site-main" tabindex="-1">
    <router-view v-slot="{ Component, route }">
      <transition name="route" mode="out-in">
        <component :is="Component" :key="route.matched[0]?.path || route.path" />
      </transition>
    </router-view>
  </main>
  <SiteFooter v-if="!$route.meta.bare" />

  <AuthDialog v-if="ui.authOpen" />
  <ClassOnboarding v-if="showOnboarding" @close="onboardingClosed = true" />

  <div class="toast-stack" aria-live="polite">
    <div v-for="item in ui.toasts" :key="item.id" class="toast" :class="{ 'is-error': item.type === 'error' }">{{ item.message }}</div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import AuthDialog from '@/components/AuthDialog.vue';
import ClassOnboarding from '@/components/ClassOnboarding.vue';
import { ui } from '@/stores/ui';
import { session } from '@/stores/session';
import { t } from '@/i18n';

const onboardingClosed = ref(false);
const postponed = (() => {
  try { return sessionStorage.getItem('nis_kitap_class_later') === '1'; } catch { return false; }
})();
const showOnboarding = computed(() => session.ready && session.uid && session.role === 'student' && session.needsClass
  && !onboardingClosed.value && !postponed && !ui.authOpen);
</script>

<style>
.site-main { flex: 1; display: flex; flex-direction: column; padding-top: var(--nav-h); outline: none; }
.site-main > * { flex: 1; }
.skip-link {
  position: fixed; top: 8px; left: 8px; z-index: 2000;
  padding: 10px 14px; border-radius: var(--r-sm);
  background: var(--text-1); color: var(--bg); font-weight: 600; text-decoration: none;
  transform: translateY(-150%); transition: transform var(--dur-2) var(--ease-out);
}
.skip-link:focus { transform: none; }
</style>
