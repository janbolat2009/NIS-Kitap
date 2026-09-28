import axios from 'axios';

export const WEEKLY_SEARCH_LIMIT = 3;
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getStorageKey(email) {
  return `nis_kitap_gemini_limit_${String(email || 'anonymous').toLowerCase().trim()}`;
}

/**
 * Loads current user's search limit status from localStorage
 */
export function getLocalLimit(email) {
  if (!email) {
    return {
      isLoggedIn: false,
      limit: WEEKLY_SEARCH_LIMIT,
      used: 0,
      remaining: WEEKLY_SEARCH_LIMIT,
      resetAt: null,
      cycleStartedAt: null,
    };
  }

  const key = getStorageKey(email);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {
        isLoggedIn: true,
        email,
        limit: WEEKLY_SEARCH_LIMIT,
        used: 0,
        remaining: WEEKLY_SEARCH_LIMIT,
        resetAt: null,
        cycleStartedAt: null,
      };
    }

    const data = JSON.parse(raw);
    const now = Date.now();

    // Check if 7 days have elapsed -> automatically reset limit
    if (data.resetAt && now >= new Date(data.resetAt).getTime()) {
      const resetData = {
        isLoggedIn: true,
        email,
        limit: WEEKLY_SEARCH_LIMIT,
        used: 0,
        remaining: WEEKLY_SEARCH_LIMIT,
        resetAt: null,
        cycleStartedAt: null,
      };
      localStorage.setItem(key, JSON.stringify(resetData));
      return resetData;
    }

    const used = Number(data.used || data.count || 0);
    return {
      isLoggedIn: true,
      email,
      limit: WEEKLY_SEARCH_LIMIT,
      used,
      remaining: Math.max(0, WEEKLY_SEARCH_LIMIT - used),
      resetAt: data.resetAt || null,
      cycleStartedAt: data.cycleStartedAt || null,
    };
  } catch {
    return {
      isLoggedIn: true,
      email,
      limit: WEEKLY_SEARCH_LIMIT,
      used: 0,
      remaining: WEEKLY_SEARCH_LIMIT,
      resetAt: null,
      cycleStartedAt: null,
    };
  }
}

/**
 * Saves or updates search limit info in localStorage
 */
export function saveLocalLimit(email, limitInfo) {
  if (!email) return;
  const key = getStorageKey(email);
  try {
    localStorage.setItem(key, JSON.stringify(limitInfo));
  } catch {}
}

/**
 * Checks whether user can perform a Gemini search right now.
 */
export function canPerformSearch(email) {
  if (!email) {
    return {
      allowed: false,
      reason: 'unauthorized',
      message: 'Gemini-powered book search is only available to registered users.',
    };
  }

  const current = getLocalLimit(email);
  if (current.used >= WEEKLY_SEARCH_LIMIT && current.resetAt) {
    const now = Date.now();
    const resetTime = new Date(current.resetAt).getTime();
    if (now < resetTime) {
      return {
        allowed: false,
        reason: 'limit_reached',
        limit: WEEKLY_SEARCH_LIMIT,
        used: current.used,
        remaining: 0,
        resetAt: current.resetAt,
        cycleStartedAt: current.cycleStartedAt,
        resetInMs: resetTime - now,
      };
    }
  }

  return {
    allowed: true,
    limit: WEEKLY_SEARCH_LIMIT,
    used: current.used,
    remaining: current.remaining,
    resetAt: current.resetAt,
  };
}

/**
 * Records a search and updates the limit (called after search starts or returns).
 */
export function recordSearch(email, serverLimit = null) {
  if (!email) return;
  const key = getStorageKey(email);
  const now = Date.now();

  if (serverLimit && typeof serverLimit.used === 'number') {
    const info = {
      isLoggedIn: true,
      email,
      limit: WEEKLY_SEARCH_LIMIT,
      used: serverLimit.used,
      remaining: Math.max(0, WEEKLY_SEARCH_LIMIT - serverLimit.used),
      resetAt: serverLimit.resetAt,
      cycleStartedAt: serverLimit.cycleStartedAt || new Date(now).toISOString(),
    };
    saveLocalLimit(email, info);
    return info;
  }

  const current = getLocalLimit(email);
  let count = current.used + 1;
  let cycleStartedAt = current.cycleStartedAt;
  let resetAt = current.resetAt;

  if (!resetAt || now >= new Date(resetAt).getTime()) {
    // Start fresh 7-day cycle
    count = 1;
    cycleStartedAt = new Date(now).toISOString();
    resetAt = new Date(now + SEVEN_DAYS_MS).toISOString();
  }

  const updated = {
    isLoggedIn: true,
    email,
    limit: WEEKLY_SEARCH_LIMIT,
    used: count,
    remaining: Math.max(0, WEEKLY_SEARCH_LIMIT - count),
    resetAt,
    cycleStartedAt,
  };

  saveLocalLimit(email, updated);
  return updated;
}

/**
 * Fetches authoritative limit quota from server
 */
export async function syncServerLimit(email) {
  if (!email) return null;
  try {
    const res = await axios.get(`/api/gemini/limit?email=${encodeURIComponent(email)}`, { timeout: 3500 });
    if (res.data && typeof res.data.used === 'number') {
      const serverData = res.data;
      const info = {
        isLoggedIn: true,
        email,
        limit: WEEKLY_SEARCH_LIMIT,
        used: serverData.used,
        remaining: Math.max(0, WEEKLY_SEARCH_LIMIT - serverData.used),
        resetAt: serverData.resetAt,
        cycleStartedAt: serverData.cycleStartedAt,
      };
      saveLocalLimit(email, info);
      return info;
    }
  } catch {}
  return getLocalLimit(email);
}

/**
 * Formats the reset timestamp into an understandable localized string
 */
export function formatResetDateTime(resetAt, locale = 'ru') {
  if (!resetAt) return '';
  const d = new Date(resetAt);
  const loc = locale === 'kz' ? 'kk-KZ' : locale === 'en' ? 'en-US' : 'ru-RU';

  return d.toLocaleString(loc, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats relative time remaining until reset
 */
export function formatResetCountdown(resetAt, locale = 'ru') {
  if (!resetAt) return '';
  const diffMs = new Date(resetAt).getTime() - Date.now();
  if (diffMs <= 0) {
    if (locale === 'kz') return 'қазір қолжетімді';
    if (locale === 'en') return 'available now';
    return 'доступно сейчас';
  }

  const hoursTotal = Math.ceil(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hoursTotal / 24);
  const hours = hoursTotal % 24;

  if (locale === 'kz') {
    if (days > 0) return `${days} күн ${hours > 0 ? `${hours} сағаттан` : ''} кейін`;
    return `${hoursTotal} сағаттан кейін`;
  }
  if (locale === 'en') {
    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}${hours > 0 ? ` ${hours} hour${hours > 1 ? 's' : ''}` : ''}`;
    return `in ${hoursTotal} hour${hoursTotal > 1 ? 's' : ''}`;
  }
  // Russian
  if (days > 0) {
    const dayWord = days === 1 ? 'день' : days >= 2 && days <= 4 ? 'дня' : 'дней';
    return `через ${days} ${dayWord}${hours > 0 ? ` ${hours} ч.` : ''}`;
  }
  return `через ${hoursTotal} ч.`;
}
