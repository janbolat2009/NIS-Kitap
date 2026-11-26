import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Absolute asset paths: with './' a page opened directly at /book/<title> loaded
// /book/assets/*.js, which the SPA rewrite answered with index.html.
// GitHub Pages (project page) still builds with relative paths.
export default defineConfig({
  base: process.env.VITE_BASE || (process.env.GITHUB_ACTIONS ? './' : '/'),
  plugins: [vue()],
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