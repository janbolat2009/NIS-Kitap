<template>
  <div class="page container board">
    <header class="page-head">
      <div>
        <h1 class="page-title">{{ t('board.title') }}</h1>
        <p class="page-lead">{{ t('board.lead') }}</p>
      </div>
    </header>

    <div class="controls">
      <div class="tabs" role="group" :aria-label="t('board.title')">
        <button type="button" class="tab" :aria-pressed="view === 'shanyraks'" @click="view = 'shanyraks'">{{ t('cabinet.shanyrak') }}</button>
        <button type="button" class="tab" :aria-pressed="view === 'students'" @click="view = 'students'">{{ t('board.students') }}</button>
      </div>
      <div v-if="view === 'shanyraks' && year" class="period">
        <select v-model="periodType" class="select" :aria-label="t('board.periodLabel')">
          <option value="year">{{ t('board.year') }}</option>
          <option value="quarter">{{ t('board.quarter') }}</option>
          <option value="month">{{ t('board.month') }}</option>
        </select>
        <select v-if="periodType === 'quarter'" v-model="quarter" class="select" :aria-label="t('board.quarter')">
          <option v-for="n in 4" :key="n" :value="`${year}-Q${n}`">{{ t('board.q', { n }) }}</option>
        </select>
        <select v-if="periodType === 'month'" v-model="month" class="select" :aria-label="t('board.month')">
          <option v-for="m in months" :key="m" :value="m">{{ monthLabel(m) }}</option>
        </select>
      </div>
      <span v-else-if="year" class="muted">{{ t('board.year') }} {{ year }}</span>
    </div>

    <div v-if="loading" class="list"><div v-for="n in 5" :key="n" class="skeleton" style="height: 64px" /></div>

    <template v-else-if="view === 'shanyraks'">
      <div v-if="loadError" class="notice notice-warning" role="alert">
        <p>{{ t('common.errorTitle') }}</p>
        <button type="button" class="btn btn-secondary btn-sm" @click="load">{{ t('common.retry') }}</button>
      </div>
      <p v-else-if="!ranked.length" class="empty" role="status">{{ t('board.empty') }}</p>
      <section v-else :aria-label="t('board.scale')">
        <p class="chart-scale">{{ t('board.scale') }} · <span class="tabular">0–{{ fmt(maxScore) }}</span></p>
        <template v-for="group in groups" :key="group.id">
          <section v-if="group.rows.length" :class="group.id">
            <h2 v-if="group.id === 'rest'" class="section-title">{{ t('board.remainder') }}</h2>
            <ol class="list">
              <li v-for="s in group.rows" :key="s.id" class="row" :class="[`place-${s.rank}`, { open: openId === s.id }]">
                <button type="button" class="row-btn" :aria-expanded="openId === s.id" @click="openId = openId === s.id ? '' : s.id">
                  <span class="rank tabular"><span class="visually-hidden">{{ t('board.placement', { n: s.rank }) }}</span><span aria-hidden="true">{{ s.rank }}</span></span>
                  <span class="name">{{ s.name }}</span>
                  <span class="score tabular">{{ fmt(s.score) }} <small>{{ t('board.points') }}</small></span>
                  <svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                  <span v-if="group.id === 'leaders'" class="bar" aria-hidden="true"><i :key="`${periodKey}-${s.score}`" :style="{ width: `${(s.score / maxScore) * 100}%` }" /></span>
                </button>
                <div v-if="openId === s.id" class="details">
                  <div>
                    <h3>{{ t('board.composition') }}</h3>
                    <ul class="kv">
                      <li v-for="(v, k) in s.byKind" :key="k"><span>{{ t(`board.kinds.${k}`) }}</span><b class="tabular" :class="{ neg: v < 0 }">{{ v > 0 ? '+' : '' }}{{ fmt(v) }}</b></li>
                    </ul>
                  </div>
                  <div>
                    <h3>{{ t('board.byClass') }}</h3>
                    <ul class="kv">
                      <li v-for="c in sortedClasses(s.byClass)" :key="c[0]"><span>{{ c[0] }}</span><b class="tabular">{{ fmt(c[1]) }}</b></li>
                    </ul>
                  </div>
                </div>
              </li>
            </ol>
          </section>
        </template>
      </section>
    </template>

    <template v-else>
      <p v-if="!session.uid" class="notice notice-info">{{ t('board.signInForStudents') }} <button type="button" class="btn btn-sm btn-primary" @click="openLogin()">{{ t('nav.signIn') }}</button></p>
      <template v-else>
        <p class="muted hint">{{ t('board.studentsHint') }}</p>
        <p v-if="!students.length" class="empty">{{ t('board.empty') }}</p>
        <ol v-else class="list">
          <li v-for="r in students" :key="r.id" class="row"><div class="row-btn static">
            <span class="rank tabular">{{ r.rank }}</span>
            <span class="name">{{ r.nameShort || t('onboarding.title') }}<small class="muted"> · {{ r.className }}<template v-if="r.shanyrakName"> · {{ r.shanyrakName }}</template></small></span>
            <span class="score tabular">{{ r.score }}</span>
          </div></li>
        </ol>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { t, currentLocale } from '@/i18n';
