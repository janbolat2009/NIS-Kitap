<template>
  <div class="data-table">
    <div class="dt-toolbar">
      <input
        v-model="query"
        class="kp-input dt-search"
        type="search"
        :placeholder="t('common.search')"
        :aria-label="t('common.search')"
        @input="page = 1"
      />
      <div class="dt-actions">
        <span class="kp-muted">{{ t('common.total', { count: result.total }) }}</span>
        <button v-if="exportName" class="kp-btn small" type="button" @click="exportCsv">{{ t('common.export') }}</button>
        <slot name="actions" />
      </div>
    </div>
    <div class="kp-table-wrap">
      <table class="kp-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key" :class="{ 'kp-num': col.numeric }" :aria-sort="ariaSort(col)">
              <button v-if="col.sortable !== false" type="button" @click="toggleSort(col.key)">
                {{ col.label }}
                <span aria-hidden="true">{{ sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '' }}</span>
              </button>
              <span v-else>{{ col.label }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!result.rows.length">
            <td :colspan="columns.length" class="dt-empty">{{ emptyText || t('common.none') }}</td>
          </tr>
          <tr v-for="(row, i) in result.rows" :key="row.id || i">
            <td v-for="col in columns" :key="col.key" :class="{ 'kp-num': col.numeric }">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">{{ format(col, row) }}</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="result.pages > 1" class="kp-pager">
      <button class="kp-btn small" type="button" :disabled="result.page <= 1" @click="page = result.page - 1">{{ t('common.prev') }}</button>
      <span class="kp-muted">{{ t('common.page', { page: result.page, pages: result.pages }) }}</span>
      <button class="kp-btn small" type="button" :disabled="result.page >= result.pages" @click="page = result.page + 1">{{ t('common.next') }}</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { searchSortPage } from '@/lib/analytics';
import { downloadCsv } from '@/lib/csv';
import { t } from '@/i18n';

const props = defineProps({
  rows: { type: Array, default: () => [] },
  // [{ key, label, numeric?, sortable?, format?(row) }]
  columns: { type: Array, required: true },
  searchFields: { type: Array, default: () => [] },
  defaultSort: { type: String, default: '' },
  pageSize: { type: Number, default: 20 },
  exportName: { type: String, default: '' },
  emptyText: { type: String, default: '' },
});

const query = ref('');
const page = ref(1);
const sortKey = ref(props.defaultSort);
const sortDir = ref('desc');

const result = computed(() => searchSortPage(props.rows, {
  query: query.value,
  fields: props.searchFields.length ? props.searchFields : props.columns.map((c) => c.key),
  sortKey: sortKey.value,
  sortDir: sortDir.value,
  page: page.value,
  pageSize: props.pageSize,
}));

function toggleSort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  else {
    sortKey.value = key;
    sortDir.value = 'desc';
  }
}
function ariaSort(col) {
  if (sortKey.value !== col.key) return 'none';
  return sortDir.value === 'asc' ? 'ascending' : 'descending';
}
function format(col, row) {
  if (col.format) return col.format(row);
  const v = row[col.key];
  return v === undefined || v === null || v === '' ? '—' : v;
}
function exportCsv() {
  const all = searchSortPage(props.rows, {
    query: query.value,
    fields: props.searchFields.length ? props.searchFields : props.columns.map((c) => c.key),
    sortKey: sortKey.value,
    sortDir: sortDir.value,
    page: 1,
    pageSize: 1_000_000,
  }).rows;
  downloadCsv(`${props.exportName}.csv`, all, props.columns.map((c) => ({ label: c.label, value: (r) => (c.format ? c.format(r) : r[c.key]) })));
}
</script>

<style scoped>
.dt-toolbar { display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-bottom: 12px; }
.dt-search { max-width: 320px; }
.dt-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.dt-empty { text-align: center; padding: 28px 14px; color: var(--apple-text-muted); }
@media (max-width: 640px) { .dt-search { max-width: none; } }
</style>
