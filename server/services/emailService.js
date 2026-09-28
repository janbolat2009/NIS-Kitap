import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target recipients specified in requirements:
// 1. janbolatique.kz@gmail.com (Zhanbolat)
// 2. muldasheva_v@ast.nis.edu.kz (Librarian)
export const NOTIFICATION_RECIPIENTS = [
  'janbolatique.kz@gmail.com',
  'muldasheva_v@ast.nis.edu.kz',
];

/**
 * Creates and configures the nodemailer transporter.
 * Supports SMTP (e.g. Gmail App Password, NIS Exchange SMTP),
 * or falls back to Ethereal / local audit logger in dev mode.
 */
let cachedTransporter = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpSecure = process.env.SMTP_SECURE !== 'false' && smtpPort === 465;

  if (smtpUser && smtpPass) {
    console.log(`📧 Configured live SMTP transport for ${smtpUser} (${smtpHost}:${smtpPort})`);
    cachedTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    return cachedTransporter;
  }

  // Fallback: Ethereal test account or local logging transport
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log(`ℹ️ SMTP credentials not found in .env. Using Ethereal test mailer (${testAccount.user})`);
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return cachedTransporter;
  } catch (err) {
    console.warn(`⚠️ Ethereal account creation failed: ${err.message}. Using JSON stream transport.`);
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return cachedTransporter;
  }
}

/**
 * Formats a date into a clean, human-readable string in Almaty time (UTC+5)
 */
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

