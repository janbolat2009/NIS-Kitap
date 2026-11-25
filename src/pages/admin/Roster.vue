<template>
  <PageShell>
    <AdminNav />
    <header class="kp-head">
      <div>
        <h1 class="kp-title">{{ t('roster.title') }}</h1>
        <p class="kp-subtitle">{{ t('roster.subtitle') }}</p>
      </div>
    </header>

    <StaffGate :permission="['roster.manage', 'roles.manage']">
      <div class="kp-tabs rs-tabs" role="tablist">
        <button v-for="tab in tabs" :key="tab.id" role="tab" class="kp-tab" :class="{ active: activeTab === tab.id }" :aria-selected="activeTab === tab.id" @click="activeTab = tab.id">{{ tab.label }}</button>
      </div>

      <!-- Shanyraks & classes -->
      <section v-if="activeTab === 'shanyraks'" class="rs-panel">
        <div class="kp-card rs-import">
          <h2 class="kp-h2">{{ t('roster.importShanyraks') }}</h2>
          <p class="kp-muted">{{ t('roster.importHint', { columns: SHANYRAK_COLUMNS.join(', ') }) }}</p>
          <div class="rs-import-actions">
            <label class="kp-btn">
              {{ t('roster.chooseFile') }}
              <input type="file" accept=".csv,.json,text/csv,application/json" class="kp-sr-only" @change="readFile($event, 'shanyraks')" />
            </label>
            <button class="kp-btn" type="button" @click="template(SHANYRAK_COLUMNS, 'shanyrak_import_template')">{{ t('roster.template') }}</button>
          </div>
          <ImportPreview v-if="shanyrakPreview" :preview="shanyrakPreview" :count="shanyrakPreview.classes.length" />
          <button v-if="shanyrakPreview && !shanyrakPreview.errors.length && shanyrakPreview.classes.length" class="kp-btn primary" :disabled="busy" @click="applyShanyraks">{{ t('roster.apply') }}</button>
        </div>

        <div v-if="loading" class="kp-skeleton kp-section" style="height: 220px"></div>
        <div v-else class="kp-section">
          <p v-if="!shanyraks.length" class="kp-muted">{{ t('roster.empty') }}</p>
          <div v-else class="kp-grid">
            <article v-for="s in shanyraks" :key="s.id" class="kp-card">
              <span class="kp-muted">{{ s.academicYear }}</span>
              <h3 class="rs-name">{{ s.name }}</h3>
              <p class="kp-muted">{{ t('roster.curator') }}: {{ s.curatorName }}</p>
              <div class="kp-chips"><span v-for="c in s.classNames" :key="c" class="kp-pill">{{ c }}</span></div>
            </article>
          </div>
        </div>
      </section>

      <!-- Students -->
      <section v-if="activeTab === 'students'" class="rs-panel">
        <div class="kp-card rs-import">
          <h2 class="kp-h2">{{ t('roster.importStudents') }}</h2>
          <p class="kp-muted">{{ t('roster.importHint', { columns: STUDENT_COLUMNS.join(', ') }) }}</p>
          <div class="rs-import-actions">
            <label class="kp-btn">
              {{ t('roster.chooseFile') }}
              <input type="file" accept=".csv,.json,text/csv,application/json" class="kp-sr-only" @change="readFile($event, 'students')" />
            </label>
            <button class="kp-btn" type="button" @click="template(STUDENT_COLUMNS, 'students_import_template')">{{ t('roster.template') }}</button>
          </div>
          <ImportPreview v-if="studentPreview" :preview="studentPreview" :count="studentPreview.students.length" />
          <button v-if="studentPreview && !studentPreview.errors.length && studentPreview.students.length" class="kp-btn primary" :disabled="busy" @click="applyStudents">{{ t('roster.apply') }}</button>
        </div>
        <div class="kp-section">
          <DataTable
            :rows="students"
            :columns="studentColumns"
            :search-fields="['fullName', 'email', 'className', 'shanyrakName']"
            default-sort="className"
            export-name="nis-kitap-roster"
            :empty-text="t('roster.empty')"
          />
        </div>
      </section>

      <!-- Roles -->
      <section v-if="activeTab === 'roles'" class="rs-panel">
        <p class="kp-muted">{{ t('roster.roleHint') }}</p>
        <form class="kp-card rs-role-form" @submit.prevent="assign">
          <div class="kp-field">
            <label class="kp-label" for="r-email">{{ t('roster.roleEmail') }}</label>
            <input id="r-email" v-model.trim="roleForm.email" class="kp-input" type="email" required />
          </div>
          <div class="kp-field">
            <label class="kp-label" for="r-role">{{ t('roster.role') }}</label>
            <select id="r-role" v-model="roleForm.role" class="kp-select">
              <option v-for="r in ROLES" :key="r" :value="r">{{ t(`roster.roles.${r}`) }}</option>
            </select>
          </div>
          <div v-if="roleForm.role === 'teacher'" class="kp-field">
            <label class="kp-label" for="r-subject">{{ t('rewards.subject') }}</label>
            <select id="r-subject" v-model="roleForm.subject" class="kp-select">
              <option v-for="s in SUBJECTS" :key="s" :value="s">{{ t(`rewards.subjects.${s}`) }}</option>
            </select>
          </div>
          <button class="kp-btn primary" type="submit" :disabled="busy">{{ t('roster.assign') }}</button>
        </form>
        <DataTable
          class="kp-section"
          :rows="roleRows"
          :columns="roleColumns"
          default-sort="email"
          :empty-text="t('roster.empty')"
        >
          <template #cell-actions="{ row }">
            <button class="kp-btn small danger" :disabled="busy" @click="unassign(row)">{{ t('roster.remove') }}</button>
          </template>
        </DataTable>
      </section>
    </StaffGate>

    <div v-if="toast" class="kp-toast" :class="{ error: toastError }" role="status">{{ toast }}</div>
  </PageShell>
