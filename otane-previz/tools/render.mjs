// Rendu hors ligne d'une séquence en MP4 (sans son) : node tools/render.mjs <scène> <sortie.mp4> [fps]
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { serve, CHROME_ARGS } from './serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [scene, out, fpsArg] = process.argv.slice(2);
const fps = Number(fpsArg || 24);

const srv = await serve(root);
const browser = await chromium.launch({ args: CHROME_ARGS });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => { console.error('[pageerror]', e.message); process.exit(1); });
await page.goto(`http://localhost:${srv.address().port}/index.html?render=1&scene=${scene}`);
await page.waitForFunction('window.ready === true', null, { timeout: 180000 });
const duration = await page.evaluate(() => window.duration);
const frames = Math.round(duration * fps);

const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });

const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  const b64 = await page.evaluate((t) => { window.seek(t); return window.grab(0.93).split(',')[1]; }, i / fps);
  const buf = Buffer.from(b64, 'base64');
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % 240 === 0) {
    const el = (Date.now() - t0) / 1000;
    console.log(`SC ${scene} ${i}/${frames} — ${el.toFixed(0)} s écoulées, ~${((el / (i + 1)) * (frames - i) / 60).toFixed(1)} min restantes`);
  }
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();
srv.close();
console.log(`SC ${scene} terminé : ${frames} images en ${((Date.now() - t0) / 60000).toFixed(1)} min → ${out}`);
