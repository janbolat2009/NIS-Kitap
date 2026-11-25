<template>
  <PageShell>
    <header class="kp-head" v-reveal>
      <div>
        <span class="kp-eyebrow">{{ t('hundred.title') }} · NIS Kitap</span>
        <h1 class="kp-title">{{ t('lb.title') }}</h1>
        <p class="kp-subtitle">{{ t('lb.subtitle') }}</p>
      </div>
    </header>

    <StaffGate>
      <div class="lb-controls">
        <div class="kp-tabs" role="tablist" :aria-label="t('lb.title')">
          <button v-for="tab in tabs" :key="tab" role="tab" class="kp-tab" :class="{ active: activeTab === tab }" :aria-selected="activeTab === tab" @click="activeTab = tab">
            {{ t(`lb.tab${tab}`) }}
          </button>
        </div>
        <div class="kp-tabs" role="tablist" :aria-label="t('common.period')">
          <button v-for="p in periods" :key="p" role="tab" class="kp-tab" :class="{ active: period === p }" :aria-selected="period === p" @click="period = p">
            {{ t(`lb.period${p}`) }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="lb-podium">
        <div v-for="n in 3" :key="n" class="kp-skeleton" style="height: 170px"></div>
      </div>
      <div v-else-if="error" class="kp-state" role="alert">
        <h3>{{ t('common.errorTitle') }}</h3>
        <p>{{ t('common.errorDesc') }}</p>
        <button class="kp-btn" @click="load">{{ t('common.retry') }}</button>
      </div>
      <div v-else-if="!ranked.length" class="kp-state">
        <h3>{{ t('lb.empty') }}</h3>
        <p>{{ t('lb.rules') }}</p>
      </div>
      <template v-else>
        <ol class="lb-podium" :key="`${activeTab}-${period}`">
          <li v-for="(row, i) in podium" :key="row.id" class="lb-place kp-card" :class="[`place-${i + 1}`, { me: row.id === session.uid }]">
            <span class="lb-medal" aria-hidden="true">{{ row.rank }}</span>
            <strong class="lb-name">{{ labelOf(row) }}</strong>
            <span class="lb-sub">{{ subOf(row) }}</span>
            <span class="lb-score">{{ row.score }} <small>{{ scoreUnit }}</small></span>
            <span v-if="row.badges?.length" class="lb-badges">
              <span v-for="b in row.badges.slice(-3)" :key="b" class="lb-badge" :title="t(`badge.${b}`)">{{ b.split('_')[1] }}</span>
            </span>
          </li>
        </ol>

        <div v-if="rest.length" class="kp-table-wrap kp-section">
          <table class="kp-table">
            <thead>
              <tr>
                <th>{{ t('lb.place') }}</th>
                <th>{{ activeTab === 'Students' || activeTab === 'Hundred' ? t('lb.participant') : activeTab === 'Classes' ? t('common.class') : t('common.shanyrak') }}</th>
                <th v-if="activeTab === 'Students' || activeTab === 'Hundred'">{{ t('common.shanyrak') }}</th>
                <th v-else class="kp-num">{{ t('lb.members') }}</th>
                <th class="kp-num">{{ t('lb.confirmedBooks') }}</th>
                <th class="kp-num">{{ activeTab === 'Hundred' ? t('hundred.title') : t('lb.points') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rest" :key="row.id" :class="{ 'lb-me': row.id === session.uid }">
                <td>{{ row.rank }}</td>
                <td><strong>{{ labelOf(row) }}</strong><span v-if="row.id === session.uid" class="kp-pill blue lb-you">{{ t('lb.you') }}</span></td>
                <td v-if="activeTab === 'Students' || activeTab === 'Hundred'">{{ row.shanyrakName || '—' }}</td>
                <td v-else class="kp-num">{{ row.members }}</td>
                <td class="kp-num">{{ row.confirmedBooks }}</td>
                <td class="kp-num"><strong>{{ row.score }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="kp-muted lb-rules">{{ t('lb.rules') }}</p>
      </template>

      <section v-if="session.role === 'student' || myRow" class="kp-card kp-section lb-privacy">
        <h2 class="kp-h2">{{ t('lb.privacyTitle') }}</h2>
        <div class="kp-chips" role="radiogroup" :aria-label="t('lb.privacyTitle')">
          <button class="kp-chip" role="radio" :aria-checked="privacy === 'short'" :class="{ active: privacy === 'short' }" :disabled="!session.roster || savingPrivacy" @click="savePrivacy('short')">{{ t('lb.privacyShort') }}</button>
          <button class="kp-chip" role="radio" :aria-checked="privacy === 'hidden'" :class="{ active: privacy === 'hidden' }" :disabled="savingPrivacy" @click="savePrivacy('hidden')">{{ t('lb.privacyHidden') }}</button>
        </div>
        <p v-if="!session.roster" class="kp-muted">{{ t('lb.privacyNoRoster') }}</p>
      </section>
    </StaffGate>

    <div v-if="toast" class="kp-toast" role="status">{{ toast }}</div>
  </PageShell>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import PageShell from '@/components/PageShell.vue';
import StaffGate from '@/components/StaffGate.vue';
import { session } from '@/stores/session';
import { t } from '@/i18n';
import { rankRows, groupTotals, monthOf, quarterOf, academicYearOf } from '@/lib/points';
import { getLeaderboard, setMyPrivacy } from '@/services/progressService';

const tabs = ['Students', 'Classes', 'Shanyraks', 'Hundred'];
const periods = ['Month', 'Quarter', 'Year', 'All'];
const activeTab = ref('Students');
const period = ref('Year');
const rows = ref([]);
const loading = ref(true);
const error = ref(false);
const toast = ref('');
const savingPrivacy = ref(false);

const periodKey = computed(() => {
  const now = new Date();
  return { Month: monthOf(now), Quarter: quarterOf(now), Year: academicYearOf(now), All: '' }[period.value];
});

function periodScore(row) {
  return periodKey.value ? Number(row.byPeriod?.[periodKey.value] || 0) : Number(row.points || 0);
}

const ranked = computed(() => {
  const withScore = rows.value.map((r) => ({ ...r, periodScore: periodScore(r) }));
  if (activeTab.value === 'Students') return rankRows(withScore, (r) => r.periodScore);
  if (activeTab.value === 'Hundred') return rankRows(withScore, (r) => r.hundredBooks);
  if (activeTab.value === 'Classes') return rankRows(groupTotals(withScore, 'classId', 'className'), (g) => g.points);
  return rankRows(groupTotals(withScore, 'shanyrakId', 'shanyrakName'), (g) => g.points);
});
const podium = computed(() => ranked.value.slice(0, 3));
const rest = computed(() => ranked.value.slice(3));
const scoreUnit = computed(() => (activeTab.value === 'Hundred' ? t('common.books') : t('common.points')));
const myRow = computed(() => rows.value.find((r) => r.id === session.uid));
const privacy = ref('short');

function labelOf(row) {
  if (activeTab.value === 'Classes' || activeTab.value === 'Shanyraks') return row.name;
  if (row.privacyMode === 'hidden' || !row.nameShort) return row.id === session.uid ? t('lb.you') : t('lb.hidden');
  return row.nameShort;
}
function subOf(row) {
  if (activeTab.value === 'Classes' || activeTab.value === 'Shanyraks') return `${row.members} · ${row.confirmedBooks} ${t('common.books')}`;
  return [row.className, row.shanyrakName].filter(Boolean).join(' · ') || '—';
}

async function load() {
  if (!session.uid || !session.emailVerified) return;
  loading.value = true;
  error.value = false;
  try {
    rows.value = await getLeaderboard();
    privacy.value = myRow.value?.privacyMode || 'short';
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

async function savePrivacy(mode) {
  savingPrivacy.value = true;
  try {
    await setMyPrivacy(mode);
    privacy.value = mode;
    await load();
    toast.value = t('common.saved');
  } catch {
    toast.value = t('admin.errors.default');
  } finally {
    savingPrivacy.value = false;
    setTimeout(() => { toast.value = ''; }, 2500);
  }
}

watch(() => [session.ready, session.uid], load, { immediate: true });
</script>

<style scoped>
.lb-controls { display: flex; gap: 12px; flex-wrap: wrap; justify-content: space-between; margin-bottom: 22px; }
.lb-podium {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  align-items: end;
}
.lb-place {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  animation: kp-rise 0.5s var(--apple-spring) both;
  min-width: 0;
}
.lb-place.place-1 { order: 2; padding-top: 30px; padding-bottom: 30px; border-color: rgba(246, 238, 225, 0.35); }
.lb-place.place-2 { order: 1; animation-delay: 80ms; }
.lb-place.place-3 { order: 3; animation-delay: 140ms; }
.lb-place.me { box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.5) inset; }
.lb-medal {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 18px;
  color: #0b1424;
  background: #CBD5E1;
}
.place-1 .lb-medal { background: var(--apple-cream); width: 52px; height: 52px; font-size: 20px; }
.place-3 .lb-medal { background: #D6A77A; }
.lb-name { font-size: 16px; overflow-wrap: anywhere; }
.lb-sub { font-size: 13px; color: var(--apple-text-muted); }
.lb-score { font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums; }
.lb-score small { font-size: 12px; font-weight: 500; color: var(--apple-text-muted); }
.lb-badges { display: flex; gap: 4px; }
.lb-badge {
  min-width: 26px;
  height: 26px;
  padding: 0 6px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid rgba(246, 238, 225, 0.4);
  color: var(--apple-cream);
  transition: transform 0.25s var(--apple-spring);
}
.lb-badge:hover { transform: scale(1.12); }
.lb-me td { background: rgba(56, 189, 248, 0.06); }
.lb-you { margin-left: 8px; }
.lb-rules { margin-top: 14px; }
.lb-privacy .kp-chips { margin-bottom: 8px; }

@media (max-width: 640px) {
  .lb-podium { grid-template-columns: 1fr; }
  .lb-place.place-1, .lb-place.place-2, .lb-place.place-3 { order: 0; padding: 16px; }
  .lb-controls .kp-tabs { width: 100%; }
}
</style>