</template>

<script setup>
import { computed, defineComponent, h, reactive, ref, watch } from 'vue';
import PageShell from '@/components/PageShell.vue';
import StaffGate from '@/components/StaffGate.vue';
import AdminNav from '@/components/AdminNav.vue';
import DataTable from '@/components/DataTable.vue';
import { session, refreshSessionRole } from '@/stores/session';
import { can, ROLES } from '@/lib/roles';
import { SUBJECTS } from '@/lib/workflow';
import { parseShanyrakImport, parseStudentImport, SHANYRAK_COLUMNS, STUDENT_COLUMNS } from '@/lib/importer';
import { downloadCsv } from '@/lib/csv';
import { t } from '@/i18n';
import {
  importShanyraks, importStudents, listShanyraks, listStudents, listClasses, listRoleAssignments, assignRole, removeRole,
} from '@/services/adminService';

const ImportPreview = defineComponent({
  props: { preview: { type: Object, required: true }, count: { type: Number, default: 0 } },
  setup(props) {
    return () => h('div', { class: 'rs-preview', role: 'status' }, [
      h('strong', t('roster.preview')),
      h('span', t('roster.rows', { count: props.count })),
      h('span', { class: props.preview.errors.length ? 'rs-bad' : '' }, t('roster.errorsCount', { count: props.preview.errors.length })),
      props.preview.warnings ? h('span', t('roster.warningsCount', { count: props.preview.warnings.length })) : null,
      props.preview.errors.length
        ? h('ul', { class: 'rs-errors' }, props.preview.errors.slice(0, 20).map((e) => h('li', `#${e.line}: ${e.message}`)))
        : null,
    ]);
  },
});

const tabs = computed(() => [
  ...(can(session.role, 'roster.manage') ? [{ id: 'shanyraks', label: t('roster.tabShanyraks') }, { id: 'students', label: t('roster.tabStudents') }] : []),
  ...(can(session.role, 'roles.manage') ? [{ id: 'roles', label: t('roster.tabRoles') }] : []),
]);
const activeTab = ref('shanyraks');

const loading = ref(false);
const busy = ref(false);
const toast = ref('');
const toastError = ref(false);
const shanyraks = ref([]);
const classes = ref([]);
const students = ref([]);
const roles = ref([]);
const shanyrakPreview = ref(null);
const studentPreview = ref(null);
const fileNames = reactive({ shanyraks: '', students: '' });

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

function template(columns, name) {
  downloadCsv(`${name}.csv`, [], columns.map((c) => ({ label: c, key: c })));
}

