// Firebase Admin SDK for Vercel functions.
// Credentials come only from the server environment:
//   FIREBASE_SERVICE_ACCOUNT  — the service-account JSON (raw or base64)
// For local tests the emulators are used instead (FIRESTORE_EMULATOR_HOST /
// FIREBASE_AUTH_EMULATOR_HOST), and no credentials are needed.
// Files under api/_lib are not exposed as routes by Vercel.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'nis-kitap-2025';

function parseServiceAccount(raw) {
  if (!raw) return null;
  let text = String(raw).trim();
  if (!text.startsWith('{')) {
    try {
      text = Buffer.from(text, 'base64').toString('utf8');
    } catch {
      return null;
    }
  }
  try {
    const json = JSON.parse(text);
    if (json.private_key) json.private_key = json.private_key.replace(/\\n/g, '\n');
    return json.client_email && json.private_key ? json : null;
  } catch {
    return null;
  }
}

export function usingEmulator() {
  return Boolean(process.env.FIRESTORE_EMULATOR_HOST);
}

export function adminConfigured() {
  return usingEmulator() || Boolean(parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT));
}

let app = null;

function getApp() {
  if (app) return app;
  if (getApps().length) {
    [app] = getApps();
    return app;
  }
  if (usingEmulator()) {
    app = initializeApp({ projectId: process.env.GCLOUD_PROJECT || PROJECT_ID });
    return app;
  }
  const sa = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
  if (!sa) {
    const err = new Error('server_not_configured');
    err.status = 503;
    err.code = 'server_not_configured';
    throw err;
  }
  app = initializeApp({ credential: cert(sa), projectId: sa.project_id || PROJECT_ID });
  return app;
}

let firestore = null;
export function db() {
  if (!firestore) {
    firestore = getFirestore(getApp());
    try {
      firestore.settings({ ignoreUndefinedProperties: true });
    } catch {
      // settings can only be applied once per instance
    }
  }
  return firestore;
}

export function adminAuth() {
  return getAuth(getApp());
}

export { FieldValue, Timestamp };
