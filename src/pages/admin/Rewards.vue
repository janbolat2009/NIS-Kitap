<template>
  <PageShell>
    <AdminNav />
    <header class="kp-head">
      <div>
        <h1 class="kp-title">{{ t('rewards.title') }}</h1>
        <p class="kp-subtitle">{{ t('rewards.subtitle') }}</p>
      </div>
    </header>

    <StaffGate permission="rewards.view">
      <p class="rw-note" role="note">{{ t('rewards.gradeNote') }}</p>

      <div class="kp-tabs rw-tabs" role="tablist">
        <button v-for="tab in tabs" :key="tab.id" role="tab" class="kp-tab" :class="{ active: activeTab === tab.id }" :aria-selected="activeTab === tab.id" @click="activeTab = tab.id">{{ tab.label }}</button>
      </div>

      <!-- Issues -->
      <section v-if="activeTab === 'issues'">
        <div class="kp-filters rw-filters">
          <div class="kp-field">
            <label class="kp-label" for="rf-status">{{ t('rewards.filterStatus') }}</label>
            <select id="rf-status" v-model="filterStatus" class="kp-select">
              <option value="">{{ t('common.all') }}</option>
              <option v-for="s in REWARD_STATUSES" :key="s" :value="s">{{ t(`rewards.statuses.${s}`) }}</option>
            </select>
          </div>
          <div class="kp-field">
            <label class="kp-label" for="rf-type">{{ t('rewards.filterType') }}</label>
            <select id="rf-type" v-model="filterType" class="kp-select">
              <option value="">{{ t('common.all') }}</option>
              <option v-for="tp in REWARD_TYPES" :key="tp" :value="tp">{{ t(`rewards.types.${tp}`) }}</option>
            </select>
          </div>
        </div>
        <div v-if="loading" class="kp-skeleton" style="height: 240px"></div>
        <div v-else-if="loadError" class="kp-state" role="alert">
          <h3>{{ t('common.errorTitle') }}</h3>
          <button class="kp-btn" @click="load">{{ t('common.retry') }}</button>
        </div>
        <DataTable
          v-else
          :rows="issueRows"
          :columns="issueColumns"
          :search-fields="['title', 'recipientName', 'className', 'reason', 'certificateNumber']"
          default-sort="createdAt"
          export-name="nis-kitap-rewards"
          :empty-text="t('rewards.empty')"
        >
          <template #cell-statusLabel="{ row }">
            <span class="kp-pill" :class="tone(row.status)">{{ row.statusLabel }}</span>
          </template>
          <template #cell-actions="{ row }">
            <div class="rw-actions">
              <button v-for="to in allowedNext(row)" :key="to" class="kp-btn small" :class="{ primary: to !== 'rejected' && to !== 'expired', danger: to === 'rejected' }" :disabled="busy === row.id" @click="move(row, to)">
                {{ t(`rewards.actions.${to}`) }}
              </button>
              <router-link v-if="row.certificateNumber" :to="`/certificate/${row.certificateNumber}`" class="kp-btn small">{{ t('rewards.certificate') }}</router-link>
              <button class="kp-btn small" @click="historyFor = row">{{ t('rewards.history') }}</button>
            </div>
          </template>
        </DataTable>
      </section>

      <!-- New reward -->
      <section v-if="activeTab === 'new'" class="kp-card rw-form">
        <div class="kp-field">
          <label class="kp-label" for="rn-recipient">{{ t('rewards.recipient') }}</label>
          <input id="rn-recipient" v-model="recipientQuery" class="kp-input" :placeholder="t('rewards.recipientHint')" autocomplete="off" @input="form.recipient = null" />
          <ul v-if="recipientMatches.length && !form.recipient" class="rw-suggest" role="listbox">
            <li v-for="r in recipientMatches" :key="r.uid"><button type="button" @click="pickRecipient(r)">{{ r.label }}</button></li>
          </ul>
        </div>
        <div class="kp-field">
          <label class="kp-label" for="rn-type">{{ t('rewards.type') }}</label>
          <select id="rn-type" v-model="form.type" class="kp-select">
            <option v-for="tp in REWARD_TYPES" :key="tp" :value="tp">{{ t(`rewards.types.${tp}`) }}</option>
          </select>
        </div>
        <div v-if="form.type === 'subject_points'" class="kp-field">
          <label class="kp-label" for="rn-subject">{{ t('rewards.subject') }}</label>
          <select id="rn-subject" v-model="form.subject" class="kp-select">
            <option v-for="s in SUBJECTS" :key="s" :value="s">{{ t(`rewards.subjects.${s}`) }}</option>
          </select>
        </div>
        <div class="kp-field">
          <label class="kp-label" for="rn-title">{{ t('rewards.titleField') }}</label>
          <input id="rn-title" v-model="form.title" class="kp-input" maxlength="200" />
        </div>
        <div class="kp-field">
          <label class="kp-label" for="rn-reason">{{ t('common.reason') }}</label>
          <textarea id="rn-reason" v-model="form.reason" class="kp-textarea" maxlength="1000"></textarea>
        </div>
        <div class="rw-row">
          <div v-if="form.type === 'points'" class="kp-field">
            <label class="kp-label" for="rn-points">{{ t('rewards.pointsField') }}</label>
            <input id="rn-points" v-model.number="form.points" class="kp-input" type="number" min="1" max="1000" />
          </div>
          <div v-if="form.type === 'badge'" class="kp-field">
            <label class="kp-label" for="rn-badge">{{ t('rewards.badgeField') }}</label>
            <input id="rn-badge" v-model="form.badge" class="kp-input" maxlength="60" />
          </div>
          <div v-if="['store_certificate', 'physical_prize', 'certificate'].includes(form.type)" class="kp-field">
            <label class="kp-label" for="rn-nominal">{{ t('rewards.nominal') }}</label>
            <input id="rn-nominal" v-model="form.nominal" class="kp-input" maxlength="100" />
          </div>
          <div class="kp-field">
            <label class="kp-label" for="rn-valid">{{ t('rewards.validUntil') }}</label>
            <input id="rn-valid" v-model="form.validUntil" class="kp-input" type="date" />
          </div>
        </div>
        <button class="kp-btn primary" :disabled="busy === 'new' || !canPropose" @click="createIssue">{{ t('rewards.create') }}</button>
      </section>

      <!-- Candidates -->
      <section v-if="activeTab === 'candidates'">
        <p class="kp-muted">{{ t('rewards.candidatesHint') }}</p>
        <DataTable
          :rows="candidates"
          :columns="candidateColumns"
          default-sort="confirmedBooks"
          :page-size="15"
          :empty-text="t('lb.empty')"
        >
          <template #cell-actions="{ row }">
            <button v-if="canPropose" class="kp-btn small primary" @click="proposeFor(row)">{{ t('rewards.propose') }}</button>
          </template>
        </DataTable>
      </section>

      <!-- Catalog -->
      <section v-if="activeTab === 'catalog'" class="rw-catalog">
        <div class="kp-grid">
          <article v-for="item in catalog" :key="item.id" class="kp-card">
            <span class="kp-pill violet">{{ t(`rewards.types.${item.type}`) }}</span>
            <h3 class="rw-cat-title">{{ item.name }}</h3>
            <p class="kp-muted">{{ item.description }}</p>
            <p class="kp-muted">{{ t('rewards.catalogPoints') }}: {{ item.pointsRequired || '—' }} · {{ t('rewards.catalogQty') }}: {{ item.quantity ?? '—' }}</p>
          </article>
          <p v-if="!catalog.length" class="kp-muted">{{ t('rewards.catalogEmpty') }}</p>
        </div>
        <form v-if="canPropose" class="kp-card rw-form kp-section" @submit.prevent="addCatalog">
          <h2 class="kp-h2">{{ t('rewards.catalogAdd') }}</h2>
          <div class="rw-row">
            <div class="kp-field"><label class="kp-label" for="c-name">{{ t('rewards.catalogName') }}</label><input id="c-name" v-model="catalogForm.name" class="kp-input" required maxlength="200" /></div>
            <div class="kp-field">
              <label class="kp-label" for="c-type">{{ t('rewards.type') }}</label>
              <select id="c-type" v-model="catalogForm.type" class="kp-select">
                <option v-for="tp in REWARD_TYPES" :key="tp" :value="tp">{{ t(`rewards.types.${tp}`) }}</option>
              </select>
            </div>
            <div class="kp-field"><label class="kp-label" for="c-pts">{{ t('rewards.catalogPoints') }}</label><input id="c-pts" v-model.number="catalogForm.pointsRequired" class="kp-input" type="number" min="0" /></div>
            <div class="kp-field"><label class="kp-label" for="c-qty">{{ t('rewards.catalogQty') }}</label><input id="c-qty" v-model="catalogForm.quantity" class="kp-input" type="number" min="0" /></div>
          </div>
          <div class="kp-field"><label class="kp-label" for="c-desc">{{ t('rewards.catalogDesc') }}</label><textarea id="c-desc" v-model="catalogForm.description" class="kp-textarea" maxlength="1000"></textarea></div>
          <button class="kp-btn primary" type="submit" :disabled="busy === 'catalog'">{{ t('common.save') }}</button>
        </form>
      </section>

      <div v-if="historyFor" class="rw-overlay" @click="historyFor = null">
        <div class="kp-card rw-dialog" role="dialog" aria-modal="true" :aria-label="t('rewards.history')" @click.stop>
          <h2 class="kp-h2">{{ historyFor.title }}</h2>
          <ol class="rw-history">
            <li v-for="(h, i) in historyFor.history || []" :key="i">
              <span class="kp-pill" :class="tone(h.status)">{{ t(`rewards.statuses.${h.status}`) }}</span>
              <span>{{ formatDate(h.at) }} · {{ h.byName || h.by }}</span>
              <p v-if="h.note" class="kp-muted">{{ h.note }}</p>
            </li>
          </ol>
          <button class="kp-btn" @click="historyFor = null">{{ t('common.close') }}</button>
        </div>
      </div>
    </StaffGate>

    <div v-if="toast" class="kp-toast" :class="{ error: toastError }" role="status">{{ toast }}</div>
  </PageShell>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import PageShell from '@/components/PageShell.vue';
