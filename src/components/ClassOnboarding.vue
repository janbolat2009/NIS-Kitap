<template>
  <div class="modal-backdrop">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="onb-title">
      <div class="book-anim" aria-hidden="true"><span class="cover" /><span class="page" /><span class="page p2" /></div>
      <div class="modal-head">
        <h2 id="onb-title">{{ t('onboarding.title') }}</h2>
      </div>
      <p class="lead">{{ t('onboarding.lead') }}</p>
      <form class="form" @submit.prevent="save">
        <ClassFields v-model="person" @loaded="(n) => (hasClasses = n > 0)" />
        <p class="hint">{{ t('onboarding.once') }}</p>
        <p v-if="error" class="error-text" role="alert">{{ error }}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="later">{{ t('onboarding.later') }}</button>
          <button type="submit" class="btn btn-primary" :disabled="busy || !hasClasses || !person.className || !person.firstName">
            <span v-if="busy" class="spinner" /><span v-else>{{ t('onboarding.save') }}</span>
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue';
import { t, currentLocale } from '@/i18n';
import { session, refreshMe } from '@/stores/session';
import { post, errorMessage } from '@/services/api';
import { toast } from '@/stores/ui';
import { splitDisplayName } from '@/lib/school';
import ClassFields from '@/components/ClassFields.vue';

const emit = defineEmits(['close']);
const fromName = splitDisplayName(session.name);
const person = reactive({
  firstName: session.profile?.firstName || fromName.firstName,
  lastName: session.profile?.lastName || fromName.lastName,
  className: '',
});
const busy = ref(false);
const error = ref('');
const hasClasses = ref(true);

onMounted(() => document.body.classList.add('modal-open'));
onBeforeUnmount(() => document.body.classList.remove('modal-open'));

function later() {
  try { sessionStorage.setItem('nis_kitap_class_later', '1'); } catch { /* ignore */ }
  emit('close');
}

async function save() {
  error.value = '';
  busy.value = true;
  try {
    const p = await post('me/class', { ...person });
    await refreshMe();
    toast(p.shanyrakName ? t('onboarding.result', { name: p.shanyrakName }) : t('onboarding.unmapped'));
    emit('close');
  } catch (err) {
    error.value = errorMessage(err, currentLocale.value);
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.lead { color: var(--text-2); font-size: var(--fs-sm); margin: -6px 0 16px; }
.form { display: flex; flex-direction: column; gap: 12px; }
.book-anim { position: relative; width: 56px; height: 44px; margin-bottom: 12px; perspective: 1200px; overflow: hidden; }
.book-anim span { position: absolute; top: 0; left: 28px; width: 26px; height: 40px; border-radius: 2px 5px 5px 2px; transform-origin: left center; }
.book-anim .cover { left: 2px; width: 26px; background: var(--brand); border-radius: 5px 2px 2px 5px; }
.book-anim .page { background: var(--surface-3); border: 1px solid var(--line-strong); animation: turn 2.6s var(--ease-in-out) infinite; }
.book-anim .p2 { animation-delay: 1.3s; background: var(--surface-2); }
@keyframes turn {
  0%, 15% { transform: rotateY(0deg); }
  55%, 100% { transform: rotateY(-180deg); opacity: 0.2; }
}
</style>
