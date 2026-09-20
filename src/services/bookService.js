import axios from 'axios';

let cachedBooks = null;
let loadPromise = null;

const API_BASE = '/api';

/**
 * Нормализация языка к каноническому виду в базе данных: 'Қазақ', 'Русский', 'English'
 */
export function normalizeLanguage(lang) {
  if (!lang) return '';
  const clean = String(lang).toLowerCase().trim();

  // Kazakh
  if (
    clean === 'kz' ||
    clean === 'kazakh' ||
    clean === 'казахский' ||
    clean === 'казах' ||
    clean === 'қазақ' ||
    clean === 'қазақша' ||
    clean.includes('қазақ') ||
    clean.includes('казах')
  ) {
    return 'Қазақ';
  }

  // English
  if (
    clean === 'en' ||
    clean === 'english' ||
    clean === 'английский' ||
    clean === 'англ' ||
    clean === 'ағылшын' ||
    clean.includes('english') ||
    clean.includes('англ') ||
    clean.includes('ағылшын')
  ) {
    return 'English';
  }

  // Russian
  if (
    clean === 'ru' ||
    clean === 'russian' ||
    clean === 'русский' ||
    clean === 'рус' ||
    clean === 'орыс' ||
    clean.includes('рус') ||
    clean.includes('орыс')
  ) {
    return 'Русский';
  }

  return lang;
}

/**
 * Проверка соответствия языка книги и выбранного фильтра
 */
export function matchLanguage(bookLang, targetLang) {
  if (!targetLang) return true;
  const normBook = normalizeLanguage(bookLang);
  const normTarget = normalizeLanguage(targetLang);

  if (normBook && normTarget) {
    return normBook === normTarget;
  }
  return String(bookLang || '').toLowerCase().includes(String(targetLang).toLowerCase());
}

export {
  CANONICAL_GENRE_MAP,
  matchGenre,
  getUniqueGenres,
  getGenreMeta,
} from '@/config/genres';

function mapBookRecord(b, idx) {
  return {
    _id: b._id || `local-${idx}`,
    title: b.title || 'Без названия',
    author: b.author || 'Не указан',
    genre: Array.isArray(b.genre) ? b.genre : (b.genre ? [b.genre] : ['Другое']),
    description: b.description || '',
    year: String(b.year || ''),
    copies: Number(b.copies ?? 1),
    language: b.language || 'Русский',
    cover_image: b.cover_image || '',
    status: b.status || 'available',
    isbn: b.isbn || '',
    visible: b.visible !== false,
  };
}

/**
 * Загрузка книг: сначала проверяется бэкенд, при недоступности — статический fallback из public/data/books.json
 */
export async function getBooks(forceReload = false, includeHidden = false) {
  if (cachedBooks && !forceReload) {
    return includeHidden ? cachedBooks : cachedBooks.filter((b) => b.visible !== false);
  }

  if (loadPromise && !forceReload) {
    const list = await loadPromise;
    return includeHidden ? list : list.filter((b) => b.visible !== false);
  }

  loadPromise = (async () => {
    try {
      // 1. Попытка загрузить с бэкенда
      const res = await axios.get(`${API_BASE}/books?all=true`, { timeout: 2500 });
      if (Array.isArray(res.data) && res.data.length > 0) {
        cachedBooks = res.data.map(mapBookRecord);
        return cachedBooks;
      }
    } catch {
      // Бэкенд недоступен — используем fallback
    }

    try {
      // 2. Fallback: загрузка локального JSON из public/data/books.json
      const baseUrl = import.meta.env?.BASE_URL || './';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

      const staticRes = await axios.get(`${cleanBase}data/books.json`, { timeout: 10000 });
      if (Array.isArray(staticRes.data)) {
        cachedBooks = staticRes.data.map(mapBookRecord);
        return cachedBooks;
      }
    } catch (staticErr) {
      try {
        const fallbackRes = await axios.get('/data/books.json', { timeout: 10000 });
        if (Array.isArray(fallbackRes.data)) {
          cachedBooks = fallbackRes.data.map(mapBookRecord);
          return cachedBooks;
        }
      } catch {
        // ignore
      }
    }

    cachedBooks = [];
    return cachedBooks;
  })();

  const list = await loadPromise;
  return includeHidden ? list : list.filter((b) => b.visible !== false);
}

