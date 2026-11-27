import { describe, it, expect } from 'vitest';
import { resolveRole, roleFromConfig, can, canAssignRole, permissionsOf, isStaff, configuredStaff, roleBlockReason } from '../src/lib/roles.js';
import { PERMISSIONS, ROLES } from '../src/lib/permissions.js';

const config = {
  TECH_ADMIN_EMAILS: ['tech@school.kz'],
  DIRECTOR_EMAILS: ['Director@School.kz'],
  DEPUTY_EMAILS: ['deputy@school.kz'],
  LIBRARIAN_EMAILS: ['lib@school.kz', 'LIBRARIAN_EMAIL_HERE'],
};

describe('role resolution', () => {
  it('maps configured emails case-insensitively and ignores placeholders', () => {
    expect(roleFromConfig('director@school.kz', config)).toBe('director');
    expect(roleFromConfig(' TECH@school.kz ', config)).toBe('tech_admin');
    expect(roleFromConfig('librarian_email_here', config)).toBe(null);
  });

  it('needs a verified e-mail for any role', () => {
    expect(resolveRole({ email: 'director@school.kz', emailVerified: false }, config)).toBe('unverified');
    expect(resolveRole({ email: '', emailVerified: true }, config)).toBe('guest');
    expect(resolveRole({ email: 'pupil@school.kz', emailVerified: true }, config)).toBe('student');
  });

  it('accepts only assignable roles from roles/{email}; tech_admin only from config', () => {
    expect(resolveRole({ email: 'x@school.kz', emailVerified: true, storedRole: 'librarian' }, config)).toBe('librarian');
    expect(resolveRole({ email: 'x@school.kz', emailVerified: true, storedRole: 'tech_admin' }, config)).toBe('student');
    expect(resolveRole({ email: 'x@school.kz', emailVerified: true, storedRole: 'super_admin' }, config)).toBe('student');
    // config wins over a stored role
    expect(resolveRole({ email: 'lib@school.kz', emailVerified: true, storedRole: 'director' }, config)).toBe('librarian');
  });
});

describe('permissions', () => {
  it('a student has no staff permission', () => {
    expect(permissionsOf('student')).toEqual([]);
    expect(isStaff('student')).toBe(false);
  });

  it('the librarian runs the desk: fund, loans, e-mails, verification, reviews', () => {
    for (const p of ['fund.manage', 'loans.manage', 'notifications.send', 'reading.verify', 'reviews.moderate', 'points.adjust']) {
      expect(can('librarian', p)).toBe(true);
    }
    expect(can('librarian', 'classes.manage')).toBe(false);
    expect(can('librarian', 'roles.manage')).toBe(false);
  });

  it('director and deputy see reports and approve rewards but do not change points or stock', () => {
    for (const role of ['director', 'deputy']) {
      expect(can(role, 'reports.view')).toBe(true);
      expect(can(role, 'rewards.approve')).toBe(true);
      expect(can(role, 'points.adjust')).toBe(false);
      expect(can(role, 'loans.manage')).toBe(false);
      expect(can(role, 'reading.verify')).toBe(false);
    }
  });

  it('the tech admin configures classes, rules and roles but does not touch points or loans', () => {
    for (const p of ['classes.manage', 'settings.manage', 'roles.manage', 'students.class_change']) expect(can('tech_admin', p)).toBe(true);
    for (const p of ['points.adjust', 'reading.verify', 'loans.manage', 'rewards.issue']) expect(can('tech_admin', p)).toBe(false);
  });

  it('every permission names only known roles', () => {
    for (const roles of Object.values(PERMISSIONS)) for (const r of roles) expect(ROLES).toContain(r);
  });

  it('only a tech admin assigns roles, never to self, never tech_admin, never over config', () => {
    expect(canAssignRole('tech_admin', 'tech@school.kz', 'new@school.kz', 'librarian', config)).toBe(true);
    expect(canAssignRole('tech_admin', 'tech@school.kz', 'tech@school.kz', 'director', config)).toBe(false);
    expect(canAssignRole('tech_admin', 'tech@school.kz', 'new@school.kz', 'tech_admin', config)).toBe(false);
    expect(canAssignRole('tech_admin', 'tech@school.kz', 'lib@school.kz', 'student', config)).toBe(false);
    expect(canAssignRole('director', 'director@school.kz', 'new@school.kz', 'librarian', config)).toBe(false);
  });

  it('explains why a role was refused, so the screen can say it', () => {
    expect(roleBlockReason('tech@school.kz', 'TECH@school.kz', config)).toBe('self');
    expect(roleBlockReason('tech@school.kz', 'Director@School.kz', config)).toBe('config');
    expect(roleBlockReason('tech@school.kz', 'new@school.kz', config)).toBe('other');
  });

  it('lists the staff fixed in the config file, without placeholders', () => {
    const list = configuredStaff(config);
    expect(list.map((r) => r.id).sort()).toEqual(['deputy@school.kz', 'director@school.kz', 'lib@school.kz', 'tech@school.kz']);
    expect(list.every((r) => r.fixed && r.active)).toBe(true);
    expect(list.find((r) => r.id === 'director@school.kz').role).toBe('director');
  });
});
