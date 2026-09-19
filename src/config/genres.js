/**
 * NIS Kitap - Centralized Scalable Genre Configuration
 * Single source of truth for:
 *  - Canonical database genre names
 *  - Multilingual keywords for search & filtering
 *  - Apple Glassmorphism accent colors
 *  - Semantic vector SVG icons
 *  - Navigation routes & i18n tokens
 */

export const CANONICAL_GENRE_MAP = {
  selfDevelopment: {
    key: 'selfDevelopment',
    canonical: 'Саморазвитие',
    i18nKey: 'genres.selfDevelopment',
    keywords: [
      'саморазвит', 'мотиваци', 'личностн', 'mindset', 'habits', 'успех',
      'даму', 'күш', 'мақсат', 'әдет', 'лидер', 'психолог', 'интеллект',
      'тайм', 'эмоциональн', 'лидерств', 'развити', 'самосовершенствован'
    ],
    accent: '#10B981', // Emerald green (growth, progress)
    route: '/catalog?genre=' + encodeURIComponent('Саморазвитие'),
    icon: 'selfDevelopment',
  },
  adventure: {
    key: 'adventure',
    canonical: 'Приключения',
    i18nKey: 'genres.adventure',
    keywords: ['приключен', 'adventure', 'шытырман', 'саяхат', 'экспедици', 'саяхатшы'],
    accent: '#10B981',
    route: '/adventure',
    icon: 'adventure',
  },
  encyclopedia: {
    key: 'encyclopedia',
    canonical: 'Энциклопедии',
    i18nKey: 'genres.encyclopedia',
    keywords: ['энциклопед', 'encyclopedia', 'справочник', 'анықтамалық'],
    accent: '#0284C7',
    route: '/catalog?genre=' + encodeURIComponent('Энциклопедии'),
    icon: 'encyclopedia',
  },
  fantasy: {
    key: 'fantasy',
    canonical: 'Фэнтези',
    i18nKey: 'genres.fantasy',
    keywords: ['фэнтези', 'fantasy', 'қиял-ғажайып', 'магия', 'сиқыр'],
    accent: '#818CF8',
    route: '/fantasy',
    icon: 'fantasy',
  },
  romantica: {
    key: 'romantica',
    canonical: 'Романтика',
    i18nKey: 'genres.romantica',
    keywords: ['романтик', 'romanc', 'махаббат', 'сүйіспеншілік', 'ғашық'],
    accent: '#F43F5E',
    route: '/romantica',
    icon: 'romantica',
  },
  textbooks: {
    key: 'textbooks',
    canonical: 'Учебники',
    i18nKey: 'genres.textbooks',
    keywords: ['учебник', 'textbook', 'оқулық', 'хрестоматия'],
    accent: '#F97316',
    route: '/catalog?genre=' + encodeURIComponent('Учебники'),
    icon: 'textbooks',
  },
  biography: {
    key: 'biography',
    canonical: 'Биография',
    i18nKey: 'genres.biography',
    keywords: ['биограф', 'biograph', 'өмірбаян', 'мемуар', 'тұлға'],
    accent: '#EC4899',
    route: '/biography',
    icon: 'biography',
  },
  fantastica: {
    key: 'fantastica',
    canonical: 'Фантастика',
    i18nKey: 'genres.fantastica',
    keywords: ['фантастик', 'sci-fi', 'scifi', 'ғылыми фантастика', 'космос', 'болашақ'],
    accent: '#38BDF8',
    route: '/fantastica',
    icon: 'fantastica',
  },
  teacherGuides: {
    key: 'teacherGuides',
    canonical: 'Методические пособия',
    i18nKey: 'genres.teacherGuides',
    keywords: ['методическ', 'teacher', 'әдістемелік', 'пособие', 'нұсқаулық'],
    accent: '#14B8A6',
    route: '/catalog?genre=' + encodeURIComponent('Методические пособия'),
    icon: 'teacherGuides',
  },
  poetry: {
    key: 'poetry',
    canonical: 'Поэзия',
    i18nKey: 'genres.poetry',
    keywords: ['поэзи', 'стих', 'poet', 'poem', 'өлең', 'жыр', 'лирик', 'дастан'],
    accent: '#6366F1',
    route: '/poetry',
    icon: 'poetry',
  },
  detective: {
    key: 'detective',
    canonical: 'Детектив',
    i18nKey: 'genres.detective',
    keywords: ['детектив', 'detective', 'тыңшы', 'триллер', 'тергеу', 'қылмыс'],
    accent: '#F59E0B',
    route: '/detective',
    icon: 'detective',
  },
  classics: {
    key: 'classics',
    canonical: 'Классика',
    i18nKey: 'genres.classics',
    keywords: ['классик', 'проза', 'повест', 'fiction', 'роман'],
    accent: '#EAB308',
    route: '/catalog?genre=' + encodeURIComponent('Классика'),
    icon: 'classics',
  },
  drama: {
    key: 'drama',
    canonical: 'Драма',
    i18nKey: 'genres.drama',
    keywords: ['драма', 'трагедия', 'пьеса', 'театр'],
    accent: '#EF4444',
    route: '/catalog?genre=' + encodeURIComponent('Драма'),
    icon: 'drama',
  },
  fairyTales: {
    key: 'fairyTales',
    canonical: 'Сказки',
    i18nKey: 'genres.fairyTales',
    keywords: ['сказк', 'ертегі', 'fairy', 'детская литература', 'аңыз'],
    accent: '#A855F7',
    route: '/catalog?genre=' + encodeURIComponent('Сказки'),
    icon: 'fairyTales',
  },
};

