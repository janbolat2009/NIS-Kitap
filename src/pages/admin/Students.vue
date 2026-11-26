<template>
  <section class="students">
    <div class="toolbar">
      <input v-model="q" class="input" placeholder="Имя, email или класс" />
      <span class="muted">{{ filtered.length }}</span>
    </div>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>Ученик</th><th>Класс</th><th>Шаңырак</th><th class="num">Очки за год</th><th class="num">Книг</th><th /></tr></thead>
        <tbody>
          <tr v-for="s in filtered.slice(0, 300)" :key="s.uid">
            <td><b>{{ s.name || '—' }}</b><div class="muted small">{{ s.email }}<span v-if="!s.emailVerified"> · email не подтверждён</span></div></td>
            <td>{{ s.className || '—' }}</td>
            <td>{{ s.shanyrakName || (s.className ? 'не сопоставлен' : '—') }}</td>
            <td class="num">{{ s.points }}</td>
            <td class="num">{{ s.confirmedBooks }}</td>
            <td><button type="button" class="btn btn-ghost btn-sm" @click="open(s.uid)">Открыть</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="detail" class="modal-backdrop" @click.self="detail = null">
      <div class="modal wide" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div>
            <h2>{{ [detail.profile.firstName, detail.profile.lastName].join(' ') }}</h2>
            <p class="muted">{{ detail.profile.email }} · {{ detail.profile.className || 'класс не указан' }} · {{ detail.profile.shanyrakName || 'шаңырак не определён' }}</p>
          </div>
          <button type="button" class="btn btn-ghost btn-icon btn-sm" @click="detail = null">✕</button>
        </div>
        <div class="actions">
          <button v-if="can('students.class_change')" type="button" class="btn btn-secondary btn-sm" @click="changeClass">Перевести в другой класс</button>
          <button v-if="can('points.adjust')" type="button" class="btn btn-secondary btn-sm" @click="adjust">Корректировка очков</button>
        </div>

        <h3>Журнал очков</h3>
        <p class="muted small">Каждая строка — основание начисления. Класс и шаңырак указаны на момент операции.</p>
        <ul class="rows">
          <li v-for="e in detail.ledger" :key="e.id" class="row-item" :class="{ rev: e.reversed }">
            <div class="row-main">
              <div class="row-title">{{ ACTION[e.action] || e.action }} <span class="tabular" :class="{ neg: e.points < 0 }">{{ e.points > 0 ? '+' : '' }}{{ e.points }}</span><span v-if="e.reversed" class="badge">отменено</span></div>
              <div class="row-meta">{{ e.bookTitle }} · {{ fmt(e.createdAt) }} · {{ e.className || '—' }} / {{ e.shanyrakName || 'без шаңырака' }} · {{ ROLE[e.createdByRole] || e.createdByRole }}<span v-if="e.reason"> · {{ e.reason }}</span><span v-if="e.reversalReason"> · отмена: {{ e.reversalReason }}</span></div>
            </div>
            <div class="row-actions">
              <button v-if="can('points.adjust') && !e.reversed && e.action !== 'reversal'" type="button" class="btn btn-ghost btn-sm" @click="reverse(e)">Отменить</button>
            </div>
          </li>
        </ul>

        <h3>Прочтения</h3>
        <ul class="rows">
          <li v-for="p in detail.progress" :key="p.id" class="row-item">
            <div class="row-main"><div class="row-title">{{ p.bookTitle }}</div><div class="row-meta">{{ p.status }} / {{ p.verificationStatus }}<span v-if="p.decisionNote"> · {{ p.decisionNote }}</span></div></div>
            <div class="row-actions">
              <button v-if="can('points.adjust') && p.verificationStatus === 'confirmed'" type="button" class="btn btn-ghost btn-sm" @click="revoke(p)">Отменить подтверждение</button>
            </div>
          </li>
        </ul>

        <h3>История классов</h3>
        <ul class="hist">
          <li v-for="h in detail.classHistory" :key="h.id">{{ fmt(h.at) }}: {{ h.from ? `${h.from.className} (${h.from.shanyrakName || '—'}) → ` : '' }}{{ h.to.className }} ({{ h.to.shanyrakName || '—' }}) · {{ SOURCE[h.source] || h.source }}<span v-if="h.reason"> · {{ h.reason }}</span></li>
        </ul>

        <h3>Брони</h3>
        <ul class="hist">
          <li v-for="r in detail.reservations" :key="r.id">{{ fmt(r.createdAt || r.reservedAt) }} · {{ r.bookTitle || r.title }} · {{ r.status }}</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { session } from '@/stores/session';
