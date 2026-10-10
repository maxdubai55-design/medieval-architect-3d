import * as THREE from 'three';
import { shake as shakeFn, clamp, inv, smooth } from './lib/util.js';

// Format de sortie : 1280×720, image utile en 2,39:1 (1280×536), bandes noires porteuses
// du « slate » technique en haut et des sous-titres en bas.
export const OUT_W = 1280;
export const OUT_H = 720;
export const PIC_H = 536;
export const BAR = (OUT_H - PIC_H) / 2;

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"DejaVu Sans Mono", Menlo, Consolas, monospace';

export class Film {
  constructor(host, { slate = true, scale = 1 } = {}) {
    this.slate = slate;
    this.renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(OUT_W, PIC_H, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.out = document.createElement('canvas');
    this.out.width = OUT_W;
    this.out.height = OUT_H;
    this.g = this.out.getContext('2d');
    host.appendChild(this.out);
    this.camera = new THREE.PerspectiveCamera(35, OUT_W / PIC_H, 0.1, 20000);
    this.makeGrain();
    this.makeVignette();
  }

  makeGrain() {
    this.grain = [];
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 6; k++) {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const x = c.getContext('2d');
      const id = x.createImageData(256, 256);
      for (let i = 0; i < id.data.length; i += 4) {
        const v = 128 + (rnd() - 0.5) * 255;
        id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
        id.data[i + 3] = 255;
      }
      x.putImageData(id, 0, 0);
      this.grain.push(c);
    }
  }

  makeVignette() {
    const c = document.createElement('canvas');
    c.width = OUT_W;
    c.height = PIC_H;
    const x = c.getContext('2d');
    const grd = x.createRadialGradient(OUT_W / 2, PIC_H / 2, PIC_H * 0.45, OUT_W / 2, PIC_H / 2, OUT_W * 0.62);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(0,0,0,0.55)');
    x.fillStyle = grd;
    x.fillRect(0, 0, OUT_W, PIC_H);
    this.vignette = c;
  }

  load(mod) {
    if (this.scene) this.dispose();
    this.mod = mod;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.ctx = { scene: this.scene, camera: this.camera, renderer: this.renderer, film: this };
    this.S = mod.setup(this.ctx) || {};
    this.S.flash = 0;
    this.S.fade = 0;
    this.duration = mod.duration;
    // Compile une fois pour éviter un premier rendu lent pendant la lecture.
    this.renderer.compile(this.scene, this.camera);
  }

  dispose() {
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
    this.renderer.renderLists.dispose();
  }

  shotAt(t) {
    const shots = this.mod.shots;
    for (let i = 0; i < shots.length; i++) if (t >= shots[i].t[0] && t < shots[i].t[1]) return [shots[i], i];
    return [shots[shots.length - 1], shots.length - 1];
  }

  frame(t) {
    const { mod, S, camera } = this;
    t = clamp(t, 0, this.duration - 1e-4);
    const [shot, idx] = this.shotAt(t);
    const lt = t - shot.t[0];
    const dur = shot.t[1] - shot.t[0];
    S.flash = 0;
    S.fade = 0;
    S.shotIndex = idx;
    mod.update(t, S, this.ctx, shot, lt);
    const c = shot.cam(lt, S, lt / dur, t);
    let [px, py, pz] = c.pos;
    let [lx, ly, lz] = c.look;
    if (c.shake) {
      const [a, b, d] = shakeFn(t, c.shakeFreq ?? 1.3, idx * 13.7);
      px += a * c.shake; py += b * c.shake; pz += d * c.shake * 0.5;
      lx += a * c.shake * 0.6; ly += b * c.shake * 0.6;
    }
    camera.position.set(px, py, pz);
    camera.up.set(0, 1, 0);
    camera.lookAt(lx, ly, lz);
    if (c.roll) camera.rotateZ(c.roll);
    camera.fov = c.fov ?? 35;
    camera.near = c.near ?? 0.1;
    camera.far = c.far ?? 20000;
    camera.updateProjectionMatrix();
    this.renderer.render(this.scene, camera);
    this.compose(t, shot, idx, lt, dur);
  }

