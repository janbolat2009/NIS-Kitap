import fs from 'fs';
import path from 'path';

// Stopwords in Kazakh, Russian, and English that distort book search relevance
const STOP_WORDS = new Set([
  // Kazakh
  'туралы', 'жайлы', 'кітап', 'кітаптар', 'кітаптары', 'кітабы', 'көркем', 'оқу', 'оқығым',
  'келеді', 'келетін', 'қандай', 'бар', 'маған', 'маган', 'керек', 'бойынша', 'үшін', 'үшин',
  'арналған', 'арналган', 'мен', 'бен', 'пен', 'және', 'жане', 'немесе', 'тауып', 'бер', 'берші',
  'көрсет', 'көрсетші', 'жақсы', 'үздік', 'уздик', 'ең', 'ен', 'қызықты', 'кызыкты', 'қазақша',
  'орысша', 'ағылшынша', 'тілінде', 'тіліндегі', 'болсын', 'болса', 'туралысын', 'шығарма', 'шығармалар',
  // Russian
  'про', 'о', 'об', 'обо', 'книга', 'книги', 'книгу', 'книжек', 'книжка', 'книгах', 'книге',
  'посоветуй', 'порекомендуй', 'найди', 'хочу', 'почитать', 'какие', 'какой', 'какую', 'какие-нибудь',
  'есть', 'мне', 'для', 'прочитать', 'лучшие', 'хорошие', 'самые', 'что', 'как', 'где', 'или',
  'и', 'в', 'во', 'на', 'с', 'со', 'по', 'под', 'над', 'из', 'от', 'до', 'к', 'ко', 'у',
  'литература', 'произведение', 'роман', 'повесть', 'рассказ', 'сборник', 'том',
  // English
  'about', 'book', 'books', 'recommend', 'find', 'show', 'search', 'give', 'me', 'want',
  'to', 'read', 'reading', 'best', 'good', 'great', 'like', 'similar', 'the', 'a', 'an',
  'of', 'in', 'for', 'on', 'with', 'by', 'and', 'or', 'any', 'some', 'please', 'which'
]);

