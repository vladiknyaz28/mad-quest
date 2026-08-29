import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const buildId = new Date().toISOString();

/** GitHub Pages: 404.html = index для SPA + правки для мобильных браузеров. */
let html = readFileSync('dist/index.html', 'utf8');
html = html.replace(/ crossorigin/g, '');
html = html.replace(
  '</head>',
  `    <meta name="build-id" content="${buildId}" />\n  </head>`,
);
writeFileSync('dist/index.html', html);
copyFileSync('dist/index.html', 'dist/404.html');
