import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: '/' — локально и на своём домене.
// Для GitHub Pages: base: '/mad-quest/' (имя репозитория).
export default defineConfig({
  plugins: [react()],
  base: '/mad-quest/',
});
