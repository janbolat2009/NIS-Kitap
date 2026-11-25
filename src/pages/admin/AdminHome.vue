<template>
  <PageShell>
    <AdminNav />
    <header class="kp-head">
      <div>
        <h1 class="kp-title">{{ t('admin.title') }}</h1>
        <p class="kp-subtitle">{{ t('admin.subtitle') }}</p>
      </div>
    </header>

    <StaffGate :permission="['reading.verify', 'loans.manage', 'points.adjust', 'audit.view']">
      <div class="kp-tabs ah-tabs" role="tablist">
        <button v-for="tab in tabs" :key="tab.id" role="tab" class="kp-tab" :class="{ active: activeTab === tab.id }" :aria-selected="activeTab === tab.id" @click="activeTab = tab.id">
          {{ tab.label }}<span v-if="tab.id === 'queue' && queue.length" class="ah-count">{{ queue.length }}</span>
        </button>
      </div>

      <!-- Verification queue -->
      <section v-if="activeTab === 'queue'" class="ah-panel">
        <div v-if="loadingQueue" class="ah-stack"><div v-for="n in 3" :key="n" class="kp-skeleton" style="height: 150px"></div></div>
        <div v-else-if="queueError" class="kp-state" role="alert">
          <h3>{{ t('common.errorTitle') }}</h3>
          <button class="kp-btn" @click="loadQueue">{{ t('common.retry') }}</button>
        </div>
        <div v-else-if="!queue.length" class="kp-state"><h3>{{ t('admin.queueEmpty') }}</h3></div>
        <TransitionGroup v-else tag="ul" name="ah-list" class="ah-stack">
          <li v-for="item in queue" :key="item.id" class="kp-card ah-request">
            <div class="ah-request-head">
              <div>
                <strong class="ah-book">{{ item.bookTitle }}</strong>
                <span class="kp-muted"> — {{ item.bookAuthor }}</span>
                <div class="ah-meta">
                  <span>{{ item.email }}</span>
                  <span>· {{ t('admin.requested') }}: {{ formatDate(item.requestedAt) }}</span>
                  <span v-if="item.isHundred" class="kp-pill green">100 кітап</span>
                  <span v-if="item.loanReturned" class="kp-pill blue">{{ t('admin.evidenceLoan') }}</span>
                </div>
              </div>
              <div v-if="item.flags?.length" class="ah-flags">
                <span class="kp-pill amber" :title="t('admin.flags')">⚑ {{ item.flags.map((f) => t(`admin.flag_${f}`)).join(', ') }}</span>
              </div>
            </div>
            <blockquote v-if="item.review" class="ah-review">{{ item.review }}</blockquote>
            <p v-else class="kp-muted">{{ t('admin.noReview') }}</p>
            <div class="ah-decision">
              <label v-if="item.review" class="ah-check">
                <input v-model="decisions[item.id].reviewAccepted" type="checkbox" />
                {{ t('admin.acceptReview') }}
              </label>
              <span v-else></span>
              <input v-model="decisions[item.id].note" class="kp-input" :placeholder="t('admin.note')" :aria-label="t('admin.note')" maxlength="500" />
              <div class="ah-buttons">
                <button class="kp-btn danger" :disabled="busy === item.id" @click="decide(item, 'rejected')">{{ t('admin.reject') }}</button>
                <button class="kp-btn primary" :disabled="busy === item.id" @click="decide(item, 'confirmed')">{{ t('admin.confirm') }}</button>
              </div>
            </div>
          </li>
        </TransitionGroup>
      </section>

      <!-- Loans -->
      <section v-if="activeTab === 'loans'" class="ah-panel">
        <div v-if="loadingLoans" class="kp-skeleton" style="height: 260px"></div>
        <DataTable
          v-else
          :rows="loanRows"
          :columns="loanColumns"
          default-sort="reservedAt"
          export-name="nis-kitap-loans"
          :empty-text="t('admin.loansEmpty')"
        >
          <template #cell-statusLabel="{ row }">
            <span class="kp-pill" :class="loanTone(row)">{{ row.statusLabel }}</span>
          </template>
          <template #cell-actions="{ row }">
            <div class="ah-row-actions">
              <button v-if="row.status === 'active'" class="kp-btn small primary" :disabled="busy === row.id" @click="loan(row, 'issued')">{{ t('admin.markIssued') }}</button>
              <button v-if="row.status === 'issued'" class="kp-btn small" :disabled="busy === row.id" @click="loan(row, 'returned')">{{ t('admin.markReturned') }}</button>
              <button v-if="row.status === 'active'" class="kp-btn small danger" :disabled="busy === row.id" @click="loan(row, 'cancelled')">{{ t('admin.markCancelled') }}</button>
            </div>
          </template>
        </DataTable>
      </section>

      <!-- Manual confirmation -->
      <section v-if="activeTab === 'manual'" class="ah-panel kp-card ah-form">
        <p class="kp-muted">{{ t('admin.manualHint') }}</p>
        <div class="kp-field">
          <label class="kp-label" for="m-email">{{ t('admin.manualStudent') }}</label>
          <input id="m-email" v-model.trim="manual.email" class="kp-input" type="email" autocomplete="off" />
        </div>
        <div class="kp-field">
          <label class="kp-label" for="m-book">{{ t('admin.manualBook') }}</label>
          <input id="m-book" v-model="manual.query" class="kp-input" :placeholder="t('admin.manualBookPlaceholder')" autocomplete="off" @input="manual.book = null" />
          <ul v-if="bookSuggestions.length && !manual.book" class="ah-suggest" role="listbox">
            <li v-for="b in bookSuggestions" :key="b.bookId">
              <button type="button" @click="pickBook(b)">{{ b.title }} <span class="kp-muted">— {{ b.author }} · {{ b.language }}</span></button>
            </li>
          </ul>
        </div>
        <div class="kp-field">
          <label class="kp-label" for="m-note">{{ t('admin.note') }}</label>
          <input id="m-note" v-model="manual.note" class="kp-input" maxlength="500" />
        </div>
        <button class="kp-btn primary" :disabled="!manual.email || !manual.book || busy === 'manual'" @click="submitManual">{{ t('admin.confirm') }}</button>
      </section>

      <!-- Points adjustment -->
      <section v-if="activeTab === 'points'" class="ah-panel kp-card ah-form">
        <p class="kp-muted">{{ t('admin.pointsHint') }}</p>
        <div class="kp-field">
          <label class="kp-label" for="p-email">{{ t('admin.manualStudent') }}</label>
          <input id="p-email" v-model.trim="adjust.email" class="kp-input" type="email" />
        </div>
        <div class="kp-field">
          <label class="kp-label" for="p-points">{{ t('admin.pointsValue') }}</label>
          <input id="p-points" v-model.number="adjust.points" class="kp-input" type="number" step="1" min="-1000" max="1000" />
        </div>
        <div class="kp-field">
          <label class="kp-label" for="p-reason">{{ t('common.reason') }}</label>
          <input id="p-reason" v-model="adjust.reason" class="kp-input" maxlength="300" />
        </div>
        <button class="kp-btn primary" :disabled="busy === 'points'" @click="submitAdjust">{{ t('common.save') }}</button>
      </section>

      <!-- Points formula -->
      <section v-if="activeTab === 'settings'" class="ah-panel kp-card ah-form">
        <p class="kp-muted">{{ t('admin.settingsHint') }}</p>
        <div class="ah-settings">
          <div class="kp-field"><label class="kp-label" for="s1">{{ t('admin.sBook') }}</label><input id="s1" v-model.number="settings.confirmedBook" class="kp-input" type="number" min="0" /></div>
          <div class="kp-field"><label class="kp-label" for="s2">{{ t('admin.sHundred') }}</label><input id="s2" v-model.number="settings.hundredBonus" class="kp-input" type="number" min="0" /></div>
          <div class="kp-field"><label class="kp-label" for="s3">{{ t('admin.sReview') }}</label><input id="s3" v-model.number="settings.meaningfulReview" class="kp-input" type="number" min="0" /></div>
          <div class="kp-field"><label class="kp-label" for="s4">{{ t('admin.sReread') }}</label><input id="s4" v-model.number="settings.rereadShare" class="kp-input" type="number" min="0" max="1" step="0.1" /></div>
          <div class="kp-field"><label class="kp-label" for="s5">{{ t('admin.sMinReview') }}</label><input id="s5" v-model.number="settings.minReviewLength" class="kp-input" type="number" min="0" /></div>
        </div>
        <button class="kp-btn primary" :disabled="busy === 'settings'" @click="submitSettings">{{ t('common.save') }}</button>
      </section>

      <!-- Audit -->
      <section v-if="activeTab === 'audit'" class="ah-panel">
        <div v-if="loadingAudit" class="kp-skeleton" style="height: 260px"></div>
        <DataTable
          v-else
          :rows="auditRows"
          :columns="auditColumns"
          default-sort="when"
          export-name="nis-kitap-audit"
          :empty-text="t('admin.auditEmpty')"
        />
      </section>
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
import { getBookId, normalizeText } from '@/lib/bookId';
import { toDate } from '@/lib/points';
import { t, currentLocale } from '@/i18n';
import { getBooks } from '@/services/bookService';
import { loadHundredBooks } from '@/services/progressService';
import {
  listVerificationQueue, confirmReading, rejectReading, listReservations, setLoanStatus, manualConfirm,
  adjustPoints, getPointSettings, savePointSettings, listAuditLog, listUsers,
} from '@/services/adminService';