import StaffGate from '@/components/StaffGate.vue';
import AdminNav from '@/components/AdminNav.vue';
import DataTable from '@/components/DataTable.vue';
import { session } from '@/stores/session';
import { can, cleanEmail } from '@/lib/roles';
import { REWARD_TYPES, REWARD_STATUSES, SUBJECTS, nextStatuses, canTransition } from '@/lib/workflow';
import { t, currentLocale } from '@/i18n';
import { listRewardIssues, listRewardCatalog, createRewardIssue, transitionReward, saveRewardCatalogItem } from '@/services/rewardsService';
import { listUsers, listStudents } from '@/services/adminService';
import { getLeaderboard } from '@/services/progressService';

const canPropose = computed(() => can(session.role, 'rewards.propose'));
const tabs = computed(() => [
  { id: 'issues', label: t('rewards.tabIssues') },
  ...(canPropose.value ? [{ id: 'new', label: t('rewards.tabNew') }, { id: 'candidates', label: t('rewards.tabCandidates') }] : []),
  { id: 'catalog', label: t('rewards.tabCatalog') },
]);
const activeTab = ref('issues');

const issues = ref([]);
const catalog = ref([]);
const recipients = ref([]);
const board = ref([]);
const loading = ref(false);
const loadError = ref(false);
const busy = ref('');
const toast = ref('');
const toastError = ref(false);
const filterStatus = ref('');
const filterType = ref('');
const historyFor = ref(null);

