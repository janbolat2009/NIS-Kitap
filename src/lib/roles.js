// Role resolution shared by the server API, the UI and the tests.
// The server (api/_lib/auth.js) is the authority: it resolves the role from a
// verified Firebase ID token for every request. The UI uses the same function
// only to decide what to show. Firestore rules are generated from the same lists.
import access from '../../config/access.json' with { type: 'json' };
import { ROLES, STAFF_ROLES, PERMISSIONS, ASSIGNABLE_ROLES } from './permissions.js';

export { ROLES, STAFF_ROLES, PERMISSIONS, ASSIGNABLE_ROLES };

const PLACEHOLDER = /_EMAIL_HERE$/i;

export const CONFIG_KEYS = {
  tech_admin: 'TECH_ADMIN_EMAILS',
  director: 'DIRECTOR_EMAILS',
  deputy: 'DEPUTY_EMAILS',
  librarian: 'LIBRARIAN_EMAILS',
};

export function cleanEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function configuredEmails(list) {
  return (Array.isArray(list) ? list : []).map(cleanEmail).filter((e) => e && !PLACEHOLDER.test(e));
}

// Role from config/access.json (a reviewed code change). Order = priority.
export function roleFromConfig(email, config = access) {
  const e = cleanEmail(email);
  if (!e) return null;
  for (const [role, key] of Object.entries(CONFIG_KEYS)) {
    if (configuredEmails(config[key]).includes(e)) return role;
  }
  return null;
}

// Final role. Config wins, then a roles/{email} document written by a tech admin
// through the API (tech_admin itself is never accepted from a document), then
// 'student' for any signed-in account with a verified e-mail.
// A role sent by the client (profile, localStorage, query string) is never used.
export function resolveRole({ email, emailVerified, storedRole } = {}, config = access) {
  if (!email) return 'guest';
  if (!emailVerified) return 'unverified';
  const fromConfig = roleFromConfig(email, config);
  if (fromConfig) return fromConfig;
  if (storedRole && ASSIGNABLE_ROLES.includes(storedRole)) return storedRole;
  return 'student';
}

export function can(role, permission) {
  const allowed = PERMISSIONS[permission];
  return Array.isArray(allowed) && allowed.includes(role);
}

export function permissionsOf(role) {
  return Object.keys(PERMISSIONS).filter((p) => can(role, p));
}

export function isStaff(role) {
  return STAFF_ROLES.includes(role);
}

// Only a tech admin assigns roles, never to themselves, never tech_admin,
// and never over a role fixed in config/access.json.
export function canAssignRole(actorRole, actorEmail, targetEmail, newRole, config = access) {
  if (!can(actorRole, 'roles.manage')) return false;
  if (!ASSIGNABLE_ROLES.includes(newRole)) return false;
  const target = cleanEmail(targetEmail);
  if (!target || cleanEmail(actorEmail) === target) return false;
  if (roleFromConfig(target, config)) return false;
  return true;
}
