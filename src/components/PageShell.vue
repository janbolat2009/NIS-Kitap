<template>
  <div class="page container">
    <slot :open-login="openLogin" />
  </div>
</template>

<script setup>
// Content wrapper for older pages. Header, footer and the sign-in dialog live in Root.vue.
import { provide } from 'vue';
import { openLogin } from '@/stores/ui';

provide('openLogin', openLogin);
</script>
