// NIS Kitap API v2 — one Vercel function for every server action.
// vercel.json rewrites /api/v2/<path> here. Each route declares who may call it:
//   'public'    anyone
//   'user'      signed-in Firebase user (e-mail may be unverified)
//   'verified'  signed-in user with a verified e-mail
//   '<perm>'    staff permission from src/lib/permissions.js (verified e-mail,
//               non-revoked token, role resolved on the server)
import { adminConfigured } from '../_lib/admin.js';
import { ApiError, send, parseBody, setCommonHeaders } from '../_lib/http.js';
import { getActor, requireUser, requireVerified, requirePermission } from '../_lib/auth.js';
import { getMe, setMyClass, setPrivacy, setLocale, changeStudentClass } from '../_lib/domain/profiles.js';
import { getClassMap, importClassMap, upsertClass, copyYear } from '../_lib/domain/classes.js';
import {
  setStatus, requestVerification, withdrawRequest, verificationQueue, confirmReading, rejectReading, manualConfirm, revokeConfirmation,
} from '../_lib/domain/reading.js';
import { manualAdjust, reverseEntry, rebuildAggregates } from '../_lib/domain/points.js';
import {
  createReservation, cancelMine, cancelByStaff, prepare, issue, returnBook, directIssue, expireAll, listReservations, adjustFund, inventoryLog,
} from '../_lib/domain/loans.js';
import { notifyReservation, mailStatus, mailConfig } from '../_lib/domain/mail.js';
import { upsertMyReview, deleteMyReview, listReviews, moderateReview } from '../_lib/domain/reviews.js';
import { saveCatalogItem, claimReward, awardReward, decideIssue, listIssues } from '../_lib/domain/rewards.js';
import {
  listStudents, studentDetail, listRoles, assignRole, getSettings, saveSchool, saveRules, settingsHistory, auditLog, reports, migrate, rollbackMigration,
} from '../_lib/domain/staff.js';

const REWARD_STAFF = ['rewards.manage', 'rewards.issue', 'rewards.approve'];

