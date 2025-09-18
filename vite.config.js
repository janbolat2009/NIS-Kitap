import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/openai': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/openai/, '/api/openai'), // Перенаправление на /api/openai
      },
      '/books': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/books/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});