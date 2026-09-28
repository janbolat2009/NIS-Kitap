import { checkAndIncrementSearchLimit, getUserSearchLimit, WEEKLY_SEARCH_LIMIT } from '../services/searchLimitService.js';
import { NOTIFICATION_RECIPIENTS, sendReservationNotification } from '../services/emailService.js';

async function runTests() {
  console.log('========================================================');
  console.log('🧪 VERIFYING NIS KITAP FEATURES 1 & 2');
  console.log('========================================================\n');

  // Test 1: Notification Recipients Check
  console.log('--- TEST 1: Email Notification Recipients Configuration ---');
  console.log('Expected recipients:', ['janbolatique.kz@gmail.com', 'muldasheva_v@ast.nis.edu.kz']);
  console.log('Actual recipients:', NOTIFICATION_RECIPIENTS);
  if (
    NOTIFICATION_RECIPIENTS.includes('janbolatique.kz@gmail.com') &&
    NOTIFICATION_RECIPIENTS.includes('muldasheva_v@ast.nis.edu.kz') &&
    NOTIFICATION_RECIPIENTS.length === 2
  ) {
    console.log('✅ TEST 1 PASSED: Target emails are accurately configured.\n');
  } else {
    console.error('❌ TEST 1 FAILED: Recipients mismatch');
    process.exit(1);
  }

  // Test 2: Email Composition and Dispatch (Mock / Test Transport)
  console.log('--- TEST 2: Email Composition and Dispatch ---');
  const sampleReservation = {
    bookTitle: '1984',
    author: 'Джордж Оруэлл',
    genre: 'Антиутопия, Фантастика',
    isbn: '9785171123666',
    language: 'Русский',
    year: '2021',
    copies: 3,
    description: 'Культовый роман-антиутопия о тоталитарном обществе.',
    userName: 'Алихан Смагулов',
    userEmail: 'smagulov.a@ast.nis.edu.kz',
    userId: 'user_nis_78945',
    reservedAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    reservationId: 'RES-2026-NIS-001',
  };

  const emailResult = await sendReservationNotification(sampleReservation);
  console.log('Email dispatch result:', {
    success: emailResult.success,
    recipients: emailResult.recipients,
    messageId: emailResult.messageId || 'logged',
  });

  if (emailResult.success && emailResult.recipients.length === 2) {
    console.log('✅ TEST 2 PASSED: Email notification successfully formatted and dispatched.\n');
  } else {
    console.error('❌ TEST 2 FAILED: Email dispatch did not succeed');
    process.exit(1);
  }

  // Test 3: Gemini Search Auth Enforcement (Guests blocked)
  console.log('--- TEST 3: Gemini Search Auth Enforcement ---');
  const guestResult = await checkAndIncrementSearchLimit(null, 'книги про космос');
  console.log('Guest search attempt result:', guestResult);
  if (!guestResult.allowed && guestResult.reason === 'unauthorized') {
    console.log('✅ TEST 3 PASSED: Guest search strictly rejected with 401 unauthorized requirement.\n');
  } else {
    console.error('❌ TEST 3 FAILED: Guest search was not blocked');
    process.exit(1);
  }

  // Test 4: Gemini Search Limit (3 per 7 days per user)
  console.log('--- TEST 4: Gemini Search Limit Counter (3/week) ---');
  const testUser = `test_reader_${Date.now()}@ast.nis.edu.kz`;

  // Search 1
  const s1 = await checkAndIncrementSearchLimit(testUser, 'query 1');
  console.log(`Search 1: allowed=${s1.allowed}, used=${s1.used}, remaining=${s1.remaining}`);
  if (!s1.allowed || s1.used !== 1 || s1.remaining !== 2) throw new Error('Search 1 failed');

  // Search 2
  const s2 = await checkAndIncrementSearchLimit(testUser, 'query 2');
  console.log(`Search 2: allowed=${s2.allowed}, used=${s2.used}, remaining=${s2.remaining}`);
  if (!s2.allowed || s2.used !== 2 || s2.remaining !== 1) throw new Error('Search 2 failed');

  // Search 3
  const s3 = await checkAndIncrementSearchLimit(testUser, 'query 3');
  console.log(`Search 3: allowed=${s3.allowed}, used=${s3.used}, remaining=${s3.remaining}`);
  if (!s3.allowed || s3.used !== 3 || s3.remaining !== 0) throw new Error('Search 3 failed');

  // Search 4 (Should be BLOCKED with resetAt details)
  const s4 = await checkAndIncrementSearchLimit(testUser, 'query 4');
  console.log(`Search 4 (Blocked): allowed=${s4.allowed}, reason=${s4.reason}, resetAt=${s4.resetAt}`);
  if (s4.allowed || s4.reason !== 'limit_reached' || !s4.resetAt) {
    throw new Error('Search 4 was not blocked or missing reset timestamp');
  }
  console.log('✅ TEST 4 PASSED: 3 searches allowed, 4th request blocked with reset date.\n');

  // Test 5: Status Check (getUserSearchLimit)
  console.log('--- TEST 5: Status Check without decrement ---');
  const status = await getUserSearchLimit(testUser);
  console.log(`User status check: used=${status.used}, remaining=${status.remaining}, resetAt=${status.resetAt}`);
  if (status.used !== 3 || status.remaining !== 0) {
    throw new Error('Status check reported incorrect values');
  }
  console.log('✅ TEST 5 PASSED: Status correctly reflects depleted weekly limit.\n');

  console.log('========================================================');
  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
  console.log('========================================================');
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
