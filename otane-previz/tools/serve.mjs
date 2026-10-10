// Petit serveur statique pour le rendu hors ligne.
import http from 'http';
import fs from 'fs';
import path from 'path';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg' };

export function serve(root, port = 0) {
  return new Promise((resolve) => {
    const srv = http.createServer((q, s) => {
      const p = path.join(root, decodeURIComponent(q.url.split('?')[0]));
      fs.readFile(p, (e, d) => {
        if (e) { s.writeHead(404); return s.end(); }
        s.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
        s.end(d);
      });
    }).listen(port, () => resolve(srv));
  });
}

export const CHROME_ARGS = ['--use-gl=angle', '--use-angle=vulkan', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
