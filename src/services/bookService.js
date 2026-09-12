import axios from 'axios';

let cachedBooks = null;
let loadPromise = null;

const API_BASE = '/api';

/**
 * Загрузка книг: сначала проверяется бэкенд, при недоступности — статический fallback из /data/books.json
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
      // 1. Попытка загрузить с бэкенда (таймаут 2.5 сек, чтобы не зависать при отсутствии сервера)
      const res = await axios.get(`${API_BASE}/books`, { timeout: 2500 });
      if (Array.isArray(res.data) && res.data.length > 0) {
        cachedBooks = res.data;
        return cachedBooks;
      }
    } catch {
      // Бэкенд недоступен или вернул ошибку — используем fallback
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
  const target = genreName.toLowerCase().trim();

  return books.filter((b) => {
    if (Array.isArray(b.genre)) {
      return b.genre.some((g) => g.toLowerCase().includes(target));
    }
    return (b.genre || '').toLowerCase().includes(target);
  });
}

/**
 * Фильтрация книг по языку
 */
export async function getBooksByLanguage(lang) {
  const books = await getBooks();
  if (!lang) return books;
  const target = lang.toLowerCase().trim();

  // Сопоставление для разных написаний
  const mapLang = {
    english: 'english',
    английский: 'english',
    казахский: 'казахский',
    қазақ: 'казахский',
    kazakh: 'казахский',
    русский: 'русский',
    russian: 'русский',
  };

  const normTarget = mapLang[target] || target;

  return books.filter((b) => {
    const bLang = (b.language || '').toLowerCase().trim();
    const normBLang = mapLang[bLang] || bLang;
    return normBLang === normTarget || bLang.includes(target);
  });
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
 * Умный ИИ-поиск: обращение к OpenAI API сервера с интеллектуальным клиентским fallback
 */
export async function searchAi(prompt) {
  if (!prompt || !prompt.trim()) return [];

  // 1. Попытка запросить серверный ИИ
  try {
    const res = await axios.post(
      `${API_BASE}/openai/search`,
      { prompt: prompt.trim() },
      { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
    );
    if (res.data?.books && res.data.books.length > 0) {
      return res.data.books;
    }
  } catch {
    // Сервер OpenAI недоступен — запускаем интеллектуальный клиентский матчинг
  }

  // 2. Интеллектуальный клиентский матчинг (семантический скоринг)
  const books = await getBooks();
  const tokens = prompt
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (tokens.length === 0) return books.slice(0, 10);

  const scored = books.map((b) => {
    let score = 0;
    const title = (b.title || '').toLowerCase();
    const author = (b.author || '').toLowerCase();
    const desc = (b.description || '').toLowerCase();
    const genre = (Array.isArray(b.genre) ? b.genre.join(' ') : (b.genre || '')).toLowerCase();

    tokens.forEach((token) => {
      if (title.includes(token)) score += 10;
      if (genre.includes(token)) score += 8;
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

  // Если точных совпадений нет, возвращаем релевантную выборку бестселлеров/фантастики
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
