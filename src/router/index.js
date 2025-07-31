import { createRouter, createWebHistory } from 'vue-router';
import App from '@/App.vue';
import Register from '@/components/Register.vue';
import Profile from '@/components/Profile.vue';
import Catalog from '@/pages/Catalog.vue';
import BookDetail from '@/pages/BookDetail.vue';
import Fantastica from '@/pages/genres/Fantastica.vue';
import Fantasy from '@/pages/genres/Fantasy.vue';
import Detective from '@/pages/genres/Detective.vue';
import Adventure from '@/pages/genres/Adventure.vue';
import Biography from '@/pages/genres/Biography.vue';
import Romantica from '@/pages/genres/Romantica.vue';
import Poetry from '@/pages/genres/Poetry.vue';
import EnglishBooks from '@/pages/languages/EnglishBooks.vue';
import RussianBooks from '@/pages/languages/RussianBooks.vue';
import KazakhBooks from '@/pages/languages/KazakhBooks.vue';

const routes = [
  { path: '/', name: 'App', component: App },
  { path: '/register', name: 'Register', component: Register },
  { path: '/profile', name: 'Profile', component: Profile },
  { path: '/catalog', name: 'Catalog', component: Catalog },
  { path: '/book/:id', name: 'BookDetail', component: BookDetail },
  { path: '/fantastica',name: 'Fantastica', component: Fantastica},
  { path: '/fantasy',name: 'Fantasy', component: Fantasy},
  { path: '/detective',name: 'Detective', component: Detective},
  { path: '/adventure',name: 'Adventure', component: Adventure},
  { path: '/biography',name: 'Biography', component: Biography},
  { path: '/romantica',name: 'Romantica', component: Romantica},
  { path: '/poetry', name: 'Poetry', component: Poetry},
  { path: '/english', name: 'English', component: EnglishBooks},
  { path: '/russian', name: 'Russian', component: RussianBooks},
  { path: '/kazakh', name: 'Kazakh', component: KazakhBooks},
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;