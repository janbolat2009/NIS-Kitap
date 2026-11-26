<template>
  <div class="page container book-page">
    <button type="button" class="btn btn-ghost btn-sm back" @click="$router.back()">← {{ t('book.back') }}</button>

    <div v-if="loading" class="layout"><div class="skeleton cover-sk" /><div><div class="skeleton" style="height: 40px; width: 70%" /><div class="skeleton" style="height: 20px; width: 40%; margin-top: 12px" /></div></div>

    <div v-else-if="!book" class="empty">
      <h3>{{ t('book.notFound') }}</h3><p>{{ t('book.notFoundLead') }}</p>
      <router-link to="/catalog" class="btn btn-primary">{{ t('nav.catalog') }}</router-link>
    </div>

    <template v-else>
      <article class="layout">
        <div class="cover" :style="{ '--c': coverColor }" aria-hidden="true">
          <span class="cover-title">{{ book.title }}</span><span class="cover-author">{{ book.author }}</span>
        </div>
        <div class="info">
          <p v-if="hundred" class="badge badge-warm">{{ t('book.hundredBadge') }}</p>
          <h1 class="title">{{ book.title }}</h1>
          <p class="author">{{ book.author }}</p>
          <dl class="meta">
            <div v-if="book.language"><dt>{{ t('book.language') }}</dt><dd>{{ book.language }}</dd></div>
            <div v-if="genre"><dt>{{ t('book.genre') }}</dt><dd>{{ genre }}</dd></div>
            <div v-if="book.year"><dt>{{ t('book.year') }}</dt><dd>{{ book.year }}</dd></div>
            <div v-if="book.isbn"><dt>{{ t('book.isbn') }}</dt><dd>{{ book.isbn }}</dd></div>
          </dl>

          <section id="reserve" class="fund" :aria-label="t('book.fund')">
            <h2 class="h3">{{ t('book.fund') }}</h2>
            <dl class="counters">
              <div><dt>{{ t('loan.total') }}</dt><dd class="tabular">{{ av.total }}</dd></div>
              <div class="ok"><dt>{{ t('loan.available') }}</dt><dd class="tabular">{{ av.available }}</dd></div>
              <div><dt>{{ t('loan.held') }}</dt><dd class="tabular">{{ av.held }}</dd></div>
              <div><dt>{{ t('loan.issuedCount') }}</dt><dd class="tabular">{{ av.issued }}</dd></div>
            </dl>

            <div v-if="myLoan" class="loan" :class="`is-${myLoan.status}`">
              <div class="loan-head"><span class="badge badge-info">{{ t(`loan.${myLoan.status}`) }}</span><span class="muted">{{ t('loan.code') }}: <b class="tabular">{{ myLoan.code }}</b></span></div>
              <p v-if="myLoan.pickup" class="loan-line">{{ t('loan.pickup') }}: {{ fmtDate(myLoan.pickup.start) }}, {{ myLoan.pickup.from }}–{{ myLoan.pickup.to }}, {{ myLoan.pickup.place }}</p>
              <p v-if="myLoan.holdUntil && ['requested', 'ready'].includes(myLoan.status)" class="loan-line">{{ t('loan.holdUntil') }}: {{ fmtDateTime(myLoan.holdUntil) }}</p>
              <p v-if="myLoan.dueDate && myLoan.status === 'issued'" class="loan-line">{{ t('loan.due') }}: {{ fmtDate(myLoan.dueDate) }}</p>
              <button v-if="['requested', 'ready'].includes(myLoan.status)" type="button" class="btn btn-danger btn-sm" :disabled="busy" @click="cancel">{{ t('loan.cancel') }}</button>
            </div>
            <template v-else>
              <button type="button" class="btn btn-primary btn-lg reserve-btn" :class="{ done: justReserved }" :disabled="busy || av.available < 1" @click="reserve">
                <span v-if="busy" class="spinner" />
                <svg v-else-if="justReserved" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4"><path class="check" d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                <span>{{ av.available < 1 ? t('loan.none') : t('loan.reserve') }}</span>
              </button>
              <p class="hint">{{ t('loan.holdNote', { hours: holdHours }) }}</p>
            </template>
          </section>

          <section class="status" :aria-label="t('book.yourStatus')">
            <h2 class="h3">{{ t('book.yourStatus') }}: <span class="muted">{{ t(`status.${displayState}`) }}</span></h2>
            <div class="seg">
              <button v-for="s in ['want', 'reading', 'finished']" :key="s" type="button" :aria-pressed="progress?.status === s" :disabled="busy || locked" @click="setStatus(s)">{{ t(`status.${s}`) }}</button>
            </div>
            <router-link v-if="hundred && progress?.status === 'finished' && !locked" to="/100-kitap" class="link-sm">{{ t('hundred.sendForReview') }} →</router-link>
          </section>
        </div>
      </article>

      <section v-if="book.description" class="desc">
        <h2 class="section-title">{{ t('book.description') }}</h2>
        <p>{{ book.description }}</p>
      </section>

      <section class="reviews">
        <div class="rev-head">
          <h2 class="section-title">{{ t('book.reviews') }}<span v-if="avgRating" class="avg"> · ★ {{ avgRating }}</span></h2>
          <button v-if="!editing" type="button" class="btn btn-secondary btn-sm" @click="startReview">{{ myReview ? t('book.editReview') : t('book.writeReview') }}</button>
        </div>
        <p v-if="myReview && !editing" class="notice" :class="{ 'notice-warning': myReview.status === 'pending', 'notice-success': myReview.status === 'published', 'notice-danger': myReview.status === 'rejected' }">
          {{ myReview.status === 'published' ? t('book.reviewPublished') : myReview.status === 'rejected' ? t('book.reviewRejected', { note: myReview.moderationNote }) : t('book.reviewPending') }}
        </p>
        <form v-if="editing" class="review-form" @submit.prevent="submitReview">
          <div class="stars" role="radiogroup" :aria-label="t('hundred.verify.rating')">
            <button v-for="n in 5" :key="n" type="button" role="radio" :aria-checked="rForm.rating === n" :class="{ on: n <= rForm.rating }" @click="rForm.rating = n">★</button>
          </div>
          <label class="visually-hidden" for="rev-text">{{ t('book.reviewText') }}</label>
          <textarea id="rev-text" v-model="rForm.text" class="textarea" maxlength="2000" required />
          <p class="hint">{{ t('book.reviewRules') }}</p>
          <p v-if="rError" class="error-text" role="alert">{{ rError }}</p>
          <div class="row-actions">
            <button type="submit" class="btn btn-primary btn-sm" :disabled="busy">{{ t('book.save') }}</button>
            <button type="button" class="btn btn-ghost btn-sm" @click="editing = false">{{ t('common.cancel') }}</button>
            <button v-if="myReview" type="button" class="btn btn-danger btn-sm" :disabled="busy" @click="removeReview">{{ t('book.delete') }}</button>
          </div>
        </form>
        <ul v-if="reviews.length" class="rev-list">
          <li v-for="r in reviews" :key="r.id" class="rev">
            <div class="rev-meta"><b>{{ r.authorLabel }}</b><span class="stars-ro" :aria-label="`${r.rating}/5`">{{ '★'.repeat(r.rating) }}<span class="dim">{{ '★'.repeat(5 - r.rating) }}</span></span><span class="muted">{{ fmtDate(r.publishedAt) }}</span></div>
            <p class="rev-text">{{ r.text }}</p>
          </li>
        </ul>
        <p v-else-if="!editing" class="muted">{{ t('book.noReviews') }}</p>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { t, currentLocale } from '@/i18n';
