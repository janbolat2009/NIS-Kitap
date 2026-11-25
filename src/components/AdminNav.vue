<template>
  <nav class="admin-nav kp-tabs kp-no-print" :aria-label="t('nav.staff')">
    <router-link v-for="link in links" :key="link.to" :to="link.to" class="kp-tab" :class="{ active: $route.path === link.to }">
      {{ link.label }}
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { session } from '@/stores/session';
import { can } from '@/lib/roles';
import { t } from '@/i18n';

const links = computed(() => [
  { to: '/admin', label: t('nav.admin'), perm: 'reading.verify' },
  { to: '/admin/analytics', label: t('nav.analytics'), perm: 'analytics.view' },
  { to: '/admin/rewards', label: t('nav.rewards'), perm: 'rewards.view' },
  { to: '/admin/roster', label: t('analytics.roster'), perm: 'roster.manage' },
].filter((l) => can(session.role, l.perm)));
</script>

<style scoped>
.admin-nav { margin-bottom: 24px; width: max-content; }
.admin-nav a { text-decoration: none; }
</style>
