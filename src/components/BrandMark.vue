<template>
  <span class="mark" aria-hidden="true">
    <svg viewBox="0 0 78 78" width="100%" height="100%">
      <path :d="markPath" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" />
    </svg>
  </span>
</template>

<script setup>
const markPath = 'M25.847 22C22.3129 26.5581 18.1669 35.9461 19.1456 38.3384C20.369 41.3288 32.9424 29.3401 35.4162 28.9867C37.8901 28.6332 25.847 48.0092 28.6199 54.9215C30.3032 59.1176 56.156 32.7854 59.5 22';
</script>

<style scoped>
.mark {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: var(--logo-mark);
  flex: none;
}
</style>