import { session } from '@/stores/session';
import { openLogin, toast } from '@/stores/ui';
import { getBookByTitle } from '@/services/bookService';
import { getBookId } from '@/lib/bookId';
import { displayStatus } from '@/lib/workflow';
import { errorMessage } from '@/services/api';
import { getSchoolSettings } from '@/services/schoolService';
import {
  watchAvailability, watchMyReservations, watchMyProgress, reserveBook, cancelReservation, setReadingStatus,
  listPublishedReviews, getMyReview, saveReview, deleteReview, loadHundredBooks, logView,
} from '@/services/library';

const route = useRoute();
const book = ref(null);
const loading = ref(true);
const av = ref({ total: 0, held: 0, issued: 0, available: 0 });
const loans = ref([]);
const progressMap = ref(new Map());
const hundred = ref(null);
const busy = ref(false);
const justReserved = ref(false);
const reviews = ref([]);
const myReview = ref(null);
const editing = ref(false);
const rForm = reactive({ rating: 5, text: '' });
const rError = ref('');
const holdHours = ref(48);
let stops = [];

const bookId = computed(() => (book.value ? getBookId(book.value) : ''));
const genre = computed(() => (Array.isArray(book.value?.genre) ? book.value.genre.join(', ') : book.value?.genre || ''));
const progress = computed(() => progressMap.value.get(bookId.value) || null);
const displayState = computed(() => displayStatus(progress.value));
const locked = computed(() => ['pending', 'confirmed'].includes(progress.value?.verificationStatus));
const myLoan = computed(() => loans.value.find((l) => l.bookId === bookId.value && ['requested', 'ready', 'issued'].includes(l.status)) || null);
const avgRating = computed(() => (reviews.value.length ? (reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length).toFixed(1) : ''));
const coverColor = computed(() => {
  let h = 0;
  for (const ch of String(book.value?.title || '')) h = (h * 31 + ch.charCodeAt(0)) % 5;
  return `var(--cover-${h + 1})`;
});

