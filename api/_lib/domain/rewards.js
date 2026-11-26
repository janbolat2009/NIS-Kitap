// Rewards: catalog (rewards/{id}) and issues (reward_issues/{id}).
//
// A catalog item has a title, type, description, human-readable conditions,
// optional machine-checked criteria (confirmed books, «100 кітап» books, points
// in the year), an availability status and an approval order:
//   approval 'librarian' — the librarian issues it;
//   approval 'director'  — the librarian proposes, the director or deputy approves.
// Criteria are always checked here against student_points, never trusted from
// the browser. Certificates get a number that anyone can verify at
// /certificate/{number} (only the short name and class are public).
import { db } from '../admin.js';
import { fail, str, int, oneOf, bool, id as idParam } from '../http.js';
import { audit } from '../audit.js';
import { assertNotSelf } from '../auth.js';
import { rateLimit } from '../rateLimit.js';
import { getSchool } from '../settings.js';
import { certificateNumber } from '../../../src/lib/workflow.js';

const coll = (name) => db().collection(name);
export const REWARD_TYPES = ['certificate', 'diploma', 'achievement', 'prize', 'other'];
const CERT_TYPES = ['certificate', 'diploma'];

function cleanCriteria(c = {}) {
  const n = (v) => (v === '' || v === null || v === undefined ? 0 : int(v, { min: 0, max: 100000, field: 'criteria' }));
  return { minConfirmedBooks: n(c.minConfirmedBooks), minHundredBooks: n(c.minHundredBooks), minPoints: n(c.minPoints) };
}

export async function saveCatalogItem(actor, body) {
  const ref = body.id ? coll('rewards').doc(idParam(body.id)) : coll('rewards').doc();
  const now = new Date().toISOString();
  const data = {
    title: str(body.title, { min: 2, max: 120, required: true, field: 'title' }),
    type: oneOf(body.type, REWARD_TYPES, 'type'),
    description: str(body.description, { max: 1000, field: 'description' }),
    conditions: str(body.conditions, { min: 3, max: 600, required: true, field: 'conditions' }),
    criteria: cleanCriteria(body.criteria),
    status: oneOf(body.status || 'active', ['active', 'paused', 'archived'], 'status'),
    approval: oneOf(body.approval || 'librarian', ['librarian', 'director'], 'approval'),
    claimable: bool(body.claimable),
    quantity: body.quantity === '' || body.quantity === null || body.quantity === undefined ? null : int(body.quantity, { min: 0, max: 100000, field: 'quantity' }),
    updatedAt: now,
    updatedBy: actor.uid,
  };
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const before = snap.exists ? snap.data() : null;
    tx.set(ref, { ...data, issuedCount: before?.issuedCount || 0, createdAt: before?.createdAt || now, createdBy: before?.createdBy || actor.uid });
    audit(tx, actor, before ? 'reward_catalog_updated' : 'reward_catalog_created', 'rewards', ref.id,
      before ? { title: before.title, status: before.status, criteria: before.criteria } : null, { title: data.title, status: data.status, criteria: data.criteria });
  });
  return { id: ref.id, ...data };
}

async function checkCriteria(tx, uid, reward, school) {
  const sp = await tx.get(coll('student_points').doc(uid));
  const s = sp.exists ? sp.data() : {};
  const year = s.years?.[school.currentAcademicYear] || {};
  const snapshot = {
    confirmedBooks: Number(s.confirmedBooks) || 0,
    hundredBooks: Number(s.hundredBooks) || 0,
    pointsThisYear: Number(year.total) || 0,
    academicYear: school.currentAcademicYear,
  };
  const c = reward.criteria || {};
  const met = snapshot.confirmedBooks >= (c.minConfirmedBooks || 0)
    && snapshot.hundredBooks >= (c.minHundredBooks || 0)
    && snapshot.pointsThisYear >= (c.minPoints || 0);
  return { met, snapshot };
}

