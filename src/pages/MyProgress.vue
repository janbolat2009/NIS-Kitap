<template>
  <PageShell>
    <header class="kp-head" v-reveal>
      <div>
        <h1 class="kp-title">{{ t('me.title') }}</h1>
        <p class="kp-subtitle">{{ t('me.subtitle') }}</p>
      </div>
      <div class="me-head-actions">
        <router-link to="/100-kitap" class="kp-btn">{{ t('nav.hundred') }}</router-link>
        <router-link to="/leaderboard" class="kp-btn">{{ t('nav.leaderboard') }}</router-link>
      </div>
    </header>

    <StaffGate>
      <div v-if="loading" class="kp-kpis">
        <div v-for="n in 4" :key="n" class="kp-skeleton" style="height: 86px"></div>
      </div>
      <div v-else-if="error" class="kp-state" role="alert">
        <h3>{{ t('common.errorTitle') }}</h3>
        <p>{{ t('common.errorDesc') }}</p>
        <button class="kp-btn" @click="load">{{ t('common.retry') }}</button>
      </div>
      <template v-else>
        <section class="me-top">
          <div class="kp-card me-ring">
            <ProgressRing :value="hundredConfirmed" :max="100" :label="t('hundred.progressOf', { count: hundredConfirmed })" />
            <div>
              <strong>{{ t('hundred.progressOf', { count: hundredConfirmed }) }}</strong>
              <p class="kp-muted">{{ t('hundred.confirmedNote') }}</p>
            </div>
          </div>
          <div class="kp-kpis kp-stagger me-kpis">
            <div class="kp-kpi"><strong>{{ summary.total }}</strong><span>{{ t('me.points') }}</span></div>
            <div class="kp-kpi"><strong>{{ rank || '—' }}</strong><span>{{ t('me.place') }}</span></div>
            <div class="kp-kpi"><strong>{{ confirmed.length }}</strong><span>{{ t('me.confirmed') }}</span></div>
            <div class="kp-kpi"><strong>{{ pending.length }}</strong><span>{{ t('me.pendingBooks') }}</span></div>
          </div>
        </section>

        <section class="kp-section">
          <h2 class="kp-h2">{{ t('me.badges') }}</h2>
          <div v-if="summary.badges.length" class="me-badges kp-stagger">
            <div v-for="b in summary.badges" :key="b" class="me-badge">
              <span class="me-badge-num">{{ b.split('_')[1] || '★' }}</span>
              <span>{{ t(`badge.${b}`) !== `badge.${b}` ? t(`badge.${b}`) : b }}</span>
            </div>
          </div>
          <p v-else class="kp-muted">{{ t('me.noBadges') }}</p>
        </section>

        <div class="me-columns kp-section">
          <section class="kp-card">
            <h2 class="kp-h2">{{ t('me.readBooks') }}</h2>
            <ul v-if="confirmed.length" class="me-list">
              <li v-for="p in confirmed" :key="p.id">
                <strong>{{ p.bookTitle }}</strong>
                <span class="kp-muted">{{ p.bookAuthor }}</span>
                <span v-if="p.isHundred" class="kp-pill green">100 кітап</span>
              </li>
            </ul>
            <p v-else class="kp-muted">{{ t('me.noBooks') }}</p>
          </section>

          <section class="kp-card">
            <h2 class="kp-h2">{{ t('me.pendingBooks') }}</h2>
            <ul v-if="pending.length || rejected.length" class="me-list">
              <li v-for="p in pending" :key="p.id">
                <strong>{{ p.bookTitle }}</strong>
                <span class="kp-pill amber">{{ t('status.pending') }}</span>
              </li>
              <li v-for="p in rejected" :key="p.id">
                <strong>{{ p.bookTitle }}</strong>
                <span class="kp-pill red">{{ t('status.rejected') }}</span>
                <span v-if="p.decisionNote" class="kp-muted">{{ t('me.decisionNote') }}: {{ p.decisionNote }}</span>
              </li>
            </ul>
            <p v-else class="kp-muted">{{ t('common.none') }}</p>
          </section>
        </div>

        <div class="me-columns kp-section">
          <section class="kp-card">
            <h2 class="kp-h2">{{ t('me.rewardsIssued') }}</h2>
            <ul v-if="issuedRewards.length" class="me-list">
              <li v-for="r in issuedRewards" :key="r.id">
                <strong>{{ r.title }}</strong>
                <span class="kp-muted">{{ t(`rewards.types.${r.type}`) }}</span>
                <router-link v-if="r.certificateNumber" :to="`/certificate/${r.certificateNumber}`" class="kp-btn small">{{ t('me.openCertificate') }}</router-link>
              </li>
            </ul>
            <p v-else class="kp-muted">{{ t('me.noRewards') }}</p>
          </section>
          <section class="kp-card">
            <h2 class="kp-h2">{{ t('me.rewardsPending') }}</h2>
            <ul v-if="pendingRewards.length" class="me-list">
              <li v-for="r in pendingRewards" :key="r.id">
                <strong>{{ r.title }}</strong>
                <span class="kp-pill amber">{{ t(`rewards.statuses.${r.status}`) }}</span>
              </li>
            </ul>
            <p v-else class="kp-muted">{{ t('me.noRewards') }}</p>
          </section>
        </div>

        <section class="kp-section">
          <h2 class="kp-h2">{{ t('me.history') }}</h2>
          <DataTable
            :rows="historyRows"
            :columns="historyColumns"
            default-sort="createdAt"
            :page-size="10"
            :empty-text="t('common.none')"
          />
        </section>

        <section v-if="bookmarks.length" class="kp-section">
          <h2 class="kp-h2">{{ t('me.bookmarks') }}</h2>
          <div class="kp-chips">
            <router-link v-for="b in bookmarks" :key="b.id" :to="`/book/${encodeURIComponent(b.bookTitle)}`" class="kp-chip">{{ b.bookTitle }}</router-link>
          </div>
        </section>
      </template>
    </StaffGate>
  </PageShell>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import PageShell from '@/components/PageShell.vue';
