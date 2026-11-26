// Identity and role checks for every API request.
// The role comes only from (1) config/access.json and (2) roles/{email} written by
// a tech admin through this API — never from the request body, a header, the
// profile or anything stored in the browser. Staff actions also require a
// verified e-mail and a token that has not been revoked.
import { adminAuth, db } from './admin.js';
import { resolveRole, can, cleanEmail, permissionsOf, roleFromConfig } from '../../src/lib/roles.js';
import { fail } from './http.js';

export function bearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const m = /^Bearer\s+([A-Za-z0-9\-_.]+)$/i.exec(String(header).trim());
  return m ? m[1] : '';
}

async function storedRoleOf(email) {
  if (!email) return null;
  try {
    const snap = await db().collection('roles').doc(email).get();
    return snap.exists ? snap.data()?.role || null : null;
  } catch {
    return null;
  }
}

/**
 * @returns {Promise<null | {uid, email, emailVerified, name, picture, role, permissions, provider}>}
 */
export async function getActor(req, { checkRevoked = false } = {}) {
  const token = bearerToken(req);
  if (!token) return null;
  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(token, checkRevoked);
  } catch {
    fail(401, 'invalid_token');
  }
  const email = cleanEmail(decoded.email);
  const emailVerified = decoded.email_verified === true;
  const stored = emailVerified && !roleFromConfig(email) ? await storedRoleOf(email) : null;
  const role = resolveRole({ email, emailVerified, storedRole: stored });
  return {
    uid: decoded.uid,
    email,
    emailVerified,
    name: String(decoded.name || '').slice(0, 120),
    picture: String(decoded.picture || '').slice(0, 500),
    provider: decoded.firebase?.sign_in_provider || '',
    role,
    permissions: permissionsOf(role),
  };
}

export async function requireUser(req) {
  const actor = await getActor(req);
  if (!actor) fail(401, 'auth_required');
  return actor;
}

export async function requireVerified(req) {
  const actor = await requireUser(req);
  if (!actor.emailVerified) fail(403, 'email_not_verified');
  return actor;
}

// Staff endpoints: verified e-mail, a non-revoked token and the permission
// (or any of several permissions when a list is given).
export async function requirePermission(req, permission) {
  const actor = await getActor(req, { checkRevoked: true });
  if (!actor) fail(401, 'auth_required');
  if (!actor.emailVerified) fail(403, 'email_not_verified');
  const list = Array.isArray(permission) ? permission : [permission];
  if (!list.some((p) => can(actor.role, p))) fail(403, 'forbidden', { permission: list.join('|') });
  return actor;
}

export function assertNotSelf(actor, targetUid) {
  if (actor.uid && targetUid && actor.uid === targetUid) fail(403, 'self_action_forbidden');
}
