<template>
  <div class="page container hb">
    <router-link to="/100-kitap" class="btn btn-ghost btn-sm back">← {{ t('hundred.backToList') }}</router-link>

    <div v-if="loading" class="layout" aria-hidden="true">
      <div class="skeleton cover-sk" />
      <div><div class="skeleton" style="height: 40px; width: 70%" /><div class="skeleton" style="height: 20px; width: 40%; margin-top: 12px" /></div>
    </div>

    <div v-else-if="!entry" class="empty">
      <h3>{{ t('hundred.notFound') }}</h3>
      <p>{{ t('hundred.notFoundLead') }}</p>
      <router-link to="/100-kitap" class="btn btn-primary">{{ t('hundred.backToList') }}</router-link>
    </div>

    <article v-else class="layout">
      <div class="stage">
        <HundredCover :entry="entry" size="hero" closing />
      </div>

      <div class="info">
        <p class="kicker">{{ t('hundred.numberOf', { n: entry.order }) }}</p>
        <h1 class="title">{{ entry.title }}</h1>
        <p class="author">{{ entry.author }}</p>
        <p class="chips">
          <span class="badge badge-info">{{ t('hundred.gradeN', { n: entry.grade }) }}</span>
          <span class="badge">{{ t(`hundred.sections.${entry.section}`) }}</span>
          <span v-if="entry.genre" class="badge">{{ entry.genre }}</span>
          <span class="badge" :class="badgeClass(state)">{{ t(`status.${state}`) }}</span>
        </p>

        <section class="block" aria-labelledby="hb-status">
          <h2 id="hb-status" class="h3">{{ t('hundred.yourStatus') }}</h2>
          <div class="seg4" role="radiogroup" :aria-label="t('hundred.yourStatus')" :style="{ '--i': optionIndex }">
            <span class="thumb" aria-hidden="true" />
            <button v-for="o in options" :key="o.key" type="button" role="radio" :aria-checked="current === o.key" :disabled="busy || locked" @click="choose(o.key)">{{ o.label }}</button>
          </div>
          <p class="hint">{{ t('hundred.statusHint') }}</p>
          <p v-if="progress?.decisionNote && ['rejected', 'revoked'].includes(state)" class="note">{{ t('hundred.rejectedNote', { note: progress.decisionNote }) }}</p>
          <div class="more">
            <button v-if="canRequest" type="button" class="btn btn-primary" :disabled="busy" @click="openVerify">{{ t('hundred.sendForReview') }}</button>
            <button v-if="state === 'pending'" type="button" class="btn btn-secondary" :disabled="busy" @click="withdraw">{{ t('hundred.withdraw') }}</button>
          </div>
        </section>

        <section class="block" aria-labelledby="hb-about">
          <h2 id="hb-about" class="h3">{{ t('hundred.about') }}</h2>
          <p class="desc">{{ description || t('hundred.aboutEmpty') }}</p>
        </section>

        <section class="block" aria-labelledby="hb-fund">
          <h2 id="hb-fund" class="h3">{{ t('book.fund') }}</h2>
          <p class="avail" :class="availClass">{{ availText }}</p>
          <div class="more">
            <router-link v-if="canReserve" :to="{ path: `/book/${encodeURIComponent(entry.catalogTitle)}`, hash: '#reserve' }" class="btn btn-secondary">{{ t('loan.reserve') }}</router-link>
            <router-link v-if="entry.catalogTitle" :to="`/book/${encodeURIComponent(entry.catalogTitle)}`" class="btn btn-ghost">{{ t('hundred.catalogPage') }}</router-link>
          </div>
        </section>
      </div>
    </article>

    <div v-if="verifyOpen" class="modal-backdrop" @click.self="verifyOpen = false">
      <form class="modal" role="dialog" aria-modal="true" aria-labelledby="verify-title" @submit.prevent="sendVerify">
        <div class="modal-head">
          <div>
            <h2 id="verify-title">{{ t('hundred.verify.title') }}</h2>
            <p class="muted">{{ entry.title }} — {{ entry.author }}</p>
          </div>
          <button type="button" class="btn btn-ghost btn-icon btn-sm" :aria-label="t('common.close')" @click="verifyOpen = false">✕</button>
        </div>
        <p class="lead">{{ t('hundred.verify.lead') }}</p>
        <div class="field">
          <label class="label" for="v-review">{{ t('hundred.verify.review') }}</label>
          <textarea id="v-review" v-model="vForm.review" class="textarea" maxlength="2000" :placeholder="t('hundred.verify.reviewHint')" />
        </div>
        <label class="check"><input v-model="vForm.publish" type="checkbox" /> {{ t('hundred.verify.publish') }}</label>
        <div v-if="vForm.publish" class="field">
          <span class="label">{{ t('hundred.verify.rating') }}</span>
          <div class="stars" role="radiogroup" :aria-label="t('hundred.verify.rating')">
            <button v-for="n in 5" :key="n" type="button" role="radio" :aria-checked="vForm.rating === n" :class="{ on: n <= vForm.rating }" @click="vForm.rating = n">★</button>
          </div>
          <p class="hint">{{ t('book.reviewRules') }}</p>
        </div>
        <p v-if="vError" class="error-text" role="alert">{{ vError }}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="verifyOpen = false">{{ t('common.cancel') }}</button>
          <button type="submit" class="btn btn-primary" :disabled="busy">{{ t('hundred.verify.submit') }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import HundredCover from '@/components/HundredCover.vue';
import { t, currentLocale } from '@/i18n';
import { session } from '@/stores/session';
import { openLogin, toast } from '@/stores/ui';
import { displayStatus } from '@/lib/workflow';
import { errorMessage } from '@/services/api';
import { getBookByTitle } from '@/services/bookService';
import {
  loadHundredBooks, trackId, watchMyProgress, getAvailabilityMany, setReadingStatus, requestVerification, withdrawVerification,
} from '@/services/library';

const route = useRoute();
const entry = ref(null);
const loading = ref(true);
const progress = ref(null);
const availability = ref(null);
const description = ref('');
const busy = ref(false);
// What the switch shows right after a tap, before the server confirms it.
const optimistic = ref('');
const verifyOpen = ref(false);
const vForm = reactive({ review: '', publish: false, rating: 5 });
const vError = ref('');
let unwatch = () => {};

const options = computed(() => [
  { key: 'none', label: t('hundred.noneShort') },
  { key: 'want', label: t('status.want') },
  { key: 'reading', label: t('status.reading') },
  { key: 'finished', label: t('status.finished') },
]);
const stored = computed(() => {
  const s = progress.value?.status;
  return ['want', 'reading', 'finished'].includes(s) ? s : 'none';
});
const current = computed(() => optimistic.value || stored.value);
const optionIndex = computed(() => Math.max(0, options.value.findIndex((o) => o.key === current.value)));
const state = computed(() => displayStatus(progress.value));
const locked = computed(() => ['pending', 'confirmed'].includes(progress.value?.verificationStatus));
const canRequest = computed(() => progress.value?.status === 'finished' && ['none', 'rejected', 'revoked', undefined].includes(progress.value?.verificationStatus));

const avail = computed(() => {
  const e = entry.value;
  if (!e) return { kind: 'unknown' };
  if (!e.catalogBookId) return { kind: 'not_in_catalog' };
  const a = availability.value;
  if (a) return { kind: a.available > 0 ? 'available' : 'all_taken', ...a };
  const copies = Number(e.catalogCopies) || 0;
  return copies ? { kind: 'available', total: copies, available: copies } : { kind: 'unknown' };
});
const availText = computed(() => {
  const a = avail.value;
  if (a.kind === 'not_in_catalog') return t('loan.notInCatalog');
  if (a.kind === 'unknown') return t('loan.unknown');
  if (a.kind === 'all_taken') return t('loan.none');
  return t('loan.freeOf', { n: a.available, total: a.total });
});
const availClass = computed(() => ({ ok: avail.value.kind === 'available', off: avail.value.kind !== 'available' }));
const canReserve = computed(() => avail.value.kind === 'available' && entry.value?.catalogTitle);

function badgeClass(s) {
  return {
    'badge-success': s === 'confirmed',
    'badge-warning': s === 'pending',
    'badge-info': s === 'reading',
    'badge-warm': s === 'want',
    'badge-danger': s === 'rejected' || s === 'revoked',
  };
}

function requireSignIn() {
  if (!session.uid) {
    openLogin('login');
    return false;
  }
  return true;
}

async function choose(key) {
  if (!requireSignIn() || key === current.value) return;
  busy.value = true;
  optimistic.value = key;
  try {
    await setReadingStatus(trackId(entry.value), key, entry.value.id);
  } catch (err) {
    optimistic.value = '';
    toast(errorMessage(err, currentLocale.value), { type: 'error' });
  } finally {
    busy.value = false;
  }
}

function openVerify() {
  if (!requireSignIn()) return;
  Object.assign(vForm, { review: '', publish: false, rating: 5 });
  vError.value = '';
  verifyOpen.value = true;
}

async function sendVerify() {
  busy.value = true;
  vError.value = '';
  try {
    const res = await requestVerification(trackId(entry.value), { review: vForm.review, publishReview: vForm.publish, rating: vForm.publish ? vForm.rating : null }, entry.value.id);
    verifyOpen.value = false;
    toast(t('hundred.verify.sent'));
    if (vForm.publish && res?.reviewResult && !res.reviewResult.ok) toast(t('book.reviewRules'), { type: 'error', timeout: 6000 });
  } catch (err) {
    vError.value = errorMessage(err, currentLocale.value);
  } finally {
    busy.value = false;
  }
}

async function withdraw() {
  busy.value = true;
  try {
    await withdrawVerification(trackId(entry.value), entry.value.id);
  } catch (err) {
    toast(errorMessage(err, currentLocale.value), { type: 'error' });
  } finally {
    busy.value = false;
  }
}

async function load() {
  loading.value = true;
  try {
    const data = await loadHundredBooks();
    entry.value = data.books.find((b) => b.id === route.params.id && b.isActive !== false) || null;
    if (entry.value) {
      document.title = `${entry.value.title} — NIS Kitap`;
      if (entry.value.catalogBookId) getAvailabilityMany([entry.value.catalogBookId]).then((m) => { availability.value = m.get(entry.value.catalogBookId) || null; }).catch(() => {});
      if (entry.value.catalogTitle) getBookByTitle(entry.value.catalogTitle).then((b) => { description.value = b?.description || ''; }).catch(() => {});
    }
  } catch {
    entry.value = null;
  } finally {
    loading.value = false;
  }
}

watch(() => session.uid, () => {
  unwatch();
  unwatch = watchMyProgress((map) => {
    progress.value = entry.value ? map.get(trackId(entry.value)) || null : null;
    optimistic.value = '';
  });
}, { immediate: true });
watch(entry, (e) => {
  if (e) {
    unwatch();
    unwatch = watchMyProgress((map) => { progress.value = map.get(trackId(e)) || null; optimistic.value = ''; });
  }
});
watch(verifyOpen, (v) => document.body.classList.toggle('modal-open', v));
onMounted(load);
onBeforeUnmount(() => { unwatch(); document.body.classList.remove('modal-open'); });
</script>

<style scoped>
.hb { overflow-x: clip; }
.back { margin-bottom: 18px; }
.layout { display: grid; grid-template-columns: minmax(240px, 380px) 1fr; gap: clamp(28px, 6vw, 72px); align-items: start; }
.stage { position: sticky; top: calc(var(--nav-h) + 24px); padding: 16px 28px 28px 16px; }
.cover-sk { aspect-ratio: 2 / 3; border-radius: 10px; }
.kicker { font-size: var(--fs-xs); font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent-text); }
.title { font-size: var(--fs-3xl); margin-top: 6px; overflow-wrap: anywhere; text-wrap: balance; }
.author { margin-top: 6px; font-size: var(--fs-lg); color: var(--text-2); }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
.block { margin-top: 28px; padding-top: 22px; border-top: 1px solid var(--line); }
.block .h3 { margin-bottom: 12px; }
.desc { max-width: 66ch; color: var(--text-2); line-height: 1.65; white-space: pre-line; overflow-wrap: anywhere; }
.hint { margin-top: 10px; font-size: var(--fs-sm); color: var(--text-3); }
.note { margin-top: 10px; font-size: var(--fs-sm); color: var(--danger); background: var(--danger-soft); padding: 8px 10px; border-radius: var(--r-sm); }
.more { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.more:empty { display: none; }
.avail { font-weight: 600; }
.avail.ok { color: var(--success); }
.avail.off { color: var(--text-3); }

/* Four-way switch with a thumb that slides to the chosen state. */
.seg4 {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  max-width: 520px;
  padding: 4px;
  border-radius: var(--r-pill);
  background: var(--surface-3);
  box-shadow: inset 0 1px 2px color-mix(in srgb, var(--text-1) 12%, transparent);
  isolation: isolate;
}
.thumb {
  position: absolute;
  inset: 4px auto 4px 4px;
  width: calc((100% - 8px) / 4);
  border-radius: var(--r-pill);
  background: var(--surface);
  box-shadow: 0 1px 3px color-mix(in srgb, var(--text-1) 28%, transparent), 0 0 0 0.5px color-mix(in srgb, var(--text-1) 10%, transparent);
  transform: translateX(calc(var(--i) * 100%));
  transition: transform 460ms cubic-bezier(0.3, 1.3, 0.5, 1);
  z-index: -1;
}
.seg4 button {
  min-height: 44px;
  padding: 0 6px;
  border: none;
  border-radius: var(--r-pill);
  background: none;
  color: var(--text-2);
  font-size: var(--fs-sm);
  font-weight: 650;
  cursor: pointer;
  transition: color 260ms ease;
  -webkit-tap-highlight-color: transparent;
}
.seg4 button[aria-checked='true'] { color: var(--accent-text); }
.seg4 button:disabled { cursor: not-allowed; opacity: 0.6; }

.lead { color: var(--text-2); font-size: var(--fs-sm); margin: -6px 0 14px; }
.modal .field { margin-bottom: 12px; }
.modal .check { margin-bottom: 12px; }
.stars { display: flex; gap: 4px; }
.stars button { width: 40px; height: 40px; border: none; background: none; font-size: 26px; color: var(--line-strong); cursor: pointer; }
.stars button.on { color: var(--warm); }

@media (prefers-reduced-motion: no-preference) {
  .info > * { animation: rise var(--dur-3) var(--ease-out) both; }
  .info > *:nth-child(2) { animation-delay: 60ms; }
  .info > *:nth-child(3) { animation-delay: 100ms; }
  .info > *:nth-child(4) { animation-delay: 140ms; }
  .info > *:nth-child(n + 5) { animation-delay: 190ms; }
}
@media (prefers-reduced-motion: reduce) { .thumb { transition-duration: 1ms; } }
@media (max-width: 760px) {
  .layout { grid-template-columns: 1fr; gap: 12px; }
  .stage { position: static; width: min(72%, 280px); margin-inline: auto; }
  .seg4 { max-width: none; }
  .seg4 button { font-size: 12.5px; padding: 0 2px; }
}
</style>