/**
 * Returns canonical genre info by key or canonical name
 */
export function getGenreMeta(keyOrName) {
  if (!keyOrName) return null;
  const clean = String(keyOrName).trim().toLowerCase();

  // Try direct key match
  if (CANONICAL_GENRE_MAP[keyOrName]) {
    return CANONICAL_GENRE_MAP[keyOrName];
  }

  // Try canonical or keywords match
  for (const info of Object.values(CANONICAL_GENRE_MAP)) {
    if (
      info.canonical.toLowerCase() === clean ||
      info.key.toLowerCase() === clean ||
      info.keywords.some((k) => clean.includes(k) || k.includes(clean))
    ) {
      return info;
    }
  }

  return null;
}

/**
 * Checks if a book's genre matches a target filter
 */
export function matchGenre(bookGenres, targetGenre) {
  if (!targetGenre) return true;
  const target = String(targetGenre).toLowerCase().trim();

  // 1. Identify canonical target group
  let targetGroup = null;
  for (const [group, info] of Object.entries(CANONICAL_GENRE_MAP)) {
    if (
      info.canonical.toLowerCase() === target ||
      info.key.toLowerCase() === target ||
      info.keywords.some((p) => target.includes(p) || p.includes(target))
    ) {
      targetGroup = group;
      break;
    }
  }

  const list = Array.isArray(bookGenres) ? bookGenres : [bookGenres || ''];

  return list.some((bg) => {
    const b = String(bg).toLowerCase().trim();
    if (!b) return false;

    if (targetGroup) {
      const info = CANONICAL_GENRE_MAP[targetGroup];
      if (info.canonical.toLowerCase() === b) return true;
      if (info.keywords.some((p) => b.includes(p) || p.includes(b))) return true;
    }

    // Direct string or substring match
    if (b === target || b.includes(target) || target.includes(b)) {
      return true;
    }

    const stem = target.length > 5 ? target.slice(0, 5) : target;
    return b.startsWith(stem) || stem.includes(b);
  });
}

/**
 * Dynamically scans the books array and aggregates all active genres with exact book counts
 */
export function getUniqueGenres(books) {
  if (!Array.isArray(books) || books.length === 0) return [];

  const groupCounts = {};
  const ungroupedCounts = {};

  for (const b of books) {
    const rawGenres = Array.isArray(b.genre) ? b.genre : [b.genre || ''];
    const matchedKeys = new Set();

    for (const g of rawGenres) {
      const clean = String(g).trim();
      if (!clean) continue;
      const lower = clean.toLowerCase();

      let matchedKey = null;
      for (const [key, info] of Object.entries(CANONICAL_GENRE_MAP)) {
        if (
          info.canonical.toLowerCase() === lower ||
          info.keywords.some((p) => lower.includes(p) || p.includes(lower))
        ) {
          matchedKey = key;
          break;
        }
      }

      if (matchedKey) {
        matchedKeys.add(matchedKey);
      } else {
        ungroupedCounts[clean] = (ungroupedCounts[clean] || 0) + 1;
      }
    }

    for (const key of matchedKeys) {
      groupCounts[key] = (groupCounts[key] || 0) + 1;
    }
  }

  const result = [];

  // Add all canonical groups that have > 0 books
  for (const [key, info] of Object.entries(CANONICAL_GENRE_MAP)) {
    const count = groupCounts[key] || 0;
    if (count > 0) {
      result.push({
        key,
        value: info.canonical,
        label: info.canonical,
        count,
        color: info.accent,
        accent: info.accent,
        route: info.route,
        icon: info.icon,
      });
    }
  }

  // Add any dynamic ungrouped genres with >= 10 books
  for (const [name, count] of Object.entries(ungroupedCounts)) {
    if (count >= 10) {
      result.push({
        key: name.toLowerCase().replace(/\s+/g, '-'),
        value: name,
        label: name,
        count,
        color: '#64748B',
        accent: '#64748B',
        route: '/catalog?genre=' + encodeURIComponent(name),
        icon: 'default',
      });
    }
  }

  // Sort descending by book count
  result.sort((a, b) => b.count - a.count);
  return result;
}
