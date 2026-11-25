<template>
  <PageShell>
    <AdminNav />
    <header class="kp-head">
      <div>
        <h1 class="kp-title">{{ t('analytics.title') }}</h1>
        <p class="kp-subtitle">{{ t('analytics.subtitle') }}</p>
      </div>
      <button v-if="data" class="kp-btn kp-no-print" @click="print">{{ t('common.print') }}</button>
    </header>

    <StaffGate permission="analytics.view">
      <section class="kp-card an-filters kp-no-print" :aria-label="t('analytics.filters')">
        <div class="kp-filters">
          <div class="kp-field">
            <label class="kp-label" for="f-period">{{ t('common.period') }}</label>
            <select id="f-period" v-model="filters.period" class="kp-select">
              <option value="all">{{ t('analytics.periodAll') }}</option>
              <option value="week">{{ t('analytics.periodWeek') }}</option>
              <option value="month">{{ t('analytics.periodMonth') }}</option>
              <option value="quarter">{{ t('analytics.periodQuarter') }}</option>
              <option value="year">{{ t('analytics.periodYear') }}</option>
            </select>
          </div>
          <div class="kp-field">
            <label class="kp-label" for="f-year">{{ t('common.year') }}</label>
            <select id="f-year" v-model="filters.academicYear" class="kp-select">
              <option value="">{{ t('common.all') }}</option>
              <option v-for="y in options.years" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
          <div class="kp-field">
            <label class="kp-label" for="f-grade">{{ t('common.grade') }}</label>
            <select id="f-grade" v-model="filters.grade" class="kp-select">
              <option value="">{{ t('common.all') }}</option>
              <option v-for="g in [7, 8, 9, 10, 11, 12]" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>
          <div class="kp-field">
            <label class="kp-label" for="f-class">{{ t('common.class') }}</label>
            <select id="f-class" v-model="filters.classId" class="kp-select">
              <option value="">{{ t('common.all') }}</option>
              <option v-for="c in options.classes" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="kp-field">
            <label class="kp-label" for="f-shan">{{ t('common.shanyrak') }}</label>
            <select id="f-shan" v-model="filters.shanyrakId" class="kp-select">
              <option value="">{{ t('common.all') }}</option>
              <option v-for="s in options.shanyraks" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="kp-field">
            <label class="kp-label" for="f-student">{{ t('common.student') }}</label>
            <select id="f-student" v-model="filters.uid" class="kp-select">
              <option value="">{{ t('common.all') }}</option>
              <option v-for="s in options.students" :key="s.uid" :value="s.uid">{{ s.label }}</option>
            </select>
          </div>
          <div class="kp-field">
            <label class="kp-label" for="f-lang">{{ t('common.language') }}</label>
            <select id="f-lang" v-model="filters.language" class="kp-select">
              <option value="">{{ t('common.all') }}</option>
              <option v-for="l in options.languages" :key="l" :value="l">{{ l }}</option>
            </select>
          </div>
          <div class="kp-field">
            <label class="kp-label" for="f-genre">{{ t('common.genre') }}</label>
            <select id="f-genre" v-model="filters.genre" class="kp-select">
              <option value="">{{ t('common.all') }}</option>
              <option v-for="g in options.genres" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>
          <div class="kp-field">
            <label class="kp-label" for="f-status">{{ t('analytics.eventStatus') }}</label>
            <select id="f-status" v-model="filters.status" class="kp-select">
              <option value="">{{ t('common.all') }}</option>
              <option value="pending">{{ t('status.pending') }}</option>
              <option value="confirmed">{{ t('status.confirmed') }}</option>
              <option value="rejected">{{ t('status.rejected') }}</option>
            </select>
          </div>
          <label class="an-check">
            <input v-model="filters.hundredOnly" type="checkbox" />
            {{ t('analytics.hundredOnly') }}
          </label>
          <button class="kp-btn small" @click="resetFilters">{{ t('analytics.reset') }}</button>
        </div>
      </section>

      <div v-if="loading" class="kp-kpis kp-section">
        <div v-for="n in 8" :key="n" class="kp-skeleton" style="height: 86px"></div>
      </div>
      <div v-else-if="error" class="kp-state kp-section" role="alert">
        <h3>{{ t('common.errorTitle') }}</h3>
        <p>{{ t('common.errorDesc') }}</p>
        <button class="kp-btn" @click="load">{{ t('common.retry') }}</button>
      </div>
      <template v-else-if="data">
        <p v-if="!data.students.length" class="kp-muted an-note">{{ t('analytics.noRoster') }}</p>

        <section class="kp-kpis kp-section kp-stagger" :key="filterKey">
          <div v-for="k in kpiList" :key="k.key" class="kp-kpi">
            <strong>{{ k.value }}</strong>
            <span>{{ k.label }}</span>
          </div>
        </section>

        <section class="an-charts kp-section">
          <div class="kp-card an-wide" v-reveal><ColumnChart :title="t('analytics.cReadsByMonth')" :data="charts.readsByMonth" :empty-text="t('analytics.empty')" /></div>
          <div class="kp-card an-wide" v-reveal><ColumnChart :title="t('analytics.cActivity')" :data="charts.activityByMonth" :empty-text="t('analytics.empty')" /></div>
          <div class="kp-card" v-reveal><BarList :title="t('analytics.cShanyraks')" :data="charts.shanyraks" :limit="20" :empty-text="t('analytics.empty')" /></div>
          <div class="kp-card" v-reveal><BarList :title="t('analytics.cTopClasses')" :data="charts.topClasses" :empty-text="t('analytics.empty')" /></div>
          <div class="kp-card" v-reveal><BarList :title="t('analytics.cTopBooks')" :data="charts.topBooks" :empty-text="t('analytics.empty')" /></div>
          <div class="kp-card" v-reveal><BarList :title="t('analytics.cTopAuthors')" :data="charts.topAuthors" :empty-text="t('analytics.empty')" /></div>
          <div class="kp-card" v-reveal><BarList :title="t('analytics.cGenres')" :data="charts.genres" :empty-text="t('analytics.empty')" /></div>
          <div class="kp-card" v-reveal><BarList :title="t('analytics.cLanguages')" :data="charts.languages" :empty-text="t('analytics.empty')" /></div>
          <div class="kp-card" v-reveal><BarList :title="t('analytics.cHundredGrades')" :data="charts.hundredByGrade" :empty-text="t('analytics.empty')" /></div>
        </section>

        <section class="kp-section">
          <h2 class="kp-h2">{{ t('analytics.tableTitle') }}</h2>
          <DataTable
            :rows="studentRows"
            :columns="studentColumns"
            :search-fields="['name', 'email', 'className', 'shanyrakName']"
            default-sort="confirmed"
            export-name="nis-kitap-students"
          />
        </section>
      </template>
    </StaffGate>
  </PageShell>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import PageShell from '@/components/PageShell.vue';
