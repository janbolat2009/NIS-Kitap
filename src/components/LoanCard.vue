<template>
  <li class="loan-card" :class="[`is-${p.status}`, p.alert && `alert-${p.alert}`]">
    <div class="loan-top">
      <div class="loan-id">
        <router-link v-if="title" :to="{ name: 'BookDetail', params: { title } }" class="loan-title">{{ title }}</router-link>
        <span class="loan-meta">{{ t('loan.code') }}: <b class="tabular">{{ loan.code || loan.id }}</b></span>
      </div>
      <span v-if="p.alert" class="badge" :class="p.alert === 'overdue' ? 'badge-danger' : 'badge-warning'">{{ t(p.alert === 'overdue' ? 'stages.overdueBadge' : 'stages.lapsedBadge') }}</span>
      <span v-else-if="p.final" class="badge" :class="{ 'badge-success': p.status === 'returned', 'badge-danger': p.status === 'cancelled' }">{{ p.status === 'cancelled' ? t('stages.cancelled') : t(`loan.${p.status}`) }}</span>
    </div>

    <ol v-if="!p.final" class="track" :aria-label="t('stages.label')" :style="{ '--steps': p.stages.length }">
      <li
        v-for="s in p.stages"
        :key="s.key"
        class="step"
        :class="`step-${s.state}`"
        :aria-current="s.state === 'current' ? 'step' : undefined"
      >
        <span class="dot" aria-hidden="true">
          <svg v-if="s.state === 'done'" viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>
        </span>
        <span class="step-text">
          <span class="step-name">{{ t(`stages.${s.key}`) }}</span>
          <span class="visually-hidden">, {{ t(`stages.${s.state}`) }}</span>
          <span v-if="s.at && s.state !== 'upcoming'" class="step-date">{{ fmt(s.at, s.key === 'pickup') }}</span>
          <span v-else-if="s.key === 'pickup' && s.at" class="step-date">{{ fmt(s.at, true) }}</span>
        </span>
      </li>
    </ol>

    <p class="next" :class="{ 'is-final': p.final }">{{ hint }}</p>

    <div v-if="canCancel || (p.final && title)" class="loan-actions">
      <button v-if="canCancel" type="button" class="btn btn-danger btn-sm" @click="$emit('cancel', loan)">{{ t('loan.cancel') }}</button>
      <router-link v-if="p.final && title" :to="{ name: 'BookDetail', params: { title } }" class="btn btn-secondary btn-sm">{{ t('hundred.open') }}</router-link>
    </div>
  </li>
</template>

<script setup>
import { computed } from 'vue';
import { t, currentLocale } from '@/i18n';
import { loanProgress } from '@/lib/loanStages';
import { HOLDING } from '@/lib/loans';

const props = defineProps({ loan: { type: Object, required: true }, now: { type: Date, default: () => new Date() } });
defineEmits(['cancel']);

const p = computed(() => loanProgress(props.loan, props.now));
const title = computed(() => props.loan.bookTitle || props.loan.title || '');
const canCancel = computed(() => HOLDING.includes(p.value.status));

const loc = () => ({ kz: 'kk-KZ', en: 'en-GB' }[currentLocale.value] || 'ru-RU');
function fmt(iso, withTime = false) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(loc(), withTime ? { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'long' });
}

const hint = computed(() => {
  const l = props.loan;
  const s = p.value;
  if (s.final) {
    const at = fmt(s.at) || '—';
    const key = s.status === 'cancelled' && s.byStaff ? 'cancelledByStaff' : s.status;
    const again = s.status === 'returned' ? '' : ` ${t('stages.final.again')}`;
    return `${t(`stages.final.${key}`, { at })}${again}`;
  }
  if (s.alert) return t(`stages.next.${s.alert}`, { due: fmt(l.dueDate) });
  const place = l.pickup?.place || '';
  const code = l.code || l.id;
  switch (s.current) {
    case 'prepared': {
      const when = l.pickup ? `${fmt(l.pickup.start)}, ${l.pickup.from}–${l.pickup.to}` : '';
      return when && place ? t('stages.next.prepared', { when, place }) : t('stages.next.pickupNoPlace', { code });
    }
    case 'pickup':
      if (!place) return t('stages.next.pickupNoPlace', { code });
      return l.holdUntil ? t('stages.next.pickupUntil', { until: fmt(l.holdUntil, true), place, code }) : t('stages.next.pickup', { place, code });
    case 'issued':
      return l.dueDate ? t('stages.next.issued', { due: fmt(l.dueDate) }) : t('stages.next.issuedNoDue');
    default:
      return l.holdUntil ? t('stages.next.reserved', { until: fmt(l.holdUntil, true) }) : t('stages.next.reservedNoDate');
  }
});
</script>

