import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Absolute asset paths: with './' a page opened directly at /book/<title> loaded
// /book/assets/*.js, which the SPA rewrite answered with index.html.
// GitHub Pages (project page) still builds with relative paths.
export default defineConfig({
  base: process.env.VITE_BASE || (process.env.GITHUB_ACTIONS ? './' : '/'),
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: they change rarely, so browsers keep them
        // cached between deploys. Firestore gets its own chunk and is loaded only
        // by the pages that read it (src/firebaseDb.js).
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](@firebase[\\/](firestore|webchannel-wrapper)|firebase[\\/]firestore)[\\/]/.test(id)) return 'firebase-firestore';
          if (/[\\/]node_modules[\\/](@firebase|firebase|idb)[\\/]/.test(id)) return 'firebase-core';
          if (/[\\/]node_modules[\\/](@vue|vue|vue-router)[\\/]/.test(id)) return 'vue';
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api/gemini': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/api/openai': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});