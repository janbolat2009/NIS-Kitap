import { describe, it, expect } from 'vitest';
import { displayStatus, certificateNumber, isValidCertificateNumber } from '../src/lib/workflow.js';
import {
  availability, applyDelta, canTransition, normalizeStatus, isHoldExpired, isValidPickup, reservationCode,
} from '../src/lib/loans.js';
import { validateReview, sanitizeReviewText } from '../src/lib/reviews.js';
import {
  normalizeClassName, isValidClassName, publicShortName, readerLabel, academicYearOfDate, nextAcademicYear,
} from '../src/lib/school.js';

describe('reading status shown to the student', () => {
  it('keeps the personal mark apart from the librarian decision', () => {
    expect(displayStatus({ status: 'finished', verificationStatus: 'none' })).toBe('finished');
    expect(displayStatus({ status: 'finished', verificationStatus: 'pending' })).toBe('pending');
    expect(displayStatus({ status: 'finished', verificationStatus: 'confirmed' })).toBe('confirmed');
    expect(displayStatus({ status: 'finished', verificationStatus: 'revoked' })).toBe('revoked');
    expect(displayStatus(null)).toBe('not_started');
  });
});

describe('fund counters', () => {
  it('three copies: one issued leaves two free, a return gives three again', () => {
    let inv = { total: 3, held: 0, issued: 0 };
    inv = applyDelta(inv, { held: 1 });
    expect(availability(inv)).toMatchObject({ held: 1, available: 2 });
    inv = applyDelta(inv, { held: -1, issued: 1 });
    expect(availability(inv)).toMatchObject({ issued: 1, available: 2 });
    inv = applyDelta(inv, { issued: -1 });
    expect(availability(inv)).toMatchObject({ total: 3, available: 3 });
  });

  it('refuses negative counters and more copies in use than the fund has', () => {
    expect(() => applyDelta({ total: 1, held: 1, issued: 0 }, { held: 1 })).toThrow('no_copies');
    expect(() => applyDelta({ total: 1, held: 0, issued: 0 }, { issued: -1 })).toThrow('negative_stock');
    expect(() => applyDelta({ total: 2, held: 1, issued: 1 }, { total: -1 })).toThrow('no_copies');
  });

  it('allows only the defined reservation transitions', () => {
    expect(canTransition('requested', 'ready')).toBe(true);
    expect(canTransition('active', 'issued')).toBe(true); // record of the first version
    expect(canTransition('issued', 'cancelled')).toBe(false);
    expect(canTransition('returned', 'issued')).toBe(false);
    expect(normalizeStatus('active')).toBe('requested');
  });

  it('detects an expired hold and validates the pickup window', () => {
    expect(isHoldExpired({ status: 'requested', holdUntil: '2000-01-01T00:00:00Z' })).toBe(true);
    expect(isHoldExpired({ status: 'issued', holdUntil: '2000-01-01T00:00:00Z' })).toBe(false);
    expect(isValidPickup({ date: '2026-12-01', from: '13:00', to: '15:00', place: 'Библиотека' })).toBe(true);
    expect(isValidPickup({ date: '2026-12-01', from: '15:00', to: '13:00', place: 'Библиотека' })).toBe(false);
    expect(reservationCode(() => 0)).toBe('NK-AAAAAA');
  });
});

describe('reviews', () => {
  it('refuses links, e-mails and phone numbers', () => {
    expect(validateReview({ rating: 5, text: 'Отличная книга, читайте на www.example.com обязательно!' }).errors).toContain('contains_link');
    expect(validateReview({ rating: 5, text: 'Отличная книга, пишите мне на pupil@mail.kz пожалуйста' }).errors).toContain('contains_email');
    expect(validateReview({ rating: 5, text: 'Отличная книга, звоните +7 701 123 45 67 после уроков' }).errors).toContain('contains_phone');
    expect(validateReview({ rating: 7, text: 'Короткий' }).errors).toEqual(expect.arrayContaining(['bad_rating', 'too_short']));
  });

  it('keeps the text as text and removes invisible characters', () => {
    const v = validateReview({ rating: 4, text: '  Хорошая​ книга   <b>про</b> дружбу и честность героев.  ' });
    expect(v.ok).toBe(true);
    expect(v.value.text).toBe('Хорошая книга <b>про</b> дружбу и честность героев.');
    expect(sanitizeReviewText('a\n\n\n\nb')).toBe('a\n\nb');
  });
});

describe('school helpers', () => {
  it('normalizes class names typed in Cyrillic', () => {
    expect(normalizeClassName('11 а')).toBe('11A');
    expect(normalizeClassName('10Н')).toBe('10H');
    expect(normalizeClassName('9Д')).toBe('9D');
    expect(isValidClassName('12Р')).toBe(true);
    expect(isValidClassName('99Z')).toBe(false);
  });

  it('builds safe public labels without surname or e-mail', () => {
    expect(publicShortName('Адема', 'Аманова')).toBe('Адема А.');
    expect(readerLabel({ shortName: 'Адема А.', className: '11M' })).toBe('Адема А., 11M');
    expect(readerLabel({ shortName: 'Адема А.', className: '11M', privacyMode: 'hidden' })).toBe('Читатель, 11 класс');
  });

  it('computes academic years', () => {
    expect(academicYearOfDate(new Date('2026-09-01T00:00:00Z'))).toBe('2026-2027');
    expect(academicYearOfDate(new Date('2027-05-01T00:00:00Z'))).toBe('2026-2027');
    expect(nextAcademicYear('2026-2027')).toBe('2027-2028');
  });
});

describe('certificates', () => {
  it('generates verifiable numbers', () => {
    const n = certificateNumber(new Date('2026-05-01'));
    expect(isValidCertificateNumber(n)).toBe(true);
    expect(isValidCertificateNumber('NISK-2026-ABC')).toBe(false);
  });
});