function notify(message, isError = false) {
  toast.value = message;
  toastError.value = isError;
  setTimeout(() => { toast.value = ''; }, 3500);
}
function errorText(err) {
  const key = err?.code || err?.message;
  const text = t(`admin.errors.${key}`);
  return text.startsWith('admin.errors.') ? t('admin.errors.default') : text;
}
function formatDate(value) {
  if (!value) return '—';
  const loc = currentLocale.value === 'kz' ? 'kk-KZ' : currentLocale.value === 'en' ? 'en-GB' : 'ru-RU';
  return new Date(value).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' });
}
function tone(status) {
  return { approved: 'green', issued: 'blue', claimed: 'green', rejected: 'red', expired: 'red', awaiting_approval: 'amber', proposed: 'violet' }[status] || '';
}

const issueRows = computed(() => issues.value
  .filter((i) => (!filterStatus.value || i.status === filterStatus.value) && (!filterType.value || i.type === filterType.value))
  .map((i) => ({
    ...i,
    statusLabel: t(`rewards.statuses.${i.status}`),
    typeLabel: t(`rewards.types.${i.type}`) + (i.subject ? ` · ${t(`rewards.subjects.${i.subject}`)}` : ''),
  })));
const issueColumns = computed(() => [
  { key: 'createdAt', label: t('common.date'), format: (r) => formatDate(r.createdAt) },
  { key: 'recipientName', label: t('rewards.recipient'), format: (r) => [r.recipientName, r.className].filter(Boolean).join(', ') },
  { key: 'typeLabel', label: t('rewards.type') },
  { key: 'title', label: t('rewards.titleField') },
  { key: 'statusLabel', label: t('common.status') },
  { key: 'certificateNumber', label: t('rewards.number') },
  { key: 'actions', label: t('common.actions'), sortable: false, format: () => '' },
]);