import { toast } from '@/stores/ui';
import { get, post, errorMessage } from '@/services/api';

const ACTION = { book_confirmed: 'Книга подтверждена', hundred_bonus: 'Бонус «100 кітап»', review_accepted: 'Отзыв засчитан', milestone: 'Достижение', reward: 'Награда', manual: 'Ручная корректировка', reversal: 'Отмена операции' };
const ROLE = { librarian: 'библиотекарь', director: 'директор', deputy: 'завуч', tech_admin: 'техадмин', system: 'система' };
const SOURCE = { self: 'выбрал(а) сам(а)', admin: 'перевод администратором', import: 'импорт списка', mapping_change: 'изменено соответствие класса' };
const can = (p) => session.permissions.includes(p);
const list = ref([]);
const q = ref('');
const detail = ref(null);

const filtered = computed(() => {
  const s = q.value.trim().toLowerCase();
  return s ? list.value.filter((x) => [x.name, x.email, x.className].some((v) => String(v || '').toLowerCase().includes(s))) : list.value;
});
const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

async function load() {
  try { list.value = await get('admin/students'); } catch (err) { toast(errorMessage(err), { type: 'error' }); }
}
async function open(uid) {
  try { detail.value = await get(`admin/students/${uid}`); } catch (err) { toast(errorMessage(err), { type: 'error' }); }
}
async function act(fn, msg) {
  try {
    await fn();
    toast(msg);
    await open(detail.value.profile.uid);
    await load();
  } catch (err) {
    toast(errorMessage(err), { type: 'error' });
  }
}
function changeClass() {
  const className = window.prompt('Новый класс (например, 10A):');
  if (!className) return;
  const reason = window.prompt('Основание перевода:');
  if (!reason) return;
  act(() => post(`admin/students/${detail.value.profile.uid}/class`, { className, reason }), 'Ученик переведён. Прошлые очки остались в прежнем шаңыраке.');
}
function adjust() {
  const points = Number(window.prompt('Сколько очков начислить (отрицательное число — списать)?'));
  if (!points) return;
  const reason = window.prompt('Основание (увидит ученик):');
  if (!reason) return;
  act(() => post('admin/points/adjust', { uid: detail.value.profile.uid, points, reason }), 'Корректировка записана');
}
function reverse(e) {
  const reason = window.prompt('Причина отмены операции:');
  if (!reason) return;
  act(() => post(`admin/points/${e.id}/reverse`, { reason }), 'Операция отменена');
}
function revoke(p) {
  const reason = window.prompt('Почему подтверждение отменяется?');
  if (!reason) return;
  act(() => post(`admin/reading/${p.id}/revoke`, { reason }), 'Подтверждение отменено, очки списаны');
}

watch(detail, (v) => document.body.classList.toggle('modal-open', Boolean(v)));
onMounted(load);
</script>

<style scoped>
.toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 14px; }
.toolbar .input { max-width: 420px; }
.small { font-size: var(--fs-xs); }
.wide { max-width: 860px; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
h3 { margin: 20px 0 8px; font-size: var(--fs-md); }
.rev .row-title { color: var(--text-3); }
.neg { color: var(--danger); }
.hist { margin: 0; padding-left: 18px; font-size: var(--fs-sm); color: var(--text-2); display: flex; flex-direction: column; gap: 4px; }
</style>
