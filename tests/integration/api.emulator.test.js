// End-to-end checks of API v2 against the Firebase emulators (Auth + Firestore).
// Run with: npm run test:emulator   (never touches the real project)
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const RUN = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST);
const AUTH = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1`;
const YEAR = '2026-2027';

let handler;
let admin;
let db;
let notifyReservation;
let getBookId;

async function signUp(email, { verified = true } = {}) {
  const res = await fetch(`${AUTH}/accounts:signUp?key=demo`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'test-password-1', returnSecureToken: true }),
  });
  const data = await res.json();
  if (!data.localId) throw new Error(`signUp failed: ${JSON.stringify(data)}`);
  if (verified) await admin.adminAuth().updateUser(data.localId, { emailVerified: true, displayName: email.split('@')[0] });
  const signIn = await fetch(`${AUTH}/accounts:signInWithPassword?key=demo`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'test-password-1', returnSecureToken: true }),
  });
  const tok = await signIn.json();
  return { uid: data.localId, email, token: tok.idToken };
}

async function call(user, method, route, body) {
  const [pathname, qs] = route.split('?');
  const req = {
    method,
    url: `/api/v2/${pathname}${qs ? `?${qs}` : ''}`,
    headers: { origin: 'http://localhost:5173', ...(user ? { authorization: `Bearer ${user.token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    query: { path: pathname, ...Object.fromEntries(new URLSearchParams(qs || '')) },
  };
  const out = { status: 0, headers: {}, body: '' };
  const res = {
    status(code) { out.status = code; return this; },
    setHeader(k, v) { out.headers[k.toLowerCase()] = v; },
    end(chunk) { out.body = chunk || ''; },
  };
  await handler(req, res);
  const json = out.body ? JSON.parse(out.body) : {};
  return { status: out.status, ...json };
}

function catalog() {
  const list = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/books.json'), 'utf8'));
  const hundred = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/hundred-books.json'), 'utf8'));
  const single = list.find((b) => Number(b.copies) === 1 && b.visible !== false);
  const triple = list.find((b) => Number(b.copies) === 3 && b.visible !== false);
  const linked = hundred.books.find((h) => h.catalogBookId);
  const unlinked = hundred.books.find((h) => !h.catalogBookId);
  return { single: getBookId(single), triple: getBookId(triple), hundredLinked: linked, hundredUnlinked: unlinked, other: getBookId(list[10]) };
}

