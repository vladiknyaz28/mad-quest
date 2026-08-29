import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

// base: '/' — локально и на своём домене.
// GitHub Pages: base = '/<имя-репозитория>/'
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'iOS >= 13', 'Android >= 6'],
      modernPolyfills: true,
    }),
  ],
  base: '/mad-quest/',
  build: {
    target: 'es2020',
    modulePreload: false,
  },
});
