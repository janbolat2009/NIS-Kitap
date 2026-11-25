// State machines for reading verification and rewards.
// The UI asks these functions which buttons to show; firestore.rules enforce
// the same transitions on the server.
import { can } from './roles.js';

// ---------- reading progress ----------
// status: want | reading | finished
// verificationStatus: none | pending | confirmed | rejected
export const READING_STATUSES = ['want', 'reading', 'finished'];
export const VERIFICATION_METHODS = ['loan_returned', 'review', 'quiz', 'manual'];

// Display status combines both fields.
export function displayStatus(progress) {
  if (!progress) return 'not_started';
  if (progress.verificationStatus === 'confirmed') return 'confirmed';
  if (progress.verificationStatus === 'pending') return 'pending';
  if (progress.status === 'reading') return 'reading';
  if (progress.status === 'want') return 'want';
  if (progress.status === 'finished') return 'finished';
  return 'not_started';
}

// What a student may write to their own progress document.
export function studentCanSet(current, next) {
  const fromVerification = current?.verificationStatus || 'none';
  if (fromVerification === 'confirmed' || fromVerification === 'pending') {
    // Locked while waiting for the librarian and after confirmation.
    return false;
  }
  if (!READING_STATUSES.includes(next.status)) return false;
  if (!['none', 'pending'].includes(next.verificationStatus || 'none')) return false;
  if (next.verificationStatus === 'pending' && next.status !== 'finished') return false;
  return true;
}

export function staffCanDecide(role, progress, decision) {
  if (!can(role, 'reading.verify')) return false;
  if (!progress || progress.verificationStatus !== 'pending') return false;
  return decision === 'confirmed' || decision === 'rejected';
}

// ---------- rewards ----------
export const REWARD_TYPES = ['points', 'badge', 'certificate', 'physical_prize', 'store_certificate', 'subject_points'];
export const REWARD_STATUSES = ['draft', 'proposed', 'awaiting_approval', 'approved', 'issued', 'claimed', 'rejected', 'expired'];
export const SUBJECTS = ['kazakh', 'russian', 'english'];

const TRANSITIONS = {
  draft: ['proposed', 'rejected'],
  proposed: ['awaiting_approval', 'rejected'],
  awaiting_approval: ['approved', 'rejected'],
  approved: ['issued', 'expired'],
  issued: ['claimed', 'expired'],
  claimed: [],
  rejected: [],
  expired: [],
};

export function nextStatuses(status) {
  return TRANSITIONS[status] || [];
}

export function permissionForTransition(issue, to) {
  if (to === 'proposed' || to === 'awaiting_approval') return 'rewards.propose';
  if (to === 'approved' || to === 'rejected') {
    return issue.type === 'subject_points' ? 'rewards.review_subject' : 'rewards.approve';
  }
  if (to === 'issued' || to === 'claimed' || to === 'expired') return 'rewards.issue';
  return 'rewards.propose';
}

export function canTransition(role, issue, to, actor = {}) {
  if (!issue || !nextStatuses(issue.status).includes(to)) return false;
  if (!can(role, permissionForTransition(issue, to))) return false;
  // A teacher may only decide on subject points for their own subject.
  if (role === 'teacher') {
    if (issue.type !== 'subject_points') return false;
    if (actor.subject && issue.subject && actor.subject !== issue.subject) return false;
  }
  // Nobody approves their own proposal.
  if (to === 'approved' && actor.uid && issue.proposedBy === actor.uid && role !== 'super_admin') return false;
  return true;
}

// Subject points are a proposal to the subject teacher. They never change a grade
// automatically; "approved" only records the official decision.
export function affectsGradeAutomatically() {
  return false;
}

export function historyEntry(status, actor, note = '') {
  return { status, by: actor.uid || '', byName: actor.name || '', at: new Date().toISOString(), note: String(note || '').slice(0, 500) };
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function certificateNumber(date = new Date(), random = Math.random) {
  let tail = '';
  for (let i = 0; i < 8; i += 1) tail += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return `NISK-${date.getFullYear()}-${tail}`;
}

export function isValidCertificateNumber(value) {
  return /^NISK-\d{4}-[A-HJ-NP-Z2-9]{8}$/.test(String(value || ''));
}