describe.skipIf(!RUN)('API v2 on the emulators', () => {
  const u = {};
  let books;

  beforeAll(async () => {
    process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'demo-niskitap';
    admin = await import('../../api/_lib/admin.js');
    handler = (await import('../../api/v2/index.js')).default;
    ({ notifyReservation } = await import('../../api/_lib/domain/mail.js'));
    ({ getBookId } = await import('../../src/lib/bookId.js'));
    db = admin.db();
    books = catalog();
    await db.collection('settings').doc('school').set({ currentAcademicYear: YEAR, holdHours: 48, maxOpenReservations: 3 });
    u.tech = await signUp('janbolatique.kz@gmail.com');
    u.librarian = await signUp('muldasheva_v@ast.nis.edu.kz');
    u.director = await signUp('bekbolatov_zh@ast.nis.edu.kz');
    u.deputy = await signUp('nurysheva_a@ast.nis.edu.kz');
    u.s1 = await signUp('student1@test.local');
    u.s2 = await signUp('student2@test.local');
    u.unverified = await signUp('nobody@test.local', { verified: false });
    u.students = await Promise.all([3, 4, 5, 6, 7].map((n) => signUp(`student${n}@test.local`)));
  }, 60000);

  it('health is public and reports the server as configured', async () => {
    const r = await call(null, 'GET', 'health');
    expect(r.status).toBe(200);
    expect(r.data.adminConfigured).toBe(true);
  });

  it('roles are resolved on the server from the verified token', async () => {
    expect((await call(u.tech, 'GET', 'me')).data.role).toBe('tech_admin');
    expect((await call(u.librarian, 'GET', 'me')).data.role).toBe('librarian');
    expect((await call(u.director, 'GET', 'me')).data.role).toBe('director');
    expect((await call(u.deputy, 'GET', 'me')).data.role).toBe('deputy');
    const unv = await call(u.unverified, 'GET', 'me');
    expect(unv.data.role).toBe('unverified');
    // A student cannot reach staff routes, an unverified account cannot reserve.
    expect((await call(u.s1, 'GET', 'admin/queue')).status).toBe(403);
    expect((await call(u.s1, 'POST', 'admin/class-map/import', { csv: 'x' })).status).toBe(403);
    expect((await call(u.unverified, 'POST', 'reservations', { bookId: books.single })).status).toBe(403);
    expect((await call(null, 'GET', 'me')).status).toBe(401);
    expect((await call({ token: 'forged.token.value' }, 'GET', 'me')).status).toBe(401);
  });

  it('tech admin imports the class map with a preview; the librarian cannot', async () => {
    const csv = 'academic_year,class_name,shanyrak_name\n2026-2027,10A,Тест-Алатау\n2026-2027,10В,Тест-Алатау\n2026-2027,11A,Тест-Каспий\n2026-2027,9C,\n';
    expect((await call(u.librarian, 'POST', 'admin/class-map/import', { csv })).status).toBe(403);
    const preview = await call(u.tech, 'POST', 'admin/class-map/import', { csv, dryRun: true });
    expect(preview.status).toBe(200);
    expect(preview.data.applied).toBe(false);
    expect(preview.data.added.map((c) => c.className)).toEqual(['10A', '10B', '11A', '9C']);
    const applied = await call(u.tech, 'POST', 'admin/class-map/import', { csv });
    expect(applied.data.applied).toBe(true);
    const map = await db.collection('class_map').doc(`${YEAR}__9C`).get();
    expect(map.data().shanyrakId).toBe('');
  });

  it('student picks a class; the shanyrak comes from the server map only', async () => {
    const me = await call(u.s1, 'GET', 'me');
    expect(me.data.needsClass).toBe(true);
    const r = await call(u.s1, 'POST', 'me/class', { className: '10a', firstName: 'Адема', lastName: 'Тестова', shanyrakId: 'hacked', shanyrakName: 'Hacked' });
    expect(r.status).toBe(200);
    expect(r.data.className).toBe('10A');
    expect(r.data.shanyrakName).toBe('Тест-Алатау');
    expect(r.data.shortName).toBe('Адема Т.');
    // unknown class → refused
    expect((await call(u.s2, 'POST', 'me/class', { className: '10Z', firstName: 'Б' })).status).toBe(400);
    // unmapped class is allowed: no shanyrak
    const s2 = await call(u.s2, 'POST', 'me/class', { className: '9C', firstName: 'Бекзат', lastName: 'Тестов' });
    expect(s2.data.shanyrakId).toBe('');
    // one self-correction is allowed, the next one is locked
    const fix = await call(u.s2, 'POST', 'me/class', { className: '11A', firstName: 'Бекзат', lastName: 'Тестов' });
    expect(fix.data.shanyrakName).toBe('Тест-Каспий');
    expect((await call(u.s2, 'POST', 'me/class', { className: '10A', firstName: 'Бекзат' })).error).toBe('class_locked');
    for (const s of u.students) await call(s, 'POST', 'me/class', { className: '10B', firstName: 'Ученик', lastName: 'Тест' });
  });

  it('only one of five readers gets the last copy; counters never go negative', async () => {
    const results = await Promise.all(u.students.map((s, i) => call(s, 'POST', 'reservations', { bookId: books.single, requestKey: `k${i}` })));
    const ok = results.filter((r) => r.status === 200);
    const refused = results.filter((r) => r.status === 409);
    expect(ok).toHaveLength(1);
    expect(refused.every((r) => r.error === 'no_copies')).toBe(true);
    const inv = (await db.collection('inventory').doc(books.single).get()).data();
    expect(inv).toMatchObject({ total: 1, held: 1, issued: 0, available: 0 });
  });

  it('a double click creates one reservation; a second one for the same book is refused', async () => {
    const a = await call(u.s1, 'POST', 'reservations', { bookId: books.triple, requestKey: 'same' });
    const b = await call(u.s1, 'POST', 'reservations', { bookId: books.triple, requestKey: 'same' });
    expect(a.status).toBe(200);
    expect(b.data.duplicate).toBe(true);
    expect(b.data.id).toBe(a.data.id);
    const c = await call(u.s1, 'POST', 'reservations', { bookId: books.triple, requestKey: 'other' });
    expect(c.error).toBe('already_reserved');
    u.res = a.data;
  });

  it('3 copies: hold → prepare → e-mail → issue → return keeps the counts right', async () => {
    const inv = async () => (await db.collection('inventory').doc(books.triple).get()).data();
    expect(await inv()).toMatchObject({ total: 3, held: 1, issued: 0, available: 2 });
    // a student cannot prepare or issue
    expect((await call(u.s1, 'POST', `admin/reservations/${u.res.id}/issue`, {})).status).toBe(403);
    const day = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    const prep = await call(u.librarian, 'POST', `admin/reservations/${u.res.id}/prepare`, { date: day, from: '13:00', to: '15:30', place: 'Библиотека, 2 этаж' });
    expect(prep.status).toBe(200);
    expect(prep.data.status).toBe('ready');
    expect(prep.data.notification.status).toBe('pending');
    // e-mail: mail is not configured in tests → 503 from the route, then a fake sender
    expect((await call(u.librarian, 'POST', `admin/reservations/${u.res.id}/notify`)).error).toBe('mail_not_configured');
    process.env.SMTP_HOST = 'smtp.test'; process.env.SMTP_USER = 'library@school.test'; process.env.SMTP_PASS = 'x';
    const sent = [];
    const librarian = { uid: u.librarian.uid, email: u.librarian.email, role: 'librarian' };
    const fail1 = await notifyReservation(librarian, u.res.id, { send: async () => { throw Object.assign(new Error('boom'), { code: 'ECONNREFUSED' }); } });
    expect(fail1.notification.status).toBe('failed');
    const ok = await notifyReservation(librarian, u.res.id, { send: async (m) => { sent.push(m); return { messageId: '<1@test>', rejected: [] }; } });
    expect(ok.notification.status).toBe('sent');
    expect(ok.notification.attempts).toBe(2);
    expect(sent[0].from).toBe('"Библиотека NIS Kitap" <library@school.test>');
    expect(sent[0].to).toBe('student1@test.local');
    expect(sent[0].text).toContain('Адема');
    expect(sent[0].text).toContain(u.res.code);
    expect(sent[0].text).toContain('Библиотека, 2 этаж');
    expect(sent[0].html).not.toContain('<script');
    delete process.env.SMTP_HOST; delete process.env.SMTP_USER; delete process.env.SMTP_PASS;
    // resend did not create a second reservation
    expect((await db.collection('reservations').where('uid', '==', u.s1.uid).get()).size).toBe(1);

    const issued = await call(u.librarian, 'POST', `admin/reservations/${u.res.id}/issue`, {});
    expect(issued.data.status).toBe('issued');
    expect(await inv()).toMatchObject({ total: 3, held: 0, issued: 1, available: 2 });
    expect((await call(u.librarian, 'POST', `admin/reservations/${u.res.id}/issue`, {})).error).toBe('bad_transition');
    const back = await call(u.librarian, 'POST', `admin/reservations/${u.res.id}/return`, {});
    expect(back.data.status).toBe('returned');
    expect(await inv()).toMatchObject({ total: 3, held: 0, issued: 0, available: 3 });
    // fund cannot go below copies in use
    expect((await call(u.librarian, 'POST', `admin/inventory/${books.triple}/adjust`, { total: 5, reason: 'Новая поставка' })).data.total).toBe(5);
  });

  it('cancel and expiry release the hold', async () => {
    const s = u.students[1];
    const r = await call(s, 'POST', 'reservations', { bookId: books.triple, requestKey: 'c1' });
    expect((await call(u.s2, 'POST', `reservations/${r.data.id}/cancel`)).status).toBe(404);
    const c = await call(s, 'POST', `reservations/${r.data.id}/cancel`);
    expect(c.data.status).toBe('cancelled');
    const r2 = await call(s, 'POST', 'reservations', { bookId: books.triple, requestKey: 'c2' });
    await db.collection('reservations').doc(r2.data.id).update({ holdUntil: new Date(Date.now() - 1000).toISOString() });
    const sweep = await call(u.librarian, 'POST', 'admin/maintenance/expire');
    expect(sweep.data.expired).toBe(1);
    const inv = (await db.collection('inventory').doc(books.triple).get()).data();
    expect(inv).toMatchObject({ total: 5, held: 0, issued: 0, available: 5 });
  });

  it('reading statuses: «Прочитано» gives no points, confirmation gives them exactly once', async () => {
    const h = books.hundredLinked;
    expect((await call(u.s1, 'POST', 'reading/status', { bookId: h.catalogBookId, status: 'reading' })).data.status).toBe('reading');
    await call(u.s1, 'POST', 'reading/status', { bookId: h.catalogBookId, status: 'finished' });
    expect((await db.collection('points_ledger').where('uid', '==', u.s1.uid).get()).size).toBe(0);
    const req = await call(u.s1, 'POST', 'reading/verify', {
      bookId: h.catalogBookId, review: 'Очень понравилась книга, особенно глава про детство героя и его друзей.', rating: 5, publishReview: true,
    });
    expect(req.data.verificationStatus).toBe('pending');
    expect(req.data.reviewResult.ok).toBe(true);
    // the student cannot change the mark while waiting
    expect((await call(u.s1, 'POST', 'reading/status', { bookId: h.catalogBookId, status: 'want' })).error).toBe('locked');
    const id = `${u.s1.uid}__${h.catalogBookId}`;
    const [a, b] = await Promise.all([
      call(u.librarian, 'POST', `admin/reading/${id}/confirm`, { reviewAccepted: true }),
      call(u.librarian, 'POST', `admin/reading/${id}/confirm`, { reviewAccepted: true }),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 409]);
    const ledger = await db.collection('points_ledger').where('uid', '==', u.s1.uid).get();
    const actions = ledger.docs.map((d) => d.data().action).sort();
    expect(actions).toEqual(['book_confirmed', 'hundred_bonus', 'review_accepted']);
    const sp = (await db.collection('student_points').doc(u.s1.uid).get()).data();
    expect(sp.total).toBe(145);
    expect(sp.confirmedBooks).toBe(1);
    const sh = (await db.collection('shanyrak_points').doc(`${YEAR}__тест-алатау`).get()).data();
    expect(sh.total).toBe(145);
    const month = Object.values(sh.months)[0];
    expect(month).toMatchObject({ total: 145, book: 100, hundred: 25, review: 20 });
    expect(month.classes['10A']).toBe(145);
  });

  it('a 100 kitap book missing from the catalog can be tracked but not reserved', async () => {
    const h = books.hundredUnlinked;
    const r = await call(u.s1, 'POST', 'reading/status', { bookId: h.id, hundredId: h.id, status: 'want' });
    expect(r.data.inCatalog).toBe(false);
    expect((await call(u.s1, 'POST', 'reservations', { bookId: h.id })).error).toBe('unknown_book');
  });

  it('nobody confirms their own reading; review publication is a separate decision', async () => {
    // the librarian marks her own book and cannot confirm it
    await call(u.librarian, 'POST', 'reading/verify', { bookId: books.other, review: '' });
    const own = await call(u.librarian, 'POST', `admin/reading/${u.librarian.uid}__${books.other}/confirm`, {});
    expect(own.error).toBe('self_action_forbidden');
    const pending = await call(u.librarian, 'GET', 'admin/reviews?status=pending');
    expect(pending.data.length).toBe(1);
    const pub = await call(u.librarian, 'POST', `admin/reviews/${pending.data[0].id}/moderate`, { decision: 'publish' });
    expect(pub.data.status).toBe('published');
    const review = (await db.collection('reviews').doc(pending.data[0].id).get()).data();
    expect(review.authorLabel).toBe('Адема Т., 10A');
    expect(review.text).not.toContain('@');
  });

  it('reviews refuse links and contact details and are limited per day', async () => {
    const bad = await call(u.s2, 'POST', 'reviews', { bookId: books.other, rating: 4, text: 'Пишите мне в телеграм t.me/somebody, обсудим книгу вместе!' });
    expect(bad.error).toBe('invalid_review');
    const okR = await call(u.s2, 'POST', 'reviews', { bookId: books.other, rating: 4, text: 'Интересный сюжет, но середина немного затянута. <script>alert(1)</script>' });
    expect(okR.data.status).toBe('pending');
    const stored = (await db.collection('reviews').doc(`${u.s2.uid}__${books.other}`).get()).data();
    expect(stored.text).toContain('<script>'); // stored as text, rendered escaped by Vue
    for (let i = 0; i < 4; i += 1) await call(u.s2, 'POST', 'reviews', { bookId: books.other, rating: 3, text: `Отзыв номер ${i} про эту книгу, мнение меняется.` });
    expect((await call(u.s2, 'POST', 'reviews', { bookId: books.other, rating: 3, text: 'Ещё один отзыв, шестой за сегодня, должен упереться в лимит.' })).status).toBe(429);
  });

  it('moving a student keeps past points in the old shanyrak', async () => {
    const move = await call(u.tech, 'POST', `admin/students/${u.s1.uid}/class`, { className: '11A', reason: 'Перевод по заявлению' });
    expect(move.data.shanyrakName).toBe('Тест-Каспий');
    const old = (await db.collection('shanyrak_points').doc(`${YEAR}__тест-алатау`).get()).data();
    expect(old.total).toBe(145);
    const history = await db.collection('class_history').where('uid', '==', u.s1.uid).get();
    expect(history.docs.map((d) => d.data().source)).toContain('admin');
    // new points go to the new shanyrak
    const adj = await call(u.librarian, 'POST', 'admin/points/adjust', { uid: u.s1.uid, points: 30, reason: 'Участие в читательской конференции' });
    expect(adj.data.shanyrakName).toBe('Тест-Каспий');
    // the librarian cannot adjust her own points; the tech admin cannot adjust at all
    expect((await call(u.librarian, 'POST', 'admin/points/adjust', { uid: u.librarian.uid, points: 30, reason: 'Себе очки' })).error).toBe('self_action_forbidden');
    expect((await call(u.tech, 'POST', 'admin/points/adjust', { uid: u.s1.uid, points: 30, reason: 'Попытка техадмина' })).status).toBe(403);
  });

  it('a reversal cancels points once and keeps the history', async () => {
    const id = `${u.s1.uid}__${books.hundredLinked.catalogBookId}`;
    const rev = await call(u.librarian, 'POST', `admin/reading/${id}/revoke`, { reason: 'Подтверждено по ошибке' });
    expect(rev.data.reversed).toBe(3);
    expect((await call(u.librarian, 'POST', `admin/reading/${id}/revoke`, { reason: 'Повторно' })).error).toBe('not_confirmed');
    const sp = (await db.collection('student_points').doc(u.s1.uid).get()).data();
    expect(sp.total).toBe(30);
    expect(sp.confirmedBooks).toBe(0);
    const old = (await db.collection('shanyrak_points').doc(`${YEAR}__тест-алатау`).get()).data();
    expect(old.total).toBe(0);
    const ledger = await db.collection('points_ledger').where('uid', '==', u.s1.uid).get();
    expect(ledger.size).toBe(7);
    expect(ledger.docs.filter((d) => d.data().reversed).length).toBe(3);
  });

  it('rewards: criteria are checked on the server; director approval is required', async () => {
    const item = await call(u.librarian, 'POST', 'admin/rewards', {
      title: 'Грамота «Читатель года»', type: 'diploma', conditions: 'Не менее 1 подтверждённой книги', criteria: { minConfirmedBooks: 1 }, approval: 'director', claimable: true,
    });
    expect(item.status).toBe(200);
    // s1 has 0 confirmed books after the reversal → criteria not met
    expect((await call(u.s1, 'POST', `rewards/${item.data.id}/claim`)).error).toBe('criteria_not_met');
    await call(u.s2, 'POST', 'reading/verify', { bookId: books.triple, review: 'Хорошая книга про дружбу и приключения.' });
    await call(u.librarian, 'POST', `admin/reading/${u.s2.uid}__${books.triple}/confirm`, {});
    const award = await call(u.librarian, 'POST', 'admin/rewards/award', { rewardId: item.data.id, uid: u.s2.uid, reason: 'Активное чтение' });
    expect(award.data.status).toBe('pending_approval');
    expect((await call(u.librarian, 'POST', `admin/rewards/issues/${award.data.id}/decide`, { decision: 'approve' })).status).toBe(403);
    const ok = await call(u.director, 'POST', `admin/rewards/issues/${award.data.id}/decide`, { decision: 'approve' });
    expect(ok.data.status).toBe('issued');
    expect(ok.data.certificateNumber).toMatch(/^NISK-\d{4}-/);
    const cert = (await db.collection('certificates').doc(ok.data.certificateNumber).get()).data();
    expect(cert.recipientShort).toBe('Бекзат Т.');
    expect(JSON.stringify(cert)).not.toContain('@');
  });

  it('roles: tech admin assigns staff roles but never to self or tech_admin', async () => {
    const helper = await signUp('assistant@test.local');
    expect((await call(u.tech, 'POST', 'admin/roles', { email: helper.email, role: 'librarian' })).status).toBe(200);
    expect((await call(helper, 'GET', 'me')).data.role).toBe('librarian');
    expect((await call(u.tech, 'POST', 'admin/roles', { email: u.tech.email, role: 'director' })).error).toBe('cannot_assign_role');
    expect((await call(u.tech, 'POST', 'admin/roles', { email: helper.email, role: 'tech_admin' })).status).toBe(400);
    expect((await call(u.tech, 'POST', 'admin/roles', { email: u.librarian.email, role: 'student' })).error).toBe('cannot_assign_role');
    expect((await call(u.director, 'POST', 'admin/roles', { email: helper.email, role: 'director' })).status).toBe(403);
    const audit = await call(u.director, 'GET', 'admin/audit');
    expect(audit.data.some((a) => a.action === 'role_assigned')).toBe(true);
  });

  it('reports contain counts only; rebuild from the ledger matches the live aggregates', async () => {
    const rep = await call(u.director, 'GET', 'admin/reports');
    expect(rep.status).toBe(200);
    expect(JSON.stringify(rep.data)).not.toContain('@');
    const before = (await db.collection('student_points').doc(u.s1.uid).get()).data().total;
    const rebuilt = await call(u.tech, 'POST', 'admin/maintenance/rebuild', { apply: true });
    expect(rebuilt.data.applied).toBe(true);
    const after = (await db.collection('student_points').doc(u.s1.uid).get()).data().total;
    expect(after).toBe(before);
  });
});
