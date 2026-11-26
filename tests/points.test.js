import { describe, it, expect } from 'vitest';
import {
  normalizeRules, entriesForConfirmation, milestoneEntries, reversalEntry, summarizeLedger, shanyrakPeriodTotals,
  periodKeys, monthsOfQuarter, monthsOfAcademicYear, ledgerId, actionOf, rankRows,
} from '../src/lib/points.js';

const snapshot = { academicYear: '2026-2027', classId: '2026-2027__10A', className: '10A', shanyrakId: '2026-2027__alatau', shanyrakName: 'Алатау' };
const progress = { id: 'u1__bk_1', uid: 'u1', bookId: 'bk_1', bookTitle: 'Абай жолы', isHundred: false };
const now = new Date('2026-11-20T10:00:00Z');

describe('rules', () => {
  it('defaults: 100 per book, 25 for 100 kitap, 20 for an accepted review', () => {
    const e = entriesForConfirmation({ ...progress, isHundred: true }, { reviewAccepted: true, snapshot, now });
    expect(e.map((x) => [x.action, x.points])).toEqual([['book_confirmed', 100], ['hundred_bonus', 25], ['review_accepted', 20]]);
  });

  it('accepts the old setting names and rejects invalid values', () => {
    expect(normalizeRules({ confirmedBook: 50, meaningfulReview: 5 })).toMatchObject({ bookConfirmed: 50, reviewAccepted: 5 });
    expect(normalizeRules({ bookConfirmed: -5, milestones: [5, 'x', 5, 0] })).toMatchObject({ bookConfirmed: 100, milestones: [5] });
  });

  it('stamps period, class and shanyrak of the moment of the action', () => {
    const [e] = entriesForConfirmation(progress, { snapshot, now, actor: { uid: 'lib', role: 'librarian' } });
    expect(e).toMatchObject({ month: '2026-11', quarter: '2026-2027-Q2', academicYear: '2026-2027', className: '10A', shanyrakName: 'Алатау', createdBy: 'lib', createdByRole: 'librarian' });
  });
});

describe('ledger ids and reversals', () => {
  it('the same confirmed action always gets the same id', () => {
    const a = entriesForConfirmation(progress, { snapshot, now });
    const b = entriesForConfirmation(progress, { snapshot, now: new Date() });
    expect(a[0].id).toBe(b[0].id);
    expect(ledgerId('book', 'u1__bk_1')).toBe('book__u1__bk_1');
  });

  it('a reversal mirrors the original into the same period and shanyrak', () => {
    const [orig] = entriesForConfirmation(progress, { snapshot, now });
    const rev = reversalEntry(orig, { reason: 'ошибка', now: new Date('2027-02-01') });
    expect(rev).toMatchObject({ id: `reversal__${orig.id}`, points: -100, month: '2026-11', shanyrakName: 'Алатау', reversalOf: orig.id, reversedAction: 'book_confirmed' });
  });

  it('summary nets reversals and counts a cancelled book as not confirmed', () => {
    const entries = entriesForConfirmation({ ...progress, isHundred: true }, { snapshot, now });
    const rev = reversalEntry(entries[0], {});
    const s = summarizeLedger([...entries, rev, entries[0]]);
    expect(s.total).toBe(25);
    expect(s.confirmedBooks).toBe(0);
    expect(s.hundredBooks).toBe(1);
  });

  it('reads entries of the first version that used `kind`', () => {
    expect(actionOf({ kind: 'book' })).toBe('book_confirmed');
    expect(actionOf({ kind: 'badge' })).toBe('milestone');
  });
});

describe('milestones', () => {
  it('a badge is given exactly when the count reaches the milestone', () => {
    expect(milestoneEntries('u1', 9, { now })).toHaveLength(0);
    expect(milestoneEntries('u1', 10, { now }).map((e) => e.badge)).toEqual(['books_10']);
    expect(milestoneEntries('u1', 11, { now })).toHaveLength(0);
  });
});

describe('periods and shanyrak totals', () => {
  it('maps quarters and years to months', () => {
    expect(monthsOfQuarter('2026-2027-Q3')).toEqual(['2027-01', '2027-02', '2027-03']);
    expect(monthsOfAcademicYear('2026-2027')).toHaveLength(12);
    expect(periodKeys('2027-04-02T00:00:00Z').quarter).toBe('2026-2027-Q4');
  });

  it('sums the chosen period with a breakdown by kind and class', () => {
    const doc = { months: {
      '2026-11': { total: 145, book: 100, hundred: 25, review: 20, classes: { '10A': 145 } },
      '2027-01': { total: 70, book: 100, reversal: -30, classes: { '10B': 70 } },
    } };
    expect(shanyrakPeriodTotals(doc).total).toBe(215);
    expect(shanyrakPeriodTotals(doc, { quarter: '2026-2027-Q2' })).toMatchObject({ total: 145, byClass: { '10A': 145 } });
    expect(shanyrakPeriodTotals(doc, { month: '2027-01' }).byKind).toMatchObject({ book: 100, reversal: -30 });
  });

  it('ranks with shared places and hides zero scores', () => {
    const r = rankRows([{ n: 'a', p: 5 }, { n: 'b', p: 9 }, { n: 'c', p: 5 }, { n: 'd', p: 0 }], (x) => x.p);
    expect(r.map((x) => [x.n, x.rank])).toEqual([['b', 1], ['a', 2], ['c', 2]]);
  });
});
