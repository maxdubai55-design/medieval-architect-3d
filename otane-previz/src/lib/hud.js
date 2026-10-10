// Interfaces diégétiques dessinées en 2D par-dessus l'image (écrans, visières, cartes tactiques).
import { clamp } from './util.js';

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"DejaVu Sans Mono", Menlo, Consolas, monospace';

export function panel(g, x, y, w, h, { color = 'rgba(120,255,180,0.8)', fill = 'rgba(5,15,12,0.55)', alpha = 1 } = {}) {
  g.save();
  g.globalAlpha *= alpha;
  g.fillStyle = fill;
  g.fillRect(x, y, w, h);
  g.strokeStyle = color;
  g.lineWidth = 1;
  g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const k = 8;
  g.lineWidth = 2;
  for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    g.beginPath();
    g.moveTo(cx, cy + dy * k);
    g.lineTo(cx, cy);
    g.lineTo(cx + dx * k, cy);
    g.stroke();
  }
  g.restore();
}

export function text(g, s, x, y, { size = 14, color = 'rgba(160,255,200,0.95)', mono = true, align = 'left', weight = 500, alpha = 1, spacing = 0 } = {}) {
  g.save();
  g.globalAlpha *= alpha;
  g.font = `${weight} ${size}px ${mono ? MONO : FONT}`;
  g.fillStyle = color;
  g.textAlign = align;
  if (spacing) g.letterSpacing = `${spacing}px`;
  g.fillText(s, x, y);
  g.restore();
}

// Jauge horizontale avec seuil marqué (le « 96,8 » de Pik).
export function gauge(g, x, y, w, h, value, { limit = null, label = '', color = '#ffb040', danger = '#ff4030', max = 100, alpha = 1, decimals = 0 } = {}) {
  g.save();
  g.globalAlpha *= alpha;
  g.fillStyle = 'rgba(0,0,0,0.5)';
  g.fillRect(x, y, w, h);
  const v = clamp(value / max);
  const over = limit !== null && value > limit;
  g.fillStyle = over ? danger : color;
  g.fillRect(x, y, w * v, h);
  g.strokeStyle = 'rgba(255,255,255,0.4)';
  g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (limit !== null) {
    const lx = x + (w * limit) / max;
    g.strokeStyle = '#ff3020';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(lx, y - 5);
    g.lineTo(lx, y + h + 5);
    g.stroke();
  }
  g.font = `600 13px ${MONO}`;
  g.fillStyle = over ? danger : '#f0f0e8';
  g.fillText(`${label} ${value.toFixed(decimals).replace('.', ',')} %`, x, y - 8);
  g.restore();
}

// Cercle de visée / réticule.
export function reticle(g, x, y, r, { color = 'rgba(120,255,180,0.8)', alpha = 1, lock = 0 } = {}) {
  g.save();
  g.globalAlpha *= alpha;
  g.strokeStyle = lock > 0.5 ? 'rgba(255,80,60,0.95)' : color;
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + lock * Math.PI * 0.25;
    g.beginPath();
    g.moveTo(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6);
    g.lineTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3);
    g.stroke();
  }
  g.restore();
}

// Courbe recommandée par la Cadence (arcs bleus fins).
export function arc(g, pts, { color = 'rgba(110,170,255,0.6)', width = 1.5, dash = [], alpha = 1 } = {}) {
  g.save();
  g.globalAlpha *= alpha;
  g.strokeStyle = color;
  g.lineWidth = width;
  g.setLineDash(dash);
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
  g.restore();
}

export function blip(g, x, y, { color = '#ff5040', size = 5, label = '', alpha = 1 } = {}) {
  g.save();
  g.globalAlpha *= alpha;
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x, y - size);
  g.lineTo(x + size, y);
  g.lineTo(x, y + size);
  g.lineTo(x - size, y);
  g.closePath();
  g.fill();
  if (label) {
    g.font = `11px ${MONO}`;
    g.fillText(label, x + size + 4, y + 4);
  }
  g.restore();
}

// Alerte plein cadre (texte qui clignote).
export function alert(g, s, x, y, t, { color = '#ff4030', size = 18, blink = 3, alpha = 1, align = 'center' } = {}) {
  const on = Math.sin(t * Math.PI * 2 * blink) > -0.3 ? 1 : 0.25;
  text(g, s, x, y, { size, color, align, weight: 700, alpha: alpha * on, spacing: 2 });
}

// Liste de branches civiles du Sillage (états qui changent).
export function branchList(g, x, y, rows, { alpha = 1, title = 'BRANCHES CIVILES' } = {}) {
  panel(g, x, y, 300, 30 + rows.length * 22, { alpha });
  text(g, title, x + 12, y + 20, { size: 11, alpha, color: 'rgba(200,230,215,0.9)' });
  rows.forEach(([name, state], i) => {
    const col = state === 'ok' ? '#60f0a0' : state === 'warn' ? '#ffb040' : state === 'dead' ? '#ff4030' : '#a0a0a0';
    const lab = state === 'ok' ? 'STABLE' : state === 'warn' ? 'DÉRIVE' : state === 'dead' ? 'PERTE DE LIAISON' : state;
    g.save();
    g.globalAlpha *= alpha;
    g.fillStyle = col;
    g.fillRect(x + 12, y + 34 + i * 22, 8, 8);
    g.restore();
    text(g, name, x + 28, y + 42 + i * 22, { size: 12, alpha, color: '#e8f0ea' });
    text(g, lab, x + 288, y + 42 + i * 22, { size: 11, alpha, color: col, align: 'right' });
  });
}
