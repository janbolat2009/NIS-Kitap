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
    accent: '#0D9488', // Teal
    route: '/adventure',
    icon: 'adventure',
  },
  encyclopedia: {
    key: 'encyclopedia',
    canonical: 'Энциклопедии',
    i18nKey: 'genres.encyclopedia',
    keywords: ['энциклопед', 'encyclopedia', 'справочник', 'анықтамалық'],
    accent: '#0284C7', // Sky Blue
    route: '/catalog?genre=' + encodeURIComponent('Энциклопедии'),
    icon: 'encyclopedia',
  },
  fantasy: {
    key: 'fantasy',
    canonical: 'Фэнтези',
    i18nKey: 'genres.fantasy',
    keywords: ['фэнтези', 'fantasy', 'қиял-ғажайып', 'магия', 'сиқыр'],
    accent: '#818CF8', // Indigo
    route: '/fantasy',
    icon: 'fantasy',
  },
  romantica: {
    key: 'romantica',
    canonical: 'Романтика',
    i18nKey: 'genres.romantica',
    keywords: ['романтик', 'romanc', 'махаббат', 'сүйіспеншілік', 'ғашық'],
    accent: '#F43F5E', // Rose
    route: '/romantica',
    icon: 'romantica',
  },
  textbooks: {
    key: 'textbooks',
    canonical: 'Учебники',
    i18nKey: 'genres.textbooks',
    keywords: ['учебник', 'textbook', 'оқулық', 'хрестоматия'],
    accent: '#F97316', // Orange
    route: '/catalog?genre=' + encodeURIComponent('Учебники'),
    icon: 'textbooks',
  },
  biography: {
    key: 'biography',
    canonical: 'Биография',
    i18nKey: 'genres.biography',
    keywords: ['биограф', 'biograph', 'өмірбаян', 'мемуар', 'тұлға', 'ғұмырнама'],
    accent: '#EC4899', // Pink
    route: '/biography',
    icon: 'biography',
  },
  fantastica: {
    key: 'fantastica',
    canonical: 'Фантастика',
    i18nKey: 'genres.fantastica',
    keywords: ['фантастик', 'sci-fi', 'scifi', 'ғылыми фантастика', 'космос', 'болашақ'],
    accent: '#38BDF8', // Cyan
    route: '/fantastica',
    icon: 'fantastica',
  },
  teacherGuides: {
    key: 'teacherGuides',
    canonical: 'Методические пособия',
    i18nKey: 'genres.teacherGuides',
    keywords: ['методическ', 'teacher', 'әдістемелік', 'пособие', 'нұсқаулық', 'педагогик'],
    accent: '#14B8A6', // Mint Teal
    route: '/catalog?genre=' + encodeURIComponent('Методические пособия'),
    icon: 'teacherGuides',
  },
  poetry: {
    key: 'poetry',
    canonical: 'Поэзия',
    i18nKey: 'genres.poetry',
    keywords: ['поэзи', 'стих', 'poet', 'poem', 'өлең', 'жыр', 'лирик', 'дастан'],
    accent: '#6366F1', // Royal Indigo
    route: '/poetry',
    icon: 'poetry',
  },
  detective: {
    key: 'detective',
    canonical: 'Детектив',
    i18nKey: 'genres.detective',
    keywords: ['детектив', 'detective', 'тыңшы', 'триллер', 'тергеу', 'қылмыс'],
    accent: '#F59E0B', // Amber
    route: '/detective',
    icon: 'detective',
  },
  classics: {
    key: 'classics',
    canonical: 'Классика',
    i18nKey: 'genres.classics',
    keywords: ['классик', 'проза', 'повест', 'fiction', 'роман', 'общая литература'],
    accent: '#EAB308', // Gold
    route: '/catalog?genre=' + encodeURIComponent('Классика'),
    icon: 'classics',
  },
  drama: {
    key: 'drama',
    canonical: 'Драма',
    i18nKey: 'genres.drama',
    keywords: ['драма', 'трагедия', 'пьеса', 'театр'],
    accent: '#EF4444', // Red
    route: '/catalog?genre=' + encodeURIComponent('Драма'),
    icon: 'drama',
  },
  fairyTales: {
    key: 'fairyTales',
    canonical: 'Сказки',
    i18nKey: 'genres.fairyTales',
    keywords: ['сказк', 'ертегі', 'fairy', 'аңыз', 'фольклор'],
    accent: '#A855F7', // Violet
    route: '/catalog?genre=' + encodeURIComponent('Сказки'),
    icon: 'fairyTales',
  },
  mathematics: {
    key: 'mathematics',
    canonical: 'Математика',
    i18nKey: 'genres.mathematics',
    keywords: ['математик', 'algebra', 'geometry', 'math', 'алгебр', 'геометри'],
    accent: '#2563EB', // Royal Blue
    route: '/catalog?genre=' + encodeURIComponent('Математика'),
    icon: 'mathematics',
  },
  physics: {
    key: 'physics',
    canonical: 'Физика',
    i18nKey: 'genres.physics',
    keywords: ['физик', 'physics', 'квант', 'астроном', 'астрономия'],
    accent: '#7C3AED', // Deep Violet
    route: '/catalog?genre=' + encodeURIComponent('Физика'),
    icon: 'physics',
  },
  chemistry: {
    key: 'chemistry',
    canonical: 'Химия',
    i18nKey: 'genres.chemistry',
    keywords: ['хими', 'chemistry', 'бейорганика', 'органика'],
    accent: '#06B6D4', // Cyan
    route: '/catalog?genre=' + encodeURIComponent('Химия'),
    icon: 'chemistry',
  },
  biology: {
    key: 'biology',
    canonical: 'Биология',
    i18nKey: 'genres.biology',
    keywords: ['биолог', 'biology', 'ботаник', 'зоолог', 'генетик', 'анатоми'],
    accent: '#16A34A', // Green
    route: '/catalog?genre=' + encodeURIComponent('Биология'),
    icon: 'biology',
  },
  computerScience: {
    key: 'computerScience',
    canonical: 'Информатика',
    i18nKey: 'genres.computerScience',
    keywords: ['информатик', 'computer', 'программир', 'it', 'бағдарламалау', 'цифрлық', 'алгоритм'],
    accent: '#0284C7', // Sky Blue
    route: '/catalog?genre=' + encodeURIComponent('Информатика'),
    icon: 'computerScience',
  },
  history: {
    key: 'history',
    canonical: 'История',
    i18nKey: 'genres.history',
    keywords: ['тарих', 'истори', 'history', 'тарихи', 'тарихи роман', 'историческая литература', 'историческая проза'],
    accent: '#B45309', // Warm Bronze
    route: '/catalog?genre=' + encodeURIComponent('История'),
    icon: 'history',
  },
  languages: {
    key: 'languages',
    canonical: 'Изучение языков',
    i18nKey: 'genres.languages',
    keywords: ['английский язык', 'французский язык', 'немецкий язык', 'китайский язык', 'тіл білімі', 'языкознание', 'english', 'language', 'тіл '],
    accent: '#3B82F6', // Cobalt Blue
    route: '/catalog?genre=' + encodeURIComponent('Английский язык'),
    icon: 'languages',
  },
  philosophy: {
    key: 'philosophy',
    canonical: 'Философия',
    i18nKey: 'genres.philosophy',
    keywords: ['философ', 'philosophy', 'ойшыл', 'даналық', 'логика'],
    accent: '#9333EA', // Purple
    route: '/catalog?genre=' + encodeURIComponent('Философия'),
    icon: 'philosophy',
  },
  art: {
    key: 'art',
    canonical: 'Искусство и культура',
    i18nKey: 'genres.art',
    keywords: ['искусств', 'өнер', 'art', 'живопись', 'сурет', 'мәдениет', 'культура'],
    accent: '#E11D48', // Crimson Rose
    route: '/catalog?genre=' + encodeURIComponent('Искусство'),
    icon: 'art',
  },
  literaryStudies: {
    key: 'literaryStudies',
    canonical: 'Литературоведение',
    i18nKey: 'genres.literaryStudies',
    keywords: ['әдебиеттану', 'литературоведен', 'әдебиет', 'сын'],
    accent: '#D97706', // Ochre Gold
    route: '/catalog?genre=' + encodeURIComponent('Әдебиеттану'),
    icon: 'literaryStudies',
  },
  childrenLiterature: {
    key: 'childrenLiterature',
    canonical: 'Детская литература',
    i18nKey: 'genres.childrenLiterature',
    keywords: ['балалар әдебиеті', 'детская литература', 'children', 'балалар'],
    accent: '#FB923C', // Warm Coral
    route: '/catalog?genre=' + encodeURIComponent('Балалар әдебиеті'),
    icon: 'childrenLiterature',
  },
  socialSciences: {
    key: 'socialSciences',
    canonical: 'Экономика и общество',
    i18nKey: 'genres.socialSciences',
    keywords: ['экономик', 'қаржы', 'финанс', 'бизнес', 'business', 'политик', 'саясат', 'саясаттану', 'society'],
    accent: '#059669', // Deep Emerald
    route: '/catalog?genre=' + encodeURIComponent('Экономика'),
    icon: 'socialSciences',
  },
  satire: {
    key: 'satire',
    canonical: 'Сатира и юмор',
    i18nKey: 'genres.satire',
    keywords: ['сатир', 'юмор', 'satire', 'күлкі', 'әзіл', 'сықақ'],
    accent: '#F59E0B', // Amber
    route: '/catalog?genre=' + encodeURIComponent('Сатира'),
    icon: 'satire',
  },
  geography: {
    key: 'geography',
    canonical: 'География',
    i18nKey: 'genres.geography',
    keywords: ['географ', 'geography', 'өлкетану', 'атлас', 'карта'],
    accent: '#0891B2', // Cyan Teal
    route: '/catalog?genre=' + encodeURIComponent('География'),
    icon: 'geography',
  },
  youngAdult: {
    key: 'youngAdult',
    canonical: 'Молодежная литература',
    i18nKey: 'genres.youngAdult',
    keywords: ['молодежн', 'жасөспірім', 'young adult'],
    accent: '#8B5CF6', // Purple Glow
    route: '/catalog?genre=' + encodeURIComponent('Молодежная литература'),
    icon: 'youngAdult',
  },
  science: {
    key: 'science',
    canonical: 'Наука',
    i18nKey: 'genres.science',
    keywords: ['ғылым', 'наука', 'популярная наука', 'танымдық', 'science'],
    accent: '#0EA5E9', // Sky Cyan
    route: '/catalog?genre=' + encodeURIComponent('Ғылым'),
    icon: 'science',
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
  const DYNAMIC_PALETTE = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#E11D48', '#14B8A6'
  ];
  let pIdx = 0;
  for (const [name, count] of Object.entries(ungroupedCounts)) {
    if (count >= 10) {
      const color = DYNAMIC_PALETTE[pIdx % DYNAMIC_PALETTE.length];
      pIdx++;
      const normKey = name.toLowerCase().replace(/[\s,]+/g, '-');
      result.push({
        key: normKey,
        value: name,
        label: name,
        count,
        color: color,
        accent: color,
        route: '/catalog?genre=' + encodeURIComponent(name),
        icon: normKey,
      });
    }
  }

  // Sort descending by book count
  result.sort((a, b) => b.count - a.count);
  return result;
}