/**
 * Полнотекстовый поиск по книгам
 */
export async function searchBooks(query) {
  const books = await getBooks();
  if (!query || !query.trim()) return books;

  const q = query.toLowerCase().trim();
  return books.filter((b) => {
    const titleMatch = (b.title || '').toLowerCase().includes(q);
    const authorMatch = (b.author || '').toLowerCase().includes(q);
    const genreMatch = Array.isArray(b.genre)
      ? b.genre.some((g) => g.toLowerCase().includes(q))
      : (b.genre || '').toLowerCase().includes(q);
    const descMatch = (b.description || '').toLowerCase().includes(q);
    return titleMatch || authorMatch || genreMatch || descMatch;
  });
}

/**
 * Фильтрация книг по жанру
 */
export async function getBooksByGenre(genreName) {
  const books = await getBooks();
  if (!genreName) return books;

  return books.filter((b) => matchGenre(b.genre, genreName));
}

/**
 * Фильтрация книг по языку (с нормализацией KZ / RU / EN)
 */
export async function getBooksByLanguage(lang) {
  const books = await getBooks();
  if (!lang) return books;

  return books.filter((b) => matchLanguage(b.language, lang));
}

/**
 * Получение книги по названию
 */
export async function getBookByTitle(title) {
  const books = await getBooks();
  if (!title) return null;
  const cleanTitle = decodeURIComponent(title).trim().toLowerCase();

  return (
    books.find((b) => (b.title || '').trim().toLowerCase() === cleanTitle) ||
    books.find((b) => (b.title || '').trim().toLowerCase().includes(cleanTitle)) ||
    null
  );
}

/**
 * Умный ИИ-поиск через Gemini API (с интеллектуальным клиенто-ориентированным fallback)
 */