const locale = () => ({ kz: 'kk-KZ', en: 'en-GB' }[currentLocale.value] || 'ru-RU');
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'long' }) : '');
const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '');

function needUser() {
  if (!session.uid) {
    openLogin('login');
    return false;
  }
  return true;
}

async function reserve() {
  if (!needUser()) return;
  busy.value = true;
  try {
    const r = await reserveBook(bookId.value);
    justReserved.value = true;
    toast(`${t('loan.reserved')} · ${t('loan.code')}: ${r.code}`, { timeout: 6000 });
  } catch (err) {
    toast(errorMessage(err, currentLocale.value), { type: 'error' });
  } finally {
    busy.value = false;
  }
}

async function cancel() {
  busy.value = true;
  try {
    await cancelReservation(myLoan.value.id);
    justReserved.value = false;
    toast(t('loan.cancelled'));
  } catch (err) {
    toast(errorMessage(err, currentLocale.value), { type: 'error' });
  } finally {
    busy.value = false;
  }
}

async function setStatus(s) {
  if (!needUser()) return;
  busy.value = true;
  try {
    await setReadingStatus(bookId.value, progress.value?.status === s ? 'none' : s, hundred.value?.id || '');
  } catch (err) {
    toast(errorMessage(err, currentLocale.value), { type: 'error' });
  } finally {
    busy.value = false;
  }
}

function startReview() {
  if (!needUser()) return;
  rForm.rating = myReview.value?.rating || 5;
  rForm.text = myReview.value?.text || '';
  rError.value = '';
  editing.value = true;
}

async function submitReview() {
  busy.value = true;
  rError.value = '';
  try {
    await saveReview(bookId.value, rForm.rating, rForm.text, hundred.value?.id || '');
    myReview.value = await getMyReview(bookId.value);
    editing.value = false;
  } catch (err) {
    rError.value = err.code === 'invalid_review' ? `${t('book.reviewRules')}` : errorMessage(err, currentLocale.value);
  } finally {
    busy.value = false;
  }
}

async function removeReview() {
  busy.value = true;
  try {
    await deleteReview(bookId.value);
    myReview.value = null;
    editing.value = false;
  } catch (err) {
    rError.value = errorMessage(err, currentLocale.value);
  } finally {
    busy.value = false;
  }
}

async function load() {
  stops.forEach((s) => s());
  stops = [];
  loading.value = true;
  justReserved.value = false;
  try {
    book.value = await getBookByTitle(route.params.title);
  } catch {
    book.value = null;
  }
  loading.value = false;
  if (!book.value) return;
  const id = getBookId(book.value);
  stops.push(watchAvailability(book.value, (a) => { av.value = a; }));
  getSchoolSettings().then((s) => { holdHours.value = s.holdHours || 48; });
  loadHundredBooks().then((d) => { hundred.value = d.books.find((h) => h.catalogBookId === id) || null; }).catch(() => {});
  listPublishedReviews(id).then((r) => { reviews.value = r; }).catch(() => { reviews.value = []; });
  logView(book.value);
}

watch(() => route.params.title, load, { immediate: true });
watch(() => [session.uid, bookId.value], async () => {
  if (!bookId.value) return;
  stops.push(watchMyReservations((l) => { loans.value = l; }));
  stops.push(watchMyProgress((m) => { progressMap.value = m; }));
  myReview.value = await getMyReview(bookId.value);
}, { immediate: true });
onBeforeUnmount(() => stops.forEach((s) => s()));
</script>

