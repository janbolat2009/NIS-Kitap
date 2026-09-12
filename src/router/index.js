import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', name: 'App', component: () => import('@/App.vue') },
  { path: '/register', name: 'Register', component: () => import('@/components/Register.vue') },
  { path: '/profile', name: 'Profile', component: () => import('@/components/Profile.vue') },
  { path: '/catalog', name: 'Catalog', component: () => import('@/pages/Catalog.vue') },
  { path: '/book/:title', name: 'BookDetail', component: () => import('@/pages/BookDetail.vue') },
  { path: '/fantastica', name: 'Fantastica', component: () => import('@/pages/genres/Fantastica.vue') },
  { path: '/fantasy', name: 'Fantasy', component: () => import('@/pages/genres/Fantasy.vue') },
  { path: '/detective', name: 'Detective', component: () => import('@/pages/genres/Detective.vue') },
  { path: '/adventure', name: 'Adventure', component: () => import('@/pages/genres/Adventure.vue') },
  { path: '/biography', name: 'Biography', component: () => import('@/pages/genres/Biography.vue') },
  { path: '/romantica', name: 'Romantica', component: () => import('@/pages/genres/Romantica.vue') },
  { path: '/poetry', name: 'Poetry', component: () => import('@/pages/genres/Poetry.vue') },
  { path: '/english', name: 'English', component: () => import('@/pages/languages/EnglishBooks.vue') },
  { path: '/russian', name: 'Russian', component: () => import('@/pages/languages/RussianBooks.vue') },
  { path: '/kazakh', name: 'Kazakh', component: () => import('@/pages/languages/KazakhBooks.vue') },
  { path: '/about-us', name: 'AboutUs', component: () => import('@/pages/about-us.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' };
    }
    return { top: 0, behavior: 'smooth' };
  },
});

export default router;