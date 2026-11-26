<template>
  <div class="page container admin">
    <header class="admin-head">
      <div>
        <span class="eyebrow">{{ roleLabel }}</span>
        <h1 class="page-title">Библиотека</h1>
      </div>
      <p v-if="!session.serverOk" class="notice notice-danger">Сервер недоступен или ещё не настроен: действия сотрудников сейчас не выполнятся.</p>
    </header>
    <nav class="admin-nav tabs" aria-label="Разделы">
      <router-link v-for="s in sections" :key="s.to" :to="s.to" class="tab" :aria-selected="isActive(s.to)" exact-active-class="">{{ s.label }}</router-link>
    </nav>
    <router-view v-slot="{ Component }">
      <transition name="route" mode="out-in"><component :is="Component" /></transition>
    </router-view>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { session } from '@/stores/session';

const route = useRoute();
const ALL = [
  { to: '/admin', label: 'Выдача и проверка', any: ['loans.manage', 'reading.verify', 'reviews.moderate', 'fund.manage'] },
  { to: '/admin/students', label: 'Ученики', any: ['students.view'] },
  { to: '/admin/rewards', label: 'Поощрения', any: ['rewards.manage', 'rewards.issue', 'rewards.approve'] },
  { to: '/admin/classes', label: 'Классы и шаңыраки', any: ['classes.manage', 'students.view'] },
  { to: '/admin/reports', label: 'Отчёты', any: ['reports.view', 'audit.view'] },
  { to: '/admin/settings', label: 'Настройки', any: ['settings.manage', 'roles.manage'] },
];
const ROLE = { librarian: 'Библиотекарь', director: 'Директор', deputy: 'Завуч', tech_admin: 'Технический администратор' };
const sections = computed(() => ALL.filter((s) => s.any.some((p) => session.permissions.includes(p))));
const roleLabel = computed(() => ROLE[session.role] || session.role);
const isActive = (to) => (to === '/admin' ? route.path === '/admin' : route.path.startsWith(to));
</script>

<style scoped>
.admin-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
.admin-nav { margin-bottom: 24px; }
.admin-nav .tab { text-decoration: none; }
</style>
