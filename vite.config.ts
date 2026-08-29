import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: '/' — локально и на своём домене.
// GitHub Pages: base = '/<имя-репозитория>/'
export default defineConfig({
  plugins: [react()],
  base: '/mad-quest/',
  build: {
    target: 'es2020',
  },
});
