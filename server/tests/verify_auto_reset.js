import { checkAndIncrementSearchLimit, loadFallbackLimits } from '../services/searchLimitService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAutoReset() {
  console.log('Testing 7-day automatic reset...');
  const user = `reset_test_${Date.now()}@ast.nis.edu.kz`;

  // Exhaust all 3 searches
  await checkAndIncrementSearchLimit(user, 'q1');
  await checkAndIncrementSearchLimit(user, 'q2');
  const res3 = await checkAndIncrementSearchLimit(user, 'q3');
  console.log('Exhausted 3 searches:', res3.used);

  // 4th search is blocked
  const res4 = await checkAndIncrementSearchLimit(user, 'q4');
  if (res4.allowed) throw new Error('Search 4 should have been blocked');
  console.log('Confirmed search 4 is blocked.');

  // Simulate passage of 7 days by modifying the cache file or record
  const cachePath = path.resolve(__dirname, '../data/search_limits_cache.json');
  if (fs.existsSync(cachePath)) {
    const raw = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    if (raw[user]) {
      // Wind resetAt back to the past
      raw[user].resetAt = new Date(Date.now() - 1000).toISOString();
      fs.writeFileSync(cachePath, JSON.stringify(raw, null, 2), 'utf-8');
      loadFallbackLimits(true);
      console.log('Simulated 7 days passing (resetAt set to past).');
    }
  }

  // Next search should automatically reset and succeed!
  const resAfter = await checkAndIncrementSearchLimit(user, 'q after reset');
  console.log('Search after 7 days:', {
    allowed: resAfter.allowed,
    used: resAfter.used,
    remaining: resAfter.remaining,
    wasReset: resAfter.wasReset,
  });

  if (resAfter.allowed && resAfter.used === 1 && resAfter.remaining === 2) {
    console.log('✅ Automatic 7-day reset test passed successfully!');
  } else {
    throw new Error('Auto reset failed');
  }
}

testAutoReset().catch((err) => {
  console.error('Reset test failed:', err);
  process.exit(1);
});
