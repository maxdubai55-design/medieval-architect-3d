// Usage : node tools/still.mjs <scène> <dossier> t1 t2 ...  → images JPEG pour contrôle visuel.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { serve, CHROME_ARGS } from './serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [scene, out, ...times] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const srv = await serve(root);
const b = await chromium.launch({ args: CHROME_ARGS });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
p.on('pageerror', (e) => { console.log('[pageerror]', e.message, e.stack); process.exit(1); });
await p.goto(`http://localhost:${srv.address().port}/index.html?render=1&scene=${scene}`);
await p.waitForFunction('window.ready === true', null, { timeout: 120000 });
for (const t of times) {
  const t0 = Date.now();
  await p.evaluate((x) => window.seek(x), Number(t));
  const data = await p.evaluate(() => window.grab(0.9));
  fs.writeFileSync(path.join(out, `s${scene}_${String(t).padStart(6, '0')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
  console.log(t, Date.now() - t0, 'ms');
}
await b.close();
srv.close();
