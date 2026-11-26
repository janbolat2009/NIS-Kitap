import { createRouter, createWebHistory } from 'vue-router';
import { waitForSession, session } from '@/stores/session';
import { openLogin, toast } from '@/stores/ui';

const genre = (name, file) => ({ path: `/${name}`, name, component: () => import(`@/pages/genres/${file}.vue`) });

const routes = [
  { path: '/', name: 'Home', component: () => import('@/pages/Home.vue') },
  { path: '/catalog', name: 'Catalog', component: () => import('@/pages/Catalog.vue') },
  { path: '/book/:title', name: 'BookDetail', component: () => import('@/pages/BookDetail.vue') },
  genre('fantastica', 'Fantastica'),
  genre('fantasy', 'Fantasy'),
  genre('detective', 'Detective'),
  genre('adventure', 'Adventure'),
  genre('biography', 'Biography'),
  genre('romantica', 'Romantica'),
  genre('poetry', 'Poetry'),
  { path: '/english', name: 'English', component: () => import('@/pages/languages/EnglishBooks.vue') },
  { path: '/russian', name: 'Russian', component: () => import('@/pages/languages/RussianBooks.vue') },
  { path: '/kazakh', name: 'Kazakh', component: () => import('@/pages/languages/KazakhBooks.vue') },
  { path: '/about-us', name: 'AboutUs', component: () => import('@/pages/about-us.vue') },
  { path: '/100-kitap', name: 'HundredBooks', component: () => import('@/pages/HundredBooks.vue') },
  { path: '/leaderboard', name: 'Leaderboard', component: () => import('@/pages/Leaderboard.vue') },
  { path: '/profile', name: 'Cabinet', component: () => import('@/pages/Cabinet.vue'), meta: { auth: true } },
  { path: '/me', redirect: '/profile' },
  { path: '/register', redirect: { path: '/', query: { auth: 'register' } } },
  { path: '/certificate/:number', name: 'Certificate', component: () => import('@/pages/Certificate.vue') },
  {
    path: '/admin',
    component: () => import('@/pages/admin/AdminLayout.vue'),
    meta: { staff: true },
    children: [
      { path: '', name: 'AdminDesk', component: () => import('@/pages/admin/Desk.vue'), meta: { any: ['loans.manage', 'reading.verify', 'reviews.moderate', 'fund.manage'] } },
      { path: 'students', name: 'AdminStudents', component: () => import('@/pages/admin/Students.vue'), meta: { any: ['students.view'] } },
      { path: 'rewards', name: 'AdminRewards', component: () => import('@/pages/admin/Rewards.vue'), meta: { any: ['rewards.manage', 'rewards.issue', 'rewards.approve'] } },
      { path: 'classes', name: 'AdminClasses', component: () => import('@/pages/admin/Classes.vue'), meta: { any: ['classes.manage', 'students.view'] } },
      { path: 'reports', name: 'AdminReports', component: () => import('@/pages/admin/Reports.vue'), meta: { any: ['reports.view', 'audit.view'] } },
      { path: 'settings', name: 'AdminSettings', component: () => import('@/pages/admin/Settings.vue'), meta: { any: ['settings.manage', 'roles.manage'] } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

function waitForAnchor(hash) {
  const find = () => document.getElementById(hash.slice(1));
  const element = find();
  if (element) return Promise.resolve(element);

  return new Promise((resolve) => {
    const finish = (target) => {
      observer.disconnect();
      clearTimeout(timeout);
      resolve(target);
    };
    const observer = new MutationObserver(() => {
      const target = find();
      if (target) finish(target);
    });
    const timeout = setTimeout(() => finish(null), 1000);
    observer.observe(document.querySelector('#main') || document.body, { childList: true, subtree: true });
  });
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  async scrollBehavior(to, from, saved) {
    if (saved) return saved;
    if (to.hash) {
      const el = await waitForAnchor(to.hash);
      if (router.currentRoute.value.fullPath !== to.fullPath) return false;
      if (el) return { el, top: 80, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' };
    }
    if (to.path === from.path) return false;
    return { top: 0 };
  },
});

// Only decides what to show. Every action is checked again by the server.
router.beforeEach(async (to) => {
  if (to.query.auth === 'register' || to.query.auth === 'login') openLogin(to.query.auth);
  const needs = to.matched.some((r) => r.meta.auth || r.meta.staff);
  if (!needs) return true;
  await waitForSession();
  if (!session.uid) {
    openLogin('login');
    return { path: '/' };
  }
  const perms = session.permissions || [];
  if (to.matched.some((r) => r.meta.staff) && !perms.length) {
    toast('Раздел доступен только сотрудникам библиотеки.', { type: 'error' });
    return { path: '/' };
  }
  const any = to.meta.any;
  if (Array.isArray(any) && !any.some((p) => perms.includes(p))) {
    const first = router.getRoutes().find((r) => r.path.startsWith('/admin') && Array.isArray(r.meta.any) && r.meta.any.some((p) => perms.includes(p)));
    return first && first.path !== to.path ? { path: first.path } : { path: '/' };
  }
  return true;
});

export default router;
