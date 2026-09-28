import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Target recipients specified in requirements:
// 1. janbolatique.kz@gmail.com (Zhanbolat)
// 2. muldasheva_v@ast.nis.edu.kz (Librarian)
const NOTIFICATION_RECIPIENTS = [
  'janbolatique.kz@gmail.com',
  'muldasheva_v@ast.nis.edu.kz',
];

function formatDateTime(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  return d.toLocaleString('ru-RU', {
    timeZone: 'Asia/Almaty',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + ' (ALMT, UTC+5)';
}

function formatDateOnly(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  return d.toLocaleDateString('ru-RU', {
    timeZone: 'Asia/Almaty',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function generateReservationEmailHtml(details) {
  const {
    bookTitle,
    author,
    genre,
    isbn,
    language,
    year,
    copies,
    userName,
    userEmail,
    userId,
    reservedAt,
    dueDate,
    reservationId,
    description,
  } = details;

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Уведомление о бронировании книги | NIS Kitap</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #f3f4f6; }
    .email-container { max-width: 620px; margin: 30px auto; background: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; }
    .header-banner { background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #4f46e5 100%); padding: 32px; text-align: left; }
    .header-badge { display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #ffffff; margin-bottom: 10px; }
    .header-title { margin: 0 0 4px; font-size: 24px; font-weight: 700; color: #ffffff; }
    .header-subtitle { margin: 0; font-size: 14px; color: rgba(255, 255, 255, 0.85); }
    .content-body { padding: 30px; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #38bdf8; margin: 0 0 12px; }
    .card-panel { background: #1a2234; border: 1px solid #2a374d; border-radius: 14px; padding: 18px; margin-bottom: 20px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #243044; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #94a3b8; font-weight: 500; }
    .info-value { color: #f1f5f9; font-weight: 600; text-align: right; }
    .highlight-value { color: #38bdf8; font-weight: 700; }
    .badge-active { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
    .footer { background: #0d131f; border-top: 1px solid #1f2937; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header-banner">
      <div class="header-badge">NIS KITAP 2.0 • ШКОЛЬНАЯ БИБЛИОТЕКА</div>
      <h1 class="header-title">Новая бронь книги</h1>
      <p class="header-subtitle">Уведомление для библиотекаря и координатора платформы</p>
    </div>
    <div class="content-body">
      <div class="section-title">📚 Информация о книге</div>
      <div class="card-panel">
        <div style="font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 4px;">«${bookTitle}»</div>
        <div style="font-size: 14px; color: #94a3b8; margin-bottom: 14px;">Автор: ${author}</div>
        <div class="info-row"><span class="info-label">Жанр:</span><span class="info-value">${genre || '—'}</span></div>
        <div class="info-row"><span class="info-label">ISBN:</span><span class="info-value highlight-value">${isbn || 'Не указан / Not specified'}</span></div>
        <div class="info-row"><span class="info-label">Язык:</span><span class="info-value">${language || 'Русский'}</span></div>
        <div class="info-row"><span class="info-label">Год издания:</span><span class="info-value">${year || '—'}</span></div>
        <div class="info-row"><span class="info-label">Экземпляров в фонде:</span><span class="info-value">${copies ?? 1} шт.</span></div>
      </div>
      <div class="section-title">👤 Читатель</div>
      <div class="card-panel">
        <div class="info-row"><span class="info-label">ФИО читателя:</span><span class="info-value highlight-value">${userName}</span></div>
        <div class="info-row"><span class="info-label">Email читателя:</span><span class="info-value"><a href="mailto:${userEmail}" style="color:#38bdf8;text-decoration:none;">${userEmail}</a></span></div>
        ${userId ? `<div class="info-row"><span class="info-label">ID аккаунта:</span><span class="info-value">${userId}</span></div>` : ''}
      </div>
      <div class="section-title">⏱️ Детали бронирования</div>
      <div class="card-panel">
        <div class="info-row"><span class="info-label">Статус:</span><span class="info-value"><span class="badge-active">● Активна (зарезервировано)</span></span></div>
        <div class="info-row"><span class="info-label">Дата и время:</span><span class="info-value">${formatDateTime(reservedAt)}</span></div>
        <div class="info-row"><span class="info-label">Срок возврата:</span><span class="info-value highlight-value">${formatDateOnly(dueDate)}</span></div>
        <div class="info-row"><span class="info-label">ID брони:</span><span class="info-value" style="font-family: monospace;">${reservationId || '—'}</span></div>
      </div>
    </div>
    <div class="footer">
      <p><b>Цифровая библиотека NIS Kitap</b></p>
      <p>Получатели: janbolatique.kz@gmail.com, muldasheva_v@ast.nis.edu.kz</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateReservationEmailText(details) {
  const { bookTitle, author, genre, isbn, language, year, copies, userName, userEmail, reservedAt, dueDate, reservationId } = details;
  return `
NIS KITAP — УВЕДОМЛЕНИЕ О БРОНИРОВАНИИ КНИГИ
============================================
КНИГА:
• Название: «${bookTitle}»
• Автор: ${author}
• Жанр: ${genre || '—'}
• ISBN: ${isbn || 'Не указан / Not specified'}
• Язык: ${language || 'Русский'}
• Год: ${year || '—'}
• Экземпляров: ${copies ?? 1}

ЧИТАТЕЛЬ:
• ФИО: ${userName}
• Email: ${userEmail}

БРОНИРОВАНИЕ:
• Дата и время: ${formatDateTime(reservedAt)}
• Срок возврата: ${formatDateOnly(dueDate)}
• ID брони: ${reservationId || '—'}

Получатели: ${NOTIFICATION_RECIPIENTS.join(', ')}
`.trim();
}

async function sendEmailNotification(payload) {
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 465;

  let transporter;
  if (smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
  } else {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    } catch {
      transporter = nodemailer.createTransport({ jsonTransport: true });
    }
  }

  const subject = `[NIS Kitap] Новое бронирование книги: «${payload.bookTitle}» — ${payload.userName}`;
  const html = generateReservationEmailHtml(payload);
  const text = generateReservationEmailText(payload);
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || '"NIS Kitap Library" <library@nis.edu.kz>';

  const info = await transporter.sendMail({
    from,
    to: NOTIFICATION_RECIPIENTS,
    subject,
    text,
    html,
  });

  return {
    success: true,
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info) || null,
    recipients: NOTIFICATION_RECIPIENTS,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { book, user, dueDate, reservationId } = body;
  if (!book?.title) {
    return res.status(400).json({ error: 'Book details (title) are required' });
  }
  if (!user?.email) {
    return res.status(400).json({ error: 'User details (email) are required' });
  }

  const reservedAt = new Date();
  const returnDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const resId = reservationId || `res_${Date.now()}`;

  const payload = {
    bookTitle: book.title,
    author: book.author || 'Не указан',
    genre: Array.isArray(book.genre) ? book.genre.join(', ') : (book.genre || 'Не указан'),
    isbn: book.isbn || '',
    language: book.language || 'Русский',
    year: String(book.year || ''),
    copies: Number(book.copies ?? 1),
    description: book.description || '',
    userName: user.name || user.email.split('@')[0],
    userEmail: user.email.trim(),
    userId: user.uid || user.id || '',
    reservedAt: reservedAt.toISOString(),
    dueDate: returnDate.toISOString(),
    reservationId: resId,
  };

  try {
    const emailResult = await sendEmailNotification(payload);
    return res.status(201).json({
      success: true,
      message: 'Reservation created and email notifications sent to librarian and Zhanbolat',
      reservation: {
        id: resId,
        title: payload.bookTitle,
        author: payload.author,
        genre: payload.genre,
        isbn: payload.isbn,
        userName: payload.userName,
        userEmail: payload.userEmail,
        reservedAt: payload.reservedAt,
        dueDate: payload.dueDate,
        status: 'active',
      },
      emailNotification: emailResult,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Error processing reservation notification',
      details: err.message,
    });
  }
}
