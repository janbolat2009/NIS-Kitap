<template>
  <section class="rewards">
    <div class="two">
      <div>
        <h2 class="section-title">Каталог поощрений</h2>
        <ul class="rows">
          <li v-for="r in catalog" :key="r.id" class="row-item">
            <div class="row-main">
              <div class="row-title">{{ r.title }} <span class="badge">{{ TYPE[r.type] }}</span> <span class="badge" :class="r.status === 'active' ? 'badge-success' : ''">{{ STATUS[r.status] }}</span></div>
              <div class="row-meta">{{ r.conditions }}</div>
              <div class="row-meta">{{ r.approval === 'director' ? 'Утверждает директор/завуч' : 'Выдаёт библиотекарь' }}<span v-if="r.claimable"> · ученик может запросить</span><span v-if="r.quantity !== null"> · выдано {{ r.issuedCount || 0 }} из {{ r.quantity }}</span></div>
            </div>
            <div class="row-actions">
              <button v-if="can('rewards.manage')" type="button" class="btn btn-ghost btn-sm" @click="edit(r)">Изменить</button>
              <button v-if="can('rewards.issue') && r.status === 'active'" type="button" class="btn btn-secondary btn-sm" @click="award(r)">Выдать</button>
            </div>
          </li>
        </ul>
        <button v-if="can('rewards.manage')" type="button" class="btn btn-primary" @click="edit(null)">Добавить поощрение</button>
      </div>
      <div>
        <h2 class="section-title">Выдача и утверждение</h2>
        <select v-model="filter" class="select narrow" @change="loadIssues"><option value="">Все</option><option value="requested">Запросы учеников</option><option value="pending_approval">Ждут утверждения</option><option value="issued">Выданы</option><option value="rejected">Отклонены</option><option value="revoked">Отозваны</option></select>
        <ul class="rows">
          <li v-for="i in issues" :key="i.id" class="row-item">
            <div class="row-main">
              <div class="row-title">{{ i.title }} — {{ i.recipientName }}<span v-if="i.className">, {{ i.className }}</span></div>
              <div class="row-meta">{{ ISSUE[i.status] }} · книг: {{ i.criteriaSnapshot?.confirmedBooks }}, очков за год: {{ i.criteriaSnapshot?.pointsThisYear }}<span v-if="i.certificateNumber"> · {{ i.certificateNumber }}</span></div>
              <div v-if="i.reason" class="row-meta">{{ i.reason }}</div>
            </div>
            <div class="row-actions">
              <button v-if="canApprove(i)" type="button" class="btn btn-primary btn-sm" @click="decide(i, 'approve')">{{ i.status === 'pending_approval' ? 'Утвердить' : 'Одобрить' }}</button>
              <button v-if="canApprove(i)" type="button" class="btn btn-danger btn-sm" @click="decide(i, 'reject')">Отклонить</button>
              <button v-if="i.status === 'issued' && (can('rewards.issue') || can('rewards.approve'))" type="button" class="btn btn-ghost btn-sm" @click="decide(i, 'revoke')">Отозвать</button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="form" class="modal-backdrop" @click.self="form = null">
      <form class="modal" @submit.prevent="save">
        <div class="modal-head"><h2>{{ form.id ? 'Изменить поощрение' : 'Новое поощрение' }}</h2></div>
        <div class="stack">
          <label class="field"><span class="label">Название</span><input v-model="form.title" class="input" required maxlength="120" /></label>
          <label class="field"><span class="label">Тип</span><select v-model="form.type" class="select"><option v-for="(v, k) in TYPE" :key="k" :value="k">{{ v }}</option></select></label>
          <label class="field"><span class="label">Описание</span><textarea v-model="form.description" class="textarea" maxlength="1000" /></label>
          <label class="field"><span class="label">Условия получения (для учеников)</span><textarea v-model="form.conditions" class="textarea" required maxlength="600" /></label>
          <fieldset class="crit"><legend class="label">Проверка условий на сервере (0 — не проверять)</legend>
            <label class="field"><span class="hint">Подтверждённых книг</span><input v-model.number="form.criteria.minConfirmedBooks" type="number" min="0" class="input" /></label>
            <label class="field"><span class="hint">Книг из «100 кітап»</span><input v-model.number="form.criteria.minHundredBooks" type="number" min="0" class="input" /></label>
            <label class="field"><span class="hint">Очков за учебный год</span><input v-model.number="form.criteria.minPoints" type="number" min="0" class="input" /></label>
          </fieldset>
          <label class="field"><span class="label">Порядок подтверждения</span><select v-model="form.approval" class="select"><option value="librarian">Выдаёт библиотекарь</option><option value="director">Утверждает директор или завуч</option></select></label>
          <label class="field"><span class="label">Статус</span><select v-model="form.status" class="select"><option value="active">Доступно</option><option value="paused">Приостановлено</option><option value="archived">В архиве</option></select></label>
          <label class="field"><span class="label">Количество (пусто — без ограничения)</span><input v-model="form.quantity" type="number" min="0" class="input" /></label>
          <label class="check"><input v-model="form.claimable" type="checkbox" /> Ученик может запросить сам (условия проверит сервер)</label>
        </div>
        <div class="modal-actions"><button type="button" class="btn btn-ghost" @click="form = null">Отмена</button><button type="submit" class="btn btn-primary">Сохранить</button></div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseDb';
