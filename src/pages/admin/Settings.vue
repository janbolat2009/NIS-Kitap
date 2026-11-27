<template>
  <section class="settings">
    <div v-if="can('settings.manage') && s" class="grid">
      <form class="card" @submit.prevent="saveRules">
        <h2 class="section-title">Правила начисления очков</h2>
        <label class="field"><span class="label">За подтверждённую книгу</span><input v-model.number="rules.bookConfirmed" type="number" min="0" class="input" /></label>
        <label class="field"><span class="label">Бонус за книгу из «100 кітап»</span><input v-model.number="rules.hundredBonus" type="number" min="0" class="input" /></label>
        <label class="field"><span class="label">За засчитанный отзыв</span><input v-model.number="rules.reviewAccepted" type="number" min="0" class="input" /></label>
        <label class="field"><span class="label">Достижения (число книг через запятую)</span><input v-model="milestones" class="input" /></label>
        <label class="field"><span class="label">Предел ручной корректировки</span><input v-model.number="rules.maxManualPoints" type="number" min="0" class="input" /></label>
        <p class="hint">Новые правила применяются к будущим начислениям. Уже записанные операции не пересчитываются.</p>
        <button type="submit" class="btn btn-primary">Сохранить правила</button>
      </form>

      <form class="card" @submit.prevent="saveSchool">
        <h2 class="section-title">Школа и брони</h2>
        <label class="field"><span class="label">Текущий учебный год</span><input v-model="school.currentAcademicYear" class="input" placeholder="2026-2027" /></label>
        <label class="field"><span class="label">Бронь удерживается, часов</span><input v-model.number="school.holdHours" type="number" min="1" class="input" /></label>
        <label class="field"><span class="label">Запас после окна получения, часов</span><input v-model.number="school.pickupGraceHours" type="number" min="0" class="input" /></label>
        <label class="field"><span class="label">Срок выдачи, дней</span><input v-model.number="school.loanDays" type="number" min="1" class="input" /></label>
        <label class="field"><span class="label">Активных броней на ученика</span><input v-model.number="school.maxOpenReservations" type="number" min="1" class="input" /></label>
        <label class="field"><span class="label">Места получения (по одному в строке)</span><textarea v-model="places" class="textarea" /></label>
        <label class="check"><input v-model="school.registrationOpen" type="checkbox" /> Ученики могут выбирать класс</label>
        <button type="submit" class="btn btn-primary">Сохранить</button>
      </form>

      <div class="card">
        <h2 class="section-title">Почта</h2>
        <p :class="s.mail.configured ? 'ok' : 'bad'">{{ s.mail.configured ? 'Отправка настроена' : 'Отправка не настроена' }}</p>
        <p class="small">Отправитель: <b>{{ s.mail.from || '—' }}</b><span v-if="s.mail.replyTo"> · ответы на {{ s.mail.replyTo }}</span></p>
        <p class="small">Сервер SMTP: {{ s.mail.host || '—' }} · вход {{ s.mail.verified ? 'проверен' : s.mail.error ? `ошибка: ${s.mail.error}` : 'не проверялся' }}</p>
        <ul v-if="s.mail.problems.length" class="small warn"><li v-for="p in s.mail.problems" :key="p">{{ p }}</li></ul>
        <p class="hint">Письма уходят только от учётной записи SMTP_USER. Другой адрес отправителя используется, только если MAIL_FROM_VERIFIED=true (домен подтверждён у почтового сервиса).</p>
        <button type="button" class="btn btn-secondary btn-sm" @click="checkMail">Проверить подключение</button>
      </div>

      <div class="card">
        <h2 class="section-title">Обслуживание</h2>
        <p class="small">Миграция данных прежней версии: только добавляет поля, перед изменением сохраняет копии документов.</p>
        <div class="row-actions">
          <button type="button" class="btn btn-secondary btn-sm" @click="migrate(true)">Проверить (без изменений)</button>
          <button type="button" class="btn btn-primary btn-sm" @click="migrate(false)">Выполнить миграцию</button>
          <button type="button" class="btn btn-ghost btn-sm" @click="rebuild">Пересчитать итоги из журнала</button>
        </div>
        <pre v-if="maint" class="out">{{ maint }}</pre>
      </div>
    </div>

    <div v-if="can('roles.manage')" class="card roles">
      <h2 class="section-title">Роли сотрудников</h2>
      <p class="small">Постоянные роли заданы в <code>config/access.json</code>: директор, завуч, библиотекарь, технический администратор. Здесь можно добавить ещё сотрудников. Роль действует только после входа с подтверждённым email.</p>
      <ul class="rows">
        <li v-for="r in roles" :key="r.id" class="row-item">
          <div class="row-main"><div class="row-title">{{ r.id }}</div><div class="row-meta">{{ ROLE[r.role] || r.role }}<span v-if="r.fixed"> · закреплён в config/access.json, доступ уже есть</span><span v-else-if="!r.active"> · не действует</span></div></div>
          <div v-if="!r.fixed" class="row-actions"><button type="button" class="btn btn-ghost btn-sm" @click="setRole(r.id, 'student')">Снять роль</button></div>
        </li>
      </ul>
      <form class="add" @submit.prevent="addStaff">
        <input v-model="newEmail" type="email" class="input" placeholder="email сотрудника" required />
        <select v-model="newRole" class="select"><option value="librarian">Библиотекарь</option><option value="deputy">Завуч</option><option value="director">Директор</option></select>
        <button type="submit" class="btn btn-primary">Назначить</button>
      </form>
      <h3>Права ролей</h3>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Право</th><th v-for="r in matrixRoles" :key="r">{{ ROLE[r] }}</th></tr></thead>
          <tbody><tr v-for="(roles2, perm) in PERMISSIONS" :key="perm"><td>{{ PERMISSION_LABELS[perm] }}</td><td v-for="r in matrixRoles" :key="r" class="c">{{ roles2.includes(r) ? '✓' : '' }}</td></tr></tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { session } from '@/stores/session';
