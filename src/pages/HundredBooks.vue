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

    <div v-if="loading" class="shelf" aria-hidden="true">
      <div v-for="n in 6" :key="n" class="skeleton cover-sk" />
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

    <ol v-else class="shelf" :class="{ 'has-opening': openingId }">
      <li v-for="e in filtered" :key="e.id" class="item" :class="{ 'is-opening': openingId === e.id }">
        <a class="bk hc-host" :href="hrefOf(e)" :aria-label="t('hundred.openCover', { title: e.title })" @click="openBook($event, e)">
          <HundredCover :entry="e" :opening="openingId === e.id" :open-x="openFit.x" :open-scale="openFit.s" />
          <span class="under">
            <span class="badge status" :class="badgeClass(stateOf(e))">{{ t(`status.${stateOf(e)}`) }}</span>
            <span class="avail" :class="availClass(e)">{{ availText(e) }}</span>
          </span>
        </a>
      </li>
    </ol>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import HundredCover from '@/components/HundredCover.vue';
import { fitOpenBookFor } from '@/lib/bookFit';
import { t } from '@/i18n';
import { session } from '@/stores/session';
import { openLogin } from '@/stores/ui';
import { displayStatus } from '@/lib/workflow';
import { normalizeBookSearch } from '@/lib/bookSearch';
import { loadHundredBooks, trackId, watchMyProgress, getAvailabilityMany } from '@/services/library';

const router = useRouter();
const entries = ref([]);
const progress = ref(new Map());
const avail = ref(new Map());
const loading = ref(true);
const loadError = ref('');
const openingId = ref('');
const openFit = ref({ x: '0px', s: 1 });
const f = reactive({ grade: '', section: '', status: '', avail: '' });
const query = ref('');
const searchInput = ref(null);
const searchTerms = computed(() => normalizeBookSearch(query.value).trim().split(/\s+/).filter(Boolean));
let unwatch = () => {};
let openTimer = 0;

const grades = computed(() => [...new Set(entries.value.map((e) => e.grade))].sort((a, b) => a - b));
const progressOf = (e) => progress.value.get(trackId(e)) || null;
const stateOf = (e) => displayStatus(progressOf(e));

function availOf(e) {
  if (!e.catalogBookId) return { kind: 'not_in_catalog' };
  const a = avail.value.get(e.catalogBookId);
  if (a) return { kind: a.available > 0 ? 'available' : 'all_taken', ...a };
  const copies = Number(e.catalogCopies) || 0;
  if (!copies) return { kind: 'unknown' };
  return { kind: 'available', total: copies, available: copies };
}
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

const location = (e) => ({ name: 'HundredBook', params: { id: e.id } });
const hrefOf = (e) => router.resolve(location(e)).href;

// A plain click plays the «book opens» animation, then goes to the book page.
// Ctrl/Cmd/Shift-click and middle click keep their normal browser behaviour.
function openBook(event, e) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (openingId.value) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    router.push(location(e));
    return;
  }
  // The book opens to the left on its spine. It moves only as far as needed (and
  // shrinks on narrow screens) so the whole open spread stays on the screen.
  openFit.value = fitOpenBookFor(event.currentTarget.querySelector('.hc'));
  openingId.value = e.id;
  openTimer = setTimeout(() => router.push(location(e)), 980);
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
onMounted(load);
onBeforeUnmount(() => { unwatch(); clearTimeout(openTimer); });
</script>

<style scoped>
/* The opening book may swing past the edge for a moment: never scroll sideways. */
.hundred { overflow-x: clip; }
.source { margin-top: 10px; font-size: var(--fs-xs); color: var(--text-3); max-width: 680px; }
.progress { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface); max-width: 420px; }
.progress strong { display: block; }
.progress .muted { font-size: var(--fs-xs); }
.ring { --size: 64px; flex: none; width: var(--size); height: var(--size); border-radius: 50%; display: grid; place-items: center; background: conic-gradient(var(--success) var(--p), var(--surface-3) 0); transition: background var(--dur-3) ease; }
.ring span { width: calc(var(--size) - 12px); height: calc(var(--size) - 12px); border-radius: 50%; background: var(--surface); display: grid; place-items: center; font-weight: 700; }
.signin { align-items: center; justify-content: space-between; flex-wrap: wrap; max-width: 520px; }

.filters { display: grid; grid-template-columns: repeat(4, 1fr) auto; gap: 10px; align-items: end; margin-bottom: 28px; }
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

/* Three books to a row. */
.shelf {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(28px, 4.5vw, 56px) clamp(18px, 4vw, 52px);
}
.cover-sk { aspect-ratio: 2 / 3; border-radius: 10px; }
.item { position: relative; transition: opacity 500ms ease; }
.item.is-opening { z-index: 3; }
.has-opening .item:not(.is-opening) { opacity: 0.25; }
.bk {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: min(100%, 270px);
  margin-inline: auto;
  color: var(--text-1);
  text-decoration: none;
  outline-offset: 6px;
  border-radius: 10px;
  -webkit-tap-highlight-color: transparent;
}
.under { display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; }
.status { flex: none; }
.avail { font-size: var(--fs-xs); font-weight: 550; }
.avail.ok { color: var(--success); }
.avail.off { color: var(--text-3); }

@media (max-width: 900px) { .filters { grid-template-columns: 1fr 1fr; } .f-foot { grid-column: 1 / -1; justify-content: space-between; } }
@media (max-width: 560px) {
  .shelf { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 14px; }
  .progress { max-width: none; width: 100%; }
}
@media (max-width: 340px) {
  .filters { grid-template-columns: 1fr; }
}
</style>