import { session } from '@/stores/session';
import { toast } from '@/stores/ui';
import { get, post, errorMessage } from '@/services/api';

const TYPE = { certificate: 'Сертификат', diploma: 'Грамота', achievement: 'Достижение', prize: 'Приз', other: 'Другое' };
const STATUS = { active: 'доступно', paused: 'приостановлено', archived: 'в архиве' };
const ISSUE = { requested: 'Запрос ученика', pending_approval: 'Ждёт утверждения', issued: 'Выдано', rejected: 'Отклонено', revoked: 'Отозвано' };
const can = (p) => session.permissions.includes(p);
const catalog = ref([]);
const issues = ref([]);
const filter = ref('');
const form = ref(null);

const canApprove = (i) => (i.status === 'requested' && can('rewards.issue')) || (i.status === 'pending_approval' && can('rewards.approve'));

async function loadCatalog() {
  const snap = await getDocs(collection(db, 'rewards'));
  catalog.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
async function loadIssues() {
  try { issues.value = await get('admin/rewards/issues', { status: filter.value }); } catch (err) { toast(errorMessage(err), { type: 'error' }); }
}
function edit(r) {
  form.value = r
    ? { ...r, criteria: { minConfirmedBooks: 0, minHundredBooks: 0, minPoints: 0, ...(r.criteria || {}) }, quantity: r.quantity ?? '' }
    : { title: '', type: 'certificate', description: '', conditions: '', criteria: { minConfirmedBooks: 0, minHundredBooks: 0, minPoints: 0 }, approval: 'librarian', status: 'active', quantity: '', claimable: false };
}
async function save() {
  try {
    await post('admin/rewards', form.value);
    form.value = null;
    toast('Сохранено');
    await loadCatalog();
  } catch (err) {
    toast(errorMessage(err), { type: 'error' });
  }
}
async function award(r) {
  const email = window.prompt(`Email ученика для «${r.title}»:`);
  if (!email) return;
  try {
    const list = await get('admin/students', { q: email.trim() });
    const s = list.find((x) => x.email === email.trim().toLowerCase());
    if (!s) { toast('Ученик не найден', { type: 'error' }); return; }
    const reason = window.prompt('Основание:');
    if (!reason) return;
    const res = await post('admin/rewards/award', { rewardId: r.id, uid: s.uid, reason });
    toast(res.status === 'issued' ? 'Выдано' : 'Отправлено на утверждение');
    await Promise.all([loadIssues(), loadCatalog()]);
  } catch (err) {
    toast(err.code === 'criteria_not_met' ? `Условия не выполнены: книг ${err.data?.snapshot?.confirmedBooks ?? 0}, очков ${err.data?.snapshot?.pointsThisYear ?? 0}` : errorMessage(err), { type: 'error' });
  }
}
async function decide(i, decision) {
  const note = decision === 'approve' ? '' : window.prompt('Причина:');
  if (decision !== 'approve' && !note) return;
  try {
    await post(`admin/rewards/issues/${i.id}/decide`, { decision, note });
    toast('Готово');
    await Promise.all([loadIssues(), loadCatalog()]);
  } catch (err) {
    toast(errorMessage(err), { type: 'error' });
  }
}
watch(form, (v) => document.body.classList.toggle('modal-open', Boolean(v)));
onMounted(() => Promise.all([loadCatalog(), loadIssues()]));
</script>

<style scoped>
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
.two > div { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
.two .rows { width: 100%; }
.narrow { width: auto; }
.stack { display: flex; flex-direction: column; gap: 12px; }
.crit { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; border: 1px solid var(--line); border-radius: var(--r-md); padding: 10px; margin: 0; }
@media (max-width: 900px) { .two { grid-template-columns: 1fr; } .crit { grid-template-columns: 1fr; } }
</style>
