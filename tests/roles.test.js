import { describe, it, expect } from 'vitest';
import { resolveRole, roleFromConfig, can, canAssignRole, PERMISSIONS } from '../src/lib/roles.js';

const config = {
  DIRECTOR_EMAILS: ['director@school.kz'],
  LIBRARIAN_EMAILS: ['LIBRARIAN_EMAIL_HERE', 'lib@school.kz'],
  PROJECT_ADMIN_EMAILS: ['ardak@school.kz'],
  SUPER_ADMIN_EMAILS: ['root@school.kz'],
};

describe('role resolution', () => {
  it('ignores placeholders in config/access.json', () => {
    expect(roleFromConfig('librarian_email_here', config)).toBe(null);
  });

  it('maps configured emails case-insensitively', () => {
    expect(resolveRole({ email: 'Director@School.kz', emailVerified: true }, config)).toBe('director');
    expect(resolveRole({ email: 'ardak@school.kz', emailVerified: true }, config)).toBe('project_admin');
    expect(resolveRole({ email: 'lib@school.kz', emailVerified: true }, config)).toBe('librarian');
    expect(resolveRole({ email: 'root@school.kz', emailVerified: true }, config)).toBe('super_admin');
  });

  it('treats everyone else as a student and unverified emails as unverified', () => {
    expect(resolveRole({ email: 'pupil@school.kz', emailVerified: true }, config)).toBe('student');
    expect(resolveRole({ email: 'director@school.kz', emailVerified: false }, config)).toBe('unverified');
    expect(resolveRole({}, config)).toBe('guest');
  });

  it('ignores unknown roles stored for a user', () => {
    expect(resolveRole({ email: 'x@school.kz', emailVerified: true, storedRole: 'god' }, config)).toBe('student');
    expect(resolveRole({ email: 'x@school.kz', emailVerified: true, storedRole: 'teacher' }, config)).toBe('teacher');
  });
});

describe('permissions', () => {
  it('a student cannot use any admin capability', () => {
    for (const perm of Object.keys(PERMISSIONS)) expect(can('student', perm)).toBe(false);
    for (const perm of Object.keys(PERMISSIONS)) expect(can('guest', perm)).toBe(false);
  });

  it('full analytics only for director, librarian, project admin and super admin', () => {
    expect(PERMISSIONS['analytics.view'].sort()).toEqual(['director', 'librarian', 'project_admin', 'super_admin']);
    expect(can('curator', 'analytics.view')).toBe(false);
    expect(can('teacher', 'analytics.view')).toBe(false);
  });

  it('librarian confirms reading, director does not', () => {
    expect(can('librarian', 'reading.verify')).toBe(true);
    expect(can('director', 'reading.verify')).toBe(false);
  });

  it('only project admin and super admin adjust points', () => {
    expect(can('librarian', 'points.adjust')).toBe(false);
    expect(can('project_admin', 'points.adjust')).toBe(true);
  });

  it('nobody can assign a role to themselves; only super admin assigns roles', () => {
    expect(canAssignRole('super_admin', 'root@school.kz', 'root@school.kz', 'student')).toBe(false);
    expect(canAssignRole('super_admin', 'root@school.kz', 'lib@school.kz', 'librarian')).toBe(true);
    expect(canAssignRole('director', 'director@school.kz', 'x@school.kz', 'librarian')).toBe(false);
    expect(canAssignRole('student', 'pupil@school.kz', 'pupil@school.kz', 'super_admin')).toBe(false);
  });
});