async function readFile(event, kind) {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  fileNames[kind] = file.name;
  if (kind === 'shanyraks') shanyrakPreview.value = parseShanyrakImport(text);
  else studentPreview.value = parseStudentImport(text, classes.value);
  event.target.value = '';
}

async function applyShanyraks() {
  busy.value = true;
  try {
    await importShanyraks(shanyrakPreview.value, fileNames.shanyraks);
    shanyrakPreview.value = null;
    await load();
    notify(t('roster.imported'));
  } catch (err) {
    notify(errorText(err), true);
  } finally {
    busy.value = false;
  }
}

async function applyStudents() {
  busy.value = true;
  try {
    await importStudents(studentPreview.value, fileNames.students);
    studentPreview.value = null;
    await load();
    notify(t('roster.imported'));
  } catch (err) {
    notify(errorText(err), true);
  } finally {
    busy.value = false;
  }
}

const studentColumns = computed(() => [
  { key: 'fullName', label: t('common.name') },
  { key: 'email', label: t('common.email') },
  { key: 'className', label: t('common.class') },
  { key: 'shanyrakName', label: t('common.shanyrak') },
  { key: 'academicYear', label: t('common.year') },
]);

// ---------- roles ----------
const roleForm = reactive({ email: '', role: 'librarian', subject: 'kazakh' });
const roleRows = computed(() => roles.value.map((r) => ({
  ...r,
  roleLabel: t(`roster.roles.${r.role}`) + (r.subject ? ` · ${t(`rewards.subjects.${r.subject}`)}` : ''),
})));
const roleColumns = computed(() => [
  { key: 'email', label: t('common.email') },
  { key: 'roleLabel', label: t('roster.role') },
  { key: 'assignedAt', label: t('common.date'), format: (r) => (r.assignedAt ? new Date(r.assignedAt).toLocaleDateString() : '—') },
  { key: 'actions', label: t('common.actions'), sortable: false, format: () => '' },
]);
async function assign() {
  busy.value = true;
  try {
    await assignRole(roleForm.email, roleForm.role, roleForm.subject);
    roleForm.email = '';
    roles.value = await listRoleAssignments();
    await refreshSessionRole();
    notify(t('common.saved'));
  } catch (err) {
    notify(errorText(err), true);
  } finally {
    busy.value = false;
  }
}
async function unassign(row) {
  busy.value = true;
  try {
    await removeRole(row.email || row.id);
    roles.value = await listRoleAssignments();
    notify(t('common.saved'));
  } catch (err) {
    notify(errorText(err), true);
  } finally {
    busy.value = false;
  }
}

async function load() {
  loading.value = true;
  try {
    if (can(session.role, 'roster.manage')) {
      const [s, c, st] = await Promise.all([listShanyraks(), listClasses(), listStudents()]);
      const sortName = (a, b) => String(a.name).localeCompare(String(b.name), 'kk');
      shanyraks.value = s.sort((a, b) => String(b.academicYear).localeCompare(String(a.academicYear)) || sortName(a, b));
      classes.value = c;
      students.value = st;
    }
    if (can(session.role, 'roles.manage')) roles.value = await listRoleAssignments();
  } catch (err) {
    notify(errorText(err), true);
  } finally {
    loading.value = false;
  }
}

watch(() => [session.ready, session.role], () => {
  if (!session.ready) return;
  if (tabs.value.length && !tabs.value.some((tab) => tab.id === activeTab.value)) activeTab.value = tabs.value[0].id;
  load();
}, { immediate: true });
</script>

<style scoped>
.rs-tabs { margin-bottom: 20px; width: max-content; }
.rs-import { display: grid; gap: 12px; }
.rs-import-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.rs-name { margin: 6px 0; font-size: 18px; }
.rs-role-form { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); align-items: end; margin: 12px 0 0; }
:deep(.rs-preview) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 12px 14px;
  border-radius: var(--apple-radius-md);
  background: rgba(255, 255, 255, 0.04);
  font-size: 14px;
  color: var(--apple-text-secondary);
}
:deep(.rs-bad) { color: #FDA4AF; }
:deep(.rs-errors) { width: 100%; margin: 4px 0 0; padding-left: 18px; font-size: 13px; color: #FDA4AF; }
@media (max-width: 640px) { .rs-tabs { width: 100%; } }
</style>
