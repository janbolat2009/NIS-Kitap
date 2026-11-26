<template>
  <div class="page container cabinet">
    <header class="page-head">
      <div>
        <span class="eyebrow">{{ session.email }}</span>
        <h1 class="page-title">{{ session.name || t('cabinet.title') }}</h1>
        <p class="who">
          <span v-if="p?.className">{{ t('cabinet.class') }} <b>{{ p.className }}</b></span>
          <span v-if="p?.className">· {{ t('cabinet.shanyrak') }} <b>{{ p.shanyrakName || t('cabinet.notMapped') }}</b></span>
          <button v-if="session.role === 'student' && session.needsClass" type="button" class="btn btn-sm btn-primary" @click="showClass = true">{{ t('cabinet.chooseClass') }}</button>
        </p>
      </div>
    </header>

    <p v-if="!session.emailVerified" class="notice notice-warning verify">
      <span>{{ t('cabinet.verifyEmail', { email: session.email }) }}</span>
      <button type="button" class="btn btn-sm btn-secondary" @click="resendVerify">{{ t('cabinet.resendVerify') }}</button>
    </p>

    <div class="tabs" role="tablist">
      <button v-for="tb in tabs" :key="tb" type="button" class="tab" role="tab" :aria-selected="tab === tb" @click="tab = tb">{{ t(`cabinet.${tb}`) }}</button>
    </div>

    <section v-if="tab === 'overview'" class="panel rise-in">
      <div class="stats">
        <div class="stat"><strong>{{ yearPoints }}</strong><span>{{ t('cabinet.totalPoints') }}</span></div>
        <div class="stat"><strong>{{ points.summary?.confirmedBooks || 0 }}</strong><span>{{ t('cabinet.confirmedBooks') }}</span></div>
        <div class="stat"><strong>{{ openLoans.length }}</strong><span>{{ t('cabinet.openLoans') }}</span></div>
      </div>
      <p v-if="unassigned" class="notice notice-info">{{ t('cabinet.unassigned', { n: unassigned }) }}</p>
      <h2 class="section-title">{{ t('cabinet.loans') }}</h2>
      <LoanList :items="openLoans" @cancel="cancel" />
    </section>

    <section v-else-if="tab === 'reading'" class="panel rise-in">
      <div v-if="!readingList.length" class="empty"><p>{{ t('cabinet.noReading') }}</p><router-link to="/100-kitap" class="btn btn-secondary">{{ t('nav.hundred') }}</router-link></div>
      <div v-for="g in readingGroups" :key="g.key" class="group">
        <h2 class="section-title">{{ t(`status.${g.key}`) }} <span class="muted">· {{ g.items.length }}</span></h2>
        <ul class="rows">
          <li v-for="r in g.items" :key="r.id" class="row-item">
            <div class="row-main">
              <div class="row-title">{{ r.bookTitle }}</div>
              <div class="row-meta">{{ r.bookAuthor }}<span v-if="r.isHundred"> · 100 кітап</span><span v-if="r.decisionNote"> · {{ r.decisionNote }}</span></div>
            </div>
            <span v-if="r.pointsAwarded" class="badge badge-success">+{{ r.pointsAwarded }}</span>
          </li>
        </ul>
      </div>
    </section>

    <section v-else-if="tab === 'loans'" class="panel rise-in">
      <LoanList :items="loans" show-all @cancel="cancel" />
    </section>

    <section v-else-if="tab === 'points'" class="panel rise-in">
      <h2 class="section-title">{{ t('cabinet.history') }}</h2>
      <p v-if="!points.ledger.length" class="empty">{{ t('cabinet.noPoints') }}</p>
      <ul v-else class="rows">
        <li v-for="e in points.ledger" :key="e.id" class="row-item" :class="{ reversed: e.reversed }">
          <div class="row-main">
            <div class="row-title">{{ t(`action.${actionOf(e)}`) }}<span v-if="e.reversed" class="badge">{{ t('cabinet.reversed') }}</span></div>
            <div class="row-meta">
              <span v-if="e.bookTitle">{{ e.bookTitle }} · </span>{{ fmtDate(e.createdAt) }}
              <span v-if="e.className"> · {{ e.className }}</span><span v-if="e.shanyrakName"> · {{ e.shanyrakName }}</span>
              <span v-if="e.reason"> · {{ t('cabinet.reason') }}: {{ e.reason }}</span>
            </div>
          </div>
          <span class="pts tabular" :class="{ neg: e.points < 0 }">{{ e.points > 0 ? '+' : '' }}{{ e.points }}</span>
        </li>
      </ul>
    </section>

    <section v-else-if="tab === 'rewards'" class="panel rise-in">
      <h2 class="section-title">{{ t('cabinet.myRewards') }}</h2>
      <p v-if="!myRewards.length" class="muted">{{ t('cabinet.noRewards') }}</p>
      <ul v-else class="rows">
        <li v-for="r in myRewards" :key="r.id" class="row-item">
          <div class="row-main">
            <div class="row-title">{{ r.title }}</div>
            <div class="row-meta">{{ t(`reward.${r.type}`) }} · {{ fmtDate(r.updatedAt) }}<span v-if="r.certificateNumber"> · <router-link :to="`/certificate/${r.certificateNumber}`">{{ r.certificateNumber }}</router-link></span></div>
          </div>
          <span class="badge" :class="{ 'badge-success': r.status === 'issued', 'badge-warning': ['requested', 'pending_approval'].includes(r.status), 'badge-danger': ['rejected', 'revoked'].includes(r.status) }">{{ t(`reward.${r.status}`) }}</span>
        </li>
      </ul>
      <h2 class="section-title catalog-title">{{ t('cabinet.catalogRewards') }}</h2>
      <div class="reward-grid">
        <article v-for="r in rewardCatalog" :key="r.id" class="card reward">
          <span class="badge badge-warm">{{ t(`reward.${r.type}`) }}</span>
          <h3>{{ r.title }}</h3>
          <p v-if="r.description" class="muted">{{ r.description }}</p>
          <p class="cond"><b>{{ t('cabinet.conditions') }}:</b> {{ r.conditions }}</p>
          <p class="muted small">{{ r.approval === 'director' ? t('reward.byDirector') : t('reward.byLibrarian') }}</p>
          <button v-if="r.claimable" type="button" class="btn btn-secondary btn-sm" :disabled="busy" @click="claim(r)">{{ t('cabinet.request') }}</button>
        </article>
      </div>
    </section>

    <section v-else class="panel rise-in settings">
      <fieldset class="card">
        <legend>{{ t('cabinet.privacy') }}</legend>
        <label class="check"><input v-model="privacy" type="radio" value="short" @change="savePrivacy" /> {{ t('cabinet.privacyShort') }}</label>
        <label class="check"><input v-model="privacy" type="radio" value="hidden" @change="savePrivacy" /> {{ t('cabinet.privacyHidden') }}</label>
      </fieldset>
      <fieldset class="card">
        <legend>{{ t('theme.label') }}</legend>
        <div class="seg">
          <button type="button" :aria-pressed="themePref === 'system'" @click="setTheme('system')">Auto</button>
          <button type="button" :aria-pressed="themePref === 'light'" @click="setTheme('light')">{{ t('theme.toLight') }}</button>
          <button type="button" :aria-pressed="themePref === 'dark'" @click="setTheme('dark')">{{ t('theme.toDark') }}</button>
        </div>
      </fieldset>
      <button type="button" class="btn btn-danger" @click="doLogout">{{ t('cabinet.logout') }}</button>
    </section>

    <ClassOnboarding v-if="showClass" @close="showClass = false" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch, defineComponent, h } from 'vue';
