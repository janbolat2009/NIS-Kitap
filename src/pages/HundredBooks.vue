<template>
  <PageShell>
    <template #default="{ openLogin }">
      <header class="hb-hero" v-reveal>
        <div class="hb-hero-text">
          <span class="kp-eyebrow">{{ t('hundred.tag') }}</span>
          <h1 class="kp-title">{{ t('hundred.title') }}</h1>
          <p class="hb-full">{{ t('hundred.fullTitle') }}</p>
          <p class="kp-subtitle">{{ t('hundred.lead') }}</p>
          <p class="kp-muted hb-source">{{ t('hundred.source') }}</p>
        </div>

        <div class="hb-progress kp-card">
          <ProgressRing :value="confirmedCount" :max="100" :label="t('hundred.progressOf', { count: confirmedCount })" />
          <div class="hb-progress-text">
            <template v-if="session.uid">
              <strong>{{ t('hundred.progressOf', { count: confirmedCount }) }}</strong>
              <span class="kp-muted">{{ t('hundred.confirmedNote') }}</span>
              <div class="hb-mini-stats">
                <span class="kp-pill amber">{{ t('status.pending') }}: {{ pendingCount }}</span>
                <span class="kp-pill blue">{{ t('status.reading') }}: {{ readingCount }}</span>
              </div>
              <router-link to="/me" class="kp-btn small">{{ t('hundred.myProgress') }}</router-link>
            </template>
            <template v-else>
              <strong>{{ t('hundred.progressGuest') }}</strong>
              <span class="kp-muted">{{ t('hundred.confirmedNote') }}</span>
              <button class="kp-btn primary small" @click="openLogin()">{{ t('nav.login') }}</button>
            </template>
          </div>
        </div>
      </header>

      <section class="hb-facts kp-stagger" aria-label="100 kitap">
        <div class="kp-kpi"><strong>60</strong><span>{{ t('sections.kazakh') }}</span></div>
        <div class="kp-kpi"><strong>20</strong><span>{{ t('sections.russian') }}</span></div>
        <div class="kp-kpi"><strong>20</strong><span>{{ t('sections.foreign') }}</span></div>
        <div class="kp-kpi"><strong>7–12</strong><span>{{ t('hundred.grades') }}</span></div>
      </section>

      <section class="kp-section hb-how kp-card" v-reveal>
        <h2 class="kp-h2">{{ t('hundred.howTitle') }}</h2>
        <ol class="hb-steps">
          <li><span>1</span>{{ t('hundred.how1') }}</li>
          <li><span>2</span>{{ t('hundred.how2') }}</li>
          <li><span>3</span>{{ t('hundred.how3') }}</li>
        </ol>
        <div class="hb-milestones" :aria-label="t('hundred.milestones')">
          <div v-for="m in milestones" :key="m" class="hb-milestone" :class="{ reached: confirmedCount >= m }">
            <span class="hb-medal" aria-hidden="true">{{ m }}</span>
            <small>{{ t('hundred.milestone', { count: m }) }}</small>
          </div>
        </div>
      </section>

      <section class="kp-section" aria-labelledby="hb-list-title">
        <h2 id="hb-list-title" class="kp-sr-only">{{ t('hundred.viewAll') }}</h2>
        <div class="hb-filters kp-card">
          <div class="kp-field hb-search">
            <label class="kp-label" for="hb-q">{{ t('common.search') }}</label>
            <input id="hb-q" v-model="filters.q" class="kp-input" type="search" :placeholder="t('hundred.searchPlaceholder')" />
          </div>
          <div class="kp-field">
            <label class="kp-label" for="hb-section">{{ t('hundred.filterSection') }}</label>
            <select id="hb-section" v-model="filters.section" class="kp-select">
              <option value="">{{ t('common.all') }}</option>
              <option value="kazakh">{{ t('sections.kazakh') }}</option>
              <option value="russian">{{ t('sections.russian') }}</option>
              <option value="foreign">{{ t('sections.foreign') }}</option>
            </select>
          </div>
          <div class="kp-field">
            <label class="kp-label" for="hb-grade">{{ t('hundred.filterGrade') }}</label>
            <select id="hb-grade" v-model="filters.grade" class="kp-select">
              <option value="">{{ t('common.all') }}</option>
              <option v-for="g in [7, 8, 9, 10, 11, 12]" :key="g" :value="String(g)">{{ t('hundred.gradeN', { grade: g }) }}</option>
            </select>
          </div>
          <div class="kp-field">
            <label class="kp-label" for="hb-genre">{{ t('common.genre') }}</label>
            <select id="hb-genre" v-model="filters.genre" class="kp-select">
              <option value="">{{ t('common.all') }}</option>
              <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>
          <div v-if="session.uid" class="hb-status-chips">
            <span class="kp-label">{{ t('hundred.filterStatus') }}</span>
            <div class="kp-chips" role="group" :aria-label="t('hundred.filterStatus')">
              <button v-for="s in statusFilters" :key="s" class="kp-chip" :class="{ active: filters.status === s }" :aria-pressed="filters.status === s" @click="filters.status = s">
                {{ s === 'all' ? t('common.all') : t(`status.${s}`) }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="loading" class="hb-grid">
          <div v-for="n in 6" :key="n" class="kp-skeleton" style="height: 190px"></div>
        </div>
        <div v-else-if="loadError" class="kp-state" role="alert">
          <h3>{{ t('hundred.loadError') }}</h3>
          <p>{{ t('common.errorDesc') }}</p>
          <button class="kp-btn" @click="load">{{ t('common.retry') }}</button>
        </div>
        <div v-else-if="!visibleBooks.length" class="kp-state">
          <h3>{{ t('hundred.empty') }}</h3>
          <button class="kp-btn" @click="resetFilters">{{ t('hundred.clear') }}</button>
        </div>
        <TransitionGroup v-else tag="ul" name="hb-list" class="hb-grid">
          <li v-for="entry in visibleBooks" :key="entry.id" class="hb-book kp-card is-interactive">
            <div class="hb-book-top">
              <span class="hb-num" aria-hidden="true">{{ entry.order }}</span>
              <span v-if="session.uid" class="kp-pill" :class="statusTone(entry)">{{ t(`status.${statusOf(entry)}`) }}</span>
            </div>
            <h3 class="hb-book-title">{{ entry.title }}</h3>
            <p v-if="entry.titleAlt" class="hb-alt">{{ entry.titleAlt }}</p>
            <p class="hb-author">{{ entry.author }}</p>
            <div class="hb-meta">
              <span>{{ t('hundred.gradeN', { grade: entry.grade }) }}</span>
              <span aria-hidden="true">·</span>
              <span>{{ entry.genre }}</span>
            </div>
            <div class="hb-avail">
              <span class="hb-dot" :class="entry.catalogBookId ? 'ok' : ''" aria-hidden="true"></span>
              {{ entry.catalogBookId ? t('hundred.inCatalog') : t('hundred.notInCatalog') }}
            </div>
            <div class="hb-actions">
              <router-link
                v-if="entry.catalogBookId && entry.catalogVisible"
                :to="`/book/${encodeURIComponent(entry.catalogTitle)}`"
                class="kp-btn small"
              >{{ t('hundred.openBook') }}</router-link>
              <template v-if="session.uid && !isLocked(entry)">
                <label class="kp-sr-only" :for="`st-${entry.id}`">{{ t('hundred.setStatus') }}</label>
                <select :id="`st-${entry.id}`" class="kp-select hb-status-select" :value="progressOf(entry)?.status || ''" :disabled="busyId === entry.id" @change="changeStatus(entry, $event.target.value)">
                  <option value="">{{ t('status.not_started') }}</option>
                  <option value="want">{{ t('status.want') }}</option>
                  <option value="reading">{{ t('status.reading') }}</option>
                  <option value="finished">{{ t('status.finished') }}</option>
                </select>
                <button class="kp-btn small primary" :disabled="busyId === entry.id" @click="openRequest(entry)">{{ t('hundred.sendForCheck') }}</button>
              </template>
              <p v-else-if="session.uid && progressOf(entry)?.decisionNote" class="kp-muted hb-note">{{ progressOf(entry).decisionNote }}</p>
            </div>
          </li>
        </TransitionGroup>
      </section>

      <div v-if="requestFor" class="hb-overlay" @click="requestFor = null">
        <form class="hb-dialog kp-card" role="dialog" aria-modal="true" :aria-label="t('hundred.sendForCheck')" @click.stop @submit.prevent="submitRequest">
          <h2 class="kp-h2">{{ t('hundred.sendForCheck') }}</h2>
          <p class="hb-dialog-book"><strong>{{ requestFor.title }}</strong> — {{ requestFor.author }}</p>
          <fieldset class="hb-methods">
            <legend class="kp-label">{{ t('hundred.methodLabel') }}</legend>
            <label><input v-model="requestMethod" type="radio" value="review" /> {{ t('hundred.methodReview') }}</label>
            <label><input v-model="requestMethod" type="radio" value="loan_returned" /> {{ t('hundred.methodLoan') }}</label>
          </fieldset>
          <label class="kp-label" for="hb-review">{{ t('hundred.reviewLabel') }}</label>
          <textarea id="hb-review" v-model="requestReview" class="kp-textarea" maxlength="4000" :required="requestMethod === 'review'"></textarea>
          <p class="kp-muted">{{ t('hundred.reviewHint') }}</p>
          <div class="hb-dialog-actions">
            <button type="button" class="kp-btn" @click="requestFor = null">{{ t('common.cancel') }}</button>
            <button type="submit" class="kp-btn primary" :disabled="busyId === requestFor.id">{{ t('hundred.send') }}</button>
          </div>
        </form>
      </div>

      <div v-if="toast" class="kp-toast" :class="{ error: toastError }" role="status">{{ toast }}</div>
    </template>
  </PageShell>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import PageShell from '@/components/PageShell.vue';
import ProgressRing from '@/components/ProgressRing.vue';
import { session } from '@/stores/session';
import { t } from '@/i18n';
import { displayStatus } from '@/lib/workflow';
import { DEFAULT_POINT_SETTINGS } from '@/lib/points';
import { normalizeText } from '@/lib/bookId';
import {
  loadHundredBooks, hundredEntryToBook, getMyProgress, setReadingStatus, clearReadingStatus, requestVerification,
} from '@/services/progressService';

const books = ref([]);
const progress = ref(new Map());
const loading = ref(true);
const loadError = ref(false);
const busyId = ref('');
const toast = ref('');
const toastError = ref(false);
const milestones = DEFAULT_POINT_SETTINGS.milestones;
const statusFilters = ['all', 'not_started', 'want', 'reading', 'pending', 'confirmed'];

const filters = reactive({ q: '', section: '', grade: '', genre: '', status: 'all' });

const requestFor = ref(null);
const requestReview = ref('');
const requestMethod = ref('review');

const genres = computed(() => [...new Set(books.value.map((b) => b.genre))].sort((a, b) => a.localeCompare(b, 'ru')));

function progressOf(entry) {
  return progress.value.get(hundredEntryToBook(entry).bookId);
}
function statusOf(entry) {
  return displayStatus(progressOf(entry));
}
function isLocked(entry) {
  const p = progressOf(entry);
  return Boolean(p && ['pending', 'confirmed'].includes(p.verificationStatus));
}
function statusTone(entry) {
  return { confirmed: 'green', pending: 'amber', reading: 'blue', want: 'violet', rejected: 'red' }[statusOf(entry)] || '';
}

const confirmedCount = computed(() => books.value.filter((b) => statusOf(b) === 'confirmed').length);
const pendingCount = computed(() => books.value.filter((b) => statusOf(b) === 'pending').length);
const readingCount = computed(() => books.value.filter((b) => statusOf(b) === 'reading').length);

const visibleBooks = computed(() => {
  const q = normalizeText(filters.q);
  return books.value.filter((b) => {
    if (filters.section && b.section !== filters.section) return false;
    if (filters.grade && String(b.grade) !== filters.grade) return false;
    if (filters.genre && b.genre !== filters.genre) return false;
    if (filters.status !== 'all') {
      const s = statusOf(b);
      if (filters.status === 'not_started' ? !['not_started', 'rejected'].includes(s) : s !== filters.status) return false;
    }
    if (q) {
      const hay = normalizeText([b.title, b.titleAlt, b.author, b.catalogTitle].filter(Boolean).join(' '));
      if (!hay.includes(q)) return false;
    }
    return true;
  });
});

function resetFilters() {
  Object.assign(filters, { q: '', section: '', grade: '', genre: '', status: 'all' });
}

function notify(message, isError = false) {
  toast.value = message;
  toastError.value = isError;
  setTimeout(() => { toast.value = ''; }, 3200);
}

function errorText(err) {
  if (err?.code === 'locked') return t('hundred.locked');
  if (err?.code === 'email_not_verified') return t('common.verifyEmailDesc');
  return t('admin.errors.default');
}

async function load() {
  loading.value = true;
  loadError.value = false;
  try {
    const data = await loadHundredBooks();
    books.value = data.books.filter((b) => b.isActive !== false).sort((a, b) => a.order - b.order);
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

async function loadProgress() {
  if (!session.uid) {
    progress.value = new Map();
    return;
  }
  try {
    progress.value = await getMyProgress();
  } catch {
    progress.value = new Map();
  }
}

async function changeStatus(entry, status) {
  busyId.value = entry.id;
  try {
    const book = hundredEntryToBook(entry);
    if (!status) await clearReadingStatus(book);
    else await setReadingStatus(book, status);
    await loadProgress();
    notify(t('hundred.statusSaved'));
  } catch (err) {
    notify(errorText(err), true);
  } finally {
    busyId.value = '';
  }
}

function openRequest(entry) {
  requestFor.value = entry;
  requestReview.value = '';
  requestMethod.value = 'review';
}

async function submitRequest() {
  const entry = requestFor.value;
  if (!entry) return;
  if (requestMethod.value === 'review' && requestReview.value.trim().length < 40) {
    notify(t('hundred.reviewTooShort'), true);
    return;
  }
  busyId.value = entry.id;
  try {
    await requestVerification(hundredEntryToBook(entry), { review: requestReview.value, method: requestMethod.value });
    requestFor.value = null;
    await loadProgress();
    notify(t('hundred.sent'));
  } catch (err) {
    notify(errorText(err), true);
  } finally {
    busyId.value = '';
  }
}

const route = useRoute();
onMounted(() => {
  if (typeof route.query.q === 'string') filters.q = route.query.q;
  load();
});
watch(() => [session.ready, session.uid], loadProgress, { immediate: true });
</script>

<style scoped>
.hb-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
  gap: 28px;
  align-items: end;
}
.hb-full { margin: 0 0 12px; font-size: 18px; font-weight: 600; color: var(--apple-cream); line-height: 1.35; }
.hb-source { margin-top: 12px; }
.hb-progress { display: flex; gap: 20px; align-items: center; }
.hb-progress-text { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; min-width: 0; }
.hb-progress-text strong { font-size: 18px; }
.hb-mini-stats { display: flex; gap: 6px; flex-wrap: wrap; }

.hb-facts {
  margin-top: 28px;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.hb-steps { list-style: none; padding: 0; margin: 0 0 20px; display: grid; gap: 10px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.hb-steps li { display: flex; gap: 10px; font-size: 14px; line-height: 1.5; color: var(--apple-text-secondary); }
.hb-steps span {
  flex: 0 0 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--apple-blue-light);
  border: 1px solid rgba(56, 189, 248, 0.4);
}
.hb-milestones { display: flex; gap: 12px; flex-wrap: wrap; }
.hb-milestone { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 64px; }
.hb-medal {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 16px;
  color: var(--apple-text-muted);
  border: 2px dashed rgba(255, 255, 255, 0.18);
  transition: transform 0.35s var(--apple-spring), background 0.35s, color 0.35s, border-color 0.35s;
}
.hb-milestone small { font-size: 12px; color: var(--apple-text-muted); }
.hb-milestone.reached .hb-medal {
  color: #0b1424;
  background: var(--apple-cream);
  border: 2px solid var(--apple-cream);
}
.hb-milestone.reached:hover .hb-medal { transform: rotate(-6deg) scale(1.05); }

.hb-filters {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr));
  align-items: end;
  margin-bottom: 18px;
}
.hb-status-chips { grid-column: 1 / -1; }

.hb-grid {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
}
.hb-book { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.hb-book-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 4px; }
.hb-num {
  font-size: 13px;
  font-weight: 700;
  color: var(--apple-cream-dim);
  padding: 2px 9px;
  border-radius: var(--apple-radius-pill);
  background: rgba(246, 238, 225, 0.08);
  font-variant-numeric: tabular-nums;
}
.hb-book-title { margin: 0; font-size: 17px; font-weight: 700; line-height: 1.3; overflow-wrap: anywhere; }
.hb-alt { margin: 0; font-size: 13px; color: var(--apple-text-muted); overflow-wrap: anywhere; }
.hb-author { margin: 0; font-size: 14px; color: var(--apple-text-secondary); }
.hb-meta { display: flex; gap: 6px; flex-wrap: wrap; font-size: 12px; color: var(--apple-text-muted); }
.hb-avail { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--apple-text-secondary); margin-top: 2px; }
.hb-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255, 255, 255, 0.25); }
.hb-dot.ok { background: #34D399; }
.hb-actions { margin-top: auto; padding-top: 10px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.hb-status-select { width: auto; min-height: 32px; padding: 4px 10px; font-size: 13px; flex: 1 1 140px; }
.hb-note { margin: 0; }

.hb-list-move, .hb-list-enter-active { transition: all 0.3s var(--apple-spring); }
.hb-list-enter-from { opacity: 0; transform: translateY(6px); }
.hb-list-leave-active { display: none; }

.hb-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.hb-dialog { width: min(520px, 100%); background: #0b1424; max-height: calc(100vh - 32px); overflow-y: auto; }
.hb-dialog-book { margin: 0 0 14px; color: var(--apple-text-secondary); font-size: 14px; }
.hb-methods { border: 0; padding: 0; margin: 0 0 14px; display: grid; gap: 8px; font-size: 14px; color: var(--apple-text-secondary); }
.hb-methods label { display: flex; gap: 8px; align-items: center; cursor: pointer; }
.hb-dialog-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px; }

@media (max-width: 960px) {
  .hb-hero { grid-template-columns: 1fr; }
  .hb-filters { grid-template-columns: 1fr 1fr; }
  .hb-search { grid-column: 1 / -1; }
}
@media (max-width: 640px) {
  .hb-facts { grid-template-columns: 1fr 1fr; }
  .hb-steps { grid-template-columns: 1fr; }
  .hb-progress { flex-direction: column; align-items: flex-start; }
}
@media (prefers-reduced-motion: reduce) {
  .hb-list-move, .hb-list-enter-active { transition: none; }
}
</style>