import { session } from '@/stores/session';
import { openLogin } from '@/stores/ui';
import { shanyrakPeriodTotals, monthsOfAcademicYear, monthOf, quarterOf, rankRows } from '@/lib/points';
import { getSchoolSettings, listShanyrakPoints, listShanyraks } from '@/services/schoolService';
import { listLeaderboardRows } from '@/services/library';

const view = ref('shanyraks');
const year = ref('');
const periodType = ref('year');
const quarter = ref('');
const month = ref('');
const docs = ref([]);
const names = ref([]);
const rows = ref([]);
const loading = ref(true);
const loadError = ref(false);
const openId = ref('');

const months = computed(() => monthsOfAcademicYear(year.value));
const period = computed(() => (periodType.value === 'quarter' ? { quarter: quarter.value } : periodType.value === 'month' ? { month: month.value } : {}));
const periodKey = computed(() => period.value.month || period.value.quarter || year.value);
const ranked = computed(() => {
  const totals = new Map(docs.value.map((d) => [d.id, shanyrakPeriodTotals(d, period.value)]));
  const all = names.value.map((s) => ({ id: s.id, name: s.name, ...(totals.get(s.id) || { total: 0, byKind: {}, byClass: {} }) }));
  for (const d of docs.value) if (!all.some((a) => a.id === d.id)) all.push({ id: d.id, name: d.name, ...totals.get(d.id) });
  return rankRows(all, (r) => r.total);
});
const maxScore = computed(() => Math.max(1, ...ranked.value.map((r) => r.score)));
const groups = computed(() => [
  { id: 'leaders', rows: ranked.value.filter((r) => r.rank <= 3) },
  { id: 'rest', rows: ranked.value.filter((r) => r.rank > 3) },
]);
const students = computed(() => rankRows(rows.value.filter((r) => r.privacyMode !== 'hidden'), (r) => r.years?.[year.value]?.points).slice(0, 50));

const sortedClasses = (obj) => Object.entries(obj || {}).sort((a, b) => b[1] - a[1]);
const locale = computed(() => ({ kz: 'kk-KZ', en: 'en-GB' }[currentLocale.value] || 'ru-RU'));
const numberFormat = computed(() => new Intl.NumberFormat(locale.value));
const fmt = (number) => numberFormat.value.format(number);
const monthLabel = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString(locale.value, { month: 'long', year: 'numeric' });

