<template>
  <section class="classes">
    <div class="toolbar">
      <label class="field"><span class="label">Учебный год</span><input v-model="year" class="input narrow" placeholder="2026-2027" @change="load" /></label>
      <span class="muted">Текущий: {{ data?.currentAcademicYear }}</span>
    </div>
    <p class="notice notice-info">Шаңырак ученика определяется только по этой таблице. Изменение шаңырака класса влияет на будущие начисления; заработанные очки остаются за шаңыраком, в котором были получены.</p>
    <p v-if="data?.unmapped?.length" class="notice notice-warning">Не сопоставлены с шаңыраком: {{ data.unmapped.join(', ') }}</p>

    <div class="two">
      <div>
        <h2 class="section-title">Классы <span class="muted">· {{ data?.classes?.length || 0 }}</span></h2>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Класс</th><th>Шаңырак</th><th class="num">Учеников</th><th /></tr></thead>
            <tbody>
              <tr v-for="c in data?.classes || []" :key="c.id" :class="{ off: c.active === false }">
                <td><b>{{ c.className }}</b></td>
                <td>{{ c.shanyrakName || 'не сопоставлен' }}</td>
                <td class="num">{{ c.students }}</td>
                <td><button v-if="manage" type="button" class="btn btn-ghost btn-sm" @click="editClass(c)">Изменить</button></td>
              </tr>
            </tbody>
          </table>
        </div>
        <button v-if="manage" type="button" class="btn btn-secondary" @click="editClass(null)">Добавить класс</button>
      </div>

      <div v-if="manage">
        <h2 class="section-title">Импорт CSV</h2>
        <p class="muted small">Столбцы: <code>academic_year,class_name,shanyrak_name</code>. Пустой шаңырак — «класс пока не сопоставлен». Сначала проверьте предпросмотр.</p>
        <input type="file" accept=".csv,text/csv" class="input" @change="readFile" />
        <textarea v-model="csv" class="textarea mono" placeholder="academic_year,class_name,shanyrak_name" />
        <label class="check"><input v-model="replace" type="checkbox" /> Заменить список: классы, которых нет в файле, станут неактивными</label>
        <div class="row-actions">
          <button type="button" class="btn btn-secondary" :disabled="!csv.trim()" @click="runImport(true)">Предпросмотр</button>
          <button type="button" class="btn btn-primary" :disabled="!preview || preview.errors.length" @click="runImport(false)">Применить</button>
        </div>
        <div v-if="preview" class="preview">
          <p v-if="preview.errors.length" class="notice notice-danger">Ошибки: {{ preview.errors.map((e) => `стр. ${e.line}: ${e.message}`).join('; ') }}</p>
          <p v-if="preview.warnings.length" class="muted small">Замечания: {{ preview.warnings.map((e) => e.message).join('; ') }}</p>
          <p>Год {{ preview.academicYear }}: новых {{ preview.added.length }}, изменится шаңырак у {{ preview.changed.length }}, без изменений {{ preview.unchanged }}, станут неактивными {{ preview.deactivated.length }}.</p>
          <ul v-if="preview.changed.length" class="small"><li v-for="c in preview.changed" :key="c.className">{{ c.className }}: {{ c.from || '—' }} → {{ c.to || 'не сопоставлен' }}</li></ul>
          <p v-if="preview.applied" class="notice notice-success">Применено.</p>
        </div>
        <h2 class="section-title next">Новый учебный год</h2>
        <p class="muted small">Скопировать соответствие на следующий год. С повышением класса 10A станет 11A, выпускные классы не переносятся.</p>
        <div class="row-actions">
          <button type="button" class="btn btn-secondary" @click="copy(true)">Скопировать с повышением</button>
          <button type="button" class="btn btn-ghost" @click="copy(false)">Скопировать как есть</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { session } from '@/stores/session';
import { toast } from '@/stores/ui';
import { get, post, errorMessage } from '@/services/api';
import { nextAcademicYear } from '@/lib/school';

const manage = computed(() => session.permissions.includes('classes.manage'));
const data = ref(null);
const year = ref('');
const csv = ref('');
const replace = ref(false);
const preview = ref(null);

async function load() {
  try {
    data.value = await get('admin/class-map', { year: year.value });
    year.value = data.value.academicYear;
  } catch (err) {
    toast(errorMessage(err), { type: 'error' });
  }
}
async function readFile(e) {
  const file = e.target.files?.[0];
  if (file) csv.value = await file.text();
}
async function runImport(dryRun) {
  try {
    preview.value = await post('admin/class-map/import', { csv: csv.value, academicYear: year.value, dryRun, mode: replace.value ? 'replace' : 'merge' });
    if (!dryRun && preview.value.applied) await load();
  } catch (err) {
    toast(errorMessage(err), { type: 'error' });
  }
}
async function editClass(c) {
  const className = c ? c.className : window.prompt('Класс (например, 7A):');
  if (!className) return;
  const shanyrakName = window.prompt(`Шаңырак для ${className} (пусто — не сопоставлен):`, c?.shanyrakName || '');
  if (shanyrakName === null) return;
  const active = c ? window.confirm('Класс активен? «Отмена» — сделать неактивным.') : true;
  try {
    await post('admin/class-map/upsert', { academicYear: year.value, className, shanyrakName, active });
    toast('Сохранено');
    await load();
  } catch (err) {
    toast(errorMessage(err), { type: 'error' });
  }
}
async function copy(shiftGrades) {
  const to = nextAcademicYear(year.value);
  if (!window.confirm(`Скопировать соответствие ${year.value} на ${to}?`)) return;
  try {
    const res = await post('admin/class-map/copy-year', { from: year.value, to, shiftGrades });
    toast(`Готово: ${res.added.length} классов на ${to}`);
  } catch (err) {
    toast(errorMessage(err), { type: 'error' });
  }
}
onMounted(load);
</script>

<style scoped>
.toolbar { display: flex; gap: 14px; align-items: flex-end; margin-bottom: 14px; }
.narrow { max-width: 160px; }
.two { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 28px; margin-top: 16px; }
.two > div { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
.two .table-wrap, .two .textarea, .two .input { width: 100%; }
.mono { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 13px; min-height: 160px; }
.off td { color: var(--text-3); }
.small { font-size: var(--fs-sm); }
.preview { width: 100%; display: flex; flex-direction: column; gap: 8px; }
.next { margin-top: 16px; }
@media (max-width: 900px) { .two { grid-template-columns: 1fr; } }
</style>
