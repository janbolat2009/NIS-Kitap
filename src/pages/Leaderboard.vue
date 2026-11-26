<template>
  <div class="page container board">
    <header class="page-head">
      <div>
        <span class="eyebrow">{{ year }}</span>
        <h1 class="page-title">{{ t('board.title') }}</h1>
        <p class="page-lead">{{ t('board.lead') }}</p>
      </div>
    </header>

    <div class="controls">
      <div class="tabs" role="tablist">
        <button type="button" class="tab" role="tab" :aria-selected="view === 'shanyraks'" @click="view = 'shanyraks'">{{ t('cabinet.shanyrak') }}</button>
        <button type="button" class="tab" role="tab" :aria-selected="view === 'students'" @click="view = 'students'">{{ t('board.students') }}</button>
      </div>
      <div class="period">
        <select v-model="periodType" class="select" :aria-label="t('board.year')">
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
    </div>

    <div v-if="loading" class="list"><div v-for="n in 5" :key="n" class="skeleton" style="height: 64px" /></div>

    <template v-else-if="view === 'shanyraks'">
      <p v-if="!ranked.length" class="empty">{{ t('board.empty') }}</p>
      <ol v-else class="list rise-in">
        <li v-for="s in ranked" :key="s.id" class="row" :class="{ open: openId === s.id }">
          <button type="button" class="row-btn" :aria-expanded="openId === s.id" @click="openId = openId === s.id ? '' : s.id">
            <span class="rank tabular">{{ s.rank }}</span>
            <span class="name">{{ s.name }}</span>
            <span class="bar" aria-hidden="true"><i :style="{ width: `${Math.max(4, (s.score / maxScore) * 100)}%` }" /></span>
            <span class="score tabular">{{ s.score }}</span>
            <span class="chev" aria-hidden="true">›</span>
          </button>
          <div v-if="openId === s.id" class="details">
            <div>
              <h3>{{ t('board.composition') }}</h3>
              <ul class="kv">
                <li v-for="(v, k) in s.byKind" :key="k"><span>{{ t(`board.kinds.${k}`) }}</span><b class="tabular" :class="{ neg: v < 0 }">{{ v > 0 ? '+' : '' }}{{ v }}</b></li>
              </ul>
            </div>
            <div>
              <h3>{{ t('board.byClass') }}</h3>
              <ul class="kv">
                <li v-for="c in sortedClasses(s.byClass)" :key="c[0]"><span>{{ c[0] }}</span><b class="tabular">{{ c[1] }}</b></li>
              </ul>
            </div>
          </div>
        </li>
      </ol>
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
const openId = ref('');

const months = computed(() => monthsOfAcademicYear(year.value));
const period = computed(() => (periodType.value === 'quarter' ? { quarter: quarter.value } : periodType.value === 'month' ? { month: month.value } : {}));
const ranked = computed(() => {
  const totals = new Map(docs.value.map((d) => [d.id, shanyrakPeriodTotals(d, period.value)]));
  const all = names.value.map((s) => ({ id: s.id, name: s.name, ...(totals.get(s.id) || { total: 0, byKind: {}, byClass: {} }) }));
  for (const d of docs.value) if (!all.some((a) => a.id === d.id)) all.push({ id: d.id, name: d.name, ...totals.get(d.id) });
  return rankRows(all, (r) => r.total);
});
const maxScore = computed(() => Math.max(1, ...ranked.value.map((r) => r.score)));
const students = computed(() => rankRows(rows.value.filter((r) => r.privacyMode !== 'hidden'), (r) => r.years?.[year.value]?.points).slice(0, 50));

const sortedClasses = (obj) => Object.entries(obj || {}).sort((a, b) => b[1] - a[1]);
const monthLabel = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString({ kz: 'kk-KZ', en: 'en-GB' }[currentLocale.value] || 'ru-RU', { month: 'long', year: 'numeric' });

async function load() {
  loading.value = true;
  const school = await getSchoolSettings();
  year.value = school.currentAcademicYear;
  quarter.value = quarterOf(new Date()) || `${year.value}-Q1`;
  month.value = monthOf(new Date());
  try {
    [docs.value, names.value] = await Promise.all([listShanyrakPoints(year.value), listShanyraks(year.value)]);
  } catch {
    docs.value = [];
  }
  loading.value = false;
}

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
.period { display: flex; gap: 8px; }
.period .select { min-width: 150px; }
.list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.row { border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface); overflow: hidden; }
.row-btn { width: 100%; display: grid; grid-template-columns: 36px minmax(0, 1fr) minmax(60px, 2fr) 70px 18px; gap: 12px; align-items: center; padding: 14px 16px; background: none; border: none; color: inherit; text-align: left; cursor: pointer; }
.row-btn.static { grid-template-columns: 36px 1fr 70px; cursor: default; }
.rank { font-family: var(--font-serif); font-size: 1.1rem; color: var(--text-3); }
.row:nth-child(1) .rank { color: var(--warm); }
.name { font-weight: 600; overflow-wrap: anywhere; }
.bar { height: 8px; border-radius: 8px; background: var(--surface-2); overflow: hidden; }
.bar i { display: block; height: 100%; background: var(--accent); border-radius: 8px; transition: width var(--dur-3) var(--ease-out); }
.score { text-align: right; font-weight: 700; }
.chev { color: var(--text-3); transition: transform var(--dur-2) var(--ease-out); }
.open .chev { transform: rotate(90deg); }
.details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 4px 16px 18px 64px; animation: rise var(--dur-2) var(--ease-out); }
.details h3 { font-size: var(--fs-sm); color: var(--text-3); margin-bottom: 8px; }
.kv { list-style: none; padding: 0; margin: 0; }
.kv li { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px dashed var(--line); font-size: var(--fs-sm); }
.kv .neg { color: var(--danger); }
.hint { margin-bottom: 12px; }
@media (max-width: 600px) {
  .row-btn { grid-template-columns: 28px 1fr 56px 14px; }
  .bar { display: none; }
  .details { grid-template-columns: 1fr; padding-left: 16px; }
  .period { width: 100%; }
  .period .select { flex: 1; min-width: 0; }
}
</style>
