import { describe, it, expect } from 'vitest';
import { computeKpis, chartsData, filterEvents, filterProgress, searchSortPage, monthlySeries } from '../src/lib/analytics.js';

const NOW = new Date('2026-11-25T12:00:00Z');
const students = [
  { uid: 'u1', email: 'a@s.kz', classId: 'y__9A', className: '9A', grade: 9, shanyrakId: 's1', shanyrakName: 'Ертіс', academicYear: '2026-2027' },
  { uid: 'u2', email: 'b@s.kz', classId: 'y__10B', className: '10B', grade: 10, shanyrakId: 's2', shanyrakName: 'Каспий', academicYear: '2026-2027' },
  { uid: '', email: 'c@s.kz', classId: 'y__10B', className: '10B', grade: 10, shanyrakId: 's2', shanyrakName: 'Каспий', academicYear: '2026-2027' },
];
const events = [
  { uid: 'u1', type: 'view', occurredAt: '2026-11-24T10:00:00Z', language: 'Қазақ' },
  { uid: 'u1', type: 'bookmark', occurredAt: '2026-11-24T10:00:00Z', language: 'Қазақ' },
  { uid: 'u1', type: 'issue', occurredAt: '2026-11-20T10:00:00Z', language: 'Қазақ' },
  { uid: 'u2', type: 'return', occurredAt: '2026-10-01T10:00:00Z', language: 'Русский' },
  { uid: 'u2', type: 'reservation', occurredAt: '2026-11-23T10:00:00Z', language: 'Русский' },
];
const progress = [
  { uid: 'u1', bookTitle: 'Абай жолы', bookAuthor: 'М. Әуезов', genre: 'роман', language: 'Қазақ', isHundred: true, verificationStatus: 'confirmed', verifiedAt: '2026-11-21T10:00:00Z' },
  { uid: 'u2', bookTitle: 'Тихий Дон', bookAuthor: 'М. Шолохов', genre: 'роман', language: 'Русский', isHundred: true, verificationStatus: 'confirmed', verifiedAt: '2026-10-02T10:00:00Z' },
  { uid: 'u2', bookTitle: 'Демон', bookAuthor: 'М. Лермонтов', genre: 'поэма', language: 'Русский', isHundred: true, verificationStatus: 'pending', requestedAt: '2026-11-22T10:00:00Z' },
  { uid: 'u1', bookTitle: 'Viewed only', verificationStatus: 'none', status: 'want' },
];
const reservations = [
  { uid: 'u1', status: 'issued', dueDate: '2026-11-01T00:00:00Z' },
  { uid: 'u2', status: 'active', dueDate: '2026-12-10T00:00:00Z' },
  { uid: 'u2', status: 'returned', dueDate: '2026-10-10T00:00:00Z' },
];
const data = { events, progress, reservations, students };

describe('analytics KPIs', () => {
  it('counts only confirmed readings as read (not views or bookmarks)', () => {
    const k = computeKpis(data, {}, NOW);
    expect(k.confirmedReads).toBe(2);
    expect(k.views).toBe(1);
    expect(k.bookmarks).toBe(1);
    expect(k.issued).toBe(1);
    expect(k.returned).toBe(1);
    expect(k.totalStudents).toBe(3);
    expect(k.hundredParticipants).toBe(2);
    expect(k.activeReservations).toBe(2);
    expect(k.overdueReservations).toBe(1);
  });

  it('counts active readers by window and ignores page views', () => {
    const k = computeKpis(data, {}, NOW);
    expect(k.activeWeek).toBe(2);
    expect(k.activeMonth).toBe(2);
  });

  it('filters by class, shanyrak, grade and language', () => {
    expect(computeKpis(data, { classId: 'y__9A' }, NOW).confirmedReads).toBe(1);
    expect(computeKpis(data, { shanyrakId: 's2' }, NOW).confirmedReads).toBe(1);
    expect(computeKpis(data, { grade: 10 }, NOW).totalStudents).toBe(2);
    expect(filterEvents(events, { language: 'Русский' }, new Map(), NOW)).toHaveLength(2);
    expect(filterProgress(progress, { status: 'pending' })).toHaveLength(1);
  });

  it('filters by period', () => {
    expect(filterEvents(events, { period: 'week' }, new Map(), NOW)).toHaveLength(4);
    expect(computeKpis(data, { period: 'week' }, NOW).confirmedReads).toBe(1);
  });

  it('builds chart series from real records', () => {
    const c = chartsData(data, {}, NOW);
    expect(c.readsByMonth.at(-1)).toEqual({ label: '2026-11', value: 1 });
    expect(c.readsByMonth.at(-2)).toEqual({ label: '2026-10', value: 1 });
    expect(c.shanyraks.map((s) => s.label).sort()).toEqual(['Ертіс', 'Каспий']);
    expect(c.genres[0]).toEqual({ label: 'роман', value: 2 });
  });

  it('returns 12 months even with no data', () => {
    expect(monthlySeries([], () => null, 12, NOW)).toHaveLength(12);
  });
});

describe('tables', () => {
  const rows = Array.from({ length: 45 }, (_, i) => ({ id: i, name: `Student ${i}`, books: i % 7 }));
  it('searches, sorts and paginates', () => {
    const r = searchSortPage(rows, { query: 'student 4', fields: ['name'], sortKey: 'books', sortDir: 'desc', page: 1, pageSize: 5 });
    expect(r.total).toBe(6);
    expect(r.rows[0].books).toBeGreaterThanOrEqual(r.rows[1].books);
    expect(searchSortPage(rows, { page: 99, pageSize: 20 }).page).toBe(3);
  });
});