<style scoped>
.back { margin-bottom: 16px; }
.layout { display: grid; grid-template-columns: 260px 1fr; gap: 40px; align-items: start; }
.cover-sk { aspect-ratio: 2 / 3; border-radius: 6px 14px 14px 6px; }
.cover { aspect-ratio: 2 / 3; border-radius: 4px 14px 14px 4px; background: var(--c); color: #fff; padding: 24px 20px; display: flex; flex-direction: column; justify-content: flex-end; gap: 8px; box-shadow: var(--shadow-2), inset 6px 0 0 rgba(0, 0, 0, 0.18); position: sticky; top: calc(var(--nav-h) + 20px); animation: rise var(--dur-3) var(--ease-out) both; }
.cover-title { font-family: var(--font-serif); font-size: 1.3rem; line-height: 1.25; font-weight: 600; overflow-wrap: anywhere; }
.cover-author { font-size: var(--fs-sm); opacity: 0.85; }
.title { font-size: var(--fs-2xl); margin: 10px 0 6px; overflow-wrap: anywhere; }
.author { font-size: var(--fs-lg); color: var(--text-2); }
.meta { display: flex; flex-wrap: wrap; gap: 8px 28px; margin: 20px 0 0; }
.meta dt { font-size: var(--fs-xs); color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; }
.meta dd { margin: 2px 0 0; font-weight: 550; }
.h3 { font-family: var(--font-sans); font-size: var(--fs-md); font-weight: 650; margin-bottom: 12px; }
.fund, .status { margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--line); }
.counters { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 0 0 16px; }
.counters div { padding: 12px; border-radius: var(--r-md); background: var(--surface-2); }
.counters dt { font-size: var(--fs-xs); color: var(--text-3); }
.counters dd { margin: 2px 0 0; font-size: 1.4rem; font-weight: 700; }
.counters .ok dd { color: var(--success); }
.reserve-btn { min-width: 220px; }
.reserve-btn.done { background: var(--success); animation: pop 0.45s var(--ease-out); }
.check { stroke-dasharray: 24; stroke-dashoffset: 24; animation: draw 0.4s var(--ease-out) forwards; }
.fund .hint { margin-top: 10px; max-width: 520px; }
.loan { padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface); display: flex; flex-direction: column; gap: 8px; align-items: flex-start; animation: rise var(--dur-3) var(--ease-out) both; }
.loan-head { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.loan-line { font-size: var(--fs-sm); color: var(--text-2); }
.seg { display: grid; grid-template-columns: repeat(3, 1fr); max-width: 460px; border: 1px solid var(--line-strong); border-radius: var(--r-md); overflow: hidden; }
.seg button { min-height: 42px; border: none; background: var(--surface); color: var(--text-2); font-weight: 600; font-size: var(--fs-sm); cursor: pointer; }
.seg button + button { border-left: 1px solid var(--line-strong); }
.seg button[aria-pressed='true'] { background: var(--text-1); color: var(--bg); }
.seg button:disabled { opacity: 0.5; }
.link-sm { display: inline-block; margin-top: 10px; font-size: var(--fs-sm); font-weight: 600; }
.desc { margin-top: 48px; max-width: 760px; }
.desc p { color: var(--text-2); line-height: 1.75; white-space: pre-line; }
.reviews { margin-top: 48px; max-width: 760px; }
.rev-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.avg { color: var(--warm); font-family: var(--font-sans); font-size: var(--fs-md); }
.review-form { display: flex; flex-direction: column; gap: 10px; margin: 8px 0 20px; }
.stars { display: flex; gap: 2px; }
.stars button { width: 40px; height: 40px; border: none; background: none; font-size: 26px; color: var(--line-strong); cursor: pointer; }
.stars button.on { color: var(--warm); }
.rev-list { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; }
.rev { padding: 16px 0; border-bottom: 1px solid var(--line); }
.rev-meta { display: flex; gap: 12px; flex-wrap: wrap; align-items: baseline; font-size: var(--fs-sm); }
.stars-ro { color: var(--warm); letter-spacing: 1px; }
.stars-ro .dim { color: var(--line-strong); }
.rev-text { margin-top: 6px; color: var(--text-1); white-space: pre-line; overflow-wrap: anywhere; }
.notice { margin: 10px 0; }
@media (max-width: 760px) {
  .layout { grid-template-columns: 1fr; gap: 20px; }
  .cover { position: static; width: 150px; }
  .counters { grid-template-columns: repeat(2, 1fr); }
  .reserve-btn { width: 100%; }
}
</style>