import { useRouter } from 'vue-router';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/firebase';
import { t, currentLocale } from '@/i18n';
import { session, refreshMe, logout } from '@/stores/session';
import { toast } from '@/stores/ui';
import { themePref, setTheme } from '@/stores/theme';
import { actionOf } from '@/lib/points';
import { displayStatus } from '@/lib/workflow';
import { post, errorMessage } from '@/services/api';
import {
  watchMyReservations, watchMyProgress, cancelReservation, getMyPoints, listMyRewardIssues, listRewardCatalog, claimReward,
} from '@/services/library';
import ClassOnboarding from '@/components/ClassOnboarding.vue';

const router = useRouter();
const tabs = ['overview', 'reading', 'loans', 'points', 'rewards', 'settings'];
const tab = ref('overview');
const loans = ref([]);
const progress = ref(new Map());
const points = ref({ summary: null, ledger: [] });
const myRewards = ref([]);
const rewardCatalog = ref([]);
const busy = ref(false);
const showClass = ref(false);
const privacy = ref('short');
let stops = [];

const p = computed(() => session.profile);
const year = computed(() => session.school?.currentAcademicYear || '');
const yearPoints = computed(() => Number(points.value.summary?.years?.[year.value]?.total) || 0);
const unassigned = computed(() => points.value.ledger.filter((e) => !e.shanyrakId && e.academicYear === year.value).reduce((s, e) => s + (Number(e.points) || 0), 0));
const openLoans = computed(() => loans.value.filter((l) => ['requested', 'ready', 'issued'].includes(l.status)));
const readingList = computed(() => [...progress.value.values()]);
const readingGroups = computed(() => {
  const order = ['reading', 'pending', 'want', 'finished', 'confirmed', 'rejected', 'revoked'];
  return order.map((key) => ({ key, items: readingList.value.filter((r) => displayStatus(r) === key) })).filter((g) => g.items.length);
});

const loc = () => ({ kz: 'kk-KZ', en: 'en-GB' }[currentLocale.value] || 'ru-RU');
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(loc(), { day: 'numeric', month: 'short', year: 'numeric' }) : '');

