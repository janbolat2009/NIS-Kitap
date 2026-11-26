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

  const block = (name) => {
    const start = rules.indexOf(`match /${name}/`);
    return rules.slice(start, rules.indexOf('    }\n', start));
  };

  it('points, stock, reservations, profiles, roles and audit are written only by the server', () => {
    for (const name of ['points_ledger', 'student_points', 'leaderboard', 'shanyrak_points', 'inventory', 'reservations',
      'reading_progress', 'profiles', 'class_map', 'roles', 'reviews', 'reward_issues', 'admin_audit_logs', 'settings']) {
      expect(block(name), name).toContain('allow write: if false;');
    }
  });

  it('the staff roles come from config/access.json; a stored role can never be tech_admin', () => {
    expect(rules).toContain("myEmail() in ['janbolatique.kz@gmail.com'] ? 'tech_admin'");
    expect(rules).toContain("myEmail() in ['muldasheva_v@ast.nis.edu.kz'] ? 'librarian'");
    expect(rules).toContain("get(rolePath()).data.role in ['student', 'librarian', 'deputy', 'director']");
    expect(rules).toContain('request.auth.token.email_verified == true');
  });

  it('only published reviews are visible to other readers', () => {
    expect(block('reviews')).toContain("resource.data.status == 'published' || owner() || can_reviews_moderate()");
  });

  it('a reader writes only own bookmarks, basic account fields and view events', () => {
    expect(block('bookmarks')).toContain("id.matches(request.auth.uid + '__.*')");
    expect(block('users')).toContain("onlyKeys(['name', 'email', 'avatar', 'provider', 'lastLogin', 'createdAt', 'updatedAt'])");
    expect(block('reading_events')).toContain("request.resource.data.type in ['view', 'bookmark', 'unbookmark']");
  });

  it('closes every other collection by default', () => {
    expect(rules.trim()).toMatch(/match \/\{document=\*\*\} \{\s+allow read, write: if false;/);
  });
});
