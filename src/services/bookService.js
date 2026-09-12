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

/**
 * Нормализация жанра с учетом форм единственного/множественного числа и трех языков
 */
export function matchGenre(bookGenres, targetGenre) {
  if (!targetGenre) return true;
  const target = String(targetGenre).toLowerCase().trim();

  const genreKeywords = {
    adventure: ['приключен', 'adventure', 'шытырман', 'саяхат'],
    fantastica: ['фантастик', 'sci-fi', 'scifi', 'ғылыми фантастика'],
    fantasy: ['фэнтези', 'fantasy', 'қиял-ғажайып'],
    detective: ['детектив', 'detective', 'тыңшы'],
    biography: ['биограф', 'biograph', 'өмірбаян'],
    romantica: ['романтик', 'romanc', 'махаббат', 'сүйіспеншілік'],
    poetry: ['поэзи', 'стих', 'poet', 'poem', 'өлең', 'жыр'],
  };

  // Определение канонической группы для targetGenre
  let matchedGroup = null;
  for (const [group, patterns] of Object.entries(genreKeywords)) {
    if (patterns.some((p) => target.includes(p) || p.includes(target))) {
      matchedGroup = group;
      break;
    }
  }

  const list = Array.isArray(bookGenres) ? bookGenres : [bookGenres || ''];

  return list.some((bg) => {
    const b = String(bg).toLowerCase().trim();
    if (matchedGroup) {
      const patterns = genreKeywords[matchedGroup];
      if (patterns.some((p) => b.includes(p) || p.includes(b))) {
        return true;
      }
    }
    // Fallback: подстрока или совпадение основы слова
    const stem = target.length > 5 ? target.slice(0, 5) : target;
    return b.includes(target) || target.includes(b) || b.startsWith(stem);
  });
}

/**
 * Загрузка книг: сначала проверяется бэкенд, при недоступности — статический fallback из public/data/books.json
 */
export async function getBooks(forceReload = false) {
  if (cachedBooks && !forceReload) {
    return cachedBooks;
  }

  if (loadPromise && !forceReload) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      // 1. Попытка загрузить с бэкенда
      const res = await axios.get(`${API_BASE}/books`, { timeout: 2500 });
      if (Array.isArray(res.data) && res.data.length > 0) {
        cachedBooks = res.data;
        return cachedBooks;
      }
    } catch {
      // Бэкенд недоступен — используем fallback
    }

    try {
      // 2. Fallback: загрузка локального JSON из public/data/books.json
      const baseUrl = import.meta.env.BASE_URL || './';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const staticRes = await axios.get(`${cleanBase}data/books.json`, { timeout: 10000 });
      if (Array.isArray(staticRes.data)) {
        cachedBooks = staticRes.data.map((b, idx) => ({
          _id: b._id || `local-${idx}`,
          title: b.title || 'Без названия',
          author: b.author || 'Не указан',
          genre: Array.isArray(b.genre) ? b.genre : (b.genre ? [b.genre] : ['Другое']),
          description: b.description || '',
          year: String(b.year || ''),
          copies: Number(b.copies ?? 1),
          language: b.language || 'Русский',
        }));
        return cachedBooks;
      }
    } catch (staticErr) {
      console.warn('Не удалось загрузить books.json по основному пути, пробуем прямой /data/books.json', staticErr);
      try {
        const fallbackRes = await axios.get('/data/books.json', { timeout: 10000 });
        if (Array.isArray(fallbackRes.data)) {
          cachedBooks = fallbackRes.data.map((b, idx) => ({
            _id: b._id || `local-${idx}`,
            title: b.title || 'Без названия',
            author: b.author || 'Не указан',
            genre: Array.isArray(b.genre) ? b.genre : (b.genre ? [b.genre] : ['Другое']),
            description: b.description || '',
            year: String(b.year || ''),
            copies: Number(b.copies ?? 1),
            language: b.language || 'Русский',
          }));
          return cachedBooks;
        }
      } catch (finalErr) {
        console.error('Ошибка загрузки данных книг:', finalErr);
      }
    }

    cachedBooks = [];
    return cachedBooks;
  })();

  return loadPromise;
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

  // 1. Запрос к серверному Gemini эндпоинту
  const endpoints = [`${API_BASE}/gemini/search`, `${API_BASE}/ai/search`, `${API_BASE}/openai/search`];
  for (const ep of endpoints) {
    try {
      const res = await axios.post(
        ep,
        { prompt: prompt.trim() },
        { headers: { 'Content-Type': 'application/json' }, timeout: 9000 }
      );
      if (res.data?.books && res.data.books.length > 0) {
        return res.data.books;
      }
    } catch {
      // Переход к следующему эндпоинту или fallback
    }
  }

  // 2. Интеллектуальный клиентский матчинг (семантический скоринг для RU, KZ, EN)
  const books = await getBooks();
  const tokens = prompt
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()«»"']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (tokens.length === 0) return books.slice(0, 10);

  // Семантические синонимы на трех языках
  const conceptMap = {
    space: ['космос', 'ғарыш', 'планет', 'жұлдыз', 'марсиан', 'галактик', 'space', 'universe', 'alien'],
    dystopia: ['антиутопи', 'фаренгейт', 'брэдбери', 'оруэлл', 'цензур', 'тиран', 'dystopia', 'тоталитар'],
    detective: ['детектив', 'холмс', 'агата', 'кристи', 'пуаро', 'қылмыс', 'тергеу', 'sherlock', 'crime', 'mystery'],
    history: ['тарих', 'абай', 'мұхтар', 'жүсіп', 'казах', 'қазақ', 'хан', 'батыр', 'history', 'тарихи', 'алаш'],
    psychology: ['психолог', 'саморазвит', 'мотиваци', 'табыс', 'өмір', 'ақыл', 'mindset', 'habits', 'успех'],
    adventure: ['приключен', 'саяхат', 'экспедици', 'робинзон', 'верн', 'дюма', 'adventure', 'остров'],
    romance: ['романтик', 'махаббат', 'сезім', 'любов', 'сүйіспеншілік', 'love', 'drama'],
    ielts: ['ielts', 'sat', 'english', 'grammar', 'toefl', 'vocabulary', 'dictionary', 'ағылшын'],
  };

  // Расширяем токены найденными синонимами
  const expandedTokens = new Set(tokens);
  for (const [, synonyms] of Object.entries(conceptMap)) {
    if (tokens.some((t) => synonyms.some((syn) => syn.includes(t) || t.includes(syn)))) {
      synonyms.forEach((syn) => expandedTokens.add(syn));
    }
  }

  const tokenList = Array.from(expandedTokens);

  const scored = books.map((b) => {
    let score = 0;
    const title = (b.title || '').toLowerCase();
    const author = (b.author || '').toLowerCase();
    const desc = (b.description || '').toLowerCase();
    const genre = (Array.isArray(b.genre) ? b.genre.join(' ') : (b.genre || '')).toLowerCase();

    tokenList.forEach((token) => {
      if (title.includes(token)) score += 12;
      if (genre.includes(token)) score += 9;
      if (author.includes(token)) score += 7;
      if (desc.includes(token)) score += 4;
    });

    return { ...b, matchScore: score };
  });

  const matched = scored
    .filter((b) => b.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  if (matched.length > 0) {
    return matched.slice(0, 20);
  }

  return books.slice(0, 8);
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
