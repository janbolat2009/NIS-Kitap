import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import SearchLimit from '../models/SearchLimit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const WEEKLY_SEARCH_LIMIT = 3;
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Local fallback store if MongoDB is offline or in serverless environments
const fallbackLimits = new Map();
const fallbackFilePath = path.resolve(__dirname, '../data/search_limits_cache.json');

export function loadFallbackLimits(force = false) {
  if (fallbackLimits.size > 0 && !force) return;
  try {
    if (fs.existsSync(fallbackFilePath)) {
      const raw = fs.readFileSync(fallbackFilePath, 'utf-8');
      const data = JSON.parse(raw);
      fallbackLimits.clear();
      for (const [k, v] of Object.entries(data)) {
        fallbackLimits.set(k.toLowerCase(), v);
      }
    }
  } catch {}
}

export function _setFallbackLimitForTesting(email, record) {
  if (!email) return;
  fallbackLimits.set(email.toLowerCase().trim(), record);
  saveFallbackLimits();
}

function saveFallbackLimits() {
  try {
    const dir = path.dirname(fallbackFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const obj = {};
    for (const [k, v] of fallbackLimits.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(fallbackFilePath, JSON.stringify(obj, null, 2), 'utf-8');
  } catch {}
}

/**
 * Checks and records a search attempt for a user.
 * Each registered user gets 3 Gemini search requests per 7-day period.
 * Automatically resets the limit every 7 days.
 */
export async function checkAndIncrementSearchLimit(userEmail, query = '') {
  if (!userEmail || typeof userEmail !== 'string') {
    return {
      allowed: false,
      reason: 'unauthorized',
      message: 'Gemini-powered book search is only available to registered users.',
    };
  }

  const cleanEmail = userEmail.toLowerCase().trim();
  const now = new Date();

  // Try MongoDB if available
  if (mongoose.connection.readyState === 1) {
    try {
      let record = await SearchLimit.findOne({ email: cleanEmail });

      if (!record) {
        // New user: start first 7-day cycle
        const resetAt = new Date(now.getTime() + SEVEN_DAYS_MS);
        record = await SearchLimit.create({
          email: cleanEmail,
          count: 1,
          cycleStartedAt: now,
          resetAt,
          lastSearchAt: now,
          searchHistory: [{ query, timestamp: now }],
        });

        return {
          allowed: true,
          limit: WEEKLY_SEARCH_LIMIT,
          used: 1,
          remaining: WEEKLY_SEARCH_LIMIT - 1,
          resetAt: record.resetAt.toISOString(),
          cycleStartedAt: record.cycleStartedAt.toISOString(),
        };
      }

      // Check if 7-day cycle has expired -> Automatically reset
      const resetTime = new Date(record.resetAt).getTime();
      if (now.getTime() >= resetTime) {
        record.count = 1;
        record.cycleStartedAt = now;
        record.resetAt = new Date(now.getTime() + SEVEN_DAYS_MS);
        record.lastSearchAt = now;
        if (!record.searchHistory) record.searchHistory = [];
        record.searchHistory.push({ query, timestamp: now });
        await record.save();

        return {
          allowed: true,
          limit: WEEKLY_SEARCH_LIMIT,
          used: 1,
          remaining: WEEKLY_SEARCH_LIMIT - 1,
          resetAt: record.resetAt.toISOString(),
          cycleStartedAt: record.cycleStartedAt.toISOString(),
          wasReset: true,
        };
      }

      // Inside current 7-day cycle: check count
      if (record.count >= WEEKLY_SEARCH_LIMIT) {
        const resetInMs = resetTime - now.getTime();
        return {
          allowed: false,
          reason: 'limit_reached',
          message: `Weekly limit of ${WEEKLY_SEARCH_LIMIT} Gemini search requests has been reached.`,
          limit: WEEKLY_SEARCH_LIMIT,
          used: record.count,
          remaining: 0,
          resetAt: record.resetAt.toISOString(),
          cycleStartedAt: record.cycleStartedAt.toISOString(),
          resetInMs,
        };
      }

      // Increment count
      record.count += 1;
      record.lastSearchAt = now;
      if (!record.searchHistory) record.searchHistory = [];
      record.searchHistory.push({ query, timestamp: now });
      await record.save();

      return {
        allowed: true,
        limit: WEEKLY_SEARCH_LIMIT,
        used: record.count,
        remaining: Math.max(0, WEEKLY_SEARCH_LIMIT - record.count),
        resetAt: record.resetAt.toISOString(),
        cycleStartedAt: record.cycleStartedAt.toISOString(),
      };
    } catch (dbErr) {
      console.warn('MongoDB search limit error, falling back to cached store:', dbErr.message);
    }
  }

  // Fallback memory/file cache
  loadFallbackLimits();
  let userRecord = fallbackLimits.get(cleanEmail);

  if (!userRecord) {
    userRecord = {
      email: cleanEmail,
      count: 1,
      cycleStartedAt: now.toISOString(),
      resetAt: new Date(now.getTime() + SEVEN_DAYS_MS).toISOString(),
      lastSearchAt: now.toISOString(),
    };
    fallbackLimits.set(cleanEmail, userRecord);
    saveFallbackLimits();

    return {
      allowed: true,
      limit: WEEKLY_SEARCH_LIMIT,
      used: 1,
      remaining: WEEKLY_SEARCH_LIMIT - 1,
      resetAt: userRecord.resetAt,
      cycleStartedAt: userRecord.cycleStartedAt,
    };
  }

  const resetTime = new Date(userRecord.resetAt).getTime();
  if (now.getTime() >= resetTime) {
    // Automatically reset every 7 days
    userRecord.count = 1;
    userRecord.cycleStartedAt = now.toISOString();
    userRecord.resetAt = new Date(now.getTime() + SEVEN_DAYS_MS).toISOString();
    userRecord.lastSearchAt = now.toISOString();
    fallbackLimits.set(cleanEmail, userRecord);
    saveFallbackLimits();

    return {
      allowed: true,
      limit: WEEKLY_SEARCH_LIMIT,
      used: 1,
      remaining: WEEKLY_SEARCH_LIMIT - 1,
      resetAt: userRecord.resetAt,
      cycleStartedAt: userRecord.cycleStartedAt,
      wasReset: true,
    };
  }

  if (userRecord.count >= WEEKLY_SEARCH_LIMIT) {
    return {
      allowed: false,
      reason: 'limit_reached',
      message: `Weekly limit of ${WEEKLY_SEARCH_LIMIT} Gemini search requests has been reached.`,
      limit: WEEKLY_SEARCH_LIMIT,
      used: userRecord.count,
      remaining: 0,
      resetAt: userRecord.resetAt,
      cycleStartedAt: userRecord.cycleStartedAt,
      resetInMs: resetTime - now.getTime(),
    };
  }

  userRecord.count += 1;
  userRecord.lastSearchAt = now.toISOString();
  fallbackLimits.set(cleanEmail, userRecord);
  saveFallbackLimits();

  return {
    allowed: true,
    limit: WEEKLY_SEARCH_LIMIT,
    used: userRecord.count,
    remaining: Math.max(0, WEEKLY_SEARCH_LIMIT - userRecord.count),
    resetAt: userRecord.resetAt,
    cycleStartedAt: userRecord.cycleStartedAt,
  };
}

/**
 * Gets the current limit status for a user without incrementing the counter.
 */
export async function getUserSearchLimit(userEmail) {
  if (!userEmail) {
    return {
      isLoggedIn: false,
      limit: WEEKLY_SEARCH_LIMIT,
      used: 0,
      remaining: WEEKLY_SEARCH_LIMIT,
    };
  }

  const cleanEmail = userEmail.toLowerCase().trim();
  const now = new Date();

  if (mongoose.connection.readyState === 1) {
    try {
      const record = await SearchLimit.findOne({ email: cleanEmail });
      if (record) {
        const resetTime = new Date(record.resetAt).getTime();
        if (now.getTime() >= resetTime) {
          // If window has passed, it will be reset on next search
          return {
            isLoggedIn: true,
            email: cleanEmail,
            limit: WEEKLY_SEARCH_LIMIT,
            used: 0,
            remaining: WEEKLY_SEARCH_LIMIT,
            resetAt: null,
            readyToReset: true,
          };
        }
        return {
          isLoggedIn: true,
          email: cleanEmail,
          limit: WEEKLY_SEARCH_LIMIT,
          used: record.count,
          remaining: Math.max(0, WEEKLY_SEARCH_LIMIT - record.count),
          resetAt: record.resetAt.toISOString(),
          cycleStartedAt: record.cycleStartedAt.toISOString(),
          resetInMs: Math.max(0, resetTime - now.getTime()),
        };
      }
    } catch {}
  }

  loadFallbackLimits();
  const userRecord = fallbackLimits.get(cleanEmail);
  if (userRecord) {
    const resetTime = new Date(userRecord.resetAt).getTime();
    if (now.getTime() >= resetTime) {
      return {
        isLoggedIn: true,
        email: cleanEmail,
        limit: WEEKLY_SEARCH_LIMIT,
        used: 0,
        remaining: WEEKLY_SEARCH_LIMIT,
        resetAt: null,
        readyToReset: true,
      };
    }
    return {
      isLoggedIn: true,
      email: cleanEmail,
      limit: WEEKLY_SEARCH_LIMIT,
      used: userRecord.count,
      remaining: Math.max(0, WEEKLY_SEARCH_LIMIT - userRecord.count),
      resetAt: userRecord.resetAt,
      cycleStartedAt: userRecord.cycleStartedAt,
      resetInMs: Math.max(0, resetTime - now.getTime()),
    };
  }

  // Not searched yet
  return {
    isLoggedIn: true,
    email: cleanEmail,
    limit: WEEKLY_SEARCH_LIMIT,
    used: 0,
    remaining: WEEKLY_SEARCH_LIMIT,
    resetAt: null,
  };
}