const tabs = computed(() => [
  { id: 'queue', label: t('admin.tabQueue'), perm: 'reading.verify' },
  { id: 'loans', label: t('admin.tabLoans'), perm: 'loans.manage' },
  { id: 'manual', label: t('admin.tabManual'), perm: 'reading.verify' },
  { id: 'points', label: t('admin.tabPoints'), perm: 'points.adjust' },
  { id: 'settings', label: t('admin.tabSettings'), perm: 'points.settings' },
  { id: 'audit', label: t('admin.tabAudit'), perm: 'audit.view' },
].filter((tab) => can(session.role, tab.perm)));
const activeTab = ref('queue');

const busy = ref('');
const toast = ref('');
const toastError = ref(false);
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
  const d = toDate(value);
  if (!d) return '—';
  const loc = currentLocale.value === 'kz' ? 'kk-KZ' : currentLocale.value === 'en' ? 'en-GB' : 'ru-RU';
  return d.toLocaleString(loc, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ---------- queue ----------
const queue = ref([]);
const loadingQueue = ref(false);
const queueError = ref(false);
const decisions = reactive({});
async function loadQueue() {
  if (!can(session.role, 'reading.verify')) return;
  loadingQueue.value = true;
  queueError.value = false;
  try {
    queue.value = await listVerificationQueue();
    for (const item of queue.value) {
      if (!decisions[item.id]) decisions[item.id] = { note: '', reviewAccepted: false };
    }
  } catch {
    queueError.value = true;
  } finally {
    loadingQueue.value = false;
  }
}
async function decide(item, decision) {
  busy.value = item.id;
  try {
    const d = decisions[item.id] || {};
    if (decision === 'confirmed') {
      await confirmReading(item.id, { reviewAccepted: d.reviewAccepted, note: d.note, method: item.loanReturned ? 'loan_returned' : item.method });
      notify(t('admin.confirmed'));
    } else {
      await rejectReading(item.id, d.note);
      notify(t('admin.rejected'));
    }
    queue.value = queue.value.filter((q) => q.id !== item.id);
  } catch (err) {
    notify(errorText(err), true);
    await loadQueue();
  } finally {
    busy.value = '';
  }
}

// ---------- loans ----------
const loans = ref([]);
const loadingLoans = ref(false);
async function loadLoans() {
  if (!can(session.role, 'loans.manage')) return;
  loadingLoans.value = true;
  try {
    loans.value = await listReservations();
  } catch (err) {
    notify(errorText(err), true);
  } finally {
    loadingLoans.value = false;
  }
}
function isOverdue(r) {
  const due = toDate(r.dueDate);
  return ['active', 'issued'].includes(r.status) && due && due < new Date();
}
const LOAN_LABELS = { active: 'admin.loanReserved', issued: 'admin.loanIssued', returned: 'admin.loanReturned', cancelled: 'admin.loanCancelled' };
const loanRows = computed(() => loans.value.map((r) => ({
  ...r,
  statusLabel: isOverdue(r) ? t('admin.loanOverdue') : t(LOAN_LABELS[r.status] || 'admin.loanReserved'),
})));
const loanColumns = computed(() => [
  { key: 'title', label: t('admin.book') },
  { key: 'userName', label: t('admin.reader'), format: (r) => `${r.userName || ''} ${r.userEmail ? `(${r.userEmail})` : ''}`.trim() },
  { key: 'reservedAt', label: t('common.date'), format: (r) => formatDate(r.reservedAt || r.createdAt) },
  { key: 'dueDate', label: t('admin.dueDate'), format: (r) => formatDate(r.dueDate) },
  { key: 'statusLabel', label: t('common.status') },
  { key: 'actions', label: t('common.actions'), sortable: false, format: () => '' },
]);
function loanTone(r) {
  if (isOverdue(r)) return 'red';
  return { active: 'amber', issued: 'blue', returned: 'green' }[r.status] || '';
}
async function loan(row, status) {
  busy.value = row.id;
  try {
    const reservation = { ...row };
    delete reservation.statusLabel;
    await setLoanStatus(reservation, status);
    await loadLoans();
    notify(t('common.saved'));
  } catch (err) {
    notify(errorText(err), true);
  } finally {
    busy.value = '';
  }
}

// ---------- manual confirmation ----------
const catalog = ref([]);
const manual = reactive({ email: '', query: '', book: null, note: '' });
const bookSuggestions = computed(() => {
  const q = normalizeText(manual.query);
  if (q.length < 3) return [];
  return catalog.value.filter((b) => normalizeText(b.title).includes(q)).slice(0, 8);
});
function pickBook(book) {
  manual.book = book;
  manual.query = book.title;
}
async function loadCatalog() {
  if (catalog.value.length) return;
  const [books, hundred] = await Promise.all([getBooks(false, true), loadHundredBooks().catch(() => ({ books: [] }))]);
  const hundredByBookId = new Map(hundred.books.filter((h) => h.catalogBookId).map((h) => [h.catalogBookId, h]));
  catalog.value = books.map((b) => {
    const bookId = getBookId(b);
    const h = hundredByBookId.get(bookId);
    return { ...b, bookId, isHundred: Boolean(h), hundredId: h?.id || '' };
  });
}
async function findUserByEmail(email) {
  const users = await listUsers();
  const u = users.find((x) => cleanEmail(x.email) === cleanEmail(email));
  return u ? { uid: u.id, email: u.email } : null;
}
async function submitManual() {
  busy.value = 'manual';
  try {
    const student = await findUserByEmail(manual.email);
    if (!student) {
      notify(t('admin.studentNotFound'), true);
      return;
    }
    await manualConfirm(student, manual.book, manual.note);
    Object.assign(manual, { email: '', query: '', book: null, note: '' });
    notify(t('admin.manualDone'));
  } catch (err) {
    notify(errorText(err), true);
  } finally {
    busy.value = '';
  }
}

// ---------- points ----------
const adjust = reactive({ email: '', points: 0, reason: '' });
async function submitAdjust() {
  busy.value = 'points';
  try {
    const student = await findUserByEmail(adjust.email);
    if (!student) {
      notify(t('admin.studentNotFound'), true);
      return;
    }
    await adjustPoints(student.uid, adjust.points, adjust.reason);
    Object.assign(adjust, { email: '', points: 0, reason: '' });
    notify(t('admin.pointsDone'));
  } catch (err) {
    notify(errorText(err), true);
  } finally {
    busy.value = '';
  }
}

const settings = reactive({});
async function loadSettings() {
  Object.assign(settings, await getPointSettings());
}
async function submitSettings() {
  busy.value = 'settings';
  try {
    Object.assign(settings, await savePointSettings({ ...settings }));
    notify(t('common.saved'));
  } catch (err) {
    notify(errorText(err), true);
  } finally {
    busy.value = '';
  }
}

// ---------- audit ----------
const audit = ref([]);
const loadingAudit = ref(false);
const auditRows = computed(() => audit.value.map((a) => ({ ...a, when: toDate(a.createdAt)?.toISOString() || '' })));
const auditColumns = computed(() => [
  { key: 'when', label: t('common.date'), format: (r) => formatDate(r.when) },
  { key: 'actorEmail', label: t('admin.actor') },
  { key: 'action', label: t('admin.action') },
  { key: 'entityType', label: t('admin.object'), format: (r) => `${r.entityType}/${r.entityId}` },
]);
async function loadAudit() {
  loadingAudit.value = true;
  try {
    audit.value = await listAuditLog(300);
  } catch (err) {
    notify(errorText(err), true);
  } finally {
    loadingAudit.value = false;
  }
}

function loadTab(tab) {
  if (tab === 'queue') loadQueue();
  if (tab === 'loans') loadLoans();
  if (tab === 'manual') loadCatalog();
  if (tab === 'settings') loadSettings();
  if (tab === 'audit') loadAudit();
}
watch(activeTab, loadTab);
watch(() => [session.ready, session.role], () => {
  if (!session.ready || !tabs.value.length) return;
  if (!tabs.value.some((tab) => tab.id === activeTab.value)) activeTab.value = tabs.value[0].id;
  else loadTab(activeTab.value);
}, { immediate: true });
</script>

<style scoped>
.ah-tabs { margin-bottom: 20px; width: max-content; }
.ah-count {
  margin-left: 6px;
  padding: 0 7px;
  border-radius: 10px;
  font-size: 12px;
  background: var(--apple-blue);
  color: #fff;
}
.ah-stack { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.ah-request { display: grid; gap: 12px; }
.ah-request-head { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.ah-book { font-size: 16px; }
.ah-meta { display: flex; gap: 6px 8px; flex-wrap: wrap; align-items: center; margin-top: 6px; font-size: 13px; color: var(--apple-text-muted); }
.ah-review {
  margin: 0;
  padding: 12px 14px;
  border-left: 3px solid rgba(246, 238, 225, 0.5);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0 10px 10px 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--apple-text-secondary);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.ah-decision { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 10px; align-items: center; }
.ah-check { display: flex; gap: 8px; align-items: center; font-size: 13px; color: var(--apple-text-secondary); }
.ah-buttons { display: flex; gap: 8px; }
.ah-row-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.ah-form { display: grid; gap: 14px; max-width: 640px; }
.ah-settings { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.ah-suggest {
  list-style: none;
  margin: 6px 0 0;
  padding: 6px;
  border-radius: var(--apple-radius-md);
  border: 1px solid var(--apple-glass-border);
  background: #0b1424;
  max-height: 260px;
  overflow-y: auto;
}
.ah-suggest button {
  all: unset;
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.ah-suggest button:hover, .ah-suggest button:focus-visible { background: rgba(255, 255, 255, 0.08); }
.ah-list-leave-active { transition: all 0.3s var(--apple-spring); }
.ah-list-leave-to { opacity: 0; transform: translateX(20px); }
@media (max-width: 760px) {
  .ah-decision { grid-template-columns: 1fr; }
  .ah-buttons > * { flex: 1; }
  .ah-tabs { width: 100%; }
}
</style>
