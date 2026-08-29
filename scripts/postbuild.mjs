import { copyFileSync } from 'node:fs';

/** GitHub Pages: 404.html = index для SPA. */
copyFileSync('dist/index.html', 'dist/404.html');
