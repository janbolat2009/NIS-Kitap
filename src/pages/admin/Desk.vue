<template>
  <section class="desk">
    <div class="tabs sub" role="tablist">
      <button v-for="tb in visibleTabs" :key="tb.id" type="button" class="tab" role="tab" :aria-selected="tab === tb.id" @click="tab = tb.id">
        {{ tb.label }}<span v-if="tb.count" class="badge badge-warning cnt">{{ tb.count }}</span>
      </button>
    </div>

    <!-- reservations -->
    <div v-if="tab === 'loans'" class="pane">
      <div class="toolbar">
        <select v-model="loanFilter" class="select narrow" @change="loadLoans">
          <option value="open">Активные</option><option value="requested">Новые заявки</option><option value="ready">Готовы к выдаче</option>
          <option value="issued">На руках</option><option value="returned">Возвращены</option><option value="cancelled">Отменены</option><option value="expired">Истекли</option>
        </select>
        <input v-model="loanQuery" class="input" placeholder="Книга, ученик, номер брони" />
        <button type="button" class="btn btn-secondary" @click="loadLoans">Обновить</button>
      </div>
      <p v-if="loading.loans" class="muted">Загрузка…</p>
      <p v-else-if="!filteredLoans.length" class="empty">Броней нет.</p>
      <ul v-else class="rows">
        <li v-for="r in filteredLoans" :key="r.id" class="row-item">
          <div class="row-main">
            <div class="row-title">{{ r.bookTitle || r.title }} <span class="muted">· {{ r.bookAuthor || r.author }}</span></div>
            <div class="row-meta">{{ r.userName }}<span v-if="r.className">, {{ r.className }}</span> · {{ r.userEmail }} · <b class="tabular">{{ r.code || r.id }}</b></div>
            <div class="row-meta">
              <span v-if="r.pickup">Получение: {{ fmtDay(r.pickup.start) }} {{ r.pickup.from }}–{{ r.pickup.to }}, {{ r.pickup.place }} · </span>
              <span v-if="['requested', 'ready'].includes(r.status) && r.holdUntil">Бронь до {{ fmtDT(r.holdUntil) }}</span>
              <span v-if="r.status === 'issued'" :class="{ overdue: isOverdue(r) }">Вернуть до {{ fmtDay(r.dueDate) }}</span>
            </div>
            <div v-if="r.status === 'ready'" class="row-meta">
              Письмо: <span :class="mailClass(r)">{{ mailLabel(r) }}</span><span v-if="r.notification?.error"> ({{ r.notification.error }})</span>
            </div>
          </div>
          <div class="row-actions">
            <span class="badge" :class="statusClass(r.status)">{{ LOAN[r.status] }}</span>
            <template v-if="['requested', 'ready'].includes(r.status)">
              <button type="button" class="btn btn-secondary btn-sm" @click="openPrepare(r)">{{ r.status === 'ready' ? 'Изменить время' : 'Подготовить' }}</button>
              <button v-if="r.status === 'ready' && can('notifications.send')" type="button" class="btn btn-secondary btn-sm" :disabled="busy === r.id" @click="notify(r)">{{ r.notification?.status === 'sent' ? 'Отправить повторно' : 'Отправить письмо' }}</button>
              <button type="button" class="btn btn-primary btn-sm" :disabled="busy === r.id" @click="act(r, 'issue')">Выдать</button>
              <button type="button" class="btn btn-danger btn-sm" :disabled="busy === r.id" @click="cancel(r)">Отменить</button>
            </template>
            <button v-if="r.status === 'issued'" type="button" class="btn btn-primary btn-sm" :disabled="busy === r.id" @click="act(r, 'return')">Принять возврат</button>
          </div>
        </li>
      </ul>
    </div>

    <!-- verification queue -->
    <div v-else-if="tab === 'queue'" class="pane">
      <p v-if="loading.queue" class="muted">Загрузка…</p>
      <p v-else-if="!queue.length" class="empty">Заявок на проверку нет.</p>
      <ul v-else class="rows">
        <li v-for="q in queue" :key="q.id" class="row-item">
          <div class="row-main">
            <div class="row-title">{{ q.bookTitle }} <span v-if="q.isHundred" class="badge badge-warm">100 кітап</span></div>
            <div class="row-meta">{{ q.student.name }}<span v-if="q.student.className">, {{ q.student.className }}</span><span v-if="q.student.shanyrakName"> · {{ q.student.shanyrakName }}</span> · {{ fmtDT(q.requestedAt) }}</div>
            <p v-if="q.review" class="review">«{{ q.review }}»</p>
            <div class="flags"><span v-for="f in q.flags" :key="f" class="badge" :class="f === 'loan_returned' ? 'badge-success' : 'badge-warning'">{{ FLAGS[f] || f }}</span></div>
          </div>
          <div class="row-actions col">
            <label class="check"><input v-model="reviewAccepted[q.id]" type="checkbox" /> Засчитать отзыв (+{{ reviewPoints }})</label>
            <button type="button" class="btn btn-primary btn-sm" :disabled="busy === q.id" @click="confirm(q)">Подтвердить</button>
            <button type="button" class="btn btn-danger btn-sm" :disabled="busy === q.id" @click="reject(q)">Не подтверждать</button>
          </div>
        </li>
      </ul>
    </div>

    <!-- fund -->
    <div v-else-if="tab === 'fund'" class="pane">
      <div class="toolbar">
        <input v-model="fundQuery" class="input" placeholder="Название или автор" @keyup.enter="searchFund" />
        <button type="button" class="btn btn-secondary" @click="searchFund">Найти</button>
      </div>
      <ul v-if="fundResults.length" class="rows">
        <li v-for="b in fundResults" :key="b.bookId" class="row-item">
          <div class="row-main">
            <div class="row-title">{{ b.title }} <span class="muted">· {{ b.author }}</span></div>
            <div class="row-meta tabular">Всего {{ b.av.total }} · свободно {{ b.av.available }} · забронировано {{ b.av.held }} · выдано {{ b.av.issued }}</div>
            <ul v-if="logs[b.bookId]" class="log">
              <li v-for="l in logs[b.bookId]" :key="l.id">{{ fmtDT(l.at) }} — {{ LOG[l.action] || l.action }} {{ deltaText(l.delta) }} → {{ l.after.total }}/{{ l.after.held }}/{{ l.after.issued }}<span v-if="l.reason"> · {{ l.reason }}</span></li>
            </ul>
          </div>
          <div class="row-actions">
            <button v-if="can('fund.manage')" type="button" class="btn btn-secondary btn-sm" @click="adjust(b)">Изменить фонд</button>
            <button type="button" class="btn btn-secondary btn-sm" @click="direct(b)">Выдать без брони</button>
            <button type="button" class="btn btn-ghost btn-sm" @click="showLog(b)">Журнал</button>
          </div>
        </li>
      </ul>
    </div>

    <!-- reviews -->
    <div v-else-if="tab === 'reviews'" class="pane">
      <p v-if="!reviews.length" class="empty">Отзывов на модерации нет.</p>
      <ul v-else class="rows">
        <li v-for="r in reviews" :key="r.id" class="row-item">
          <div class="row-main">
            <div class="row-title">{{ r.bookTitle }} · {{ '★'.repeat(r.rating) }}</div>
            <div class="row-meta">{{ r.authorLabel }} · {{ fmtDT(r.updatedAt) }}<span v-if="r.editCount"> · изменён</span></div>
            <p class="review">{{ r.text }}</p>
          </div>
          <div class="row-actions">
            <button type="button" class="btn btn-primary btn-sm" :disabled="busy === r.id" @click="moderate(r, 'publish')">Опубликовать</button>
            <button type="button" class="btn btn-danger btn-sm" :disabled="busy === r.id" @click="moderate(r, 'reject')">Отклонить</button>
          </div>
        </li>
      </ul>
    </div>

    <!-- prepare dialog -->
    <div v-if="prep" class="modal-backdrop" @click.self="prep = null">
      <form class="modal" @submit.prevent="savePrepare">
        <div class="modal-head"><h2>Время и место получения</h2></div>
        <p class="muted">{{ prep.r.bookTitle || prep.r.title }} — {{ prep.r.userName }}</p>
        <div class="grid2">
          <label class="field"><span class="label">Дата</span><input v-model="prep.date" type="date" class="input" required /></label>
          <label class="field"><span class="label">Место</span><input v-model="prep.place" class="input" list="places" required maxlength="120" /></label>
          <label class="field"><span class="label">С</span><input v-model="prep.from" type="time" class="input" required /></label>
          <label class="field"><span class="label">До</span><input v-model="prep.to" type="time" class="input" required /></label>
        </div>
        <datalist id="places"><option v-for="p in places" :key="p" :value="p" /></datalist>
        <label class="check"><input v-model="prep.notify" type="checkbox" :disabled="!can('notifications.send')" /> Сразу отправить письмо ученику</label>
        <p v-if="prep.error" class="error-text">{{ prep.error }}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="prep = null">Отмена</button>
          <button type="submit" class="btn btn-primary" :disabled="prep.busy">Сохранить</button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { session } from '@/stores/session';
