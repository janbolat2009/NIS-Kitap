// Signed-in user, role and profile.
// Firebase Auth says who the user is; the role, permissions, class and shanyrak
// come from the server (/api/v2/me), which resolves them from the verified token.
// Nothing stored in the browser is trusted for access decisions.
import { reactive, watch } from 'vue';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { resolveRole, can, cleanEmail } from '@/lib/roles';
import { api } from '@/services/api';

export const session = reactive({
  ready: false,
  uid: '',
  email: '',
  name: '',
  avatar: '',
  emailVerified: false,
  role: 'guest',
  permissions: [],
  profile: null,
  needsClass: false,
  school: null,
  serverOk: true,
  // kept for older pages
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

export async function refreshMe() {
  if (!auth.currentUser) return null;
  try {
    const me = await api('me');
    Object.assign(session, {
      role: me.role,
      permissions: me.permissions || [],
      profile: me.profile || null,
      needsClass: Boolean(me.needsClass),
      school: me.school || null,
      emailVerified: me.emailVerified,
      serverOk: true,
    });
    if (me.profile?.firstName) session.name = [me.profile.firstName, me.profile.lastName].filter(Boolean).join(' ');
    return me;
  } catch (err) {
    // Server unavailable: show the account, but no staff tools (the server would refuse anyway).
    if (err?.code === 'server_not_configured' || err?.code === 'network_error') session.serverOk = false;
    session.role = resolveRole({ email: session.email, emailVerified: session.emailVerified });
    session.permissions = [];
    return null;
  }
}

async function saveAccount(user) {
  try {
    // Firestore is loaded on demand (a signed-in visit only), see src/firebaseDb.js.
    const [{ doc, setDoc }, { db }] = await Promise.all([import('firebase/firestore'), import('@/firebaseDb')]);
    await setDoc(doc(db, 'users', user.uid), {
      name: String(user.displayName || '').slice(0, 120),
      email: cleanEmail(user.email),
      avatar: String(user.photoURL || '').slice(0, 500),
      provider: user.providerData?.[0]?.providerId || 'password',
      lastLogin: new Date().toISOString(),
    }, { merge: true });
  } catch {
    // optional
  }
}

export function startSession() {
  if (started) return;
  started = true;
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      Object.assign(session, {
        uid: '', email: '', name: '', avatar: '', emailVerified: false, role: 'guest', permissions: [], profile: null, needsClass: false,
      });
      clearLegacyStorage();
    } else {
      const email = cleanEmail(user.email);
      Object.assign(session, {
        uid: user.uid,
        email,
        name: user.displayName || email.split('@')[0],
        avatar: user.photoURL || '',
        emailVerified: Boolean(user.emailVerified),
        role: resolveRole({ email, emailVerified: user.emailVerified }),
      });
      saveAccount(user);
      await refreshMe();
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
  if (session.permissions?.length) return session.permissions.includes(permission);
  return can(session.role, permission);
}

export function isStaffUser() {
  return (session.permissions || []).length > 0;
}

export async function getIdToken() {
  const user = auth.currentUser;
  return user ? user.getIdToken() : '';
}

export async function refreshSessionRole() {
  await refreshMe();
}

export async function logout() {
  await signOut(auth);
}

// Keeps the per-page refs used by older pages (isLoggedIn, userEmail, ...) in sync.
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
