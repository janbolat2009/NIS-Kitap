<template>
  <div class="class-fields">
    <div class="row">
      <div class="field">
        <label class="label" :for="`${uid}-first`">{{ t('onboarding.firstName') }}</label>
        <input :id="`${uid}-first`" v-model.trim="model.firstName" class="input" autocomplete="given-name" maxlength="40" required />
      </div>
      <div class="field">
        <label class="label" :for="`${uid}-last`">{{ t('onboarding.lastName') }}</label>
        <input :id="`${uid}-last`" v-model.trim="model.lastName" class="input" autocomplete="family-name" maxlength="40" />
      </div>
    </div>
    <p class="hint">{{ t('onboarding.nameHint') }}</p>
    <div class="field">
      <label class="label" :for="`${uid}-class`">{{ t('onboarding.class') }}</label>
      <div v-if="loading" class="skeleton" style="height: 44px" />
      <p v-else-if="!classes.length" class="notice">{{ t('onboarding.empty') }}</p>
      <select v-else :id="`${uid}-class`" v-model="model.className" class="select">
        <option value="">{{ t('onboarding.choose') }}</option>
        <optgroup v-for="g in grouped" :key="g.grade" :label="t('hundred.gradeN', { n: g.grade })">
          <option v-for="c in g.items" :key="c.id" :value="c.className">{{ c.className }}</option>
        </optgroup>
      </select>
    </div>
    <transition name="fade-slide">
      <p v-if="selected" class="result" :class="{ unmapped: !selected.shanyrakId }">
        <template v-if="selected.shanyrakId">{{ t('onboarding.result', { name: selected.shanyrakName }) }}</template>
        <template v-else>{{ t('onboarding.unmapped') }}</template>
      </p>
    </transition>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { t } from '@/i18n';
import { listClasses } from '@/services/schoolService';
import { gradeOf } from '@/lib/school';

const model = defineModel({ type: Object, required: true });
const emit = defineEmits(['loaded']);
const uid = `cf${Math.random().toString(36).slice(2, 7)}`;
const classes = ref([]);
const loading = ref(true);

const grouped = computed(() => {
  const map = new Map();
  for (const c of classes.value) {
    const g = gradeOf(c.className);
    map.set(g, [...(map.get(g) || []), c]);
  }
  return [...map.entries()].map(([grade, items]) => ({ grade, items }));
});
// Preview only. The server decides the shanyrak from its own copy of the map.
const selected = computed(() => classes.value.find((c) => c.className === model.value.className) || null);

onMounted(async () => {
  try {
    classes.value = await listClasses();
  } catch {
    classes.value = [];
  } finally {
    loading.value = false;
    emit('loaded', classes.value.length);
  }
});
</script>

<style scoped>
.class-fields { display: flex; flex-direction: column; gap: 12px; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.result { font-size: var(--fs-sm); font-weight: 600; color: var(--success); background: var(--success-soft); padding: 10px 12px; border-radius: var(--r-md); }
.result.unmapped { color: var(--warning); background: var(--warning-soft); font-weight: 500; }
.fade-slide-enter-active { transition: opacity var(--dur-2) ease, transform var(--dur-2) var(--ease-out); }
.fade-slide-enter-from { opacity: 0; transform: translateY(-4px); }
@media (max-width: 380px) { .row { grid-template-columns: 1fr; } }
</style>