import { toast } from '@/stores/ui';
import { get, post, errorMessage } from '@/services/api';
import { getBooks } from '@/services/bookService';
import { getBookId } from '@/lib/bookId';
import { getAvailability } from '@/services/library';
import { getSchoolSettings } from '@/services/schoolService';

const LOAN = { requested: 'Новая заявка', ready: 'Готова к выдаче', issued: 'На руках', returned: 'Возвращена', cancelled: 'Отменена', expired: 'Истекла' };
const FLAGS = {
  loan_returned: 'Книга брал(а) и вернул(а)', no_review: 'Без отзыва', short_review: 'Короткий отзыв', duplicate_review: 'Повтор отзыва',
  many_requests_24h: 'Много заявок за сутки', finished_too_fast: 'Слишком быстро',
};
const LOG = { hold: 'бронь', issue: 'выдача', issued: 'выдача', returned: 'возврат', cancelled: 'отмена', expired: 'истечение', adjust: 'корректировка' };

const can = (p) => session.permissions.includes(p);
const tab = ref('loans');
const loans = ref([]);
const loanFilter = ref('open');
const loanQuery = ref('');
const queue = ref([]);
const reviews = ref([]);
const reviewAccepted = reactive({});
const reviewPoints = ref(20);
const fundQuery = ref('');
const fundResults = ref([]);
const logs = reactive({});
const busy = ref('');
const loading = reactive({ loans: false, queue: false });
const prep = ref(null);
const places = ref(['Библиотека']);

