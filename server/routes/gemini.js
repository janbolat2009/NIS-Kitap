import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { Book } from '../server.js';
import 'dotenv/config';

const router = express.Router();

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
let ai = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({ apiKey: geminiApiKey });
  console.log('✅ Google Gemini API initialized with @google/genai');
} else {
  console.warn('⚠️ GEMINI_API_KEY / GOOGLE_API_KEY not found in environment!');
}

router.get('/test', (req, res) => {
  res.json({
    message: 'Google Gemini AI route is operational!',
    timestamp: new Date().toISOString(),
    hasApiKey: !!geminiApiKey,
    model: 'gemini-2.5-flash',
  });
});

/**
 * POST /api/gemini/search
 * Умный поиск книг с использованием Google Gemini API
 */
router.post('/search', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Поле "prompt" обязательно' });
  }

  const cleanPrompt = prompt.trim();

  try {
    console.log('🔍 [Gemini Search] запрос:', cleanPrompt);

    // 1. Попытка использовать Gemini для извлечения смысловых категорий и ключевых понятий
    let aiExpandedKeywords = [];
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Ты интеллектуальный помощник школьной библиотеки NIS Kitap.
Пользователь ищет книгу по запросу: "${cleanPrompt}".
Извлеки из запроса 3-7 ключевых слов и тем для поиска (на русском, казахском и английском языках, включая возможные жанры: фантастика, фэнтези, детектив, приключения, биография, романтика, поэзия).
Ответь ТОЛЬКО списком слов через запятую без лишнего текста. Например: космос, ғарыш, space, планеты, фантастика, sci-fi`,
        });

        const textOutput = response.text || '';
        aiExpandedKeywords = textOutput
          .split(/[,;\n]+/)
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s.length > 2);
        console.log('✨ [Gemini AI] Расширенные ключевые слова:', aiExpandedKeywords);
      } catch (geminiErr) {
        console.warn('⚠️ Ошибка вызова Gemini API (продолжаем с эвристическим поиском):', geminiErr.message);
      }
    }

    // 2. Объединяем слова из запроса пользователя и слова от Gemini
    const userTokens = cleanPrompt
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()«»"']/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const allKeywords = Array.from(new Set([...userTokens, ...aiExpandedKeywords]));

    // 3. Поиск в MongoDB (если доступен)
    let books = [];
    try {
      if (Book && Book.find) {
        const orConditions = allKeywords.map((kw) => ({
          $or: [
            { title: { $regex: kw, $options: 'i' } },
            { author: { $regex: kw, $options: 'i' } },
            { description: { $regex: kw, $options: 'i' } },
            { genre: { $regex: kw, $options: 'i' } },
          ],
        }));

        if (orConditions.length > 0) {
          books = await Book.find({ $or: orConditions }).lean().limit(30);
        }
      }
    } catch (dbErr) {
      console.warn('⚠️ Ошибка MongoDB при поиске книг:', dbErr.message);
    }

    // 4. Ранжирование результатов по релевантности
    if (books.length > 0) {
      books = books
        .map((b) => {
          let score = 0;
          const title = (b.title || '').toLowerCase();
          const author = (b.author || '').toLowerCase();
          const desc = (b.description || '').toLowerCase();
          const genre = (Array.isArray(b.genre) ? b.genre.join(' ') : (b.genre || '')).toLowerCase();

          allKeywords.forEach((kw) => {
            if (title.includes(kw)) score += 10;
            if (genre.includes(kw)) score += 8;
            if (author.includes(kw)) score += 6;
            if (desc.includes(kw)) score += 3;
          });

          return { ...b, matchScore: score };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 15);
    }

    return res.json({
      books,
      query: cleanPrompt,
      keywords: allKeywords,
      source: 'gemini-2.5-flash',
    });
  } catch (error) {
    console.error('❌ Ошибка Gemini Router:', error.message);
    return res.status(500).json({ error: 'Внутренняя ошибка при поиске через Gemini' });
  }
});

export default router;