function historyItem(status, actor, note = '') {
  return { status, at: new Date().toISOString(), by: actor.uid, role: actor.role, note: String(note || '').slice(0, 300) };
}

async function createIssue(actor, { rewardId, uid, reason, requestedByStudent }) {
  const school = await getSchool();
  const rRef = coll('rewards').doc(idParam(rewardId, 'rewardId'));
  const issueRef = coll('reward_issues').doc();
  return db().runTransaction(async (tx) => {
    const rSnap = await tx.get(rRef);
    if (!rSnap.exists) fail(404, 'reward_not_found');
    const reward = rSnap.data();
    if (reward.status !== 'active') fail(409, 'reward_not_available');
    if (requestedByStudent && !reward.claimable) fail(403, 'reward_not_claimable');
    if (reward.quantity !== null && reward.quantity !== undefined && (reward.issuedCount || 0) >= reward.quantity) fail(409, 'reward_out_of_stock');
    const pSnap = await tx.get(coll('profiles').doc(uid));
    if (!pSnap.exists) fail(404, 'student_not_found');
    const profile = pSnap.data();
    const dup = await tx.get(coll('reward_issues').where('uid', '==', uid).where('rewardId', '==', rRef.id).where('status', 'in', ['requested', 'pending_approval', 'issued']).limit(1));
    if (!dup.empty) fail(409, 'reward_already_requested', { issueId: dup.docs[0].id });
    const { met, snapshot } = await checkCriteria(tx, uid, reward, school);
    if (!met) fail(409, 'criteria_not_met', { snapshot, criteria: reward.criteria });
    const now = new Date().toISOString();
    let status;
    if (requestedByStudent) status = 'requested';
    else status = reward.approval === 'director' ? 'pending_approval' : 'issued';
    const data = {
      rewardId: rRef.id,
      title: reward.title,
      type: reward.type,
      approval: reward.approval,
      uid,
      recipientName: [profile.firstName, profile.lastName].filter(Boolean).join(' '),
      recipientShort: profile.shortName || '',
      className: profile.className || '',
      academicYear: school.currentAcademicYear,
      reason: String(reason || '').slice(0, 500),
      criteriaSnapshot: snapshot,
      status,
      requestedBy: actor.uid,
      requestedByRole: actor.role,
      createdAt: now,
      updatedAt: now,
      history: [historyItem(status, actor, reason)],
    };
    if (status === 'issued') Object.assign(data, issueFields(tx, actor, issueRef.id, data, now));
    tx.set(issueRef, data);
    if (status === 'issued') tx.update(rRef, { issuedCount: (reward.issuedCount || 0) + 1 });
    if (!requestedByStudent) audit(tx, actor, `reward_${status}`, 'reward_issues', issueRef.id, null, { rewardId: rRef.id, uid, status }, reason);
    return { id: issueRef.id, ...data };
  });
}

function issueFields(tx, actor, issueId, issue, now) {
  const out = { issuedAt: now, issuedBy: actor.uid, issuedByRole: actor.role };
  if (CERT_TYPES.includes(issue.type)) {
    const number = certificateNumber(new Date());
    out.certificateNumber = number;
    tx.set(coll('certificates').doc(number), {
      number,
      issueId,
      type: issue.type,
      title: issue.title,
      recipientShort: issue.recipientShort || '',
      className: issue.className || '',
      academicYear: issue.academicYear || '',
      issuedAt: now,
      status: 'valid',
    });
  }
  return out;
}

// Student asks for a claimable reward; the server checks the criteria.
export async function claimReward(actor, rewardId) {
  await rateLimit(`claim_${actor.uid}`, { limit: 10, windowSec: 86400 });
  return createIssue(actor, { rewardId, uid: actor.uid, reason: 'Запрос ученика', requestedByStudent: true });
}