function allowedNext(issue) {
  return nextStatuses(issue.status).filter((to) => canTransition(session.role, issue, to, { uid: session.uid, subject: session.subject }));
}

async function move(issue, to) {
  busy.value = issue.id;
  try {
    await transitionReward(issue.id, to);
    await loadIssues();
    notify(t('common.saved'));
  } catch (err) {
    notify(errorText(err), true);
  } finally {
    busy.value = '';
  }
}

// ---------- new reward ----------
const emptyForm = () => ({ recipient: null, type: 'certificate', subject: 'kazakh', title: '', reason: '', points: 50, badge: '', nominal: '', validUntil: '' });
const form = reactive(emptyForm());
const recipientQuery = ref('');
const recipientMatches = computed(() => {
  const q = recipientQuery.value.trim().toLowerCase();
  if (q.length < 2) return [];
  return recipients.value.filter((r) => r.search.includes(q)).slice(0, 8);
});
function pickRecipient(r) {
  form.recipient = r;
  recipientQuery.value = r.label;
}
function proposeFor(row) {
  const r = recipients.value.find((x) => x.uid === row.id);
  if (r) pickRecipient(r);
  activeTab.value = 'new';
}
async function createIssue() {
  if (!form.recipient) {
    notify(t('admin.errors.recipient_required'), true);
    return;
  }
  busy.value = 'new';
  try {
    await createRewardIssue({
      uid: form.recipient.uid,
      recipientName: form.recipient.fullName,
      recipientEmail: form.recipient.email,
      className: form.recipient.className,
      type: form.type,
      title: form.title || t(`rewards.types.${form.type}`),
      reason: form.reason,
      nominal: form.nominal,
      subject: form.subject,
      validUntil: form.validUntil,
      points: form.points,
      badge: form.badge,
    });
    Object.assign(form, emptyForm());
    recipientQuery.value = '';
    notify(t('rewards.created'));
    activeTab.value = 'issues';
  } catch (err) {
    notify(errorText(err), true);
  } finally {
    busy.value = '';
  }
}

