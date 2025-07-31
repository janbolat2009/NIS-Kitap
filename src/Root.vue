<!-- src/Root.vue -->
<template>
  <div class="root-container">
    <router-view />
  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  background-color: #003060;
  font-family: Arial, sans-serif;
}

.root-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
