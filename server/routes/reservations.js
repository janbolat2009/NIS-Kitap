import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Reservation from '../models/Reservation.js';
import { sendReservationNotification, NOTIFICATION_RECIPIENTS } from '../services/emailService.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to look up book in existing database / books.json if needed
let localBooksCache = null;
function getBookFromLocalDatabase(title) {
  if (!title) return null;
  const cleanTitle = title.trim().toLowerCase();

  if (!localBooksCache) {
    const candidates = [
      path.resolve(__dirname, '../data/books.json'),
      path.resolve(__dirname, '../../public/data/books.json'),
      path.resolve(__dirname, '../../data/books.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          localBooksCache = JSON.parse(fs.readFileSync(p, 'utf-8'));
          break;
        } catch {}
      }
    }
  }

  if (Array.isArray(localBooksCache)) {
    return localBooksCache.find(
      (b) => (b.title || '').trim().toLowerCase() === cleanTitle
    ) || null;
  }
  return null;
}

/**
 * POST /api/reservations
 * Creates a book reservation, stores it in the database, and automatically sends
 * email notification to both librarian (muldasheva_v@ast.nis.edu.kz) and Zhanbolat (janbolatique.kz@gmail.com).
 */
router.post('/', async (req, res) => {
  try {
    const { book, user, dueDate, reservationId } = req.body;

    if (!book || !book.title) {
      return res.status(400).json({ error: 'Book details (title) are required' });
    }

    if (!user || !user.email) {
      return res.status(400).json({ error: 'User details (name and email) are required' });
    }

    // 1. Look up existing database record to get complete authoritative metadata (ISBN, etc.)
    let dbBook = null;
    if (mongoose.connection.readyState === 1) {
      try {
        const BookModel = mongoose.models.Book;
        if (BookModel) {
          dbBook = await BookModel.findOne({
            title: { $regex: new RegExp(`^${book.title.trim()}$`, 'i') },
          }).lean();
        }
      } catch (dbErr) {
        console.warn('MongoDB book lookup error:', dbErr.message);
      }
    }

    if (!dbBook) {
      dbBook = getBookFromLocalDatabase(book.title);
    }

    // Consolidate book data using existing database data
    const finalBook = {
      title: dbBook?.title || book.title,
      author: dbBook?.author || book.author || 'Не указан',
      genre: Array.isArray(dbBook?.genre)
        ? dbBook.genre.join(', ')
        : (dbBook?.genre || (Array.isArray(book.genre) ? book.genre.join(', ') : book.genre) || 'Не указан'),
      isbn: dbBook?.isbn || book.isbn || '',
      language: dbBook?.language || book.language || 'Русский',
      year: String(dbBook?.year || book.year || ''),
      copies: Number(dbBook?.copies ?? book.copies ?? 1),
      description: dbBook?.description || book.description || '',
    };

    const finalUser = {
      name: user.name || user.email.split('@')[0],
      email: user.email.trim(),
      id: user.uid || user.id || '',
    };

    const resId = reservationId || `res_${Date.now()}`;
    const reservedAt = new Date();
    const returnDate = dueDate
      ? new Date(dueDate)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // 2. Automatically send email notification to both librarian & Zhanbolat
    const emailPayload = {
      bookTitle: finalBook.title,
      author: finalBook.author,
      genre: finalBook.genre,
      isbn: finalBook.isbn,
      language: finalBook.language,
      year: finalBook.year,
      copies: finalBook.copies,
      description: finalBook.description,
      userName: finalUser.name,
      userEmail: finalUser.email,
      userId: finalUser.id,
      reservedAt: reservedAt.toISOString(),
      dueDate: returnDate.toISOString(),
      reservationId: resId,
    };

    const emailResult = await sendReservationNotification(emailPayload);

    // 3. Save reservation to MongoDB if connected
    let savedReservation = null;
    if (mongoose.connection.readyState === 1) {
      try {
        savedReservation = await Reservation.create({
          reservationId: resId,
          bookId: dbBook?._id ? String(dbBook._id) : undefined,
          title: finalBook.title,
          author: finalBook.author,
          genre: finalBook.genre,
          isbn: finalBook.isbn,
          language: finalBook.language,
          year: finalBook.year,
          copies: finalBook.copies,
          userName: finalUser.name,
          userEmail: finalUser.email,
          userId: finalUser.id,
          reservedAt,
          dueDate: returnDate,
          status: 'active',
          emailSent: emailResult.success,
          notifiedRecipients: NOTIFICATION_RECIPIENTS,
          emailError: emailResult.error || null,
        });
      } catch (saveErr) {
        console.warn('⚠️ Could not save reservation to MongoDB:', saveErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Reservation created successfully and email notifications sent',
      reservation: {
        id: resId,
        title: finalBook.title,
        author: finalBook.author,
        genre: finalBook.genre,
        isbn: finalBook.isbn,
        language: finalBook.language,
        year: finalBook.year,
        copies: finalBook.copies,
        userName: finalUser.name,
        userEmail: finalUser.email,
        reservedAt: reservedAt.toISOString(),
        dueDate: returnDate.toISOString(),
        status: 'active',
      },
      emailNotification: {
        sent: emailResult.success,
        recipients: NOTIFICATION_RECIPIENTS,
        previewUrl: emailResult.previewUrl || null,
        messageId: emailResult.messageId || null,
      },
    });
  } catch (error) {
    console.error('❌ Reservation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while processing reservation',
      details: error.message,
    });
  }
});

/**
 * GET /api/reservations/user/:email
 * Retrieves reservations for a specific user
 */
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) return res.status(400).json({ error: 'Email parameter required' });

    if (mongoose.connection.readyState === 1) {
      const list = await Reservation.find({ userEmail: email.toLowerCase().trim() })
        .sort({ reservedAt: -1 })
        .lean();
      return res.json(list);
    }

    return res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/reservations/:id
 * Cancels a reservation
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      await Reservation.findOneAndUpdate(
        { reservationId: id },
        { status: 'cancelled' }
      );
    }
    return res.json({ success: true, message: 'Reservation cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
