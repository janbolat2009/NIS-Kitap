// Generates firestore.rules from firestore.rules.template + config/access.json
// + src/lib/permissions.js, so the UI and the server use one permission matrix.
// Usage: npm run rules:build
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PERMISSIONS } from '../src/lib/permissions.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const access = JSON.parse(fs.readFileSync(path.join(root, 'config/access.json'), 'utf8'));
let rules = fs.readFileSync(path.join(root, 'firestore.rules.template'), 'utf8');

const EMAIL = /^[^\s@'"\\]+@[^\s@'"\\]+\.[^\s@'"\\]+$/;
function list(key) {
  const emails = (access[key] || [])
    .map((e) => String(e).trim().toLowerCase())
    .filter((e) => !/_email_here$/i.test(e));
  for (const e of emails) {
    if (!EMAIL.test(e)) throw new Error(`config/access.json ${key}: invalid email "${e}"`);
  }
  return `[${emails.map((e) => `'${e}'`).join(', ')}]`;
}

for (const key of ['SUPER_ADMIN_EMAILS', 'DIRECTOR_EMAILS', 'PROJECT_ADMIN_EMAILS', 'LIBRARIAN_EMAILS']) {
  rules = rules.replaceAll(`__${key}__`, list(key));
}

const fns = Object.entries(PERMISSIONS)
  .map(([perm, roles]) => `    function can_${perm.replace(/\./g, '_')}() { return hasAny([${roles.map((r) => `'${r}'`).join(', ')}]); }`)
  .join('\n');
rules = rules.replace('__PERMISSION_FUNCTIONS__', fns);

if (/__[A-Z_]+__/.test(rules)) throw new Error('Unreplaced placeholder left in firestore.rules');
fs.writeFileSync(path.join(root, 'firestore.rules'), rules);
console.log('firestore.rules generated');
