<template>
  <section class="reports">
    <template v-if="can('reports.view')">
      <p v-if="!rep" class="muted">Загрузка…</p>
      <template v-else>
        <div class="stats">
          <div class="stat"><strong>{{ rep.totals.students }}</strong><span>учеников с классом</span></div>
          <div class="stat"><strong>{{ rep.totals.readers }}</strong><span>читали в этом году</span></div>
          <div class="stat"><strong>{{ rep.totals.confirmedBooks }}</strong><span>подтверждённых книг</span></div>
          <div class="stat"><strong>{{ rep.totals.pendingVerifications }}</strong><span>ждут проверки</span></div>
          <div class="stat"><strong>{{ rep.totals.open + rep.totals.ready }}</strong><span>активных броней</span></div>
          <div class="stat"><strong>{{ rep.totals.issued }}</strong><span>книг на руках</span></div>
          <div class="stat"><strong :class="{ bad: rep.totals.overdue }">{{ rep.totals.overdue }}</strong><span>просрочено</span></div>
        </div>
        <div class="two">
          <div>
            <h2 class="section-title">По месяцам</h2>
            <div class="table-wrap"><table class="table"><thead><tr><th>Месяц</th><th class="num">Подтверждено</th><th class="num">Заявок</th><th class="num">Броней</th><th class="num">Выдано</th></tr></thead>
              <tbody><tr v-for="m in rep.months" :key="m.month"><td>{{ m.month }}</td><td class="num">{{ m.confirmed }}</td><td class="num">{{ m.requests }}</td><td class="num">{{ m.reservations }}</td><td class="num">{{ m.issued }}</td></tr></tbody></table></div>
          </div>
          <div>
            <h2 class="section-title">Шаңыраки, {{ rep.academicYear }}</h2>
            <ul class="bars"><li v-for="s in rep.shanyraks" :key="s.name"><span>{{ s.name }}</span><i :style="{ width: `${(s.total / maxSh) * 100}%` }" /><b class="tabular">{{ s.total }}</b></li></ul>
          </div>
        </div>
        <div class="two">
          <div>
            <h2 class="section-title">Участие классов</h2>
            <div class="table-wrap"><table class="table"><thead><tr><th>Класс</th><th>Шаңырак</th><th class="num">Учеников</th><th class="num">Читают</th></tr></thead>
              <tbody><tr v-for="c in rep.classes" :key="c.className"><td>{{ c.className }}</td><td>{{ c.shanyrakName || '—' }}</td><td class="num">{{ c.students }}</td><td class="num">{{ c.activeReaders }}</td></tr></tbody></table></div>
          </div>
          <div>
            <h2 class="section-title">Чаще всего подтверждают</h2>
            <ol class="top"><li v-for="b in rep.topBooks" :key="b.title">{{ b.title }} <span class="muted">· {{ b.count }}</span></li></ol>
          </div>
        </div>
      </template>
    </template>

    <template v-if="can('audit.view')">
      <h2 class="section-title audit-title">Журнал действий сотрудников</h2>
      <div class="table-wrap"><table class="table"><thead><tr><th>Когда</th><th>Кто</th><th>Действие</th><th>Объект</th><th>Комментарий</th></tr></thead>
        <tbody><tr v-for="a in audit" :key="a.id"><td>{{ fmt(a.createdAt) }}</td><td>{{ a.actorEmail }}<div class="muted small">{{ a.actorRole }}</div></td><td>{{ a.action }}</td><td class="small">{{ a.entityType }} / {{ a.entityId }}</td><td class="small">{{ a.note }}</td></tr></tbody></table></div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { session } from '@/stores/session';
import { toast } from '@/stores/ui';
import { get, errorMessage } from '@/services/api';

const can = (p) => session.permissions.includes(p);
const rep = ref(null);
const audit = ref([]);
const maxSh = computed(() => Math.max(1, ...(rep.value?.shanyraks || []).map((s) => s.total)));
const fmt = (iso) => (iso ? new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
onMounted(async () => {
  try {
    if (can('reports.view')) rep.value = await get('admin/reports');
    if (can('audit.view')) audit.value = await get('admin/audit', { limit: 200 });
  } catch (err) {
    toast(errorMessage(err), { type: 'error' });
  }
});
</script>

<style scoped>
.stats { margin-bottom: 24px; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
.bars { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.bars li { display: grid; grid-template-columns: 120px 1fr 60px; gap: 10px; align-items: center; font-size: var(--fs-sm); }
.bars i { display: block; height: 10px; border-radius: 10px; background: var(--accent); }
.bars b { text-align: right; }
.top { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; }
.bad { color: var(--danger); }
.small { font-size: var(--fs-xs); }
.audit-title { margin-top: 12px; }
@media (max-width: 900px) { .two { grid-template-columns: 1fr; } }
</style>