import { toast } from '@/stores/ui';
import { get, post, errorMessage } from '@/services/api';
import { PERMISSIONS, PERMISSION_LABELS, STAFF_ROLES } from '@/lib/permissions';

const ROLE = { librarian: 'Библиотекарь', deputy: 'Завуч', director: 'Директор', tech_admin: 'Техадмин', student: 'Ученик' };
const can = (p) => session.permissions.includes(p);
const matrixRoles = STAFF_ROLES;
const s = ref(null);
const rules = reactive({});
const school = reactive({});
const milestones = ref('');
const places = ref('');
const maint = ref('');
const roles = ref([]);
const newEmail = ref('');
const newRole = ref('librarian');

async function load() {
  if (can('settings.manage')) {
    s.value = await get('admin/settings');
    Object.assign(rules, s.value.rules);
    Object.assign(school, s.value.school);
    milestones.value = (s.value.rules.milestones || []).join(', ');
    places.value = (s.value.school.pickupPlaces || []).join('\n');
  }
  if (can('roles.manage')) roles.value = await get('admin/roles');
}
async function wrap(fn, msg) {
  try {
    await fn();
    toast(msg);
    await load();
  } catch (err) {
    toast(errorMessage(err), { type: 'error' });
  }
}
const saveRules = () => wrap(() => post('admin/settings/points', { ...rules, milestones: milestones.value.split(/[,\s]+/).map(Number).filter(Boolean) }), 'Правила сохранены');
const saveSchool = () => wrap(() => post('admin/settings/school', { ...school, pickupPlaces: places.value.split('\n').map((x) => x.trim()).filter(Boolean) }), 'Настройки сохранены');
const checkMail = () => wrap(async () => { s.value.mail = await get('admin/mail/status'); }, 'Проверено');
const setRole = (email, role) => wrap(() => post('admin/roles', { email, role }), 'Роль обновлена');
async function addStaff() {
  const email = newEmail.value.trim().toLowerCase();
  if (!email) return;
  await setRole(email, newRole.value);
  // Keep the address in the field when it failed, so it can be corrected.
  if (roles.value.some((r) => r.id === email)) newEmail.value = '';
}
async function migrate(dryRun) {
  if (!dryRun && !window.confirm('Выполнить миграцию в рабочей базе? Копии изменяемых документов будут сохранены.')) return;
  try { maint.value = JSON.stringify(await post('admin/maintenance/migrate', dryRun ? { dryRun: true } : { apply: true, dryRun: false }), null, 2); } catch (err) { toast(errorMessage(err), { type: 'error' }); }
}
async function rebuild() {
  try { maint.value = JSON.stringify(await post('admin/maintenance/rebuild', { apply: true }), null, 2); } catch (err) { toast(errorMessage(err), { type: 'error' }); }
}
onMounted(() => load().catch((err) => toast(errorMessage(err), { type: 'error' })));
</script>

<style scoped>
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.card { display: flex; flex-direction: column; gap: 12px; }
.small { font-size: var(--fs-sm); }
.ok { color: var(--success); font-weight: 650; }
.bad, .warn { color: var(--danger); }
.out { background: var(--bg-elevated); border: 1px solid var(--line); border-radius: var(--r-md); padding: 10px; font-size: 12px; overflow: auto; max-height: 260px; }
.roles { margin-top: 16px; }
.add { display: flex; gap: 8px; flex-wrap: wrap; }
.add .input { flex: 1; min-width: 220px; }
.add .select { width: auto; }
.c { text-align: center; color: var(--success); font-weight: 700; }
h3 { margin-top: 8px; }
@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
</style>