const ROUTES = [
  ['GET', 'health', 'public', async () => ({ ok: true, adminConfigured: adminConfigured(), mailConfigured: mailConfig().configured, version: 2 })],

  // ---------- me ----------
  ['GET', 'me', 'user', ({ actor }) => getMe(actor)],
  ['POST', 'me/class', 'user', ({ actor, body }) => setMyClass(actor, body)],
  ['POST', 'me/locale', 'user', ({ actor, body }) => setLocale(actor, body)],
  ['POST', 'me/privacy', 'verified', ({ actor, body }) => setPrivacy(actor, body)],

  // ---------- reading ----------
  ['POST', 'reading/status', 'verified', ({ actor, body }) => setStatus(actor, body)],
  ['POST', 'reading/verify', 'verified', ({ actor, body }) => requestVerification(actor, body)],
  ['POST', 'reading/withdraw', 'verified', ({ actor, body }) => withdrawRequest(actor, body)],

  // ---------- reservations ----------
  ['POST', 'reservations', 'verified', ({ actor, body }) => createReservation(actor, body)],
  ['POST', 'reservations/:id/cancel', 'verified', ({ actor, params }) => cancelMine(actor, params.id)],

  // ---------- reviews & rewards ----------
  ['POST', 'reviews', 'verified', ({ actor, body }) => upsertMyReview(actor, body)],
  ['POST', 'reviews/delete', 'verified', ({ actor, body }) => deleteMyReview(actor, body)],
  ['POST', 'rewards/:id/claim', 'verified', ({ actor, params }) => claimReward(actor, params.id)],

  // ---------- library desk ----------
  ['GET', 'admin/queue', 'reading.verify', () => verificationQueue()],
  ['POST', 'admin/reading/manual', 'reading.verify', ({ actor, body }) => manualConfirm(actor, body)],
  ['POST', 'admin/reading/:id/confirm', 'reading.verify', ({ actor, params, body }) => confirmReading(actor, params.id, body)],
  ['POST', 'admin/reading/:id/reject', 'reading.verify', ({ actor, params, body }) => rejectReading(actor, params.id, body)],
  ['POST', 'admin/reading/:id/revoke', 'points.adjust', ({ actor, params, body }) => revokeConfirmation(actor, params.id, body)],
  ['GET', 'admin/reservations', 'loans.manage', ({ query }) => listReservations(query)],
  ['POST', 'admin/reservations/:id/prepare', 'loans.manage', ({ actor, params, body }) => prepare(actor, params.id, body)],
  ['POST', 'admin/reservations/:id/notify', 'notifications.send', ({ actor, params }) => notifyReservation(actor, params.id)],
  ['POST', 'admin/reservations/:id/issue', 'loans.manage', ({ actor, params, body }) => issue(actor, params.id, body)],
  ['POST', 'admin/reservations/:id/return', 'loans.manage', ({ actor, params, body }) => returnBook(actor, params.id, body)],
  ['POST', 'admin/reservations/:id/cancel', 'loans.manage', ({ actor, params, body }) => cancelByStaff(actor, params.id, body)],
  ['POST', 'admin/loans/direct', 'loans.manage', ({ actor, body }) => directIssue(actor, body)],
  ['POST', 'admin/inventory/:id/adjust', 'fund.manage', ({ actor, params, body }) => adjustFund(actor, params.id, body)],
  ['GET', 'admin/inventory/:id/log', ['fund.manage', 'loans.manage'], ({ params }) => inventoryLog(params.id)],
  ['POST', 'admin/maintenance/expire', 'loans.manage', () => expireAll()],
  ['GET', 'admin/reviews', 'reviews.moderate', ({ query }) => listReviews(query)],
  ['POST', 'admin/reviews/:id/moderate', 'reviews.moderate', ({ actor, params, body }) => moderateReview(actor, params.id, body)],

  // ---------- students & points ----------
  ['GET', 'admin/students', 'students.view', ({ query }) => listStudents(query)],
  ['GET', 'admin/students/:id', 'students.view', ({ params }) => studentDetail(params.id)],
  ['POST', 'admin/students/:id/class', 'students.class_change', ({ actor, params, body }) => changeStudentClass(actor, params.id, body)],
  ['POST', 'admin/points/adjust', 'points.adjust', ({ actor, body }) => manualAdjust(actor, body)],
  ['POST', 'admin/points/:id/reverse', 'points.adjust', ({ actor, params, body }) => reverseEntry(actor, params.id, body)],

  // ---------- rewards ----------
  ['GET', 'admin/rewards/issues', REWARD_STAFF, ({ query }) => listIssues(query)],
  ['POST', 'admin/rewards', 'rewards.manage', ({ actor, body }) => saveCatalogItem(actor, body)],
  ['POST', 'admin/rewards/award', 'rewards.issue', ({ actor, body }) => awardReward(actor, body)],
  ['POST', 'admin/rewards/issues/:id/decide', ['rewards.issue', 'rewards.approve'], ({ actor, params, body }) => decideIssue(actor, params.id, body)],

  // ---------- classes ----------
  ['GET', 'admin/class-map', ['classes.manage', 'students.view'], ({ query }) => getClassMap(query)],
  ['POST', 'admin/class-map/import', 'classes.manage', ({ actor, body }) => importClassMap(actor, body)],
  ['POST', 'admin/class-map/upsert', 'classes.manage', ({ actor, body }) => upsertClass(actor, body)],
  ['POST', 'admin/class-map/copy-year', 'classes.manage', ({ actor, body }) => copyYear(actor, body)],

  // ---------- configuration, reports, audit ----------
  ['GET', 'admin/settings', 'settings.manage', () => getSettings()],
  ['POST', 'admin/settings/school', 'settings.manage', ({ actor, body }) => saveSchool(actor, body)],
  ['POST', 'admin/settings/points', 'settings.manage', ({ actor, body }) => saveRules(actor, body)],
  ['GET', 'admin/settings/history', 'settings.manage', () => settingsHistory()],
  ['GET', 'admin/mail/status', 'settings.manage', () => mailStatus()],
  ['GET', 'admin/roles', 'roles.manage', () => listRoles()],
  ['POST', 'admin/roles', 'roles.manage', ({ actor, body }) => assignRole(actor, body)],
  ['GET', 'admin/audit', 'audit.view', ({ query }) => auditLog(query)],
  ['GET', 'admin/reports', 'reports.view', () => reports()],
  ['POST', 'admin/maintenance/migrate', 'settings.manage', ({ actor, body }) => migrate(actor, body)],
  ['POST', 'admin/maintenance/rollback', 'settings.manage', ({ actor, body }) => rollbackMigration(actor, body)],
  ['POST', 'admin/maintenance/rebuild', 'settings.manage', ({ actor, body }) => rebuildAggregates(actor, { dryRun: body.apply !== true })],

  // ---------- scheduled ----------
  ['GET', 'cron/expire', 'cron', () => expireAll()],
];

