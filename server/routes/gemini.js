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

const STOP_WORDS = new Set([
  'туралы', 'жайлы', 'кітап', 'кітаптар', 'кітаптары', 'кітабы', 'көркем', 'оқу', 'оқығым',
  'келеді', 'келетін', 'қандай', 'бар', 'маған', 'маган', 'керек', 'бойынша', 'үшін', 'үшин',
  'арналған', 'арналган', 'мен', 'бен', 'пен', 'және', 'жане', 'немесе', 'тауып', 'бер', 'берші',
  'көрсет', 'көрсетші', 'жақсы', 'үздік', 'уздик', 'ең', 'ен', 'қызықты', 'кызыкты', 'қазақша',
  'орысша', 'ағылшынша', 'тілінде', 'тіліндегі', 'болсын', 'болса', 'туралысын', 'шығарма', 'шығармалар',
  'про', 'о', 'об', 'обо', 'книга', 'книги', 'книгу', 'книжек', 'книжка', 'книгах', 'книге',
  'посоветуй', 'порекомендуй', 'найди', 'хочу', 'почитать', 'какие', 'какой', 'какую', 'какие-нибудь',
  'есть', 'мне', 'для', 'прочитать', 'лучшие', 'хорошие', 'самые', 'что', 'как', 'где', 'или',
  'и', 'в', 'во', 'на', 'с', 'со', 'по', 'под', 'над', 'из', 'от', 'до', 'к', 'ко', 'у',
  'литература', 'произведение', 'роман', 'повесть', 'рассказ', 'сборник', 'том',
  'about', 'book', 'books', 'recommend', 'find', 'show', 'search', 'give', 'me', 'want',
  'to', 'read', 'reading', 'best', 'good', 'great', 'like', 'similar', 'the', 'a', 'an',
  'of', 'in', 'for', 'on', 'with', 'by', 'and', 'or', 'any', 'some', 'please', 'which'
]);

const CONCEPT_MAP = {
  space: {
    genre: 'Фантастика',
    keywords: ['космос', 'ғарыш', 'garysh', 'планет', 'жұлдыз', 'марсиан', 'галактик', 'space', 'universe', 'alien', 'astronomy', 'орбит', 'sci-fi', 'scifi', 'фантастик', 'азимов', 'брэдбери', 'жұлдызаралық', 'марс', 'күн жүйесі']
  },
  dystopia: {
    genre: 'Фантастика',
    keywords: ['антиутопи', 'фаренгейт', 'брэдбери', 'оруэлл', 'цензур', 'тиран', 'dystopia', 'тоталитар', '1984', 'хаксли', 'диктатура', 'болашақ', 'жасанды', 'замятин']
  },
  fantasy: {
    genre: 'Фэнтези',
    keywords: ['фэнтези', 'магия', 'сиқыр', 'сиқыршы', 'эльф', 'айдаһар', 'дракон', 'поттер', 'роулинг', 'толкин', 'хоббит', 'сақина', 'гарри', 'fantasy', 'wizard', 'dragon', 'witch', 'қиял-ғажайып', 'ертегі']
  },
  detective: {
    genre: 'Детектив',
    keywords: ['детектив', 'холмс', 'агата', 'кристи', 'пуаро', 'қылмыс', 'тергеу', 'sherlock', 'crime', 'mystery', 'расследован', 'убийств', 'тергеуші', 'тыңшы', 'загадк', 'следствие']
  },
  history: {
    genre: 'Тарих',
    keywords: ['тарих', 'абай', 'abay', 'мұхтар', 'жүсіп', 'казах', 'қазақ', 'хан', 'батыр', 'history', 'тарихи', 'алаш', 'әуезов', 'көшпенділер', 'есенберлин', 'мағжан', 'шәкәрім', 'соқпақбаев', 'көшпенді']
  },
  psychology: {
    genre: 'Психология',
    keywords: ['психолог', 'саморазвит', 'мотиваци', 'табыс', 'өмір', 'ақыл', 'mindset', 'habits', 'успех', 'даму', 'күш', 'мақсат', 'әдет', 'атомдық', 'клир', 'карнеги', 'франкл', 'лидер', 'өзін-өзі', 'байлық']
  },
  adventure: {
    genre: 'Приключение',
    keywords: ['приключен', 'саяхат', 'экспедици', 'робинзон', 'верн', 'дюма', 'adventure', 'остров', 'шытырман', 'теңіз', 'джунгли', 'қазына', 'сокровищ', 'treasure', 'саяхатшы']
  },
  romance: {
    genre: 'Романтика',
    keywords: ['романтик', 'махаббат', 'сезім', 'любов', 'сүйіспеншілік', 'love', 'drama', 'ғашық', 'остин', 'романтикалық', 'сезімдер', 'жүрек']
  },
  poetry: {
    genre: 'Поэзия',
    keywords: ['поэзи', 'стих', 'стихотворен', 'өлең', 'жыр', 'дастан', 'ақын', 'poetry', 'poem', 'verse', 'пушкин', 'лермонтов', 'мұқағали', 'мақатаев', 'қасым']
  },
  academic: {
    genre: 'Оқулықтар',
    keywords: ['ielts', 'sat', 'english', 'grammar', 'toefl', 'vocabulary', 'dictionary', 'ағылшын', 'оқулық', 'учебник', 'грамматика', 'reading', 'writing', 'speaking']
  },
  science: {
    genre: 'Ғылым',
    keywords: ['ғылым', 'физика', 'химия', 'биология', 'математика', 'science', 'physics', 'chemistry', 'biology', 'наука', 'энциклопедия', 'алгебра', 'геометрия']
  },
};

