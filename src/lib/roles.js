// Role-based access control shared by the UI, the tests and the rules generator.
// The UI uses it only to decide what to show. Every protected read/write is
// enforced again by Firestore Security Rules (firestore.rules), which are
// generated from the same config/access.json lists.
import access from '../../config/access.json';
import { ROLES, STAFF_ROLES, PERMISSIONS } from './permissions.js';

export { ROLES, STAFF_ROLES, PERMISSIONS };

const PLACEHOLDER = /_EMAIL_HERE$/;

export function cleanEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function configuredEmails(list) {
  return (Array.isArray(list) ? list : []).map(cleanEmail).filter((e) => e && !PLACEHOLDER.test(e.toUpperCase()));
}

// Highest-priority role from the bootstrap config (config/access.json).
export function roleFromConfig(email, config = access) {
  const e = cleanEmail(email);
  if (!e) return null;
  if (configuredEmails(config.SUPER_ADMIN_EMAILS).includes(e)) return 'super_admin';
  if (configuredEmails(config.DIRECTOR_EMAILS).includes(e)) return 'director';
  if (configuredEmails(config.PROJECT_ADMIN_EMAILS).includes(e)) return 'project_admin';
  if (configuredEmails(config.LIBRARIAN_EMAILS).includes(e)) return 'librarian';
  return null;
}

// Final role: config wins, then a role document written by a super admin,
// otherwise a signed-in user with a verified email is a student.
// A role coming from the client (profile, localStorage, query string) is never used.
export function resolveRole({ email, emailVerified, storedRole } = {}, config = access) {
  if (!email) return 'guest';
  if (!emailVerified) return 'unverified';
  const fromConfig = roleFromConfig(email, config);
  if (fromConfig) return fromConfig;
  if (storedRole && ROLES.includes(storedRole)) return storedRole;
  return 'student';
}

export function can(role, permission) {
  const allowed = PERMISSIONS[permission];
  return Array.isArray(allowed) && allowed.includes(role);
}

export function isStaff(role) {
  return STAFF_ROLES.includes(role);
}

// A user may never change their own role, and only super admins assign roles.
export function canAssignRole(actorRole, actorEmail, targetEmail, newRole) {
  if (!can(actorRole, 'roles.manage')) return false;
  if (!ROLES.includes(newRole)) return false;
  if (cleanEmail(actorEmail) === cleanEmail(targetEmail)) return false;
  return true;
}