// ---------- candidates ----------
const candidates = computed(() => board.value
  .filter((r) => r.confirmedBooks > 0)
  .map((r) => {
    const rec = recipients.value.find((x) => x.uid === r.id);
    return { ...r, name: rec?.fullName || r.nameShort || '—', badgesLabel: (r.badges || []).map((b) => t(`badge.${b}`)).join(', ') };
  }));
const candidateColumns = computed(() => [
  { key: 'name', label: t('common.student') },
  { key: 'className', label: t('common.class') },
  { key: 'confirmedBooks', label: t('lb.confirmedBooks'), numeric: true },
  { key: 'hundredBooks', label: t('hundred.title'), numeric: true },
  { key: 'points', label: t('lb.points'), numeric: true },
  { key: 'badgesLabel', label: t('lb.badges') },
  { key: 'actions', label: t('common.actions'), sortable: false, format: () => '' },
]);

// ---------- catalog ----------
const catalogForm = reactive({ name: '', type: 'physical_prize', description: '', pointsRequired: 0, quantity: '' });
async function addCatalog() {
  busy.value = 'catalog';
  try {
    await saveRewardCatalogItem({ ...catalogForm });
    Object.assign(catalogForm, { name: '', type: 'physical_prize', description: '', pointsRequired: 0, quantity: '' });
    catalog.value = await listRewardCatalog();
    notify(t('common.saved'));
  } catch (err) {
    notify(errorText(err), true);
  } finally {
    busy.value = '';
  }
}

async function loadIssues() {
  issues.value = await listRewardIssues();
}

async function load() {
  if (!can(session.role, 'rewards.view')) return;
  loading.value = true;
  loadError.value = false;
  try {
    const [, cat] = await Promise.all([loadIssues(), listRewardCatalog().catch(() => [])]);
    catalog.value = cat;
    if (canPropose.value) {
      const [users, students, lb] = await Promise.all([listUsers().catch(() => []), listStudents().catch(() => []), getLeaderboard().catch(() => [])]);
      board.value = lb;
      const studentByEmail = new Map(students.map((s) => [cleanEmail(s.email), s]));
      recipients.value = users.map((u) => {
        const s = studentByEmail.get(cleanEmail(u.email)) || {};
        const fullName = s.fullName || u.name || u.email;
        return {
          uid: u.id,
          email: u.email,
          fullName,
          className: s.className || '',
          label: [fullName, s.className, u.email].filter(Boolean).join(' · '),
          search: [fullName, s.className, u.email].join(' ').toLowerCase(),
        };
      });
    }
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

watch(() => [session.ready, session.role], load, { immediate: true });
</script>

<style scoped>
.rw-note {
  margin: 0 0 18px;
  padding: 12px 16px;
  border-radius: var(--apple-radius-md);
  border: 1px solid rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.08);
  color: #FDE68A;
  font-size: 14px;
  line-height: 1.5;
}
.rw-tabs { margin-bottom: 20px; width: max-content; }
.rw-filters { margin-bottom: 14px; max-width: 520px; }
.rw-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.rw-form { display: grid; gap: 14px; max-width: 760px; }
.rw-row { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
.rw-suggest {
  list-style: none;
  margin: 6px 0 0;
  padding: 6px;
  border-radius: var(--apple-radius-md);
  border: 1px solid var(--apple-glass-border);
  background: #0b1424;
  max-height: 260px;
  overflow-y: auto;
}
.rw-suggest button { all: unset; display: block; width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 14px; }
.rw-suggest button:hover, .rw-suggest button:focus-visible { background: rgba(255, 255, 255, 0.08); }
.rw-cat-title { margin: 10px 0 6px; font-size: 16px; }
.rw-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.rw-dialog { width: min(520px, 100%); background: #0b1424; max-height: calc(100vh - 32px); overflow-y: auto; }
.rw-history { list-style: none; margin: 0 0 16px; padding: 0; display: grid; gap: 12px; }
.rw-history li { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 13px; color: var(--apple-text-secondary); }
.rw-history p { width: 100%; margin: 0; }
@media (max-width: 640px) { .rw-tabs { width: 100%; } }
</style>