export async function searchAi(prompt) {
  if (!prompt || !prompt.trim()) return [];
  const cleanPrompt = prompt.trim();

  // 1. Запрос к серверному Gemini эндпоинту
  const endpoints = [`${API_BASE}/gemini/search`, `${API_BASE}/ai/search`, `${API_BASE}/openai/search`];
  for (const ep of endpoints) {
    try {
      const res = await axios.post(
        ep,
        { prompt: cleanPrompt },
        { headers: { 'Content-Type': 'application/json' }, timeout: 12000 }
      );
      if (res.data && Array.isArray(res.data.books)) {
        return res.data.books;
      }
    } catch {
      // Переход к следующему эндпоинту или клиенто-ориентированному алгоритму
    }
  }

  // 2. Интеллектуальный клиентский матчинг (семантический скоринг для KZ, RU, EN)
  const books = await getBooks();
  if (!books || books.length === 0) return [];

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

  const rawTokens = cleanPrompt
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()«»"']/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);

  const meaningfulTokens = rawTokens.filter((w) => !STOP_WORDS.has(w));
  const tokensToUse = meaningfulTokens.length > 0 ? meaningfulTokens : rawTokens;

  const stemKazakh = (word) => {
    return word.replace(/(ның|нің|дың|дің|тың|тің|ға|ге|қа|ке|да|де|та|те|тан|тен|нан|нен|дан|ден|пен|бен|мен|лар|лер|дар|дер|тар|тер|лық|лік|дық|дік|тық|тік|ы|і|сы|сі)$/i, '');
  };

  const stemRussian = (word) => {
    return word.replace(/(ому|ему|ыми|ими|ого|его|ых|их|ая|яя|ое|ее|ые|ие|ой|ей|ям|ам|ами|ями|ах|ях|ом|ем|ов|ев|ей|у|ю|а|я|ы|и|е|о)$/i, '');
  };

  const stemmedTokens = tokensToUse.map((t) => {
    let s = t.length > 4 ? stemKazakh(t) : t;
    return s.length > 4 ? stemRussian(s) : s;
  });

  const conceptMap = {
    space: ['космос', 'ғарыш', 'garysh', 'планет', 'жұлдыз', 'марсиан', 'галактик', 'space', 'universe', 'alien', 'sci-fi', 'scifi', 'фантастик', 'азимов', 'брэдбери', 'жұлдызаралық', 'марс'],
    dystopia: ['антиутопи', 'фаренгейт', 'брэдбери', 'оруэлл', 'цензур', 'тиран', 'dystopia', 'тоталитар', '1984', 'хаксли', 'диктатура', 'болашақ', 'жасанды', 'замятин'],
    fantasy: ['фэнтези', 'магия', 'сиқыр', 'сиқыршы', 'эльф', 'айдаһар', 'дракон', 'поттер', 'роулинг', 'толкин', 'хоббит', 'сақина', 'гарри', 'fantasy', 'wizard', 'dragon', 'witch', 'қиял-ғажайып', 'хогвартс'],
    war: ['война', 'соғыс', 'военный', 'фронт', 'армия', 'память', 'победа', 'окоп', 'сражени', 'блокад', 'партизан', 'штрафбат', 'штурм', 'васильев', 'быков', 'бондарев', 'шолохов', 'судьба человека', 'они сражались за родину', 'горячий снег', 'а зори здесь тихие', 'батыр'],
    detective: ['детектив', 'холмс', 'агата', 'кристи', 'пуаро', 'қылмыс', 'тергеу', 'sherlock', 'crime', 'mystery', 'расследован', 'убийств', 'тергеуші', 'тыңшы', 'загадк'],
    history: ['тарих', 'абай', 'abay', 'мұхтар', 'жүсіп', 'казах', 'қазақ', 'хан', 'батыр', 'history', 'тарихи', 'алаш', 'әуезов', 'көшпенділер', 'есенберлин', 'мағжан', 'шәкәрім', 'соқпақбаев'],
    psychology: ['психолог', 'саморазвит', 'мотиваци', 'табыс', 'өмір', 'ақыл', 'mindset', 'habits', 'успех', 'даму', 'күш', 'мақсат', 'әдет', 'атомдық', 'клир', 'карнеги', 'франкл', 'лидер', 'өзін-өзі', 'байлық', 'бизнес', 'предпринимательств', 'финансы', 'деньги', 'инвестици', 'менеджмент'],
    adventure: ['приключен', 'саяхат', 'экспедици', 'робинзон', 'верн', 'дюма', 'adventure', 'остров', 'шытырман', 'теңіз', 'джунгли', 'қазына', 'сокровищ', 'treasure', 'саяхатшы'],
    romance: ['романтик', 'махаббат', 'сезім', 'любов', 'сүйіспеншілік', 'love', 'drama', 'ғашық', 'остин', 'романтикалық', 'сезімдер'],
    poetry: ['поэзи', 'стих', 'стихотворен', 'өлең', 'жыр', 'дастан', 'ақын', 'poetry', 'poem', 'verse', 'пушкин', 'лермонтов', 'мұқағали', 'мақатаев', 'қасым'],
    children: ['детск', 'балалар', 'сказк', 'ертегі', 'школ', 'мектеп', 'денис', 'носов', 'драгунский', 'линдгрен', 'крапивин', 'барто', 'чуковский', 'малыш', 'карлсон'],
    classics: ['классик', 'толстой', 'достоевский', 'чехов', 'пушкин', 'лермонтов', 'тургенев', 'гоголь', 'булгаков', 'бунин', 'куприн', 'набоков', 'шекспир', 'диккенс'],
    ielts: ['ielts', 'sat', 'english', 'grammar', 'toefl', 'vocabulary', 'dictionary', 'ағылшын', 'оқулық', 'учебник', 'грамматика', 'reading', 'writing', 'speaking'],
    science: ['ғылым', 'физика', 'химия', 'биология', 'математика', 'science', 'physics', 'chemistry', 'biology', 'наука', 'энциклопедия', 'алгебра'],
  };

  const expandedTokens = new Set([...tokensToUse, ...stemmedTokens]);
  for (const [, synonyms] of Object.entries(conceptMap)) {
    const matchedConcept = tokensToUse.some((t) =>
      synonyms.some((syn) => syn.includes(t) || t.includes(syn) || syn.startsWith(t.slice(0, 3)))
    );
    if (matchedConcept) {
      synonyms.forEach((syn) => expandedTokens.add(syn));
    }
  }

  const tokenList = Array.from(expandedTokens);
  const lowerPrompt = cleanPrompt.toLowerCase();

  // Явный язык запроса
  let explicitLang = '';
  if (lowerPrompt.includes('на английском') || lowerPrompt.includes('english') || lowerPrompt.includes('ағылшын')) {
    explicitLang = 'English';
  } else if (lowerPrompt.includes('на русском') || lowerPrompt.includes('русская литература') || lowerPrompt.includes('орысша')) {
    explicitLang = 'Русский';
  } else if (lowerPrompt.includes('қазақша') || lowerPrompt.includes('қазақ тілінде') || lowerPrompt.includes('на казахском')) {
    explicitLang = 'Қазақ';
  }

  const isKzQuery = /[әіңғүұқөһ]/i.test(lowerPrompt) || /(қазақ|туралы|кітап|маған|керек)/i.test(lowerPrompt);
  const isEnQuery = /^[a-z0-9\s.,!?'"-]+$/i.test(cleanPrompt) && !/[а-яё]/i.test(cleanPrompt);

  const scored = books.map((b) => {
    let score = 0;
    const title = (b.title || '').toLowerCase();
    const author = (b.author || '').toLowerCase();
    const desc = (b.description || '').toLowerCase();
    const genre = (Array.isArray(b.genre) ? b.genre.join(' ') : (b.genre || '')).toLowerCase();
    const lang = (b.language || '');

    if (title === lowerPrompt || title.includes(lowerPrompt)) score += 100;

    // Явный языковой приоритет
    if (explicitLang && lang === explicitLang) {
      score += 40;
    }

    for (const t of tokensToUse) {
      if (title.includes(t)) score += 30;
      if (genre.includes(t)) score += 25;
      if (author.includes(t)) score += 20;
      if (desc.includes(t)) score += 12;
    }

    for (const token of tokenList) {
      if (title.includes(token)) score += 12;
      if (genre.includes(token)) score += 15;
      if (author.includes(token)) score += 8;
      if (desc.includes(token)) score += 6;
      if (lang.toLowerCase().includes(token)) score += 5;
    }

    let aiReason = '';
    const bookGenre = Array.isArray(b.genre) ? b.genre[0] : (b.genre || 'Книга');
    if (isKzQuery) {
      aiReason = `«${bookGenre}» санаты және тақырып бойынша сәйкестік`;
    } else if (isEnQuery) {
      aiReason = `Matches your search query in «${bookGenre}» category`;
    } else {
      aiReason = `Соответствует вашему запросу в жанре «${bookGenre}»`;
    }

    return { ...b, matchScore: Math.min(98, Math.max(65, Math.round(score))), aiReason, _rawScore: score };
  });

  const matched = scored
    .filter((b) => b._rawScore > 0)
    .sort((a, b) => b._rawScore - a._rawScore);

  if (matched.length > 0) {
    return matched.slice(0, 20);
  }

  // Если ничего не найдено — возвращаем пустой список (без случайных заглушек!)
  return [];
}

/**
 * Работа с бронированием в localStorage
 */
const RESERVATIONS_KEY = 'nis_kitap_user_reservations';

export function getUserReservations() {
  try {
    const raw = localStorage.getItem(RESERVATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function reserveBook(book, returnDateStr = null) {
  const current = getUserReservations();
  const exists = current.find((r) => r.title === book.title);
  if (exists) {
    return { success: false, message: 'Эта книга уже забронирована вами!' };
  }

  const dueDate = returnDateStr
    ? new Date(returnDateStr)
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const newReservation = {
    id: 'res_' + Date.now(),
    title: book.title,
    author: book.author,
    genre: Array.isArray(book.genre) ? book.genre.join(', ') : book.genre,
    year: book.year,
    reservedAt: new Date().toISOString(),
    dueDate: dueDate.toISOString(),
    status: 'active',
  };

  current.unshift(newReservation);
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(current));
  return { success: true, reservation: newReservation };
}

export function cancelReservation(id) {
  const current = getUserReservations();
  const filtered = current.filter((r) => r.id !== id);
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(filtered));
  return true;
}

export function isBookReserved(title) {
  const current = getUserReservations();
  return current.some((r) => r.title === title && r.status === 'active');
}