const visibleTabs = computed(() => [
  { id: 'loans', label: 'Брони', show: can('loans.manage'), count: loans.value.filter((r) => r.status === 'requested').length },
  { id: 'queue', label: 'Проверка чтения', show: can('reading.verify'), count: queue.value.length },
  { id: 'fund', label: 'Фонд', show: can('loans.manage') || can('fund.manage') },
  { id: 'reviews', label: 'Отзывы', show: can('reviews.moderate'), count: reviews.value.length },
].filter((x) => x.show));

const filteredLoans = computed(() => {
  const q = loanQuery.value.trim().toLowerCase();
  if (!q) return loans.value;
  return loans.value.filter((r) => [r.bookTitle, r.title, r.userName, r.userEmail, r.code, r.className].some((v) => String(v || '').toLowerCase().includes(q)));
});

const fmtDT = (iso) => (iso ? new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
const fmtDay = (iso) => (iso ? new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '');
const isOverdue = (r) => r.dueDate && new Date(r.dueDate) < new Date();
const statusClass = (s) => ({ 'badge-warning': s === 'requested', 'badge-success': s === 'ready', 'badge-info': s === 'issued' });
const mailLabel = (r) => ({ sent: `отправлено ${fmtDT(r.notification.sentAt)}`, failed: 'не доставлено', sending: 'отправляется…', pending: 'ещё не отправлено' }[r.notification?.status] || 'ещё не отправлено');
const mailClass = (r) => ({ ok: r.notification?.status === 'sent', bad: r.notification?.status === 'failed' });
const deltaText = (d = {}) => Object.entries(d).map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}`).join(', ');

async function run(id, fn, okMsg) {
  busy.value = id;
  try {
    const res = await fn();
    if (okMsg) toast(okMsg);
    return res;
  } catch (err) {
    toast(errorMessage(err), { type: 'error' });
    return null;
  } finally {
    busy.value = '';
  }
}

async function loadLoans() {
  if (!can('loans.manage')) return;
  loading.loans = true;
  try { loans.value = await get('admin/reservations', { status: loanFilter.value }); } catch (err) { toast(errorMessage(err), { type: 'error' }); }
  loading.loans = false;
}
async function loadQueue() {
  if (!can('reading.verify')) return;
  loading.queue = true;
  try { queue.value = await get('admin/queue'); } catch (err) { toast(errorMessage(err), { type: 'error' }); }
  loading.queue = false;
}
async function loadReviews() {
  if (!can('reviews.moderate')) return;
  try { reviews.value = await get('admin/reviews', { status: 'pending' }); } catch { reviews.value = []; }
}

function openPrepare(r) {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  prep.value = {
    r, date: r.pickup?.date || d.toISOString().slice(0, 10), from: r.pickup?.from || '13:00', to: r.pickup?.to || '15:00',
    place: r.pickup?.place || places.value[0], notify: can('notifications.send'), busy: false, error: '',
  };
}
async function savePrepare() {
  const p = prep.value;
  p.busy = true;
  p.error = '';
  try {
    await post(`admin/reservations/${p.r.id}/prepare`, { date: p.date, from: p.from, to: p.to, place: p.place });
    if (p.notify) {
      const n = await post(`admin/reservations/${p.r.id}/notify`);
      toast(n.notification.status === 'sent' ? 'Письмо отправлено' : `Письмо не отправлено: ${n.notification.error}`, { type: n.notification.status === 'sent' ? 'info' : 'error' });
    } else toast('Время получения сохранено');
    prep.value = null;
    await loadLoans();
  } catch (err) {
    p.error = errorMessage(err);
  } finally {
    if (prep.value) p.busy = false;
  }
}
async function notify(r) {
  const n = await run(r.id, () => post(`admin/reservations/${r.id}/notify`));
  if (n) toast(n.notification.status === 'sent' ? 'Письмо отправлено' : `Письмо не отправлено: ${n.notification.error}`, { type: n.notification.status === 'sent' ? 'info' : 'error' });
  await loadLoans();
}
async function act(r, action) {
  await run(r.id, () => post(`admin/reservations/${r.id}/${action}`, {}), action === 'issue' ? 'Книга выдана' : 'Возврат принят');
  await loadLoans();
}
async function cancel(r) {
  const reason = window.prompt('Причина отмены (увидит ученик):');
  if (!reason) return;
  await run(r.id, () => post(`admin/reservations/${r.id}/cancel`, { reason }), 'Бронь отменена');
  await loadLoans();
}

async function confirm(q) {
  const ok = await run(q.id, () => post(`admin/reading/${q.id}/confirm`, { reviewAccepted: Boolean(reviewAccepted[q.id]) }));
  if (ok) toast(`Подтверждено, начислено ${ok.points} очков`);
  await loadQueue();
}
async function reject(q) {
  const note = window.prompt('Почему не подтверждено? Ученик увидит этот ответ.');
  if (!note) return;
  await run(q.id, () => post(`admin/reading/${q.id}/reject`, { note }), 'Отмечено как не подтверждённое');
  await loadQueue();
}

async function searchFund() {
  const q = fundQuery.value.trim().toLowerCase();
  if (q.length < 2) return;
  const books = (await getBooks()).filter((b) => `${b.title} ${b.author}`.toLowerCase().includes(q)).slice(0, 20);
  fundResults.value = await Promise.all(books.map(async (b) => ({ ...b, bookId: getBookId(b), av: await getAvailability(b) })));
}
async function adjust(b) {
  const total = window.prompt(`Сколько экземпляров «${b.title}» в фонде? Сейчас: ${b.av.total}`, String(b.av.total));
  if (total === null) return;
  const reason = window.prompt('Основание (поставка, списание, инвентаризация):');
  if (!reason) return;
  const res = await run(b.bookId, () => post(`admin/inventory/${b.bookId}/adjust`, { total: Number(total), reason }), 'Фонд обновлён');
  if (res) b.av = { ...b.av, ...res };
}
async function direct(b) {
  const email = window.prompt(`Email ученика для выдачи «${b.title}»:`);
  if (!email) return;
  const res = await run(b.bookId, () => post('admin/loans/direct', { bookId: b.bookId, email }), 'Книга выдана');
  if (res) b.av = res.availability;
}
async function showLog(b) {
  try { logs[b.bookId] = (await get(`admin/inventory/${b.bookId}/log`)).slice(0, 20); } catch (err) { toast(errorMessage(err), { type: 'error' }); }
}

async function moderate(r, decision) {
  const note = decision === 'reject' ? window.prompt('Причина (увидит автор):') : '';
  if (decision === 'reject' && !note) return;
  await run(r.id, () => post(`admin/reviews/${r.id}/moderate`, { decision, note }), decision === 'publish' ? 'Отзыв опубликован' : 'Отзыв отклонён');
  await loadReviews();
}

watch(prep, (v) => document.body.classList.toggle('modal-open', Boolean(v)));
onMounted(async () => {
  if (!can('loans.manage')) tab.value = visibleTabs.value[0]?.id || 'queue';
  const s = await getSchoolSettings();
  places.value = s.pickupPlaces?.length ? s.pickupPlaces : places.value;
  getBooks().catch(() => {});
  await Promise.all([loadLoans(), loadQueue(), loadReviews()]);
});
</script>

<style scoped>
.sub { margin-bottom: 18px; }
.cnt { margin-left: 6px; height: 20px; }
.pane { display: flex; flex-direction: column; gap: 14px; }
.toolbar { display: flex; gap: 8px; flex-wrap: wrap; }
.toolbar .input { flex: 1; min-width: 200px; }
.narrow { width: auto; min-width: 180px; }
.review { margin-top: 8px; padding: 10px 12px; border-left: 3px solid var(--line-strong); background: var(--bg-elevated); color: var(--text-2); font-size: var(--fs-sm); white-space: pre-line; overflow-wrap: anywhere; }
.flags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.col { flex-direction: column; align-items: stretch; min-width: 220px; }
.overdue { color: var(--danger); font-weight: 600; }
.ok { color: var(--success); font-weight: 600; }
.bad { color: var(--danger); font-weight: 600; }
.log { margin: 8px 0 0; padding-left: 18px; font-size: var(--fs-xs); color: var(--text-3); }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px 0; }
.empty { padding: 24px; }
</style>
