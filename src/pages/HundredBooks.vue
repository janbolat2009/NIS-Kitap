<template>
  <div class="page container hundred">
    <header class="page-head">
      <div>
        <span class="eyebrow">NIS · {{ t('nav.hundred') }}</span>
        <h1 class="page-title">{{ t('hundred.title') }}</h1>
        <p class="page-lead">{{ t('hundred.lead') }}</p>
        <p class="source">{{ t('hundred.source') }}</p>
      </div>
      <div v-if="session.uid" class="progress" :style="{ '--p': `${confirmed}%` }">
        <div class="ring" role="img" :aria-label="t('hundred.progress', { n: confirmed })"><span class="tabular">{{ confirmed }}</span></div>
        <div>
          <strong>{{ t('hundred.progress', { n: confirmed }) }}</strong>
          <span class="muted">{{ t('hundred.pendingCount', { n: pending }) }} · {{ t('hundred.pointsNote') }}</span>
        </div>
      </div>
      <p v-else class="notice notice-info signin">
        <span>{{ t('hundred.signInHint') }}</span>
        <button type="button" class="btn btn-sm btn-primary" @click="openLogin()">{{ t('nav.signIn') }}</button>
      </p>
    </header>

    <section class="filters" :aria-label="t('hundred.filters')">
      <div class="list-search" role="search">
        <label class="label" for="hundred-search">{{ t('catalog.searchLabel') }}</label>
        <div class="search-controls">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
          <input id="hundred-search" ref="searchInput" v-model="query" type="search" class="input" :placeholder="t('hundred.searchPlaceholder')" />
          <button v-if="query" type="button" class="btn btn-ghost clear-query" :aria-label="t('catalog.clearQuery')" @click="clearQuery">✕</button>
        </div>
      </div>
      <label class="f">
        <span class="label">{{ t('hundred.grade') }}</span>
        <select v-model="f.grade" class="select"><option value="">{{ t('hundred.all') }}</option><option v-for="g in grades" :key="g" :value="String(g)">{{ t('hundred.gradeN', { n: g }) }}</option></select>
      </label>
      <label class="f">
        <span class="label">{{ t('hundred.section') }}</span>
        <select v-model="f.section" class="select"><option value="">{{ t('hundred.all') }}</option><option v-for="s in ['kazakh', 'russian', 'foreign']" :key="s" :value="s">{{ t(`hundred.sections.${s}`) }}</option></select>
      </label>
      <label class="f">
        <span class="label">{{ t('hundred.status') }}</span>
        <select v-model="f.status" class="select" :disabled="!session.uid">
          <option value="">{{ t('hundred.all') }}</option>
          <option v-for="s in ['not_started', 'want', 'reading', 'finished', 'pending', 'confirmed']" :key="s" :value="s">{{ t(`status.${s}`) }}</option>
        </select>
      </label>
      <label class="f">
        <span class="label">{{ t('hundred.availability') }}</span>
        <select v-model="f.avail" class="select"><option value="">{{ t('hundred.all') }}</option><option v-for="a in ['available', 'all_taken', 'not_in_catalog']" :key="a" :value="a">{{ t(`hundred.avail.${a}`) }}</option></select>
      </label>
      <div class="f-foot">
        <span v-if="!loading && !loadError" class="muted" role="status">{{ t('hundred.found', { n: filtered.length }) }}</span>
        <button v-if="activeFilters" type="button" class="btn btn-ghost btn-sm" @click="resetFilters">{{ t('hundred.reset') }}</button>
      </div>
    </section>

    <div v-if="loading" class="list">
      <div v-for="n in 6" :key="n" class="skeleton" style="height: 150px; border-radius: 16px" />
    </div>
    <p v-else-if="loadError" class="notice notice-danger">{{ loadError }} <button type="button" class="btn btn-sm btn-secondary" @click="load">{{ t('common.retry') }}</button></p>
    <div v-else-if="!filtered.length" class="empty">
      <h3>{{ t('hundred.empty') }}</h3>
      <p v-if="searchTerms.length" class="muted">{{ t('catalog.emptyQuery') }}</p>
      <div class="empty-actions">
        <button v-if="searchTerms.length" type="button" class="btn btn-primary" @click="clearQuery">{{ t('catalog.clearQuery') }}</button>
        <button v-if="activeFilters" type="button" class="btn btn-secondary" @click="resetFilters">{{ t('hundred.reset') }}</button>
      </div>
    </div>

    <ol v-else class="list">
      <li v-for="e in filtered" :key="e.id" class="item" :class="{ turned: turned === e.id }">
        <div class="num tabular" aria-hidden="true">{{ e.order }}</div>
        <div class="body">
          <div class="top">
            <div class="title-block">
              <h2 class="title">
                <router-link v-if="e.catalogTitle" :to="`/book/${encodeURIComponent(e.catalogTitle)}`">{{ e.title }}</router-link>
                <template v-else>{{ e.title }}</template>
              </h2>
              <p class="meta">{{ e.author }} · {{ t('hundred.gradeN', { n: e.grade }) }} · {{ t(`hundred.sections.${e.section}`) }}</p>
            </div>
            <span class="badge status" :class="badgeClass(stateOf(e))">{{ t(`status.${stateOf(e)}`) }}</span>
          </div>

          <p class="avail" :class="availClass(e)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Zm0 0A2 2 0 0 0 6 21h13" /></svg>
            {{ availText(e) }}
          </p>
          <p v-if="progressOf(e)?.decisionNote && ['rejected', 'revoked'].includes(stateOf(e))" class="note">{{ t('hundred.rejectedNote', { note: progressOf(e).decisionNote }) }}</p>

          <div class="actions">
            <div class="seg" role="group" :aria-label="t('hundred.status')">
              <button v-for="s in ['want', 'reading', 'finished']" :key="s" type="button" :aria-pressed="progressOf(e)?.status === s"
                :disabled="busy === e.id || locked(e)" :aria-label="t(`status.${s}`)" @click="setStatus(e, s)">{{ short[s] }}</button>
            </div>
            <div class="more">
              <button v-if="canRequest(e)" type="button" class="btn btn-primary btn-sm" :disabled="busy === e.id" @click="openVerify(e)">{{ t('hundred.sendForReview') }}</button>
              <button v-if="stateOf(e) === 'pending'" type="button" class="btn btn-secondary btn-sm" :disabled="busy === e.id" @click="withdraw(e)">{{ t('hundred.withdraw') }}</button>
              <router-link v-if="canReserve(e)" :to="{ path: `/book/${encodeURIComponent(e.catalogTitle)}`, hash: '#reserve' }" class="btn btn-secondary btn-sm">{{ t('loan.reserve') }}</router-link>
            </div>
          </div>
        </div>
      </li>
    </ol>

    <div v-if="verifyFor" class="modal-backdrop" @click.self="verifyFor = null">
      <form class="modal" role="dialog" aria-modal="true" aria-labelledby="verify-title" @submit.prevent="sendVerify">
        <div class="modal-head">
          <div>
            <h2 id="verify-title">{{ t('hundred.verify.title') }}</h2>
            <p class="muted">{{ verifyFor.title }} — {{ verifyFor.author }}</p>
          </div>
          <button type="button" class="btn btn-ghost btn-icon btn-sm" :aria-label="t('common.close')" @click="verifyFor = null">✕</button>
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
          <button type="button" class="btn btn-ghost" @click="verifyFor = null">{{ t('common.cancel') }}</button>
          <button type="submit" class="btn btn-primary" :disabled="Boolean(busy)">{{ t('hundred.verify.submit') }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { t, currentLocale } from '@/i18n';
import { session } from '@/stores/session';
import { openLogin, toast } from '@/stores/ui';
import { displayStatus } from '@/lib/workflow';
import { normalizeBookSearch } from '@/lib/bookSearch';
import { errorMessage } from '@/services/api';
import {
  loadHundredBooks, trackId, watchMyProgress, getAvailabilityMany, setReadingStatus, requestVerification, withdrawVerification,
} from '@/services/library';

const entries = ref([]);
const progress = ref(new Map());
const avail = ref(new Map());
const loading = ref(true);
const loadError = ref('');
const busy = ref('');
const turned = ref('');
const f = reactive({ grade: '', section: '', status: '', avail: '' });
const query = ref('');
const searchInput = ref(null);
const searchTerms = computed(() => normalizeBookSearch(query.value).trim().split(/\s+/).filter(Boolean));
const verifyFor = ref(null);
const vForm = reactive({ review: '', publish: false, rating: 5 });
const vError = ref('');
let unwatch = () => {};

const SHORT = {
  ru: { want: 'Хочу', reading: 'Читаю', finished: 'Прочитано' },
  kz: { want: 'Оқимын', reading: 'Оқып жүрмін', finished: 'Оқыдым' },
  en: { want: 'Want', reading: 'Reading', finished: 'Finished' },
};
const short = computed(() => SHORT[currentLocale.value] || SHORT.ru);
const grades = computed(() => [...new Set(entries.value.map((e) => e.grade))].sort((a, b) => a - b));

const progressOf = (e) => progress.value.get(trackId(e)) || null;
const stateOf = (e) => displayStatus(progressOf(e));
const locked = (e) => ['pending', 'confirmed'].includes(progressOf(e)?.verificationStatus);
const canRequest = (e) => progressOf(e)?.status === 'finished' && ['none', 'rejected', 'revoked', undefined].includes(progressOf(e)?.verificationStatus);

function availOf(e) {
  if (!e.catalogBookId) return { kind: 'not_in_catalog' };
  const a = avail.value.get(e.catalogBookId);
  if (a) return { kind: a.available > 0 ? 'available' : 'all_taken', ...a };
  const copies = Number(e.catalogCopies) || 0;
  if (!copies) return { kind: 'unknown' };
  return { kind: 'available', total: copies, available: copies };
}
const canReserve = (e) => availOf(e).kind === 'available' && e.catalogTitle;
function availText(e) {
  const a = availOf(e);
  if (a.kind === 'not_in_catalog') return t('loan.notInCatalog');
  if (a.kind === 'unknown') return t('loan.unknown');
  if (a.kind === 'all_taken') return t('loan.none');
  return t('loan.freeOf', { n: a.available, total: a.total });
}
const availClass = (e) => ({ ok: availOf(e).kind === 'available', off: availOf(e).kind !== 'available' });
function badgeClass(state) {
  return {
    'badge-success': state === 'confirmed',
    'badge-warning': state === 'pending',
    'badge-info': state === 'reading',
    'badge-warm': state === 'want',
    'badge-danger': state === 'rejected' || state === 'revoked',
  };
}

const filtered = computed(() => entries.value.filter((e) => {
  if (f.grade && String(e.grade) !== f.grade) return false;
  if (f.section && e.section !== f.section) return false;
  if (f.status && stateOf(e) !== f.status) return false;
  if (f.avail) {
    const k = availOf(e).kind === 'unknown' ? 'not_in_catalog' : availOf(e).kind;
    if (k !== f.avail) return false;
  }
  if (searchTerms.value.length) {
    const text = normalizeBookSearch([e.title, e.titleAlt, e.author, e.catalogTitle].join(' '));
    return searchTerms.value.every((term) => text.includes(term));
  }
  return true;
}));
const activeFilters = computed(() => Boolean(f.grade || f.section || f.status || f.avail));
const confirmed = computed(() => entries.value.filter((e) => stateOf(e) === 'confirmed').length);
const pending = computed(() => entries.value.filter((e) => stateOf(e) === 'pending').length);

function resetFilters() {
  Object.assign(f, { grade: '', section: '', status: '', avail: '' });
}

function clearQuery() {
  query.value = '';
  searchInput.value?.focus();
}

function requireSignIn() {
  if (!session.uid) {
    openLogin('login');
    return false;
  }
  return true;
}

function flip(id) {
  turned.value = id;
  setTimeout(() => { if (turned.value === id) turned.value = ''; }, 650);
}

async function setStatus(e, status) {
  if (!requireSignIn()) return;
  const current = progressOf(e)?.status;
  busy.value = e.id;
  try {
    await setReadingStatus(trackId(e), current === status ? 'none' : status, e.id);
    flip(e.id);
  } catch (err) {
    toast(errorMessage(err, currentLocale.value), { type: 'error' });
  } finally {
    busy.value = '';
  }
}

function openVerify(e) {
  if (!requireSignIn()) return;
  Object.assign(vForm, { review: '', publish: false, rating: 5 });
  vError.value = '';
  verifyFor.value = e;
}

async function sendVerify() {
  const e = verifyFor.value;
  busy.value = e.id;
  vError.value = '';
  try {
    const res = await requestVerification(trackId(e), { review: vForm.review, publishReview: vForm.publish, rating: vForm.publish ? vForm.rating : null }, e.id);
    verifyFor.value = null;
    flip(e.id);
    toast(t('hundred.verify.sent'));
    if (vForm.publish && res?.reviewResult && !res.reviewResult.ok) toast(t('book.reviewRules'), { type: 'error', timeout: 6000 });
  } catch (err) {
    vError.value = errorMessage(err, currentLocale.value);
  } finally {
    busy.value = '';
  }
}

async function withdraw(e) {
  busy.value = e.id;
  try {
    await withdrawVerification(trackId(e), e.id);
  } catch (err) {
    toast(errorMessage(err, currentLocale.value), { type: 'error' });
  } finally {
    busy.value = '';
  }
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const data = await loadHundredBooks();
    entries.value = data.books.filter((b) => b.isActive !== false);
    avail.value = await getAvailabilityMany(entries.value.map((e) => e.catalogBookId));
  } catch {
    loadError.value = t('common.errorDesc');
  } finally {
    loading.value = false;
  }
}