// Reservation list (overview and the «Брони» tab).
const LoanList = defineComponent({
  props: { items: { type: Array, default: () => [] }, showAll: Boolean },
  emits: ['cancel'],
  setup(props, { emit }) {
    const fmt = (iso, time) => (iso ? new Date(iso).toLocaleString(loc(), time ? { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'long' }) : '');
    return () => (props.items.length
      ? h('ul', { class: 'rows' }, props.items.map((l) => h('li', { class: 'row-item', key: l.id }, [
        h('div', { class: 'row-main' }, [
          h('div', { class: 'row-title' }, l.bookTitle || l.title),
          h('div', { class: 'row-meta' }, [
            `${t('loan.code')}: ${l.code || l.id}`,
            l.pickup ? ` · ${t('loan.pickup')}: ${fmt(l.pickup.start)}, ${l.pickup.from}–${l.pickup.to}, ${l.pickup.place}` : '',
            l.holdUntil && ['requested', 'ready'].includes(l.status) ? ` · ${t('loan.holdUntil')}: ${fmt(l.holdUntil, true)}` : '',
            l.dueDate && l.status === 'issued' ? ` · ${t('loan.due')}: ${fmt(l.dueDate)}` : '',
          ]),
        ]),
        h('div', { class: 'row-actions' }, [
          h('span', { class: ['badge', { 'badge-success': l.status === 'ready', 'badge-info': l.status === 'issued', 'badge-warning': l.status === 'requested' }] }, t(`loan.${l.status}`)),
          ['requested', 'ready'].includes(l.status) ? h('button', { type: 'button', class: 'btn btn-danger btn-sm', onClick: () => emit('cancel', l) }, t('loan.cancel')) : null,
        ]),
      ])))
      : h('p', { class: 'muted' }, t('cabinet.noLoans')));
  },
});

async function cancel(l) {
  try {
    await cancelReservation(l.id);
    toast(t('loan.cancelled'));
  } catch (err) {
    toast(errorMessage(err, currentLocale.value), { type: 'error' });
  }
}

async function claim(r) {
  busy.value = true;
  try {
    await claimReward(r.id);
    myRewards.value = await listMyRewardIssues();
    toast(t('reward.requested'));
  } catch (err) {
    toast(errorMessage(err, currentLocale.value), { type: 'error' });
  } finally {
    busy.value = false;
  }
}

async function savePrivacy() {
  try {
    await post('me/privacy', { mode: privacy.value });
    await refreshMe();
  } catch (err) {
    toast(errorMessage(err, currentLocale.value), { type: 'error' });
  }
}

async function resendVerify() {
  try {
    await sendEmailVerification(auth.currentUser);
    toast(t('authx.verifySent'));
  } catch {
    toast(errorMessage({ code: 'rate_limited' }, currentLocale.value), { type: 'error' });
  }
}

async function doLogout() {
  await logout();
  router.push('/');
}

watch(() => session.uid, async (uid) => {
  stops.forEach((s) => s());
  stops = [];
  if (!uid) return;
  privacy.value = session.profile?.privacyMode || 'short';
  stops.push(watchMyReservations((l) => { loans.value = l; }));
  stops.push(watchMyProgress((m) => { progress.value = m; }));
  const [pts, mine, cat] = await Promise.all([getMyPoints(), listMyRewardIssues().catch(() => []), listRewardCatalog().catch(() => [])]);
  points.value = pts;
  myRewards.value = mine;
  rewardCatalog.value = cat;
}, { immediate: true });
onBeforeUnmount(() => stops.forEach((s) => s()));
</script>

<style scoped>
.who { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; color: var(--text-2); }
.verify { justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
.tabs { margin-bottom: 24px; }
.panel { display: flex; flex-direction: column; gap: 20px; }
.group + .group { margin-top: 8px; }
.reversed .row-title { text-decoration: line-through; color: var(--text-3); }
.reversed .badge { margin-left: 8px; text-decoration: none; }
.pts { font-weight: 700; color: var(--success); }
.pts.neg { color: var(--danger); }
.catalog-title { margin-top: 12px; }
.reward-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.reward { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.reward h3 { font-size: var(--fs-lg); }
.cond { font-size: var(--fs-sm); }
.small { font-size: var(--fs-xs); }
.settings { max-width: 560px; }
fieldset { display: flex; flex-direction: column; gap: 10px; margin: 0; }
legend { font-weight: 650; padding: 0 6px; }
.seg { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid var(--line-strong); border-radius: var(--r-md); overflow: hidden; }
.seg button { min-height: 42px; border: none; background: var(--surface); color: var(--text-2); font-weight: 600; font-size: var(--fs-sm); cursor: pointer; }
.seg button + button { border-left: 1px solid var(--line-strong); }
.seg button[aria-pressed='true'] { background: var(--text-1); color: var(--bg); }
.settings > .btn { align-self: flex-start; }
</style>