function stemWord(word) {
  let w = word.toLowerCase().trim();
  w = w.replace(/(ның|нің|дың|дің|тың|тің|ға|ге|қа|ке|да|де|та|те|тан|тен|нан|нен|дан|ден|пен|бен|мен|лар|лер|дар|дер|тар|тер|лық|лік|дық|дік|тық|тік|шылық|шілік|тану|дағы|дегі|ы|і|сы|сі|ін|ын|іне|ына)$/i, '');
  w = w.replace(/(ому|ему|ыми|ими|ого|его|ых|их|ая|яя|ое|ее|ые|ие|ой|ей|ям|ам|ами|ями|ах|ях|ом|ем|ов|ев|ей|у|ю|а|я|ы|и|е|о)$/i, '');
  return w;
}

function detectQueryLanguage(text) {
  const t = text.toLowerCase();
  if (/[әіңғүұқөһ]/i.test(t) || /(қазақ|ғарыш|туралы|кітап|қандай|маған|керек|бар)/i.test(t)) {
    return 'kk';
  }
  if (/[а-яё]/i.test(t)) {
    return 'ru';
  }
  return 'en';
}

router.get('/test', (req, res) => {
  res.json({
    message: 'Google Gemini AI route is operational!',
    timestamp: new Date().toISOString(),
    hasApiKey: !!geminiApiKey,
    model: 'gemini-2.5-flash',
  });
});