  compose(t, shot, idx, lt, dur) {
    const g = this.g;
    const { mod, S } = this;
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.fillStyle = '#000';
    g.fillRect(0, 0, OUT_W, OUT_H);
    g.drawImage(this.renderer.domElement, 0, BAR, OUT_W, PIC_H);
    // Interface diégétique dessinée par la scène (écrans, HUD, inserts)
    if (mod.overlay) {
      g.save();
      g.beginPath();
      g.rect(0, BAR, OUT_W, PIC_H);
      g.clip();
      g.translate(0, BAR);
      mod.overlay(g, t, S, shot, lt, { w: OUT_W, h: PIC_H });
      g.restore();
    }
    // Grain et vignettage
    g.globalAlpha = 0.07;
    g.globalCompositeOperation = 'overlay';
    const gc = this.grain[Math.floor(t * 24) % this.grain.length];
    const ox = Math.floor((t * 24 * 97) % 256);
    for (let x = -ox; x < OUT_W; x += 256) for (let y = BAR - (ox % 256); y < BAR + PIC_H; y += 256) g.drawImage(gc, x, y);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.drawImage(this.vignette, 0, BAR);
    // Éclair (impacts, tirs proches)
    if (S.flash > 0) {
      g.globalAlpha = clamp(S.flash);
      g.fillStyle = S.flashColor || '#fff';
      g.fillRect(0, BAR, OUT_W, PIC_H);
      g.globalAlpha = 1;
    }
    // Fondus : ouverture/fermeture de séquence + fondu demandé par la scène
    const fadeIn = 1 - smooth(inv(0, mod.fadeIn ?? 1.2, t));
    const fadeOut = smooth(inv(this.duration - (mod.fadeOut ?? 1.5), this.duration, t));
    const f = Math.max(fadeIn, fadeOut, S.fade);
    if (f > 0) {
      g.globalAlpha = clamp(f);
      g.fillStyle = '#000';
      g.fillRect(0, BAR, OUT_W, PIC_H);
      g.globalAlpha = 1;
    }
    // Carton de titre de séquence
    if (mod.card !== false) this.titleCard(t);
    if (mod.cards) for (const c of mod.cards) this.textCard(t, c);
    if (this.slate) this.drawSlate(t, shot, idx, lt, dur);
    this.drawSubs(t);
  }

  titleCard(t) {
    const { mod } = this;
    const a = smooth(inv(0.6, 1.6, t)) * (1 - smooth(inv(4.6, 5.6, t)));
    if (a <= 0) return;
    const g = this.g;
    g.save();
    g.globalAlpha = a;
    g.textAlign = 'left';
    g.fillStyle = 'rgba(220,230,225,0.85)';
    g.font = `500 15px ${FONT}`;
    g.letterSpacing = '4px';
    g.fillText((mod.chapter || '').toUpperCase(), 64, BAR + PIC_H - 92);
    g.letterSpacing = '0px';
    g.fillStyle = '#fff';
    g.font = `300 44px ${FONT}`;
    g.fillText(mod.title, 62, BAR + PIC_H - 46);
    g.restore();
  }

  // Cartons libres : { t, d, lines:[...], size, y, align }
  textCard(t, c) {
    const a = smooth(inv(c.t, c.t + 0.8, t)) * (1 - smooth(inv(c.t + c.d - 0.8, c.t + c.d, t)));
    if (a <= 0) return;
    const g = this.g;
    g.save();
    g.globalAlpha = a;
    g.textAlign = c.align || 'center';
    const x = c.align === 'left' ? 64 : OUT_W / 2;
    let y = BAR + (c.y ?? PIC_H / 2);
    for (const [i, line] of c.lines.entries()) {
      const big = i === 0 && c.big;
      g.font = big ? `200 ${c.size || 64}px ${FONT}` : `400 ${c.small || 20}px ${FONT}`;
      g.letterSpacing = big ? '10px' : '2px';
      g.fillStyle = big ? '#fff' : 'rgba(225,232,228,0.85)';
      g.fillText(line, x, y);
      y += big ? (c.size || 64) * 0.9 : (c.small || 20) * 1.7;
    }
    g.restore();
  }