/**
 * Generates an Apple-aesthetic HTML email template for book reservations
 */
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Уведомление о бронировании книги | NIS Kitap</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #f3f4f6;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 620px;
      margin: 30px auto;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .header-banner {
      background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #4f46e5 100%);
      padding: 36px 32px 30px;
      text-align: left;
    }
    .header-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #ffffff;
      margin-bottom: 12px;
    }
    .header-title {
      margin: 0 0 6px;
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.25;
    }
    .header-subtitle {
      margin: 0;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.85);
    }
    .content-body {
      padding: 32px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #38bdf8;
      margin: 0 0 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .card-panel {
      background: #1a2234;
      border: 1px solid #2a374d;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 22px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 9px 0;
      border-bottom: 1px solid #243044;
      font-size: 14px;
    }
    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .info-row:first-child {
      padding-top: 0;
    }
    .info-label {
      color: #94a3b8;
      font-weight: 500;
      min-width: 130px;
    }
    .info-value {
      color: #f1f5f9;
      font-weight: 600;
      text-align: right;
      word-break: break-word;
    }
    .highlight-value {
      color: #38bdf8;
      font-weight: 700;
    }
    .badge-active {
      display: inline-block;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      padding: 2px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
    .book-title-hero {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 4px;
    }
    .book-author-hero {
      font-size: 14px;
      color: #94a3b8;
      margin: 0 0 16px;
    }
    .notice-box {
      background: rgba(56, 189, 248, 0.08);
      border-left: 3px solid #38bdf8;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.5;
      margin-top: 10px;
    }
    .footer {
      background: #0d131f;
      border-top: 1px solid #1f2937;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    .footer p {
      margin: 4px 0;
    }
    .footer a {
      color: #38bdf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header-banner">
      <div class="header-badge">NIS KITAP 2.0 • ШКОЛЬНАЯ БИБЛИОТЕКА</div>
      <h1 class="header-title">Новая бронь книги</h1>
      <p class="header-subtitle">Уведомление для библиотекаря и координатора платформы</p>
    </div>

    <div class="content-body">
      <!-- Book Information -->
      <div class="section-title">📚 Информация о книге</div>
      <div class="card-panel">
        <div class="book-title-hero">«${bookTitle}»</div>
        <div class="book-author-hero">Автор: ${author}</div>

        <div class="info-row">
          <span class="info-label">Жанр:</span>
          <span class="info-value">${genre || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">ISBN:</span>
          <span class="info-value highlight-value">${isbn || 'Не указан / Not specified'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Язык издания:</span>
          <span class="info-value">${language || 'Русский'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Год издания:</span>
          <span class="info-value">${year || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Экземпляров в фонде:</span>
          <span class="info-value">${copies ?? 1} шт.</span>
        </div>
        ${description ? `
        <div class="info-row" style="flex-direction: column; gap: 4px; padding-top: 8px;">
          <span class="info-label" style="font-size: 12px;">Аннотация:</span>
          <span class="info-value" style="text-align: left; font-size: 12px; font-weight: normal; color: #cbd5e1;">${description.slice(0, 220)}${description.length > 220 ? '...' : ''}</span>
        </div>
        ` : ''}
      </div>

      <!-- User Information -->
      <div class="section-title">👤 Читатель (Ученик / Преподаватель)</div>
      <div class="card-panel">
        <div class="info-row">
          <span class="info-label">ФИО читателя:</span>
          <span class="info-value highlight-value">${userName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email читателя:</span>
          <span class="info-value"><a href="mailto:${userEmail}" style="color: #38bdf8; text-decoration: none;">${userEmail}</a></span>
        </div>
        ${userId ? `
        <div class="info-row">
          <span class="info-label">ID аккаунта:</span>
          <span class="info-value" style="font-family: monospace; font-size: 12px;">${userId}</span>
        </div>` : ''}
      </div>

      <!-- Reservation Details -->
      <div class="section-title">⏱️ Детали бронирования</div>
      <div class="card-panel">
        <div class="info-row">
          <span class="info-label">Статус:</span>
          <span class="info-value"><span class="badge-active">● Активна (зарезервировано)</span></span>
        </div>
        <div class="info-row">
          <span class="info-label">Дата и время брони:</span>
          <span class="info-value">${formatDateTime(reservedAt)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Срок возврата (Due date):</span>
          <span class="info-value highlight-value">${formatDateOnly(dueDate)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Номер брони:</span>
          <span class="info-value" style="font-family: monospace; font-size: 12px;">${reservationId || '—'}</span>
        </div>
      </div>

      <div class="notice-box">
        💡 <b>Памятка библиотекарю:</b> Согласно правилам библиотеки NIS, забронированная книга откладывается на стойке выдачи. Читатель может получить её по предоставлению своего имени или email.
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><b>Цифровая библиотека NIS Kitap</b></p>
      <p>Автоматическое сервисное уведомление. Ответ на это письмо не требуется.</p>
      <p style="margin-top: 10px; font-size: 11px;">Получатели: janbolatique.kz@gmail.com, muldasheva_v@ast.nis.edu.kz</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generates a clean plain text fallback
 */
function generateReservationEmailText(details) {
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
    reservedAt,
    dueDate,
    reservationId,
  } = details;

  return `
======================================================
NIS KITAP — УВЕДОМЛЕНИЕ О БРОНИРОВАНИИ КНИГИ
======================================================

Здравствуйте!

Пользователь оформил онлайн-бронирование книги в библиотеке NIS Kitap:

ДЕТАЛИ КНИГИ:
• Название: «${bookTitle}»
• Автор: ${author}
• Жанр: ${genre || '—'}
• ISBN: ${isbn || 'Не указан / Not specified'}
• Язык: ${language || 'Русский'}
• Год издания: ${year || '—'}
• Экземпляров в библиотеке: ${copies ?? 1}

ДАННЫЕ ЧИТАТЕЛЯ:
• Полное имя: ${userName}
• Email: ${userEmail}

ДЕТАЛИ БРОНИРОВАНИЯ:
• Дата и время бронирования: ${formatDateTime(reservedAt)}
• Дата возврата (Due Date): ${formatDateOnly(dueDate)}
• ID брони: ${reservationId || '—'}
• Статус: Активно

------------------------------------------------------
Письмо сформировано автоматически системой NIS Kitap.
Получатели: ${NOTIFICATION_RECIPIENTS.join(', ')}
======================================================
`.trim();
}

/**
 * Sends reservation email notification to both librarian and Zhanbolat:
 * janbolatique.kz@gmail.com
 * muldasheva_v@ast.nis.edu.kz
 */
export async function sendReservationNotification(reservationDetails) {
  try {
    const transporter = await getTransporter();

    const subject = `[NIS Kitap] Новое бронирование книги: «${reservationDetails.bookTitle}» — ${reservationDetails.userName}`;
    const html = generateReservationEmailHtml(reservationDetails);
    const text = generateReservationEmailText(reservationDetails);

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || '"NIS Kitap Library" <library@nis.edu.kz>';

    const mailOptions = {
      from: fromAddress,
      to: NOTIFICATION_RECIPIENTS,
      subject,
      text,
      html,
    };

    console.log(`📤 Sending reservation email notification for "${reservationDetails.bookTitle}" to:`, NOTIFICATION_RECIPIENTS);

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Reservation email notification successfully sent! Message ID:', info.messageId);

    // Save to audit log for local record
    try {
      const logsDir = path.resolve(__dirname, '../logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      const logEntry = `[${new Date().toISOString()}] RESERVATION NOTIFIED: "${reservationDetails.bookTitle}" reserved by ${reservationDetails.userName} (${reservationDetails.userEmail}). To: ${NOTIFICATION_RECIPIENTS.join(', ')}. MsgId: ${info.messageId || 'simulated'}\n`;
      fs.appendFileSync(path.join(logsDir, 'email_notifications.log'), logEntry, 'utf-8');
    } catch (logErr) {
      console.warn('Could not write email audit log:', logErr.message);
    }

    let previewUrl = null;
    try {
      previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 Ethereal Email Preview URL: ${previewUrl}`);
      }
    } catch {}

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
      recipients: NOTIFICATION_RECIPIENTS,
    };
  } catch (error) {
    console.error('❌ Failed to send reservation email notification:', error);
    // Write failure to audit log
    try {
      const logsDir = path.resolve(__dirname, '../logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      const logEntry = `[${new Date().toISOString()}] FAILED TO SEND: "${reservationDetails.bookTitle}" by ${reservationDetails.userName}. Error: ${error.message}\n`;
      fs.appendFileSync(path.join(logsDir, 'email_notifications.log'), logEntry, 'utf-8');
    } catch {}

    return {
      success: false,
      error: error.message,
      recipients: NOTIFICATION_RECIPIENTS,
    };
  }
}
