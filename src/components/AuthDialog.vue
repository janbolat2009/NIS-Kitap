<template>
  <div class="modal-backdrop" @click.self="close">
    <section class="modal auth" role="dialog" aria-modal="true" :aria-labelledby="`auth-title`">
      <div class="modal-head">
        <h2 id="auth-title">{{ mode === 'login' ? t('authx.login') : t('authx.register') }}</h2>
        <button type="button" class="btn btn-ghost btn-icon btn-sm" :aria-label="t('common.close')" @click="close">✕</button>
      </div>

      <p v-if="info" class="notice notice-success" role="status">{{ info }}</p>

      <button type="button" class="btn btn-secondary btn-block google" :disabled="busy" @click="google">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 38.6 44 33 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
        {{ t('authx.google') }}
      </button>
      <div class="or"><span>{{ t('authx.or') }}</span></div>

      <form class="form" novalidate @submit.prevent="submit">
        <div class="field">
          <label class="label" for="auth-email">{{ t('authx.email') }}</label>
          <input id="auth-email" v-model.trim="email" class="input" type="email" autocomplete="email" required />
        </div>
        <div class="field">
          <label class="label" for="auth-pass">{{ t('authx.password') }}</label>
          <input id="auth-pass" v-model="password" class="input" type="password" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" required />
        </div>
        <template v-if="mode === 'register'">
          <div class="field">
            <label class="label" for="auth-pass2">{{ t('authx.password2') }}</label>
            <input id="auth-pass2" v-model="password2" class="input" type="password" autocomplete="new-password" required />
          </div>
          <ClassFields v-model="person" />
        </template>
        <p v-if="error" class="error-text" role="alert">{{ error }}</p>
        <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="busy">
          <span v-if="busy" class="spinner" />
          <span v-else>{{ mode === 'login' ? t('authx.submitLogin') : t('authx.submitRegister') }}</span>
        </button>
      </form>

      <div class="switch">
        <button type="button" class="link" @click="toggle">{{ mode === 'login' ? t('authx.toRegister') : t('authx.toLogin') }}</button>
        <button v-if="mode === 'login'" type="button" class="link" @click="reset">{{ t('authx.forgot') }}</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, updateProfile,
  sendEmailVerification, sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '@/firebase';
import { t } from '@/i18n';
import { ui, closeAuth, toast } from '@/stores/ui';
import { refreshMe } from '@/stores/session';
import { post } from '@/services/api';
import ClassFields from '@/components/ClassFields.vue';

const mode = ref(ui.authMode);
const email = ref('');
const password = ref('');
const password2 = ref('');
const person = reactive({ firstName: '', lastName: '', className: '' });
const busy = ref(false);
const error = ref('');
const info = ref('');

function close() { closeAuth(); }
function toggle() { mode.value = mode.value === 'login' ? 'register' : 'login'; error.value = ''; info.value = ''; }

function onKey(e) { if (e.key === 'Escape') close(); }
onMounted(() => { document.body.classList.add('modal-open'); window.addEventListener('keydown', onKey); });
onBeforeUnmount(() => { document.body.classList.remove('modal-open'); window.removeEventListener('keydown', onKey); });

async function google() {
  error.value = '';
  busy.value = true;
  try {
    await signInWithPopup(auth, googleProvider);
    close();
  } catch (err) {
    if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(err.code)) {
      await signInWithRedirect(auth, googleProvider);
      return;
    }
    if (!['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(err.code)) error.value = t('authx.googleError');
  } finally {
    busy.value = false;
  }
}

async function submit() {
  error.value = '';
  if (!email.value || !password.value) return;
  busy.value = true;
  try {
    if (mode.value === 'login') {
      const cred = await signInWithEmailAndPassword(auth, email.value, password.value);
      if (!cred.user.emailVerified) {
        try { await sendEmailVerification(cred.user); } catch { /* sent recently */ }
      }
      close();
      return;
    }
    if (password.value.length < 8) { error.value = t('authx.weak'); return; }
    if (password.value !== password2.value) { error.value = t('authx.mismatch'); return; }
    if (!person.firstName) { error.value = `${t('onboarding.firstName')}?`; return; }
    const cred = await createUserWithEmailAndPassword(auth, email.value, password.value);
    await updateProfile(cred.user, { displayName: [person.firstName, person.lastName].filter(Boolean).join(' ') });
    try { await sendEmailVerification(cred.user); } catch { /* optional */ }
    if (person.className) {
      // The server checks the class against the school list and sets the shanyrak itself.
      try {
        await post('me/class', { className: person.className, firstName: person.firstName, lastName: person.lastName });
      } catch {
        toast(t('authx.classLater'));
      }
    }
    await refreshMe();
    toast(t('authx.verifySent'), { timeout: 6000 });
    close();
  } catch (err) {
    error.value = err.code === 'auth/email-already-in-use' ? t('authx.inUse') : t('authx.loginError');
  } finally {
    busy.value = false;
  }
}

async function reset() {
  error.value = '';
  if (!email.value) { error.value = t('authx.email'); return; }
  try {
    await sendPasswordResetEmail(auth, email.value);
  } catch {
    // Same answer whether or not the address exists.
  }
  info.value = t('authx.resetSent');
}
</script>

<style scoped>
.auth { max-width: 460px; }
.google { gap: 10px; }
.or { display: flex; align-items: center; gap: 12px; margin: 16px 0; color: var(--text-3); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.08em; }
.or::before, .or::after { content: ''; flex: 1; height: 1px; background: var(--line); }
.form { display: flex; flex-direction: column; gap: 14px; }
.form .btn-lg { margin-top: 4px; }
.switch { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
.link { background: none; border: none; padding: 4px 0; color: var(--accent-text); font-weight: 600; font-size: var(--fs-sm); cursor: pointer; }
.link:hover { text-decoration: underline; }
.notice { margin-bottom: 14px; }
</style>
