import { describe, it, expect } from 'vitest';
import { similarBooks } from '../src/lib/similarBooks.js';
import { loanProgress } from '../src/lib/loanStages.js';

const book = (title, genre, language = 'Русский', copies = 1) => ({ title, author: 'A', genre: [genre], language, copies });

describe('similar books', () => {
  const current = book('Открытая', 'Фантастика');
  const catalog = [
    current,
    book('Фант без наличия', 'Фантастика', 'Русский', 0),
    book('Фант в наличии', 'Фантастика', 'Русский', 2),
    book('Фант английский', 'Фантастика', 'English', 1),
    book('Детектив русский', 'Детектив'),
    book('Поэзия казахская', 'Поэзия', 'Қазақ'),
    { ...book('Скрытая', 'Фантастика'), visible: false },
  ];

  it('never includes the open book or hidden ones and uses only catalog records', () => {
    const list = similarBooks(current, catalog);
    expect(list).not.toContain(current);
    expect(list.map((b) => b.title)).not.toContain('Скрытая');
    list.forEach((b) => expect(catalog).toContain(b));
  });

  it('puts the same genre first, available copies first, then fills with the same language', () => {
    const titles = similarBooks(current, catalog).map((b) => b.title);
    expect(titles).toEqual(['Фант в наличии', 'Фант без наличия', 'Фант английский', 'Детектив русский']);
  });

  it('respects the limit and returns nothing when nothing matches', () => {
    expect(similarBooks(current, catalog, { limit: 2 })).toHaveLength(2);
    expect(similarBooks(book('X', 'Другое', 'Deutsch'), catalog)).toEqual([]);
  });
});

describe('reservation stages', () => {
  const now = new Date('2026-11-26T10:00:00Z');
  const base = { createdAt: '2026-11-25T08:00:00Z', holdUntil: '2026-11-27T08:00:00Z', history: [{ status: 'requested' }] };

  it('requested: reserved is current, later stages upcoming', () => {
    const p = loanProgress({ ...base, status: 'requested' }, now);
    expect(p.stages.map((s) => [s.key, s.state])).toEqual([
      ['reserved', 'current'], ['prepared', 'upcoming'], ['pickup', 'upcoming'], ['issued', 'upcoming'],
    ]);
  });

  it('legacy «active» is treated as requested', () => {
    expect(loanProgress({ ...base, status: 'active' }, now).current).toBe('reserved');
  });

  it('ready before and after the pickup window starts', () => {
    const pickup = { start: '2026-11-26T12:00:00Z', end: '2026-11-26T13:00:00Z' };
    const ready = { ...base, status: 'ready', preparedAt: '2026-11-26T09:00:00Z', pickup };
    expect(loanProgress(ready, now).current).toBe('prepared');
    expect(loanProgress(ready, new Date('2026-11-26T12:30:00Z')).current).toBe('pickup');
  });

  it('a walk-in loan shows only the hand-over, an overdue one is flagged', () => {
    const p = loanProgress({ status: 'issued', walkIn: true, issuedAt: '2026-11-01T08:00:00Z', dueDate: '2026-11-15T08:00:00Z' }, now);
    expect(p.stages.map((s) => s.key)).toEqual(['issued']);
    expect(p.alert).toBe('overdue');
  });

  it('a lapsed hold is flagged until the server marks it expired', () => {
    expect(loanProgress({ ...base, status: 'requested', holdUntil: '2026-11-26T09:00:00Z' }, now).alert).toBe('hold_lapsed');
  });

  it('final states have no scale', () => {
    ['returned', 'cancelled', 'expired'].forEach((status) => {
      const p = loanProgress({ ...base, status }, now);
      expect(p.final).toBe(true);
      expect(p.stages).toEqual([]);
    });
    expect(loanProgress({ ...base, status: 'cancelled', cancelledByRole: 'librarian' }, now).byStaff).toBe(true);
  });
});