watch(() => session.uid, () => {
  unwatch();
  unwatch = watchMyProgress((map) => { progress.value = map; });
}, { immediate: true });
watch(verifyFor, (v) => document.body.classList.toggle('modal-open', Boolean(v)));
onMounted(load);
onBeforeUnmount(() => { unwatch(); document.body.classList.remove('modal-open'); });
</script>

<style scoped>
.source { margin-top: 10px; font-size: var(--fs-xs); color: var(--text-3); max-width: 680px; }
.progress { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface); max-width: 420px; }
.progress strong { display: block; }
.progress .muted { font-size: var(--fs-xs); }
.ring { --size: 64px; flex: none; width: var(--size); height: var(--size); border-radius: 50%; display: grid; place-items: center; background: conic-gradient(var(--success) var(--p), var(--surface-3) 0); transition: background var(--dur-3) ease; }
.ring span { width: calc(var(--size) - 12px); height: calc(var(--size) - 12px); border-radius: 50%; background: var(--surface); display: grid; place-items: center; font-weight: 700; }
.signin { align-items: center; justify-content: space-between; flex-wrap: wrap; max-width: 520px; }

.filters { display: grid; grid-template-columns: repeat(4, 1fr) auto; gap: 10px; align-items: end; margin-bottom: 20px; }
.list-search { display: grid; grid-column: 1 / -1; gap: 6px; margin-bottom: 4px; }
.search-controls { position: relative; }
.search-controls .input { min-height: 50px; padding-inline: 42px 52px; font-weight: 550; }
.search-controls .input::-webkit-search-cancel-button { appearance: none; }
.search-icon { position: absolute; inset: 50% auto auto 14px; translate: 0 -50%; color: var(--accent-text); pointer-events: none; }
.clear-query { position: absolute; inset: 3px 4px 3px auto; min-width: 44px; padding: 0; }
.empty-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.f { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.f .select { font-weight: 550; }
.f-foot { display: flex; align-items: center; gap: 8px; min-height: 44px; white-space: nowrap; }

.list { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 12px; }
.item { display: flex; gap: 14px; padding: 16px; border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface); transition: border-color var(--dur-1) ease; }
.item:hover { border-color: var(--line-strong); }
.num { flex: none; width: 34px; font-family: var(--font-heading); font-size: 1.15rem; color: var(--text-3); padding-top: 1px; }
.body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.top { display: flex; gap: 10px; justify-content: space-between; align-items: flex-start; }
.title-block { min-width: 0; }
.title { font-family: var(--font-heading); font-size: 1.08rem; font-weight: 600; line-height: 1.3; overflow-wrap: anywhere; }
.title a { color: inherit; text-decoration: none; }
.title a:hover { text-decoration: underline; }
.meta { font-size: var(--fs-sm); color: var(--text-3); margin-top: 2px; }
.status { flex: none; }
.turned .status { animation: page-turn 0.6s var(--ease-out); transform-origin: left center; }
.avail { display: flex; align-items: center; gap: 6px; font-size: var(--fs-sm); font-weight: 550; }
.avail.ok { color: var(--success); }
.avail.off { color: var(--text-3); }
.note { font-size: var(--fs-sm); color: var(--danger); background: var(--danger-soft); padding: 8px 10px; border-radius: var(--r-sm); }

