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

    // 1. Попытка использовать Gemini для извлечения смысловых категорий и ключевых понятий на 3-х языках (KZ, RU, EN)
    let aiExpandedKeywords = [];
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are the expert multilingual AI librarian for NIS Kitap (Nazarbayev Intellectual Schools digital library).
The user is searching for library books in English, Kazakh (Қазақша), Russian (Русский), or a mix of these languages.
User query: "${cleanPrompt}"

Task:
1. Deeply understand the user's intent, plot summary, concepts, themes, mood, and genre regardless of input language.
2. Generate comprehensive search terms, synonyms, and translations in ALL THREE LANGUAGES simultaneously (Kazakh, Russian, English).
3. Include Kazakh Cyrillic and Latin transliterations (e.g., ғарыш/garysh, Абай жолы/Abay zholy, шытырман/shytyrman).
4. Identify matching canonical genres:
   - Фантастика / Sci-Fi / Ғылыми фантастика
   - Фэнтези / Fantasy / Қиял-ғажайып
   - Детектив / Detective / Қылмыстық / Тергеу
   - Приключения / Adventure / Шытырман оқиғалар / Саяхат
   - Биография / Biography / Өмірбаян / Тұлғалар
   - Романтика / Romance / Махаббат / Сезім
   - Поэзия / Poetry / Өлең / Жыр
   - Психология / Psychology / Тұлғалық даму / Саморазвитие
   - Тарих / History / Исторические романы
   - Оқулықтар / Academic / IELTS / SAT / English Learning

Format output STRICTLY as a comma-separated list of keywords and tokens in lowercase, without markdown or commentary.
Example:
космос, ғарыш, space, galaxy, планеты, фантастика, sci-fi, ғылыми фантастика, жұлдыздар, universe, азимов, брэдбери`,
        });

        const textOutput = response.text || '';
        aiExpandedKeywords = textOutput
          .split(/[,;\n]+/)
          .map((s) => s.replace(/^[-*•]\s*/, '').trim().toLowerCase())
          .filter((s) => s.length >= 2);
        console.log('✨ [Gemini Multilingual AI] Расширенные ключевые слова (KZ/RU/EN):', aiExpandedKeywords);
      } catch (geminiErr) {
        console.warn('⚠️ Ошибка вызова Gemini API (продолжаем с эвристическим поиском):', geminiErr.message);
      }
    }

    // 2. Объединяем слова из запроса пользователя и слова от Gemini
    const userTokens = cleanPrompt
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()«»"']/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2);

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
          books = await Book.find({ $or: orConditions }).lean().limit(40);
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
            if (title.includes(kw)) score += 15;
            if (genre.includes(kw)) score += 10;
            if (author.includes(kw)) score += 8;
            if (desc.includes(kw)) score += 4;
          });

          return { ...b, matchScore: score };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 20);
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