<style scoped>
.loan-card {
  display: flex; flex-direction: column; gap: 14px;
  padding: 16px 18px; border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface);
  animation: rise 360ms var(--ease-out) both;
}
.loan-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.loan-id { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.loan-title { color: var(--text-1); font-weight: 650; text-decoration: none; overflow-wrap: anywhere; text-wrap: pretty; }
.loan-title:hover { color: var(--accent-text); text-decoration: underline; }
.loan-meta { font-size: var(--fs-sm); color: var(--text-3); }

/* Horizontal track: dots joined by a line, labels under the dots. */
.track { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(var(--steps), minmax(0, 1fr)); }
.step { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; min-width: 0; padding-right: 8px; }
.step::before {
  content: ''; position: absolute; top: 10px; left: 22px; right: 0; height: 2px; border-radius: 2px;
  background: var(--line-strong);
}
.step:last-child::before { display: none; }
.step-done::before { background: var(--accent-text); }
.dot {
  position: relative; z-index: 1; display: grid; place-items: center;
  width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid var(--line-strong); background: var(--surface); color: var(--on-accent);
}
.step-done .dot { border-color: var(--button-fill); background: var(--button-fill); }
.step-current .dot { border-color: var(--accent-text); box-shadow: 0 0 0 4px var(--accent-soft); }
.step-current .dot::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--accent-text); }
.step-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.step-name { font-size: var(--fs-sm); font-weight: 600; color: var(--text-3); overflow-wrap: anywhere; line-height: 1.3; }
.step-done .step-name { color: var(--text-2); }
.step-current .step-name { color: var(--text-1); font-weight: 720; }
.step-date { font-size: var(--fs-xs); color: var(--text-3); font-variant-numeric: tabular-nums; }

.alert-overdue .step-current .dot { border-color: var(--danger); box-shadow: 0 0 0 4px var(--danger-soft); }
.alert-overdue .step-current .dot::after { background: var(--danger); }
.alert-hold_lapsed .step-current .dot { border-color: var(--warning); box-shadow: 0 0 0 4px var(--warning-soft); }
.alert-hold_lapsed .step-current .dot::after { background: var(--warning); }

.next {
  padding: 10px 12px; border-radius: var(--r-md); background: var(--accent-soft); color: var(--accent-text);
  font-size: var(--fs-sm); line-height: 1.5; text-wrap: pretty;
}
.next.is-final { background: var(--surface-2); color: var(--text-2); }
.alert-overdue .next { background: var(--danger-soft); color: var(--danger); }
.alert-hold_lapsed .next { background: var(--warning-soft); color: var(--warning); }
.is-cancelled, .is-expired { background: var(--bg-elevated); }
.loan-actions { display: flex; flex-wrap: wrap; gap: 8px; }

@media (prefers-reduced-motion: no-preference) {
  .step-current .dot { animation: stage-in 420ms var(--ease-out) both; }
  @keyframes stage-in { from { transform: scale(0.6); opacity: 0.4; } to { transform: none; opacity: 1; } }
}

/* Narrow phones: the same track turns vertical, so labels never get squeezed. */
@media (max-width: 520px) {
  .loan-card { padding: 14px; }
  .track { grid-template-columns: none; gap: 0; }
  .step { flex-direction: row; align-items: flex-start; gap: 12px; padding: 0 0 14px; }
  .step:last-child { padding-bottom: 0; }
  .step::before { top: 22px; bottom: 0; left: 10px; right: auto; width: 2px; height: auto; }
  .step-text { padding-top: 1px; flex-direction: row; flex-wrap: wrap; gap: 2px 8px; align-items: baseline; }
}
</style>
