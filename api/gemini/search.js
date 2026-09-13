import fs from 'fs';
import path from 'path';

// Books cache for serverless execution
let cachedBooks = null;

function loadBooks() {
  if (cachedBooks) return cachedBooks;
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
        console.log(`✅ Loaded ${cachedBooks.length} books from ${p}`);
        return cachedBooks;
      }
    }
  } catch (err) {
    console.warn('⚠️ Error reading local books.json:', err.message);
  }
  cachedBooks = [];
  return cachedBooks;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
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

  // Parse body
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

  let aiExpandedKeywords = [];

  // 1. Попытка запроса к Gemini AI
  if (apiKey) {
    try {
      // Direct REST call to Google Generative Language API (works universally in Node.js serverless)
      const systemInstruction = `You are the expert multilingual AI librarian for NIS Kitap (Nazarbayev Intellectual Schools digital library).
The user is searching for library books in English, Kazakh (Қазақша), Russian (Русский), or a mix of these languages.
User query: "${cleanPrompt}"

Task:
1. Deeply understand the user's intent, plot summary, concepts, themes, mood, and genre regardless of input language.
2. Generate comprehensive search terms, synonyms, and translations in ALL THREE LANGUAGES simultaneously (Kazakh, Russian, English).
3. Include Kazakh Cyrillic and Latin transliterations (e.g., ғарыш/garysh, Абай жолы/Abay zholy, шытырман/shytyrman).
4. Identify matching canonical genres (фантастика/sci-fi, фэнтези/fantasy, детектив/detective, приключения/adventure, биография/biography, романтика/romance, поэзия/poetry, психология/psychology, тарих/history, оқулық/academic).

Format output STRICTLY as a comma-separated list of keywords and tokens in lowercase, without markdown or commentary.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemInstruction }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 250,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        aiExpandedKeywords = textOutput
          .split(/[,;\n]+/)
          .map((s) => s.replace(/^[-*•]\s*/, '').trim().toLowerCase())
          .filter((s) => s.length >= 2);
        console.log('✨ [Vercel Gemini AI] Keywords:', aiExpandedKeywords);
      } else {
        // Fallback to gemini-1.5-flash if 2.5 is not available on key tier
        const fallbackRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemInstruction }] }],
            }),
          }
        );
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          aiExpandedKeywords = textOutput
            .split(/[,;\n]+/)
            .map((s) => s.replace(/^[-*•]\s*/, '').trim().toLowerCase())
            .filter((s) => s.length >= 2);
        }
      }
    } catch (apiErr) {
      console.warn('⚠️ Gemini API error in serverless handler:', apiErr.message);
    }
  }

  // 2. Multilingual Tokenization & Semantic Dictionaries
  const userTokens = cleanPrompt
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()«»"']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  const stemKazakh = (word) => {
    return word.replace(/(ның|нің|дың|дің|тың|тің|ға|ге|қа|ке|да|де|та|те|тан|тен|нан|нен|дан|ден|пен|бен|мен|лар|лер|дар|дер|тар|тер|лық|лік|дық|дік|тық|тік|ы|і|сы|сі)$/i, '');
  };

  const stemmedTokens = userTokens.map((t) => (t.length > 4 ? stemKazakh(t) : t));

  const conceptMap = {
    space: ['космос', 'ғарыш', 'garysh', 'планет', 'жұлдыз', 'марсиан', 'галактик', 'space', 'universe', 'alien', 'sci-fi', 'scifi', 'фантастик', 'азимов', 'брэдбери', 'жұлдызаралық'],
    dystopia: ['антиутопи', 'фаренгейт', 'брэдбери', 'оруэлл', 'цензур', 'тиран', 'dystopia', 'тоталитар', '1984', 'хаксли', 'диктатура', 'болашақ', 'жасанды'],
    fantasy: ['фэнтези', 'магия', 'сиқыр', 'сиқыршы', 'эльф', 'айдаһар', 'дракон', 'поттер', 'роулинг', 'толкин', 'хоббит', 'сақина', 'гарри', 'fantasy', 'wizard', 'dragon', 'witch', 'қиял-ғажайып'],
    detective: ['детектив', 'холмс', 'агата', 'кристи', 'пуаро', 'қылмыс', 'тергеу', 'sherlock', 'crime', 'mystery', 'расследован', 'убийств', 'тергеуші', 'тыңшы', 'загадк'],
    history: ['тарих', 'абай', 'abay', 'мұхтар', 'жүсіп', 'казах', 'қазақ', 'хан', 'батыр', 'history', 'тарихи', 'алаш', 'әуезов', 'көшпенділер', 'есенберлин', 'мағжан', 'шәкәрім', 'соқпақбаев'],
    psychology: ['психолог', 'саморазвит', 'мотиваци', 'табыс', 'өмір', 'ақыл', 'mindset', 'habits', 'успех', 'даму', 'күш', 'мақсат', 'әдет', 'атомдық', 'клир', 'карнеги', 'франкл', 'лидер'],
    adventure: ['приключен', 'саяхат', 'экспедици', 'робинзон', 'верн', 'дюма', 'adventure', 'остров', 'шытырман', 'теңіз', 'джунгли', 'қазына', 'сокровищ', 'treasure', 'саяхатшы'],
    romance: ['романтик', 'махаббат', 'сезім', 'любов', 'сүйіспеншілік', 'love', 'drama', 'ғашық', 'остин', 'романтикалық', 'сезімдер'],
    poetry: ['поэзи', 'стих', 'стихотворен', 'өлең', 'жыр', 'дастан', 'ақын', 'poetry', 'poem', 'verse', 'пушкин', 'лермонтов', 'мұқағали', 'мақатаев', 'қасым'],
    ielts: ['ielts', 'sat', 'english', 'grammar', 'toefl', 'vocabulary', 'dictionary', 'ағылшын', 'оқулық', 'учебник', 'грамматика', 'reading', 'writing', 'speaking'],
    science: ['ғылым', 'физика', 'химия', 'биология', 'математика', 'science', 'physics', 'chemistry', 'biology', 'наука', 'энциклопедия', 'алгебра'],
  };

  const expandedTokens = new Set([...userTokens, ...stemmedTokens, ...aiExpandedKeywords]);
  for (const [, synonyms] of Object.entries(conceptMap)) {
    const matchedConcept = userTokens.some((t) =>
      synonyms.some((syn) => syn.includes(t) || t.includes(syn) || syn.startsWith(t.slice(0, 3)))
    );
    if (matchedConcept) {
      synonyms.forEach((syn) => expandedTokens.add(syn));
    }
  }

  const allKeywords = Array.from(expandedTokens);
  const allBooks = loadBooks();

  // 3. High-Precision Relevance Scoring
  let scoredBooks = allBooks.map((b) => {
    let score = 0;
    const title = (b.title || '').toLowerCase();
    const author = (b.author || '').toLowerCase();
    const desc = (b.description || '').toLowerCase();
    const genre = (Array.isArray(b.genre) ? b.genre.join(' ') : (b.genre || '')).toLowerCase();
    const lang = (b.language || '').toLowerCase();

    // Exact title match bonus
    if (title === cleanPrompt.toLowerCase() || title.includes(cleanPrompt.toLowerCase())) {
      score += 30;
    }

    allKeywords.forEach((kw) => {
      if (title.includes(kw)) score += 15;
      if (genre.includes(kw)) score += 10;
      if (author.includes(kw)) score += 8;
      if (desc.includes(kw)) score += 4;
      if (lang.includes(kw)) score += 3;
    });

    return { ...b, matchScore: score };
  });

  let matched = scoredBooks
    .filter((b) => b.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20);

  if (matched.length === 0) {
    matched = allBooks.slice(0, 8);
  }

  return res.status(200).json({
    books: matched,
    query: cleanPrompt,
    keywords: allKeywords,
    source: apiKey ? 'gemini-2.5-flash' : 'trilingual-smart-matching',
  });
}
