// Single source of truth for the signed-in user and their role.
// The role is resolved from Firebase Auth (verified email) + config/access.json +
// roles/{email} in Firestore. Nothing stored in localStorage is trusted.
import { reactive, watch } from 'vue';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { resolveRole, can, cleanEmail } from '@/lib/roles';

export const session = reactive({
  ready: false,
  uid: '',
  email: '',
  name: '',
  avatar: '',
  emailVerified: false,
  role: 'guest',
  subject: '',
  roster: null,
});

let started = false;
let readyResolvers = [];

function clearLegacyStorage() {
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
  } catch {
    // storage unavailable
  }
}

async function loadStoredRole(email) {
  try {
    const snap = await getDoc(doc(db, 'roles', cleanEmail(email)));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

async function loadRoster(email) {
  try {
    const snap = await getDoc(doc(db, 'students', cleanEmail(email)));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

export function startSession() {
  if (started) return;
  started = true;
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      Object.assign(session, { uid: '', email: '', name: '', avatar: '', emailVerified: false, role: 'guest', subject: '', roster: null });
      clearLegacyStorage();
    } else {
      const email = cleanEmail(user.email);
      const stored = user.emailVerified ? await loadStoredRole(email) : null;
      const roster = user.emailVerified ? await loadRoster(email) : null;
      Object.assign(session, {
        uid: user.uid,
        email,
        name: user.displayName || email.split('@')[0],
        avatar: user.photoURL || '',
        emailVerified: Boolean(user.emailVerified),
        role: resolveRole({ email, emailVerified: user.emailVerified, storedRole: stored?.role }),
        subject: stored?.subject || '',
        roster,
      });
      try {
        localStorage.setItem('user', JSON.stringify({ email, name: session.name, avatar: session.avatar }));
        localStorage.setItem('isLoggedIn', 'true');
      } catch {
        // storage unavailable
      }
    }
    session.ready = true;
    readyResolvers.forEach((resolve) => resolve(session));
    readyResolvers = [];
  });
}

export function waitForSession() {
  startSession();
  if (session.ready) return Promise.resolve(session);
  return new Promise((resolve) => readyResolvers.push(resolve));
}

export function isSignedIn() {
  return Boolean(session.uid);
}

export function hasPermission(permission) {
  return can(session.role, permission);
}

export async function getIdToken() {
  const user = auth.currentUser;
  return user ? user.getIdToken() : '';
}

export async function refreshSessionRole() {
  if (!auth.currentUser) return;
  const stored = await loadStoredRole(session.email);
  session.role = resolveRole({ email: session.email, emailVerified: session.emailVerified, storedRole: stored?.role });
  session.subject = stored?.subject || '';
}

// Keeps the per-page refs used by existing pages (isLoggedIn, userEmail, ...)
// in sync with the real Firebase session.
export function bindSessionRefs(refs) {
  startSession();
  return watch(
    () => [session.ready, session.uid, session.name, session.avatar, session.email],
    () => {
      if (!session.ready) return;
      if (refs.isLoggedIn) refs.isLoggedIn.value = Boolean(session.uid);
      if (refs.userEmail) refs.userEmail.value = session.email;
      if (refs.userName) refs.userName.value = session.name;
      if (refs.userAvatar) refs.userAvatar.value = session.avatar;
    },
    { immediate: true },
  );
}
