import { describe, it, expect } from 'vitest';
import {
  studentCanSet, staffCanDecide, displayStatus, canTransition, nextStatuses, affectsGradeAutomatically,
  certificateNumber, isValidCertificateNumber,
} from '../src/lib/workflow.js';

describe('reading verification', () => {
  it('a student can mark statuses and send for review, but never confirm', () => {
    expect(studentCanSet(null, { status: 'reading', verificationStatus: 'none' })).toBe(true);
    expect(studentCanSet(null, { status: 'finished', verificationStatus: 'pending' })).toBe(true);
    expect(studentCanSet(null, { status: 'finished', verificationStatus: 'confirmed' })).toBe(false);
    expect(studentCanSet(null, { status: 'reading', verificationStatus: 'pending' })).toBe(false);
  });

  it('a pending or confirmed record is locked for the student', () => {
    expect(studentCanSet({ verificationStatus: 'pending' }, { status: 'want', verificationStatus: 'none' })).toBe(false);
    expect(studentCanSet({ verificationStatus: 'confirmed' }, { status: 'finished', verificationStatus: 'pending' })).toBe(false);
    expect(studentCanSet({ verificationStatus: 'rejected' }, { status: 'finished', verificationStatus: 'pending' })).toBe(true);
  });

  it('only verifiers decide, and only on pending requests', () => {
    expect(staffCanDecide('librarian', { verificationStatus: 'pending' }, 'confirmed')).toBe(true);
    expect(staffCanDecide('student', { verificationStatus: 'pending' }, 'confirmed')).toBe(false);
    expect(staffCanDecide('librarian', { verificationStatus: 'confirmed' }, 'confirmed')).toBe(false);
  });

  it('shows the combined status', () => {
    expect(displayStatus(null)).toBe('not_started');
    expect(displayStatus({ status: 'finished', verificationStatus: 'pending' })).toBe('pending');
    expect(displayStatus({ status: 'finished', verificationStatus: 'confirmed' })).toBe('confirmed');
  });
});

describe('reward approval', () => {
  const issue = (over = {}) => ({ type: 'certificate', status: 'awaiting_approval', proposedBy: 'lib1', ...over });

  it('goes through approval before it can be issued', () => {
    expect(nextStatuses('proposed')).toEqual(['awaiting_approval', 'rejected']);
    expect(canTransition('librarian', issue({ status: 'proposed' }), 'issued')).toBe(false);
    expect(canTransition('librarian', issue({ status: 'approved' }), 'issued')).toBe(true);
  });

  it('a librarian cannot approve; the director can, but not their own proposal', () => {
    expect(canTransition('librarian', issue(), 'approved', { uid: 'lib1' })).toBe(false);
    expect(canTransition('director', issue(), 'approved', { uid: 'dir1' })).toBe(true);
    expect(canTransition('director', issue({ proposedBy: 'dir1' }), 'approved', { uid: 'dir1' })).toBe(false);
  });

  it('subject points are decided by the teacher of that subject', () => {
    const subject = issue({ type: 'subject_points', subject: 'english' });
    expect(canTransition('teacher', subject, 'approved', { uid: 't1', subject: 'english' })).toBe(true);
    expect(canTransition('teacher', subject, 'approved', { uid: 't2', subject: 'kazakh' })).toBe(false);
    expect(canTransition('teacher', issue(), 'approved', { uid: 't1', subject: 'english' })).toBe(false);
  });

  it('a student cannot move any reward', () => {
    for (const to of ['awaiting_approval', 'approved', 'issued', 'rejected']) {
      expect(canTransition('student', issue({ status: 'proposed' }), to)).toBe(false);
    }
  });

  it('subject points never change a school grade automatically', () => {
    expect(affectsGradeAutomatically()).toBe(false);
  });

  it('generates verifiable certificate numbers', () => {
    const n = certificateNumber(new Date('2026-05-01'), () => 0.5);
    expect(isValidCertificateNumber(n)).toBe(true);
    expect(n.startsWith('NISK-2026-')).toBe(true);
    expect(isValidCertificateNumber('NISK-2026-0000OOOO')).toBe(false);
  });
});
