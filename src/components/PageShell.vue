<template>
  <div class="kp-page">
    <AppleNavbar
      :is-logged-in="Boolean(session.uid)"
      :user-name="session.name"
      :user-avatar="session.avatar"
      @open-register="showRegister = true"
      @open-profile="showProfile = true"
      @open-search="$router.push({ path: '/', hash: '#ai-search-section' })"
    />

    <main class="kp-main" id="main-content">
      <div class="kp-container">
        <slot :open-login="openLogin" />
      </div>
    </main>

    <div v-if="showRegister" class="apple-modal-overlay shell-overlay" @click="showRegister = false">
      <div class="shell-modal" @click.stop>
        <button class="shell-close" :aria-label="t('common.close')" @click="showRegister = false">✕</button>
        <Register @registered="showRegister = false" @loggedIn="showRegister = false" />
      </div>
    </div>

    <div v-if="showProfile" class="apple-modal-overlay shell-overlay" @click="showProfile = false">
      <div class="shell-modal" @click.stop>
        <Profile :email="session.email" :name="session.name" @back="showProfile = false" @loggedOut="showProfile = false" />
      </div>
    </div>

    <AppleFooter />
  </div>
</template>

<script setup>
import { ref, provide } from 'vue';
import AppleNavbar from '@/components/AppleNavbar.vue';
import AppleFooter from '@/components/AppleFooter.vue';
import Register from '@/components/Register.vue';
import Profile from '@/components/Profile.vue';
import { session } from '@/stores/session';
import { t } from '@/i18n';

const showRegister = ref(false);
const showProfile = ref(false);
const openLogin = () => {
  showRegister.value = true;
};
provide('openLogin', openLogin);
</script>

<style scoped>
.shell-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.shell-modal {
  position: relative;
  max-width: 100%;
}
.shell-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
}
</style>