function match(pattern, path) {
  const p = pattern.split('/');
  const s = path.split('/');
  if (p.length !== s.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i += 1) {
    if (p[i].startsWith(':')) {
      if (!s[i]) return null;
      params[p[i].slice(1)] = decodeURIComponent(s[i]);
    } else if (p[i] !== s[i]) return null;
  }
  return params;
}

function routePath(req) {
  const fromQuery = req.query?.path;
  if (fromQuery) return (Array.isArray(fromQuery) ? fromQuery.join('/') : String(fromQuery)).replace(/^\/+|\/+$/g, '');
  const url = new URL(req.url || '/', 'http://local');
  return url.pathname.replace(/^\/api\/v2\/?/, '').replace(/^\/+|\/+$/g, '');
}

function queryOf(req) {
  if (req.query && typeof req.query === 'object') return req.query;
  return Object.fromEntries(new URL(req.url || '/', 'http://local').searchParams);
}

async function authorize(req, level) {
  if (level === 'public') return null;
  if (level === 'cron') {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers?.authorization !== `Bearer ${secret}`) throw new ApiError(403, 'forbidden');
    return { uid: 'system', email: 'cron', role: 'system', permissions: [] };
  }
  if (level === 'user') return requireUser(req);
  if (level === 'verified') return requireVerified(req);
  return requirePermission(req, level);
}

export default async function handler(req, res) {
  setCommonHeaders(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  const path = routePath(req);
  let found = null;
  const allowed = [];
  for (const route of ROUTES) {
    const params = match(route[1], path);
    if (!params) continue;
    allowed.push(route[0]);
    if (route[0] === req.method) {
      found = { route, params };
      break;
    }
  }
  try {
    if (!found) {
      if (allowed.length) throw new ApiError(405, 'method_not_allowed');
      throw new ApiError(404, 'not_found');
    }
    const [, , level, fn] = found.route;
    if (level !== 'public' && !adminConfigured()) throw new ApiError(503, 'server_not_configured');
    const actor = await authorize(req, level);
    const body = req.method === 'POST' ? parseBody(req) : {};
    const data = await fn({ actor, body, params: found.params, query: queryOf(req), req });
    send(res, 200, { ok: true, data: data ?? null });
  } catch (err) {
    if (err instanceof ApiError || (err?.status && err?.code && typeof err.code === 'string')) {
      if (err.status === 429 && err.extra?.retryAfter) res.setHeader('Retry-After', String(err.extra.retryAfter));
      send(res, err.status, { ok: false, error: err.code, ...(err.extra || {}) });
      return;
    }
    // Firestore contention: the transaction could not commit after retries.
    if (err?.code === 10 || err?.code === 'aborted' || /contention|ABORTED/i.test(String(err?.message))) {
      send(res, 503, { ok: false, error: 'busy_try_again' });
      return;
    }
    console.error('[api/v2]', req.method, path, err?.code || '', err?.message || err);
    send(res, 500, { ok: false, error: 'internal_error' });
  }
}

// Exposed for tests and the docs page.
export const routes = ROUTES.map(([method, path, level]) => ({ method, path, level: Array.isArray(level) ? level.join('|') : level }));
// Kept for local tooling that wants the role of a token without a route.
export { getActor };