import StaffGate from '@/components/StaffGate.vue';
import AdminNav from '@/components/AdminNav.vue';
import DataTable from '@/components/DataTable.vue';
import BarList from '@/components/charts/BarList.vue';
import ColumnChart from '@/components/charts/ColumnChart.vue';
import { session } from '@/stores/session';
import { can } from '@/lib/roles';
import { computeKpis, chartsData, filterProgress } from '@/lib/analytics';
import { t } from '@/i18n';
import { loadAnalyticsData } from '@/services/adminService';

const data = ref(null);
const loading = ref(false);
const error = ref(false);
const emptyFilters = () => ({ period: 'all', academicYear: '', grade: '', classId: '', shanyrakId: '', uid: '', language: '', genre: '', status: '', hundredOnly: false });
const filters = reactive(emptyFilters());
const filterKey = computed(() => JSON.stringify(filters));

function resetFilters() {
  Object.assign(filters, emptyFilters());
}

const activeFilters = computed(() => {
  const f = { ...filters };
  if (f.period === 'all') f.period = '';
  return f;
});

const options = computed(() => {
  const d = data.value || { students: [], progress: [], events: [] };
  const classes = new Map();
  const shanyraks = new Map();
  for (const s of d.students) {
    if (s.classId) classes.set(s.classId, { id: s.classId, name: s.className });
    if (s.shanyrakId) shanyraks.set(s.shanyrakId, { id: s.shanyrakId, name: s.shanyrakName });
  }
  const byName = (a, b) => String(a.name).localeCompare(String(b.name), 'ru', { numeric: true });
  const records = [...d.progress, ...d.events];
  const uids = new Set(d.progress.map((p) => p.uid));
  const studentLabel = (uid) => {
    const s = d.students.find((x) => x.uid === uid);
    const u = d.users.find((x) => x.id === uid);
    return s ? `${s.fullName}, ${s.className}` : (u?.name || u?.email || uid);
  };
  return {
    years: [...new Set(d.students.map((s) => s.academicYear).filter(Boolean))].sort().reverse(),
    classes: [...classes.values()].sort(byName),
    shanyraks: [...shanyraks.values()].sort(byName),
    languages: [...new Set(records.map((r) => r.language).filter(Boolean))].sort(),
    genres: [...new Set(records.map((r) => r.genre).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')),
    students: [...uids].map((uid) => ({ uid, label: studentLabel(uid) })).sort((a, b) => a.label.localeCompare(b.label, 'ru')),
  };
});

const kpis = computed(() => (data.value ? computeKpis(data.value, activeFilters.value) : null));
const charts = computed(() => (data.value ? chartsData(data.value, activeFilters.value) : {}));

const kpiList = computed(() => {
  const k = kpis.value || {};
  return [
    { key: 'students', label: t('analytics.kStudents'), value: k.totalStudents },
    { key: 'week', label: t('analytics.kActiveWeek'), value: k.activeWeek },
    { key: 'month', label: t('analytics.kActiveMonth'), value: k.activeMonth },
    { key: 'quarter', label: t('analytics.kActiveQuarter'), value: k.activeQuarter },
    { key: 'year', label: t('analytics.kActiveYear'), value: k.activeYear },
    { key: 'issued', label: t('analytics.kIssued'), value: k.issued },
    { key: 'returned', label: t('analytics.kReturned'), value: k.returned },
    { key: 'confirmed', label: t('analytics.kConfirmed'), value: k.confirmedReads },
    { key: 'avg', label: t('analytics.kAvg'), value: k.avgBooksPerStudent },
    { key: 'hundredUsers', label: t('analytics.kHundredUsers'), value: k.hundredParticipants },
    { key: 'hundredDone', label: t('analytics.kHundredDone'), value: `${k.hundredCompletion ?? 0}%` },
    { key: 'activeRes', label: t('analytics.kActiveRes'), value: k.activeReservations },
    { key: 'overdue', label: t('analytics.kOverdue'), value: k.overdueReservations },
    { key: 'requests', label: t('analytics.kRequests'), value: k.verificationRequests },
    { key: 'views', label: t('analytics.kViews'), value: k.views },
    { key: 'bookmarks', label: t('analytics.kBookmarks'), value: k.bookmarks },
  ];
});

const studentRows = computed(() => {
  const d = data.value;
  if (!d) return [];
  const studentsByUid = new Map(d.students.filter((s) => s.uid).map((s) => [s.uid, s]));
  const progress = filterProgress(d.progress, { ...activeFilters.value, period: activeFilters.value.period || 'all' }, studentsByUid);
  const pointsByUid = new Map(d.leaderboard.map((r) => [r.id, r.points || 0]));
  const rows = new Map();
  const ensure = (uid) => {
    if (!rows.has(uid)) {
      const s = studentsByUid.get(uid) || {};
      const u = d.users.find((x) => x.id === uid) || {};
      rows.set(uid, {
        id: uid,
        name: s.fullName || u.name || '',
        email: s.email || u.email || '',
        className: s.className || '',
        shanyrakName: s.shanyrakName || '',
        confirmed: 0,
        pending: 0,
        hundred: 0,
        points: pointsByUid.get(uid) || 0,
      });
    }
    return rows.get(uid);
  };
  for (const p of progress) {
    const row = ensure(p.uid);
    if (p.verificationStatus === 'confirmed') row.confirmed += 1;
    if (p.verificationStatus === 'pending') row.pending += 1;
    if (p.verificationStatus === 'confirmed' && p.isHundred) row.hundred += 1;
  }
  return [...rows.values()];
});

const studentColumns = computed(() => [
  { key: 'name', label: t('common.name') },
  { key: 'email', label: t('common.email') },
  { key: 'className', label: t('common.class') },
  { key: 'shanyrakName', label: t('common.shanyrak') },
  { key: 'confirmed', label: t('analytics.tableBooks'), numeric: true },
  { key: 'hundred', label: t('hundred.title'), numeric: true },
  { key: 'pending', label: t('analytics.tablePending'), numeric: true },
  { key: 'points', label: t('analytics.tablePoints'), numeric: true },
]);

async function load() {
  if (!can(session.role, 'analytics.view')) return;
  loading.value = true;
  error.value = false;
  try {
    data.value = await loadAnalyticsData();
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

function print() {
  window.print();
}

watch(() => [session.ready, session.role], load, { immediate: true });
</script>

<style scoped>
.an-filters { position: relative; }
.an-check { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--apple-text-secondary); min-height: 42px; }
.an-note { margin-top: 16px; }
.an-charts {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.an-wide { grid-column: span 1; }
@media (max-width: 900px) {
  .an-charts { grid-template-columns: 1fr; }
}
@media print {
  .an-charts { grid-template-columns: 1fr 1fr; }
  .kp-card, .kp-kpi { break-inside: avoid; background: #fff; color: #000; border-color: #ccc; }
}
</style>