router.post('/search', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Поле "prompt" обязательно' });
  }

  const cleanPrompt = prompt.trim();
  const userLang = detectQueryLanguage(cleanPrompt);

  try {
    const rawTokens = cleanPrompt
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()«»"']/g, ' ')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2);

    const meaningfulTokens = rawTokens.filter((w) => !STOP_WORDS.has(w));
    const tokensToUse = meaningfulTokens.length > 0 ? meaningfulTokens : rawTokens;
    const stemmedTokens = tokensToUse.map((t) => (t.length > 4 ? stemWord(t) : t));

    const conceptKeywords = new Set([...tokensToUse, ...stemmedTokens]);
    let detectedGenre = null;

    for (const [, concept] of Object.entries(CONCEPT_MAP)) {
      const isMatched = tokensToUse.some((t) =>
        concept.keywords.some((kw) => kw === t || (t.length >= 4 && (kw.startsWith(t) || t.startsWith(kw))))
      );
      if (isMatched) {
        detectedGenre = concept.genre;
        concept.keywords.forEach((kw) => conceptKeywords.add(kw));
      }
    }

    const searchKeywords = Array.from(conceptKeywords);

    // MongoDB search
    let books = [];
    if (Book && Book.find) {
      const orConditions = searchKeywords.map((kw) => ({
        $or: [
          { title: { $regex: kw, $options: 'i' } },
          { author: { $regex: kw, $options: 'i' } },
          { description: { $regex: kw, $options: 'i' } },
          { genre: { $regex: kw, $options: 'i' } },
        ],
      }));

      if (orConditions.length > 0) {
        books = await Book.find({ $or: orConditions }).lean().limit(50);
      }
    }

    if (books.length === 0) {
      return res.json({
        books: [],
        query: cleanPrompt,
        keywords: searchKeywords,
        source: 'no-match',
        message: 'Книги по вашему запросу не найдены',
      });
    }

    // Score candidates
    const lowerPrompt = cleanPrompt.toLowerCase();
    const scoredCandidates = books.map((b) => {
      let score = 0;
      const title = (b.title || '').toLowerCase();
      const author = (b.author || '').toLowerCase();
      const desc = (b.description || '').toLowerCase();
      const genreStr = (Array.isArray(b.genre) ? b.genre.join(' ') : (b.genre || '')).toLowerCase();

      if (title === lowerPrompt || title.includes(lowerPrompt)) score += 100;
      for (const token of tokensToUse) {
        if (title.includes(token)) score += 30;
        if (author.includes(token)) score += 20;
        if (genreStr.includes(token)) score += 25;
        if (desc.includes(token)) score += 12;
      }
      for (const kw of searchKeywords) {
        if (title.includes(kw)) score += 12;
        if (genreStr.includes(kw)) score += 15;
        if (author.includes(kw)) score += 8;
        if (desc.includes(kw)) score += 6;
      }
      if (detectedGenre && genreStr.includes(detectedGenre.toLowerCase())) score += 15;

      return { ...b, candidateScore: score };
    });

    scoredCandidates.sort((a, b) => b.candidateScore - a.candidateScore);
    const topCandidates = scoredCandidates.slice(0, 20);

    let aiRerankedBooks = null;
    if (ai && topCandidates.length > 0) {
      try {
        const payload = topCandidates.map((c, idx) => ({
          id: idx + 1,
          title: c.title,
          author: c.author,
          genre: c.genre,
          desc: (c.description || '').slice(0, 150),
        }));

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `User query: "${cleanPrompt}"
Language: ${userLang}
Candidate books:
${JSON.stringify(payload)}

TASK:
Select books that genuinely match user intent. Output ONLY a JSON array:
[{"id": 1, "matchScore": 95, "aiReason": "1-sentence explanation why it matches in ${userLang === 'kk' ? 'Kazakh' : (userLang === 'ru' ? 'Russian' : 'English')}"}]`,
        });

        const rawText = response.text || '';
        const cleanedJson = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          aiRerankedBooks = [];
          for (const item of parsed) {
            const cand = topCandidates.find((c, idx) => (idx + 1) === Number(item.id));
            if (cand) {
              aiRerankedBooks.push({
                ...cand,
                matchScore: Number(item.matchScore || 85),
                aiReason: String(item.aiReason || ''),
              });
            }
          }
        }
      } catch (geminiErr) {
        console.warn('⚠️ Gemini reranking error:', geminiErr.message);
      }
    }

    let finalBooks = [];
    if (aiRerankedBooks && aiRerankedBooks.length > 0) {
      finalBooks = aiRerankedBooks;
    } else {
      finalBooks = topCandidates.slice(0, 15).map((c) => ({
        ...c,
        matchScore: Math.min(95, Math.max(60, Math.round(c.candidateScore))),
        aiReason: userLang === 'kk' ? `«${c.genre || 'Кітап'}» санаты бойынша` : `Совпадение по жанру: ${c.genre || 'Книга'}`,
      }));
    }

    return res.json({
      books: finalBooks,
      query: cleanPrompt,
      keywords: searchKeywords,
      source: aiRerankedBooks ? 'gemini-2.5-flash' : 'smart-multilingual-scoring',
    });
  } catch (error) {
    console.error('❌ Ошибка Gemini Router:', error.message);
    return res.status(500).json({ error: 'Внутренняя ошибка при поиске через Gemini' });
  }
});

export default router;