// Multilingual concept dictionary mapping semantic clusters across KZ, RU, EN
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
    keywords: ['фэнтези', 'магия', 'сиқыр', 'сиқыршы', 'эльф', 'айдаһар', 'дракон', 'поттер', 'роулинг', 'толкин', 'хоббит', 'сақина', 'гарри', 'fantasy', 'wizard', 'dragon', 'witch', 'қиял-ғажайып', 'ертегі', 'хогвартс']
  },
  war: {
    genre: 'Классика',
    keywords: ['война', 'соғыс', 'военный', 'фронт', 'армия', 'память', 'победа', 'окоп', 'сражени', 'блокад', 'партизан', 'штрафбат', 'штурм', 'васильев', 'быков', 'бондарев', 'шолохов', 'судьба человека', 'они сражались за родину', 'горячий снег', 'а зори здесь тихие', 'батыр']
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
    genre: 'Саморазвитие',
    keywords: ['психолог', 'саморазвит', 'мотиваци', 'табыс', 'өмір', 'ақыл', 'mindset', 'habits', 'успех', 'даму', 'күш', 'мақсат', 'әдет', 'атомдық', 'клир', 'карнеги', 'франкл', 'лидер', 'өзін-өзі', 'байлық', 'бизнес', 'предпринимательств', 'финансы', 'деньги', 'инвестици', 'менеджмент']
  },
  adventure: {
    genre: 'Приключения',
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
  children: {
    genre: 'Детская литература',
    keywords: ['детск', 'балалар', 'сказк', 'ертегі', 'школ', 'мектеп', 'денис', 'носов', 'драгунский', 'линдгрен', 'крапивин', 'барто', 'чуковский', 'малыш', 'карлсон']
  },
  classics: {
    genre: 'Классика',
    keywords: ['классик', 'толстой', 'достоевский', 'чехов', 'пушкин', 'лермонтов', 'тургенев', 'гоголь', 'булгаков', 'бунин', 'куприн', 'набоков', 'шекспир', 'диккенс']
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

// Books cache for serverless execution
let cachedBooks = null;

function loadBooks() {
  if (cachedBooks && cachedBooks.length > 0) return cachedBooks;
  try {
    const candidates = [
      path.join(process.cwd(), 'public', 'data', 'books.json'),
      path.join(process.cwd(), 'data', 'books.json'),
      path.join(process.cwd(), 'server', 'data', 'books.json'),
      path.join(process.cwd(), 'dist', 'data', 'books.json'),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        cachedBooks = JSON.parse(raw);
        if (Array.isArray(cachedBooks)) {
          cachedBooks = cachedBooks.filter((b) => b.visible !== false);
        }
        return cachedBooks;
      }
    }
  } catch (err) {
    console.warn('⚠️ Error reading books.json:', err.message);
  }
  cachedBooks = [];
  return cachedBooks;
}

// Kazakh & Russian suffix trimming for high-recall root matching
function stemWord(word) {
  let w = word.toLowerCase().trim();
  w = w.replace(/(ның|нің|дың|дің|тың|тің|ға|ге|қа|ке|да|де|та|те|тан|тен|нан|нен|дан|ден|пен|бен|мен|лар|лер|дар|дер|тар|тер|лық|лік|дық|дік|тық|тік|шылық|шілік|тану|дағы|дегі|ы|і|сы|сі|ін|ын|іне|ына)$/i, '');
  w = w.replace(/(ому|ему|ыми|ими|ого|его|ых|их|ая|яя|ое|ее|ые|ие|ой|ей|ям|ам|ами|ями|ах|ях|ом|ем|ов|ев|ей|у|ю|а|я|ы|и|е|о)$/i, '');
  return w;
}

// Detect language of user query
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

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;
    return res.status(200).json({
      status: 'OK',
      message: 'NIS Kitap Gemini Multilingual AI Search Serverless Endpoint',
      hasApiKey: !!apiKey,
      model: 'gemini-2.5-flash',
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Parse request body
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const prompt = body?.prompt || body?.query || '';
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Поле "prompt" обязательно' });
  }

  const cleanPrompt = prompt.trim();
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const userLang = detectQueryLanguage(cleanPrompt);

  // 1. Multilingual Tokenization with strict stopword stripping
  const rawTokens = cleanPrompt
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()«»"']/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);

  // Filter out stop words (eliminates false positives like "туралы", "книги", "about")
  const meaningfulTokens = rawTokens.filter((w) => !STOP_WORDS.has(w));
  const tokensToUse = meaningfulTokens.length > 0 ? meaningfulTokens : rawTokens;

  // Stems
  const stemmedTokens = tokensToUse.map((t) => (t.length > 4 ? stemWord(t) : t));

  // Expanded concept keywords
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
  const allBooks = loadBooks();

  if (!allBooks || allBooks.length === 0) {
    return res.status(200).json({ books: [], query: cleanPrompt, message: 'Каталог пуст' });
  }

  // 2. High-Recall Candidate Retrieval & Pre-Scoring
  const candidates = [];
  const lowerPrompt = cleanPrompt.toLowerCase();

  // Detect explicit language in user query
  let explicitLang = '';
  if (lowerPrompt.includes('на английском') || lowerPrompt.includes('english') || lowerPrompt.includes('ағылшын')) {
    explicitLang = 'English';
  } else if (lowerPrompt.includes('на русском') || lowerPrompt.includes('русская литература') || lowerPrompt.includes('орысша')) {
    explicitLang = 'Русский';
  } else if (lowerPrompt.includes('қазақша') || lowerPrompt.includes('қазақ тілінде') || lowerPrompt.includes('на казахском')) {
    explicitLang = 'Қазақ';
  }

  for (let i = 0; i < allBooks.length; i++) {
    const b = allBooks[i];
    let score = 0;
    const title = (b.title || '').toLowerCase();
    const author = (b.author || '').toLowerCase();
    const desc = (b.description || '').toLowerCase();
    const genreStr = (Array.isArray(b.genre) ? b.genre.join(' ') : (b.genre || '')).toLowerCase();
    const lang = (b.language || '');

    // Exact title match gets huge priority
    if (title === lowerPrompt || title.includes(lowerPrompt)) {
      score += 100;
    }

    // Explicit language priority
    if (explicitLang && lang === explicitLang) {
      score += 40;
    }

    // Meaningful token matches
    for (const token of tokensToUse) {
      if (title.includes(token)) score += 30;
      if (author.includes(token)) score += 20;
      if (genreStr.includes(token)) score += 25;
      if (desc.includes(token)) score += 12;
    }

    // Concept & stem matches
    for (const kw of searchKeywords) {
      if (title.includes(kw)) score += 12;
      if (genreStr.includes(kw)) score += 15;
      if (author.includes(kw)) score += 8;
      if (desc.includes(kw)) score += 6;
      if (lang.toLowerCase().includes(kw)) score += 5;
    }

    // Genre alignment boost
    if (detectedGenre && genreStr.includes(detectedGenre.toLowerCase())) {
      score += 15;
    }

    if (score > 0) {
      candidates.push({ book: b, candidateScore: score, originalIndex: i });
    }
  }

  // Sort candidates by pre-score
  candidates.sort((a, b) => b.candidateScore - a.candidateScore);

  // If no candidates matched at all, return empty (NEVER return a fake dummy stub!)
  if (candidates.length === 0) {
    return res.status(200).json({
      books: [],
      query: cleanPrompt,
      keywords: searchKeywords,
      source: 'no-match',
      message: 'Книги по данному запросу не найдены'
    });
  }

  // Take top 25 candidate books for Gemini AI reranking
  const topCandidates = candidates.slice(0, 25);

  // 3. Gemini AI Semantic Reranking & Personalized Insight
  let aiRerankedBooks = null;
  let activeModel = 'gemini-2.0-flash';

  if (apiKey && topCandidates.length > 0) {
    try {
      const candidatesPayload = topCandidates.map((c, idx) => ({
        id: idx + 1,
        title: c.book.title,
        author: c.book.author,
        genre: c.book.genre,
        language: c.book.language,
        desc: (c.book.description || '').slice(0, 150),
      }));

      const langInstruction = userLang === 'kk'
        ? 'Қазақ тілінде түсініктеме жаз (reason).'
        : (userLang === 'ru' ? 'Напиши краткое пояснение на русском языке (reason).' : 'Write explanation in English (reason).');

      const systemPrompt = `You are the expert multilingual AI Librarian for NIS Kitap (Nazarbayev Intellectual Schools digital library).
User query: "${cleanPrompt}"
User language: ${userLang} (${langInstruction})

Here is the candidate list of books from our school catalog:
${JSON.stringify(candidatesPayload)}

TASK:
1. Understand user's genuine intent, plot, topic, mood, and genre.
2. Select ONLY books that genuinely match this user's query (up to 12 books). Do NOT select books that only happen to share irrelevant words.
3. For each matching book, assign:
   - "id": number from candidate list
   - "relevance": float between 0.70 and 0.99 reflecting relevance
   - "reason": a short 1-sentence explanation of why this book matches the query in ${userLang === 'kk' ? 'Kazakh' : (userLang === 'ru' ? 'Russian' : 'English')}.
4. Return response STRICTLY as a valid JSON object:
{
  "results": [
    { "id": 1, "relevance": 0.96, "reason": "..." }
  ]
}`;

      const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'];
      let response = null;

      for (const m of models) {
        try {
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 800,
                },
              }),
            }
          );
          if (response.ok) {
            activeModel = m;
            break;
          }
        } catch {
          // try next model
        }
      }

      if (response && response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanedJson = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);

        const items = Array.isArray(parsed) ? parsed : (parsed?.results && Array.isArray(parsed.results) ? parsed.results : []);

        if (items.length > 0) {
          aiRerankedBooks = [];
          for (const item of items) {
            const cand = topCandidates.find((c, idx) => (idx + 1) === Number(item.id));
            if (cand) {
              const matchScore = item.relevance
                ? Math.round(Number(item.relevance) * 100)
                : Number(item.matchScore || 85);
              const reason = String(item.reason || item.aiReason || '');
              aiRerankedBooks.push({
                ...cand.book,
                matchScore,
                aiReason: reason,
              });
            }
          }
        }
      }
    } catch (geminiErr) {
      console.warn('⚠️ Gemini AI reranking error:', geminiErr.message);
    }
  }

  // 4. Final selection: if Gemini reranked, use it; otherwise, use high-precision pre-scored candidates
  let finalBooks = [];
  let source = activeModel;

  if (aiRerankedBooks && aiRerankedBooks.length > 0) {
    finalBooks = aiRerankedBooks;
  } else {
    source = 'smart-multilingual-scoring';
    finalBooks = topCandidates.slice(0, 15).map((c) => {
      let defaultReason = '';
      if (userLang === 'kk') {
        defaultReason = `«${c.book.genre || 'Кітап'}» санаты және сұраныс бойынша сәйкестік`;
      } else if (userLang === 'en') {
        defaultReason = `Matching genre «${c.book.genre || 'Book'}»`;
      } else {
        defaultReason = `Совпадение по жанру «${c.book.genre || 'Книга'}»`;
      }
      return {
        ...c.book,
        matchScore: Math.min(95, Math.max(60, Math.round(c.candidateScore))),
        aiReason: defaultReason,
      };
    });
  }

  return res.status(200).json({
    books: finalBooks,
    query: cleanPrompt,
    keywords: searchKeywords,
    source,
  });
}