import StaffGate from '@/components/StaffGate.vue';
import ProgressRing from '@/components/ProgressRing.vue';
import DataTable from '@/components/DataTable.vue';
import { session } from '@/stores/session';
import { t, currentLocale } from '@/i18n';
import { rankRows, summarizeLedger } from '@/lib/points';
import { getMyProgress, getMyLedger, getMyRewards, getMyBookmarks, getLeaderboard } from '@/services/progressService';

const loading = ref(true);
const error = ref(false);
const progress = ref([]);
const ledger = ref([]);
const rewards = ref([]);
const bookmarks = ref([]);
const rank = ref(null);

const summary = computed(() => summarizeLedger(ledger.value));
const confirmed = computed(() => progress.value.filter((p) => p.verificationStatus === 'confirmed'));
const pending = computed(() => progress.value.filter((p) => p.verificationStatus === 'pending'));
const rejected = computed(() => progress.value.filter((p) => p.verificationStatus === 'rejected'));
const hundredConfirmed = computed(() => confirmed.value.filter((p) => p.isHundred).length);
const issuedRewards = computed(() => rewards.value.filter((r) => ['issued', 'claimed'].includes(r.status)));
const pendingRewards = computed(() => rewards.value.filter((r) => ['proposed', 'awaiting_approval', 'approved'].includes(r.status)));

const reasonLabels = {
  book_confirmed: () => t('status.confirmed'),
  hundred_books_bonus: () => t('admin.sHundred'),
  meaningful_review: () => t('admin.sReview'),
  reread_confirmed: () => t('admin.sReread'),
};
const historyRows = computed(() => ledger.value.map((e) => ({
  ...e,
  label: reasonLabels[e.reason]?.() || (e.badge ? t(`badge.${e.badge}`) : e.reason),
})));
const historyColumns = computed(() => [
  { key: 'createdAt', label: t('common.date'), format: (r) => formatDate(r.createdAt) },
  { key: 'label', label: t('common.reason') },
  { key: 'points', label: t('lb.points'), numeric: true },
]);

function formatDate(value) {
  if (!value) return '—';
  const loc = currentLocale.value === 'kz' ? 'kk-KZ' : currentLocale.value === 'en' ? 'en-GB' : 'ru-RU';
  return new Date(value).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' });
}

async function load() {
  if (!session.uid || !session.emailVerified) return;
  loading.value = true;
  error.value = false;
  try {
    const [p, l, r, b, board] = await Promise.all([
      getMyProgress(),
      getMyLedger(),
      getMyRewards(),
      getMyBookmarks().catch(() => []),
      getLeaderboard().catch(() => []),
    ]);
    progress.value = [...p.values()];
    ledger.value = l;
    rewards.value = r;
    bookmarks.value = b;
    rank.value = rankRows(board, (row) => row.points).find((row) => row.id === session.uid)?.rank || null;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

watch(() => [session.ready, session.uid], load, { immediate: true });
</script>

<style scoped>
.me-head-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.me-top { display: grid; grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.4fr); gap: 16px; align-items: stretch; }
.me-ring { display: flex; gap: 18px; align-items: center; }
.me-ring strong { font-size: 18px; }
.me-ring p { margin: 6px 0 0; }
.me-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.me-badges { display: flex; flex-wrap: wrap; gap: 12px; }
.me-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px 8px 8px;
  border-radius: var(--apple-radius-pill);
  border: 1px solid rgba(246, 238, 225, 0.3);
  font-size: 14px;
  transition: transform 0.25s var(--apple-spring);
}
.me-badge:hover { transform: translateY(-2px); }
.me-badge-num {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 800;
  color: #0b1424;
  background: var(--apple-cream);
}
.me-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.me-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.me-list li { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; font-size: 14px; padding-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
.me-list li:last-child { border-bottom: 0; padding-bottom: 0; }
.me-list strong { overflow-wrap: anywhere; }
@media (max-width: 860px) {
  .me-top, .me-columns { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .me-ring { flex-direction: column; align-items: flex-start; }
}
</style>
