// Pickup e-mail to the reader («книга подготовлена»).
//
// Sender: only the SMTP account configured on the server (SMTP_USER). Another
// From address is used only when MAIL_FROM is set AND MAIL_FROM_VERIFIED=true,
// i.e. the tech admin confirmed that the mail provider verified that address or
// domain. The sender is never taken from a librarian's profile or the request.
//
// The letter contains: first name, title, author, reservation code, pickup date,
// time window, place and the deadline to cancel / the end of the hold.
// No class, e-mail of other people or any other personal data.
import nodemailer from 'nodemailer';
import { db } from '../admin.js';
import { fail, id as idParam } from '../http.js';
import { audit } from '../audit.js';
import { assertNotSelf } from '../auth.js';

const coll = (name) => db().collection(name);

function addressOf(value) {
  const m = /<([^>]+)>/.exec(String(value || ''));
  return (m ? m[1] : String(value || '')).trim().toLowerCase();
}
function domainOf(address) {
  return String(address || '').split('@')[1] || '';
}
export function maskEmail(email) {
  const [user, domain] = String(email || '').split('@');
  if (!domain) return '';
  return `${user.slice(0, 2)}${'•'.repeat(Math.max(1, user.length - 2))}@${domain}`;
}

export function mailConfig(env = process.env) {
  const host = env.SMTP_HOST || '';
  const port = Number(env.SMTP_PORT) || 465;
  const user = String(env.SMTP_USER || '').trim();
  const pass = env.SMTP_PASS || '';
  const problems = [];
  if (!host) problems.push('SMTP_HOST is not set');
  if (!user) problems.push('SMTP_USER is not set');
  if (!pass) problems.push('SMTP_PASS is not set');
  const name = String(env.MAIL_FROM_NAME || 'Библиотека NIS Kitap').replace(/[<>"\r\n]/g, '').slice(0, 60);
  let fromAddress = user.toLowerCase();
  if (env.MAIL_FROM) {
    const wanted = addressOf(env.MAIL_FROM);
    if (wanted && wanted !== fromAddress) {
      if (env.MAIL_FROM_VERIFIED === 'true') fromAddress = wanted;
      else problems.push(`MAIL_FROM (${wanted}) differs from SMTP_USER and MAIL_FROM_VERIFIED is not "true": the SMTP account is used as the sender`);
    }
  }
  const replyTo = env.MAIL_REPLY_TO ? addressOf(env.MAIL_REPLY_TO) : '';
  return {
    configured: Boolean(host && user && pass),
    host,
    port,
    secure: port === 465,
    user,
    pass,
    from: fromAddress ? `"${name}" <${fromAddress}>` : '',
    fromAddress,
    fromDomain: domainOf(fromAddress),
    replyTo,
    problems,
  };
}

function transporter(cfg) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

// Status for the tech admin: is sending set up, from which address, does the
// server accept our login (no letter is sent).
export async function mailStatus() {
  const cfg = mailConfig();
  const out = { configured: cfg.configured, from: cfg.fromAddress, fromDomain: cfg.fromDomain, replyTo: cfg.replyTo, host: cfg.host, problems: cfg.problems, verified: false };
  if (!cfg.configured) return out;
  try {
    await transporter(cfg).verify();
    out.verified = true;
  } catch (err) {
    out.error = String(err.code || err.message || 'verify_failed').slice(0, 200);
  }
  return out;
}

// ---------- templates ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const LOCALES = { ru: 'ru-RU', kz: 'kk-KZ', en: 'en-GB' };

function fmtDate(iso, locale, tz) {
  return new Date(iso).toLocaleDateString(LOCALES[locale] || 'ru-RU', { timeZone: tz, day: 'numeric', month: 'long', weekday: 'long' });
}
function fmtDateTime(iso, locale, tz) {
  return new Date(iso).toLocaleString(LOCALES[locale] || 'ru-RU', { timeZone: tz, day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

const TEXT = {
  ru: {
    subject: (d) => `Книга «${d.title}» ждёт вас в библиотеке — бронь ${d.code}`,
    hello: (d) => `Здравствуйте, ${d.name}!`,
    body: (d) => `Книга «${d.title}» (${d.author}) подготовлена для вас. Забрать её можно ${d.date} с ${d.from} до ${d.to}: ${d.place}.`,
    code: 'Номер бронирования',
    holdUntil: 'Бронь действует до',
    cancel: (d) => `Если вы не сможете прийти, отмените бронь в личном кабинете до ${d.cancelBefore}.`,
    cabinet: 'Открыть личный кабинет',
    footer: 'Это письмо отправлено автоматически сервисом школьной библиотеки NIS Kitap. Отвечать на него не нужно.',
  },
  kz: {
    subject: (d) => `«${d.title}» кітабы кітапханада сізді күтуде — бронь ${d.code}`,
    hello: (d) => `Сәлеметсіз бе, ${d.name}!`,
    body: (d) => `«${d.title}» (${d.author}) кітабы сізге дайындалды. Оны ${d.date} күні ${d.from}–${d.to} аралығында алуға болады: ${d.place}.`,
    code: 'Брондау нөмірі',
    holdUntil: 'Бронь жарамды',
    cancel: (d) => `Келе алмасаңыз, брондауды жеке кабинетте ${d.cancelBefore} дейін болдырмаңыз.`,
    cabinet: 'Жеке кабинетті ашу',
    footer: 'Бұл хат NIS Kitap мектеп кітапханасы сервисінен автоматты түрде жіберілді. Жауап берудің қажеті жоқ.',
  },
  en: {
    subject: (d) => `“${d.title}” is waiting for you at the library — reservation ${d.code}`,
    hello: (d) => `Hello, ${d.name}!`,
    body: (d) => `The book “${d.title}” by ${d.author} is ready for you. You can pick it up on ${d.date} between ${d.from} and ${d.to}: ${d.place}.`,
    code: 'Reservation number',
    holdUntil: 'Reservation valid until',
    cancel: (d) => `If you can't come, please cancel the reservation in your account before ${d.cancelBefore}.`,
    cabinet: 'Open my account',
    footer: 'This message was sent automatically by the NIS Kitap school library service. No reply is needed.',
  },
};

export function renderPickupEmail(locale, data, { siteUrl = 'https://www.niskitap.site', timeZone = 'Asia/Almaty' } = {}) {
  const lang = TEXT[locale] ? locale : 'ru';
  const T = TEXT[lang];
  const d = {
    name: data.name,
    title: data.title,
    author: data.author || '—',
    code: data.code,
    date: fmtDate(data.pickupStart, lang, timeZone),
    from: data.from,
    to: data.to,
    place: data.place,
    cancelBefore: fmtDateTime(data.cancelBefore, lang, timeZone),
    holdUntil: fmtDateTime(data.holdUntil, lang, timeZone),
  };
  const cabinetUrl = `${siteUrl.replace(/\/$/, '')}/profile`;
  const text = [
    T.hello(d), '', T.body(d), '', `${T.code}: ${d.code}`, `${T.holdUntil}: ${d.holdUntil}`, '', T.cancel(d), '', `${T.cabinet}: ${cabinetUrl}`, '', '—', T.footer,
  ].join('\n');
  const e = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, esc(v)]));
  const html = `<!doctype html><html lang="${lang === 'kz' ? 'kk' : lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(T.subject(d))}</title></head>
<body style="margin:0;background:#f4f1ea;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1d2433">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;border:1px solid #e4ddd0">
<tr><td style="padding:28px 28px 8px;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#7a6a4f">NIS Kitap</td></tr>
<tr><td style="padding:0 28px 8px;font-size:20px;font-weight:700;line-height:1.3">${esc(T.hello(d))}</td></tr>
<tr><td style="padding:0 28px 20px;font-size:16px;line-height:1.6">${esc(T.body(d))}</td></tr>
<tr><td style="padding:0 28px 20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f1;border:1px solid #ece4d6;border-radius:10px">
<tr><td style="padding:14px 16px;font-size:14px;color:#5b5446">${esc(T.code)}</td><td style="padding:14px 16px;font-size:16px;font-weight:700;text-align:right;font-family:Menlo,Consolas,monospace">${e.code}</td></tr>
<tr><td style="padding:0 16px 14px;font-size:14px;color:#5b5446">${esc(T.holdUntil)}</td><td style="padding:0 16px 14px;font-size:14px;text-align:right">${e.holdUntil}</td></tr>
</table></td></tr>
<tr><td style="padding:0 28px 20px;font-size:15px;line-height:1.6">${esc(T.cancel(d))}</td></tr>
<tr><td style="padding:0 28px 28px"><a href="${esc(cabinetUrl)}" style="display:inline-block;background:#1f3a5f;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:15px">${esc(T.cabinet)}</a></td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #efe8dc;font-size:12px;line-height:1.5;color:#8a8170">${esc(T.footer)}</td></tr>
</table></td></tr></table></body></html>`;
  return { subject: T.subject(d), text, html };
}

// ---------- send ----------
const SENDING_TIMEOUT_MS = 2 * 60 * 1000;

/**
 * Sends (or re-sends) the pickup e-mail of a prepared reservation. Never creates
 * a reservation. A second click while a letter is being sent is refused.
 */
export async function notifyReservation(actor, reservationId, { send } = {}) {
  const ref = coll('reservations').doc(idParam(reservationId, 'reservationId'));
  const cfg = mailConfig();
  if (!cfg.configured) fail(503, 'mail_not_configured', { problems: cfg.problems });

  const claim = await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) fail(404, 'not_found');
    const r = { id: snap.id, ...snap.data() };
    assertNotSelf(actor, r.uid);
    if (r.status !== 'ready' || !r.pickup) fail(409, 'not_prepared');
    const n = r.notification || {};
    if (n.status === 'sending' && Date.now() - new Date(n.lastAttemptAt || 0).getTime() < SENDING_TIMEOUT_MS) fail(409, 'already_sending');
    const pSnap = await tx.get(coll('profiles').doc(r.uid));
    const profile = pSnap.exists ? pSnap.data() : {};
    const now = new Date().toISOString();
    tx.update(ref, { notification: { ...n, status: 'sending', attempts: (Number(n.attempts) || 0) + 1, lastAttemptAt: now, lastAttemptBy: actor.uid } });
    return { r, profile };
  });

  const { r, profile } = claim;
  const to = String(profile.email || r.userEmail || '').toLowerCase();
  const locale = ['ru', 'kz', 'en'].includes(profile.locale) ? profile.locale : 'ru';
  const message = renderPickupEmail(locale, {
    name: profile.firstName || String(r.userName || '').split(' ')[0] || '',
    title: r.bookTitle || r.title,
    author: r.bookAuthor || r.author,
    code: r.code || r.id,
    pickupStart: r.pickup.start,
    from: r.pickup.from,
    to: r.pickup.to,
    place: r.pickup.place,
    cancelBefore: r.cancelBefore || r.pickup.start,
    holdUntil: r.holdUntil,
  }, { siteUrl: process.env.SITE_URL || 'https://www.niskitap.site' });

  let result;
  try {
    const sender = send || ((msg) => transporter(cfg).sendMail(msg));
    const info = await sender({
      from: cfg.from,
      to,
      replyTo: cfg.replyTo || undefined,
      subject: message.subject,
      text: message.text,
      html: message.html,
      headers: { 'X-NIS-Kitap-Reservation': r.code || r.id },
    });
    const rejected = Array.isArray(info?.rejected) ? info.rejected : [];
    result = rejected.length
      ? { status: 'failed', error: 'recipient_rejected' }
      : { status: 'sent', messageId: String(info?.messageId || '').slice(0, 200) };
  } catch (err) {
    result = { status: 'failed', error: String(err.code || err.responseCode || err.message || 'send_failed').slice(0, 200) };
  }

  const now = new Date().toISOString();
  const notification = {
    ...(r.notification || {}),
    status: result.status,
    attempts: (Number(r.notification?.attempts) || 0) + 1,
    lastAttemptAt: now,
    lastAttemptBy: actor.uid,
    to: maskEmail(to),
    locale,
    ...(result.status === 'sent' ? { sentAt: now, messageId: result.messageId, error: '' } : { error: result.error }),
  };
  const batch = db().batch();
  batch.update(ref, { notification, updatedAt: now });
  batch.set(coll('mail_log').doc(), {
    reservationId: ref.id, template: 'pickup_ready', locale, to: maskEmail(to), status: result.status,
    messageId: result.messageId || '', error: result.error || '', by: actor.uid, at: now,
  });
  audit(batch, actor, `pickup_email_${result.status}`, 'reservations', ref.id, null, { attempt: notification.attempts, error: result.error || '' });
  await batch.commit();
  return { id: ref.id, notification };
}