// Librarian awards a reward to a student.
export async function awardReward(actor, body) {
  const uid = idParam(body.uid, 'uid');
  assertNotSelf(actor, uid);
  const reason = str(body.reason, { min: 3, max: 500, required: true, field: 'reason' });
  return createIssue(actor, { rewardId: body.rewardId, uid, reason, requestedByStudent: false });
}

/**
 * decision: approve | reject | revoke
 *   requested        → (librarian) pending_approval or issued | rejected
 *   pending_approval → (director/deputy) issued | rejected
 *   issued           → (librarian/director/deputy) revoked
 */
export async function decideIssue(actor, issueId, body) {
  const decision = oneOf(body.decision, ['approve', 'reject', 'revoke'], 'decision');
  const note = str(body.note, { max: 300, field: 'note' });
  if (decision !== 'approve' && note.length < 3) fail(400, 'missing_field', { field: 'note' });
  const ref = coll('reward_issues').doc(idParam(issueId, 'issueId'));
  const perms = actor.permissions || [];
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) fail(404, 'not_found');
    const issue = snap.data();
    assertNotSelf(actor, issue.uid);
    const rRef = coll('rewards').doc(issue.rewardId);
    const rSnap = await tx.get(rRef);
    const reward = rSnap.exists ? rSnap.data() : {};
    const now = new Date().toISOString();
    let to = '';
    if (decision === 'approve') {
      if (issue.status === 'requested') {
        if (!perms.includes('rewards.issue')) fail(403, 'forbidden');
        to = issue.approval === 'director' ? 'pending_approval' : 'issued';
      } else if (issue.status === 'pending_approval') {
        if (!perms.includes('rewards.approve')) fail(403, 'forbidden');
        if (issue.requestedBy === actor.uid) fail(403, 'self_approval_forbidden');
        to = 'issued';
      } else fail(409, 'bad_transition');
      if (to === 'issued') {
        const school = await getSchool(tx);
        const { met, snapshot } = await checkCriteria(tx, issue.uid, reward, school);
        if (!met) fail(409, 'criteria_not_met', { snapshot });
        if (reward.quantity !== null && reward.quantity !== undefined && (reward.issuedCount || 0) >= reward.quantity) fail(409, 'reward_out_of_stock');
      }
    } else if (decision === 'reject') {
      if (issue.status === 'requested' && !perms.includes('rewards.issue')) fail(403, 'forbidden');
      if (issue.status === 'pending_approval' && !perms.includes('rewards.approve')) fail(403, 'forbidden');
      if (!['requested', 'pending_approval'].includes(issue.status)) fail(409, 'bad_transition');
      to = 'rejected';
    } else {
      if (issue.status !== 'issued') fail(409, 'bad_transition');
      if (!perms.includes('rewards.issue') && !perms.includes('rewards.approve')) fail(403, 'forbidden');
      to = 'revoked';
    }
    const patch = { status: to, updatedAt: now, history: [...(issue.history || []).slice(-20), historyItem(to, actor, note)] };
    if (to === 'issued') {
      Object.assign(patch, issueFields(tx, actor, ref.id, issue, now), { approvedBy: actor.uid, approvedByRole: actor.role });
      tx.update(rRef, { issuedCount: (reward.issuedCount || 0) + 1 });
    }
    if (to === 'revoked' && issue.certificateNumber) {
      tx.set(coll('certificates').doc(issue.certificateNumber), { status: 'revoked', revokedAt: now }, { merge: true });
    }
    if (to === 'revoked') tx.update(rRef, { issuedCount: Math.max(0, (reward.issuedCount || 0) - 1) });
    tx.update(ref, patch);
    audit(tx, actor, `reward_${to}`, 'reward_issues', ref.id, { status: issue.status }, { status: to }, note);
    return { id: ref.id, ...issue, ...patch };
  });
}

export async function listIssues(query = {}) {
  let q = coll('reward_issues');
  if (['requested', 'pending_approval', 'issued', 'rejected', 'revoked'].includes(query.status)) q = q.where('status', '==', query.status);
  const snap = await q.limit(500).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}