async function load() {
  loading.value = true;
  loadError.value = false;
  const school = await getSchoolSettings();
  if (year.value !== school.currentAcademicYear) {
    year.value = school.currentAcademicYear;
    const currentQuarter = quarterOf(new Date());
    const currentMonth = monthOf(new Date());
    quarter.value = currentQuarter?.startsWith(`${year.value}-`) ? currentQuarter : `${year.value}-Q1`;
    month.value = months.value.includes(currentMonth) ? currentMonth : months.value[0] || '';
  }
  try {
    [docs.value, names.value] = await Promise.all([listShanyrakPoints(year.value), listShanyraks(year.value).catch(() => [])]);
  } catch {
    docs.value = [];
    loadError.value = true;
  }
  loading.value = false;
}

watch(periodKey, () => { openId.value = ''; });

watch([view, () => session.uid], async () => {
  if (view.value === 'students' && session.uid && session.emailVerified && !rows.value.length) {
    try { rows.value = await listLeaderboardRows(); } catch { rows.value = []; }
  }
});
onMounted(load);
</script>

<style scoped>
.controls { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; align-items: flex-end; margin-bottom: 20px; }
.controls .tabs { border-bottom: none; }
.tab[aria-pressed='true'] { color: var(--text-1); border-bottom-color: var(--accent-text); }
.period { display: flex; gap: 8px; }
.period .select { min-width: 150px; }
.list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.chart-scale { color: var(--text-2); font-size: var(--fs-sm); padding: 0 0 8px; border-bottom: 1px solid var(--line); margin-bottom: 12px; }
.leaders .list { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 255px), 1fr)); }
.place-1 { --place: var(--warm); --place-bg: var(--warm-soft); }
.place-2 { --place: var(--accent-text); --place-bg: var(--accent-soft); }
.place-3 { --place: var(--success); --place-bg: var(--success-soft); }
.rest { margin-top: 28px; }
.leaders .row { border-color: color-mix(in srgb, var(--place) 42%, var(--line)); }
.row { border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface); overflow: hidden; }
.row-btn { width: 100%; display: grid; grid-template-columns: 34px minmax(0, 1fr) auto 16px; gap: 7px 9px; align-items: center; padding: 12px 14px; background: none; border: none; color: inherit; text-align: left; cursor: pointer; }
.row-btn.static { grid-template-columns: 34px 1fr auto; cursor: default; }
.row-btn:not(.static):hover { background: var(--surface-2); }
.row-btn:focus-visible { outline-offset: -3px; }
.rank { display: grid; place-items: center; width: 31px; height: 31px; border-radius: var(--r-sm); font-family: var(--font-heading); font-size: 1.05rem; font-weight: 770; color: var(--place, var(--text-2)); background: var(--place-bg, var(--surface-2)); }
.name { font-weight: 600; overflow-wrap: anywhere; }
.bar { grid-column: 2 / -1; height: 7px; border-radius: 8px; background: var(--surface-3); overflow: hidden; }
.bar i { display: block; height: 100%; background: var(--place, var(--accent-text)); border-radius: 8px; transform-origin: left; }
.score { text-align: right; font-weight: 700; }
.score small { color: var(--text-2); font-weight: 560; font-size: var(--fs-xs); }
.chev { color: var(--text-3); transition: transform var(--dur-2) var(--ease-out); }
.open .chev { transform: rotate(180deg); }
.details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 4px 16px 18px 64px; animation: rise var(--dur-2) var(--ease-out); }
.details h3 { font-size: var(--fs-sm); color: var(--text-3); margin-bottom: 8px; }
.kv { list-style: none; padding: 0; margin: 0; }
.kv li { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px dashed var(--line); font-size: var(--fs-sm); }
.kv .neg { color: var(--danger); }
.hint { margin-bottom: 12px; }
.notice .btn { margin-top: 8px; }
@media (prefers-reduced-motion: no-preference) {
  .bar i { animation: grow-score 480ms var(--ease-out) both; }
  @keyframes grow-score { from { transform: scaleX(0); } to { transform: scaleX(1); } }
}
@media (max-width: 910px) { .leaders .list { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 600px) {
  .row-btn { padding: 10px; }
  .details { grid-template-columns: 1fr; padding-left: 16px; }
  .period { width: 100%; }
  .period .select { flex: 1; min-width: 0; }
}
</style>
