<template>
  <div v-if="!session.ready" class="gate-loading" aria-busy="true">
    <div class="kp-skeleton" style="height: 120px"></div>
  </div>
  <div v-else-if="!session.uid" class="kp-state">
    <h3>{{ t('common.loginRequired') }}</h3>
    <p>{{ t('common.loginRequiredDesc') }}</p>
    <button v-if="openLogin" class="kp-btn primary" @click="openLogin()">{{ t('nav.login') }}</button>
  </div>
  <div v-else-if="!session.emailVerified" class="kp-state">
    <h3>{{ t('common.verifyEmail') }}</h3>
    <p>{{ t('common.verifyEmailDesc') }}</p>
  </div>
  <div v-else-if="permission && !allowed" class="kp-state" role="alert">
    <h3>{{ t('common.accessDenied') }}</h3>
    <p>{{ t('common.accessDeniedDesc') }}</p>
    <router-link to="/" class="kp-btn">{{ t('nav.home') }}</router-link>
  </div>
  <slot v-else />
</template>

<script setup>
import { computed, inject } from 'vue';
import { session } from '@/stores/session';
import { can } from '@/lib/roles';
import { t } from '@/i18n';

// UI gate only. Data access is enforced by Firestore Security Rules.
const props = defineProps({ permission: { type: [String, Array], default: '' } });
const openLogin = inject('openLogin', null);
const allowed = computed(() => {
  const list = Array.isArray(props.permission) ? props.permission : [props.permission];
  return list.some((p) => can(session.role, p));
});
</script>

<style scoped>
.gate-loading { padding: 8px 0; }
</style>
