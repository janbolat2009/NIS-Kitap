// Reader-facing progress of a reservation, built only from fields the server
// writes (api/_lib/domain/loans.js). Nothing here changes a status.
//
//   status     stage shown as current
//   requested  reserved   «Забронировано»
//   ready      prepared   «Подготовлено»  — before pickup.start
//              pickup     «Можно забрать» — from pickup.start (or ready without a pickup window)
//   issued     issued     «Выдано»
//   returned / cancelled / expired → a final state, no scale.
//
// A stage the record never went through (a walk-in loan was never reserved or
// prepared) is left out instead of being shown as done.
import { normalizeStatus, isHoldExpired, FINAL } from './loans.js';

export const LOAN_STAGES = ['reserved', 'prepared', 'pickup', 'issued'];

const time = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.getTime() : null;
};

function went(loan, status) {
  return Array.isArray(loan.history) && loan.history.some((h) => h && h.status === status);
}

export function loanProgress(loan, now = new Date()) {
  const status = normalizeStatus(loan?.status);
  const nowMs = now.getTime();
  if (FINAL.includes(status)) {
    const at = { returned: loan.returnedAt, cancelled: loan.cancelledAt, expired: loan.expiredAt }[status] || loan.updatedAt || '';
    return {
      status, final: true, stages: [], current: '', at,
      byStaff: status === 'cancelled' && Boolean(loan.cancelledByRole) && loan.cancelledByRole !== 'student',
      alert: '',
    };
  }

  const prepared = Boolean(loan.preparedAt) || went(loan, 'ready') || status === 'ready';
  const pickupStart = time(loan.pickup?.start);
  const pickupOpen = status === 'ready' && (pickupStart === null || pickupStart <= nowMs);

  let current = 'reserved';
  if (status === 'ready') current = pickupOpen ? 'pickup' : 'prepared';
  if (status === 'issued') current = 'issued';

  const visible = LOAN_STAGES.filter((key) => {
    if (key === 'reserved') return !loan.walkIn;
    if (key === 'prepared' || key === 'pickup') return status !== 'issued' || prepared;
    return true;
  });
  const currentIndex = visible.indexOf(current);
  const stages = visible.map((key, i) => ({
    key,
    state: i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming',
    at: {
      reserved: loan.createdAt || loan.reservedAt || '',
      prepared: loan.preparedAt || '',
      pickup: loan.pickup?.start || '',
      issued: loan.issuedAt || '',
    }[key],
  }));

  let alert = '';
  if (status === 'issued' && time(loan.dueDate) !== null && time(loan.dueDate) < nowMs) alert = 'overdue';
  else if (isHoldExpired(loan, now)) alert = 'hold_lapsed';

  return { status, final: false, stages, current, at: '', byStaff: false, alert };
}
