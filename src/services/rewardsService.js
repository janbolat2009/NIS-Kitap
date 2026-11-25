// Rewards: catalog, issues with an approval workflow, certificates.
// Subject points are only a proposal to the subject teacher and never change a grade.
import {
  collection, doc, getDoc, getDocs, writeBatch, runTransaction, serverTimestamp, arrayUnion,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { session } from '@/stores/session';
import { canTransition, historyEntry, certificateNumber, isValidCertificateNumber } from '@/lib/workflow';
import { ledgerId, periodKeys } from '@/lib/points';
import { rebuildLeaderboardRow } from '@/services/adminService';

const all = async (ref) => (await getDocs(ref)).docs.map((d) => ({ id: d.id, ...d.data() }));

function audit(action, entityId, before, after) {
  return {
    actorUid: session.uid,
    actorEmail: session.email,
    actorRole: session.role,
    action,
    entityType: 'reward_issues',
    entityId,
    before: before ? JSON.parse(JSON.stringify(before)) : null,
    after: after ? JSON.parse(JSON.stringify(after)) : null,
    createdAt: serverTimestamp(),
  };
}

export const listRewardCatalog = () => all(collection(db, 'rewards'));
export const listRewardIssues = () => all(collection(db, 'reward_issues'));

export async function saveRewardCatalogItem(item) {
  const ref = item.id ? doc(db, 'rewards', item.id) : doc(collection(db, 'rewards'));
  const data = {
    name: String(item.name || '').trim().slice(0, 200),
    type: item.type,
    description: String(item.description || '').trim().slice(0, 1000),
    pointsRequired: Number(item.pointsRequired) || 0,
    quantity: item.quantity === '' || item.quantity === null || item.quantity === undefined ? null : Number(item.quantity),
    nominal: String(item.nominal || '').slice(0, 100),
    isActive: item.isActive !== false,
    updatedAt: new Date().toISOString(),
    updatedBy: session.uid,
  };
  const batch = writeBatch(db);
  batch.set(ref, data);
  batch.set(doc(collection(db, 'admin_audit_logs')), { ...audit('reward_catalog_saved', ref.id, null, data), entityType: 'rewards' });
  await batch.commit();
  return { id: ref.id, ...data };
}

/**
 * @param input { uid, recipientName, recipientEmail, className, type, title, reason, nominal, subject,
 *                validUntil, rewardId, points, badge }
 */
export async function createRewardIssue(input) {
  if (!input.uid) throw new Error('recipient_required');
  if (!String(input.reason || '').trim()) throw new Error('reason_required');
  const ref = doc(collection(db, 'reward_issues'));
  const now = new Date().toISOString();
  const data = {
    uid: input.uid,
    recipientName: String(input.recipientName || '').slice(0, 200),
    recipientEmail: String(input.recipientEmail || '').toLowerCase(),
    className: input.className || '',
    rewardId: input.rewardId || '',
    type: input.type,
    title: String(input.title || '').trim().slice(0, 200),
    reason: String(input.reason || '').trim().slice(0, 1000),
    nominal: String(input.nominal || '').slice(0, 100),
    subject: input.type === 'subject_points' ? input.subject || '' : '',
    points: input.type === 'points' ? Math.round(Number(input.points) || 0) : 0,
    badge: input.type === 'badge' ? String(input.badge || '').slice(0, 60) : '',
    validUntil: input.validUntil || '',
    status: 'proposed',
    affectsGrade: false,
    proposedBy: session.uid,
    proposedByName: session.name,
    approvedBy: '',
    issuedBy: '',
    certificateNumber: '',
    history: [historyEntry('proposed', { uid: session.uid, name: session.name }, input.reason)],
    createdAt: now,
    updatedAt: now,
  };
  const batch = writeBatch(db);
  batch.set(ref, data);
  batch.set(doc(collection(db, 'admin_audit_logs')), audit('reward_proposed', ref.id, null, data));
  await batch.commit();
  return { id: ref.id, ...data };
}

const CERT_TYPES = ['certificate', 'store_certificate'];

export async function transitionReward(issueId, to, note = '') {
  const ref = doc(db, 'reward_issues', issueId);
  let rebuildUid = '';
  const result = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('not_found');
    const issue = { id: snap.id, ...snap.data() };
    if (!canTransition(session.role, issue, to, { uid: session.uid, subject: session.subject })) {
      throw new Error('not_allowed');
    }
    const now = new Date().toISOString();
    const patch = {
      status: to,
      updatedAt: now,
      history: arrayUnion(historyEntry(to, { uid: session.uid, name: session.name }, note)),
    };
    if (to === 'approved') {
      patch.approvedBy = session.uid;
      patch.approvedByName = session.name;
      patch.approvedAt = now;
    }
    if (to === 'rejected') {
      patch.rejectedBy = session.uid;
      patch.rejectedAt = now;
    }
    if (to === 'issued') {
      patch.issuedBy = session.uid;
      patch.issuedByName = session.name;
      patch.issuedAt = now;
      if (CERT_TYPES.includes(issue.type) && !issue.certificateNumber) {
        const number = certificateNumber(new Date());
        patch.certificateNumber = number;
        tx.set(doc(db, 'certificates', number), {
          number,
          issueId,
          type: issue.type,
          title: issue.title,
          recipientName: issue.recipientName,
          className: issue.className || '',
          reason: issue.reason,
          nominal: issue.nominal || '',
          issuedAt: now,
          validUntil: issue.validUntil || '',
          status: 'valid',
          approvedByName: issue.approvedByName || '',
          issuedByName: session.name,
        });
      }
      if (issue.type === 'points' && issue.points) {
        const entryId = ledgerId('reward', issueId);
        tx.set(doc(db, 'points_ledger', entryId), {
          uid: issue.uid,
          kind: 'reward',
          points: issue.points,
          reason: `reward: ${issue.title}`.slice(0, 300),
          sourceType: 'reward_issue',
          sourceId: issueId,
          createdBy: session.uid,
          createdAt: now,
          ...periodKeys(new Date()),
        });
        rebuildUid = issue.uid;
      }
      if (issue.type === 'badge' && issue.badge) {
        tx.set(doc(db, 'points_ledger', ledgerId('badge', `reward_${issueId}`)), {
          uid: issue.uid,
          kind: 'badge',
          badge: issue.badge,
          points: 0,
          reason: `badge: ${issue.title}`.slice(0, 300),
          sourceType: 'reward_issue',
          sourceId: issueId,
          createdBy: session.uid,
          createdAt: now,
          ...periodKeys(new Date()),
        });
        rebuildUid = issue.uid;
      }
    }
    if (to === 'expired' && issue.certificateNumber) {
      tx.set(doc(db, 'certificates', issue.certificateNumber), { status: 'expired', updatedAt: now }, { merge: true });
    }
    tx.update(ref, patch);
    tx.set(doc(collection(db, 'admin_audit_logs')), audit(`reward_${to}`, issueId, { status: issue.status }, { status: to, note }));
    return { ...issue, ...patch, history: undefined };
  });
  if (rebuildUid) await rebuildLeaderboardRow(rebuildUid);
  return result;
}

export async function getCertificate(number) {
  if (!isValidCertificateNumber(number)) return null;
  const snap = await getDoc(doc(db, 'certificates', number));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getRewardIssue(id) {
  const snap = await getDoc(doc(db, 'reward_issues', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
