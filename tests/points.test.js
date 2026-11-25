import { describe, it, expect } from 'vitest';
import {
  entriesForConfirmation, milestoneEntries, onlyNewEntries, summarizeLedger, rankRows, groupTotals,
  shortPublicName, academicYearOf, quarterOf, monthOf, normalizeSettings, isMeaningfulReview, suspiciousFlags, ledgerId,
} from '../src/lib/points.js';

const NOW = new Date('2026-11-20T10:00:00Z');
const progress = (over = {}) => ({ id: 'u1__bk_1', uid: 'u1', bookId: 'bk_1', isHundred: false, ...over });

describe('points formula', () => {
  it('gives 100 points for a confirmed book', () => {
    const entries = entriesForConfirmation(progress(), { now: NOW, actorUid: 'lib' });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ points: 100, kind: 'book', uid: 'u1', createdBy: 'lib' });
  });

  it('adds 25 for a 100 kitap book and 20 for an accepted review', () => {
    const entries = entriesForConfirmation(progress({ isHundred: true }), { now: NOW, reviewAccepted: true });
    expect(entries.map((e) => [e.kind, e.points])).toEqual([['book', 100], ['hundred', 25], ['review', 20]]);
  });

  it('uses admin-defined settings', () => {
    const entries = entriesForConfirmation(progress({ isHundred: true }), { now: NOW, settings: { confirmedBook: 80, hundredBonus: 10 } });
    expect(entries.reduce((s, e) => s + e.points, 0)).toBe(90);
  });

  it('does not give full points for re-reading a book already confirmed', () => {
    const entries = entriesForConfirmation(progress({ isHundred: true }), { now: NOW, alreadyConfirmedBookIds: ['bk_1'] });
    expect(entries.reduce((s, e) => s + e.points, 0)).toBe(0);
    const partial = entriesForConfirmation(progress(), { now: NOW, alreadyConfirmedBookIds: ['bk_1'], settings: { rereadShare: 0.5 } });
    expect(partial[0].points).toBe(50);
  });

  it('stamps month, term and school year', () => {
    const [entry] = entriesForConfirmation(progress(), { now: NOW });
    expect(entry).toMatchObject({ month: '2026-11', quarter: '2026-2027-Q2', academicYear: '2026-2027' });
  });
});

describe('no double crediting', () => {
  it('uses deterministic ledger ids for the same event', () => {
    const a = entriesForConfirmation(progress(), { now: NOW });
    const b = entriesForConfirmation(progress(), { now: new Date('2026-12-01') });
    expect(a[0].id).toBe(b[0].id);
    expect(a[0].id).toBe(ledgerId('book', 'u1__bk_1'));
  });

  it('drops entries that already exist in the ledger', () => {
    const entries = entriesForConfirmation(progress({ isHundred: true }), { now: NOW });
    const existing = new Set([entries[0].id]);
    expect(onlyNewEntries(entries, existing).map((e) => e.kind)).toEqual(['hundred']);
    expect(onlyNewEntries([...entries, ...entries], new Set())).toHaveLength(2);
  });

  it('counts a duplicated ledger row only once in the summary', () => {
    const entries = entriesForConfirmation(progress(), { now: NOW });
    expect(summarizeLedger([...entries, ...entries]).total).toBe(100);
  });
});

describe('milestones and summary', () => {
  it('awards each milestone badge once', () => {
    const first = milestoneEntries('u1', 10, new Set(), { now: NOW });
    expect(first.map((e) => e.badge)).toEqual(['books_10']);
    const again = milestoneEntries('u1', 26, new Set(first.map((e) => e.id)), { now: NOW });
    expect(again.map((e) => e.badge)).toEqual(['books_25']);
    expect(again.every((e) => e.points === 0)).toBe(true);
  });

  it('summarizes totals, periods and badges', () => {
    const ledger = [
      ...entriesForConfirmation(progress({ id: 'a', isHundred: true }), { now: NOW }),
      ...entriesForConfirmation(progress({ id: 'b' }), { now: new Date('2026-09-15') }),
      ...milestoneEntries('u1', 10, new Set(), { now: NOW }),
    ];
    const s = summarizeLedger(ledger);
    expect(s.total).toBe(225);
    expect(s.confirmedBooks).toBe(2);
    expect(s.hundredBooks).toBe(1);
    expect(s.byPeriod['2026-11']).toBe(125);
    expect(s.byPeriod['2026-2027']).toBe(225);
    expect(s.badges).toEqual(['books_10']);
  });
});

describe('rankings', () => {
  it('ranks rows and shares a place on ties, hiding zero scores', () => {
    const ranked = rankRows([{ id: 'a', p: 50 }, { id: 'b', p: 100 }, { id: 'c', p: 50 }, { id: 'd', p: 0 }], (r) => r.p);
    expect(ranked.map((r) => [r.id, r.rank])).toEqual([['b', 1], ['a', 2], ['c', 2]]);
  });

  it('aggregates classes and shanyraks', () => {
    const rows = [
      { classId: '9A', className: '9A', points: 100, confirmedBooks: 1 },
      { classId: '9A', className: '9A', points: 300, confirmedBooks: 3 },
      { classId: '9B', className: '9B', points: 50, confirmedBooks: 1 },
    ];
    const groups = groupTotals(rows, 'classId', 'className');
    expect(groups.find((g) => g.id === '9A')).toMatchObject({ points: 400, members: 2, perStudent: 200, confirmedBooks: 4 });
  });
});

describe('privacy and periods', () => {
  it('builds a short public name without the surname', () => {
    expect(shortPublicName('Аманова Адема')).toBe('А. Адема');
    expect(shortPublicName('Нұрлан')).toBe('Нұрлан');
  });

  it('computes school periods', () => {
    expect(academicYearOf('2027-03-10')).toBe('2026-2027');
    expect(academicYearOf('2026-09-01')).toBe('2026-2027');
    expect(quarterOf('2027-01-15')).toBe('2026-2027-Q3');
    expect(quarterOf('2026-10-15')).toBe('2026-2027-Q1');
    expect(monthOf('2026-02-03')).toBe('2026-02');
  });

  it('normalizes invalid settings to safe defaults', () => {
    const s = normalizeSettings({ confirmedBook: -5, rereadShare: 7, milestones: [50, 'x', 10] });
    expect(s.confirmedBook).toBe(100);
    expect(s.rereadShare).toBe(1);
    expect(s.milestones).toEqual([10, 50]);
  });
});

describe('anti-abuse flags', () => {
  it('flags short, duplicated and bulk requests', () => {
    const text = 'copy paste text that is long enough to pass the length check';
    const history = Array.from({ length: 6 }, (_, i) => ({ id: `r${i}`, requestedAt: '2026-11-20T09:00:00Z', review: text }));
    const flags = suspiciousFlags({ id: 'new', requestedAt: '2026-11-20T10:00:00Z', review: text }, history);
    expect(flags).toContain('many_requests_24h');
    expect(flags).toContain('duplicate_review');
    expect(suspiciousFlags({ id: 'x', review: 'ok' }, [])).toContain('short_review');
  });

  it('recognizes a meaningful review', () => {
    const good = 'Повесть рассказывает о мальчике, который вырос в ауле и мечтал стать чемпионом. Мне запомнилось, как герой тренировался каждое утро и не сдавался после поражений, поддерживая друзей.';
    expect(isMeaningfulReview(good)).toBe(true);
    expect(isMeaningfulReview('книга хорошая книга хорошая')).toBe(false);
  });
});
