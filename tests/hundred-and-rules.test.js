import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getBookId } from '../src/lib/bookId.js';

const root = path.resolve(__dirname, '..');
const hundred = JSON.parse(fs.readFileSync(path.join(root, 'public/data/hundred-books.json'), 'utf8'));
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'public/data/books.json'), 'utf8'));
const rules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');

describe('100 kitap list', () => {
  it('has exactly 100 ordered entries from the protocol: 60 + 20 + 20', () => {
    expect(hundred.books).toHaveLength(100);
    expect(hundred.books.map((b) => b.order)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
    const count = (s) => hundred.books.filter((b) => b.section === s).length;
    expect([count('kazakh'), count('russian'), count('foreign')]).toEqual([60, 20, 20]);
    expect(new Set(hundred.books.map((b) => b.id)).size).toBe(100);
    expect(hundred.source).toContain('№ 9');
  });

  it('links to existing catalog books by stable id instead of creating duplicates', () => {
    const ids = new Set(catalog.map(getBookId));
    const linked = hundred.books.filter((b) => b.catalogBookId);
    expect(linked.length).toBeGreaterThan(50);
    for (const b of linked) {
      expect(ids.has(b.catalogBookId)).toBe(true);
      expect(catalog.some((c) => c.title === b.catalogTitle)).toBe(true);
    }
  });

  it('book ids are deterministic', () => {
    const book = { title: 'Абай жолы', author: 'Әуезов М.', language: 'Қазақ' };
    expect(getBookId(book)).toBe(getBookId({ ...book, title: ' абай  жолы ' }));
    expect(getBookId(book)).toMatch(/^bk_[0-9a-f]{8}$/);
  });
});

describe('generated Firestore rules', () => {
  it('has no unreplaced placeholders', () => {
    expect(rules).not.toMatch(/__[A-Z_]+__/);
    expect(rules).not.toMatch(/_EMAIL_HERE/);
  });

  it('keeps the points ledger append-only', () => {
    const ledger = rules.slice(rules.indexOf('match /points_ledger/{id}'), rules.indexOf('match /leaderboard/{uid}'));
    expect(ledger).toContain('allow update, delete: if false;');
    expect(ledger).toContain('can_reading_verify() || can_points_adjust()');
  });

  it('never lets a user write their own role and keeps the audit log immutable', () => {
    const roles = rules.slice(rules.indexOf('match /roles/{email}'), rules.indexOf('// ---------- roster'));
    expect(roles).toContain('email != myEmail()');
    expect(roles).toContain('can_roles_manage()');
    const audit = rules.slice(rules.indexOf('match /admin_audit_logs/{id}'));
    expect(audit).toContain('allow update, delete: if false;');
  });

  it('students can only send a book for review, not confirm it', () => {
    const progress = rules.slice(rules.indexOf('function studentProgressValid'), rules.indexOf('match /reading_events/{id}'));
    expect(progress).toContain("request.resource.data.verificationStatus in ['none', 'pending']");
    expect(progress).toContain("request.resource.data.verificationStatus in ['confirmed', 'rejected']");
  });

  it('a reward cannot be approved by a student role and grades are never touched', () => {
    expect(rules).toContain("request.resource.data.affectsGrade == false");
    expect(rules).toContain("function can_rewards_approve() { return hasAny(['director', 'project_admin', 'super_admin']); }");
  });

  it('closes every other collection by default', () => {
    expect(rules.trim()).toMatch(/match \/\{document=\*\*\} \{\s+allow read, write: if false;/);
  });
});