  drawSlate(t, shot, idx, lt, dur) {
    const g = this.g;
    const { mod } = this;
    g.save();
    g.textAlign = 'left';
    g.font = `11px ${MONO}`;
    g.fillStyle = 'rgba(160,170,165,0.9)';
    const n = String(idx + 1).padStart(2, '0');
    const tot = String(mod.shots.length).padStart(2, '0');
    const tc = (s) => {
      const f = Math.floor((s % 1) * 24);
      const ss = Math.floor(s) % 60;
      const mm = Math.floor(s / 60);
      return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
    };
    g.fillText(`OTANE · PREVIZ   SC ${mod.id}  PLAN ${n}/${tot}   TC ${tc(t)}`, 24, 26);
    g.fillStyle = 'rgba(230,236,232,0.95)';
    g.font = `600 13px ${FONT}`;
    g.fillText(`${shot.plan}  ·  ${shot.optique}  ·  ${shot.mouvement}`, 24, 50);
    g.font = `12px ${FONT}`;
    g.fillStyle = 'rgba(190,200,195,0.85)';
    g.fillText(`Lumière : ${shot.lumiere}`, 24, 72);
    g.textAlign = 'right';
    g.font = `11px ${MONO}`;
    g.fillStyle = 'rgba(160,170,165,0.9)';
    g.fillText(`${mod.chapter}`, OUT_W - 24, 26);
    // Barre de durée du plan
    const w = 160;
    g.fillStyle = 'rgba(255,255,255,0.15)';
    g.fillRect(OUT_W - 24 - w, 44, w, 3);
    g.fillStyle = 'rgba(120,255,180,0.8)';
    g.fillRect(OUT_W - 24 - w, 44, w * clamp(lt / dur), 3);
    g.restore();
  }

  drawSubs(t) {
    const subs = this.mod.subs || [];
    const g = this.g;
    const active = subs.filter(([s, d]) => t >= s && t < s + d);
    if (!active.length) return;
    g.save();
    g.textAlign = 'center';
    const lines = active.slice(-2);
    let y = BAR + PIC_H + 38 - (lines.length - 1) * 30;
    for (const [s, d, who, text] of lines) {
      const a = smooth(inv(s, s + 0.15, t)) * (1 - smooth(inv(s + d - 0.15, s + d, t)));
      g.globalAlpha = a;
      g.font = `500 24px ${FONT}`;
      const body = who === '*' ? text : `— ${text}`;
      const isNarr = who === '*';
      if (isNarr) g.font = `italic 300 23px ${FONT}`;
      const tw = g.measureText(body).width;
      if (who && who !== '*') {
        g.font = `600 11px ${FONT}`;
        g.letterSpacing = '2px';
        g.fillStyle = SPEAKER_COLORS[who] || 'rgba(170,180,175,0.9)';
        g.textAlign = 'right';
        g.fillText(who.toUpperCase(), OUT_W / 2 - tw / 2 - 14, y - 2);
        g.letterSpacing = '0px';
        g.textAlign = 'center';
        g.font = `500 24px ${FONT}`;
      }
      g.fillStyle = isNarr ? 'rgba(215,225,220,0.92)' : '#f4f4f0';
      g.fillText(body, OUT_W / 2, y + 6);
      y += 32;
    }
    g.restore();
  }
}

export const SPEAKER_COLORS = {
  Balam: '#e8b070',
  Glide: '#7fd6e8',
  Fara: '#c8a8f0',
  Kovar: '#a0aab0',
  Pik: '#f0d070',
  Relais: '#9aa0a0',
  Dril: '#f07060',
  Lio: '#90e0a0',
  Sava: '#d0c0a0',
  Scientifique: '#a0e0c0',
  Tess: '#f0a0c0',
  Vek: '#f08080',
  Contrôle: '#9aa0a0',
  Agent: '#9aa0a0',
};