.actions { display: flex; flex-direction: column; gap: 8px; }
.seg { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid var(--line-strong); border-radius: var(--r-md); overflow: hidden; }
.seg button { min-height: 40px; border: none; background: var(--surface); color: var(--text-2); font-size: var(--fs-sm); font-weight: 600; cursor: pointer; padding: 0 4px; transition: background-color var(--dur-1) ease, color var(--dur-1) ease; }
.seg button + button { border-left: 1px solid var(--line-strong); }
.seg button[aria-pressed='true'] { background: var(--text-1); color: var(--bg); }
.seg button:disabled { opacity: 0.5; cursor: not-allowed; }
.more { display: flex; gap: 8px; flex-wrap: wrap; }
.more:empty { display: none; }

.lead { color: var(--text-2); font-size: var(--fs-sm); margin: -6px 0 14px; }
.modal .field { margin-bottom: 12px; }
.modal .check { margin-bottom: 12px; }
.stars { display: flex; gap: 4px; }
.stars button { width: 40px; height: 40px; border: none; background: none; font-size: 26px; color: var(--line-strong); cursor: pointer; }
.stars button.on { color: var(--warm); }

@media (max-width: 900px) { .filters { grid-template-columns: 1fr 1fr; } .f-foot { grid-column: 1 / -1; justify-content: space-between; } }
@media (max-width: 430px) {
  .list { grid-template-columns: 1fr; }
  .item { padding: 14px 12px; gap: 10px; }
  .num { width: 24px; font-size: 1rem; }
  .top { flex-direction: column; gap: 6px; }
  .more .btn { flex: 1; }
  .progress { max-width: none; width: 100%; }
}
@media (max-width: 340px) {
  .filters { grid-template-columns: 1fr; }
  .seg button { font-size: 13px; }
}
</style>
