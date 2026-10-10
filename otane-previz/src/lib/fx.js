import * as THREE from 'three';
import { rng } from './util.js';

const texCache = new Map();

// Halo radial pour les sources lumineuses (remplace un bloom coûteux).
export function glowTexture(kind = 'soft') {
  if (texCache.has(kind)) return texCache.get(kind);
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  if (kind === 'hard') {
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.15, 'rgba(255,255,255,0.9)');
    grd.addColorStop(0.35, 'rgba(255,255,255,0.25)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
  } else {
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.25, 'rgba(255,255,255,0.45)');
    grd.addColorStop(0.6, 'rgba(255,255,255,0.08)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
  }
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  if (kind === 'star') {
    g.globalCompositeOperation = 'lighter';
    const l = g.createLinearGradient(0, 64, 128, 64);
    l.addColorStop(0, 'rgba(255,255,255,0)');
    l.addColorStop(0.5, 'rgba(255,255,255,0.7)');
    l.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = l;
    g.fillRect(0, 62, 128, 4);
    g.save();
    g.translate(64, 64);
    g.rotate(Math.PI / 2);
    g.translate(-64, -64);
    g.fillRect(0, 62, 128, 4);
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(kind, t);
  return t;
}

export function glow(color = 0xffffff, size = 1, opacity = 1, kind = 'soft') {
  const m = new THREE.SpriteMaterial({
    map: glowTexture(kind),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(size);
  s.userData.baseSize = size;
  return s;
}

// Champ d'étoiles en points, avec scintillement et « vibration » (marée aveugle).
export function starfield({ count = 5000, radius = 3000, seed = 7, warm = 0.2 } = {}) {
  const r = rng(seed);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const ph = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const u = r() * 2 - 1;
    const th = r() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    pos.set([radius * s * Math.cos(th), radius * u, radius * s * Math.sin(th)], i * 3);
    const k = r();
    const c = k < warm ? [1, 0.82, 0.65] : k < warm + 0.25 ? [0.7, 0.8, 1] : [1, 1, 1];
    const b = 0.35 + 0.65 * Math.pow(r(), 3);
    col.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
    size[i] = 1 + Math.pow(r(), 6) * 4;
    ph[i] = r() * 100;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('size', new THREE.BufferAttribute(size, 1));
  g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, jitter: { value: 0 }, stretch: { value: 0 }, opacity: { value: 1 } },
    vertexShader: `
      attribute float size; attribute float phase; attribute vec3 color;
      uniform float time; uniform float jitter; uniform float stretch;
      varying vec3 vC; varying float vA;
      void main(){
        vec3 p = position;
        p += jitter * 6.0 * vec3(sin(time*23.0+phase), cos(time*19.0+phase*1.3), sin(time*29.0+phase*0.7));
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = size * (1.0 + stretch*3.0);
        vC = color * (0.8 + 0.2*sin(time*2.0+phase));
        vA = 1.0;
      }`,
    fragmentShader: `
      uniform float opacity; varying vec3 vC; varying float vA;
      void main(){
        vec2 d = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.0, length(d));
        gl_FragColor = vec4(vC, a * opacity);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  pts.renderOrder = -10;
  return pts;
}

// Fond nébuleux peint une fois dans un canvas équirectangulaire.
export function nebulaSky({ seed = 3, hues = [[30, 60, 110], [90, 40, 120]], density = 0.5, radius = 4000 } = {}) {
  const r = rng(seed);
  const W = 1024, H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#010205';
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter';
  const n = Math.floor(90 * density);
  for (let i = 0; i < n; i++) {
    const [cr, cg, cb] = r.pick(hues);
    const x = r() * W;
    const y = H * 0.5 + (r() - 0.5) * H * 0.5 * (0.4 + r());
    const rad = 30 + r() * 180;
    const a = 0.025 + r() * 0.05;
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    grd.addColorStop(0, `rgba(${cr},${cg},${cb},${a})`);
    grd.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    g.fillStyle = grd;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    if (x < rad) g.fillRect(x - rad + W, y - rad, rad * 2, rad * 2);
    if (x > W - rad) g.fillRect(x - rad - W, y - rad, rad * 2, rad * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, depthWrite: false, fog: false });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), m);
  mesh.renderOrder = -20;
  return mesh;
}

// Filaments lumineux qui défilent : le Sillage, les courants, les marées.
export function filaments({ count = 160, length = 2000, radius = 120, seed = 11, color = 0x3dff9a, twist = 1.5, segments = 60, spread = 1 } = {}) {
  const r = rng(seed);
  const verts = [];
  const us = [];
  const ids = [];
  for (let i = 0; i < count; i++) {
    const a0 = r() * Math.PI * 2;
    const rr = radius * (0.35 + 0.65 * Math.sqrt(r())) * spread;
    const wob = r() * 0.4;
    const ph = r() * 10;
    for (let s = 0; s < segments; s++) {
      for (const k of [s, s + 1]) {
        const u = k / segments;
        const a = a0 + u * twist * Math.PI * 2 + Math.sin(u * 6 + ph) * wob;
        const rad = rr * (1 + 0.15 * Math.sin(u * 9 + ph));
        verts.push(Math.cos(a) * rad, Math.sin(a) * rad, -u * length);
        us.push(u);
        ids.push(i);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('u', new THREE.Float32BufferAttribute(us, 1));
  g.setAttribute('fid', new THREE.Float32BufferAttribute(ids, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, color: { value: new THREE.Color(color) }, intensity: { value: 1 }, speed: { value: 1 } },
    vertexShader: `
      attribute float u; attribute float fid; varying float vU; varying float vId;
      void main(){ vU=u; vId=fid; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      uniform float time; uniform vec3 color; uniform float intensity; uniform float speed;
      varying float vU; varying float vId;
      void main(){
        float k = fract(vU*6.0 - time*speed*0.35 + vId*0.137);
        float a = pow(k, 6.0) + 0.12;
        float edge = smoothstep(0.0,0.05,vU)*smoothstep(1.0,0.85,vU);
        gl_FragColor = vec4(color*(0.6+1.4*pow(k,10.0)), a*edge*intensity);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const l = new THREE.LineSegments(g, m);
  l.frustumCulled = false;
  return l;
}

// Particules additives (étincelles, éclats, fragments lumineux).
export function sparkCloud({ count = 400, seed = 5, color = 0xffffff, size = 2, spread = [100, 100, 100] } = {}) {
  const r = rng(seed);
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  const ph = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos.set([(r() - 0.5) * spread[0], (r() - 0.5) * spread[1], (r() - 0.5) * spread[2]], i * 3);
    vel.set([r() - 0.5, r() - 0.5, r() - 0.5], i * 3);
    ph[i] = r();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('vel', new THREE.BufferAttribute(vel, 3));
  g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }, color: { value: new THREE.Color(color) }, size: { value: size },
      amount: { value: 1 }, flow: { value: new THREE.Vector3(0, 0, 0) }, wrap: { value: new THREE.Vector3(...spread) },
      spd: { value: 0 },
    },
    vertexShader: `
      attribute vec3 vel; attribute float phase;
      uniform float time; uniform float size; uniform float amount; uniform vec3 flow; uniform vec3 wrap; uniform float spd;
      varying float vA;
      void main(){
        vec3 p = position + vel*spd*time + flow*time;
        p = mod(p + wrap*0.5, wrap) - wrap*0.5;
        vec4 mv = modelViewMatrix*vec4(p,1.0);
        gl_Position = projectionMatrix*mv;
        float on = step(phase, amount);
        float tw = 0.5+0.5*sin(time*30.0+phase*80.0);
        gl_PointSize = size * on * (300.0 / max(1.0,-mv.z)) * (0.6+0.8*tw);
        vA = on * (0.4+0.6*tw);
      }`,
    fragmentShader: `
      uniform vec3 color; varying float vA;
      void main(){ vec2 d=gl_PointCoord-0.5; float a=smoothstep(0.5,0.0,length(d)); gl_FragColor=vec4(color, a*vA); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  return p;
}

// Cône de projecteur / faisceau (additif, sans ombre).
export function beam({ length = 60, radius = 8, color = 0xfff2b0, opacity = 0.25 } = {}) {
  const g = new THREE.ConeGeometry(radius, length, 24, 1, true);
  g.translate(0, -length / 2, 0);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color) }, opacity: { value: opacity }, len: { value: length } },
    vertexShader: `varying float vZ; varying vec3 vN; varying vec3 vV;
      void main(){ vZ = -position.z; vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 color; uniform float opacity; uniform float len; varying float vZ; varying vec3 vN; varying vec3 vV;
      void main(){ float f = 1.0 - clamp(vZ/len,0.0,1.0); float rim = pow(abs(dot(vN,vV)),1.5);
        gl_FragColor = vec4(color, opacity*f*f*rim); }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(g, m);
}

// Planète texturée procéduralement + halo atmosphérique.
export function planet({ radius = 100, seed = 1, kind = 'earth', atmo = 0x6fb6ff } = {}) {
  const r = rng(seed);
  const W = 1024, H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const blobs = (n, colFn, minR, maxR, lat = 1) => {
    for (let i = 0; i < n; i++) {
      const x = r() * W;
      const y = H / 2 + (r() - 0.5) * H * lat;
      const rad = minR + r() * (maxR - minR);
      g.fillStyle = colFn(i);
      g.beginPath();
      g.ellipse(x, y, rad * (1 + r()), rad, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  };
  if (kind === 'earth') {
    g.fillStyle = '#0b2a52';
    g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.9;
    blobs(260, () => (r() < 0.6 ? '#3d4a2c' : '#6b5a3a'), 6, 40, 0.75);
    // Nappe de poussière sur l'Afrique du Nord.
    g.globalAlpha = 0.35;
    blobs(60, () => '#c9a46a', 20, 70, 0.15);
    g.globalAlpha = 0.5;
    blobs(220, () => 'rgba(240,245,255,0.8)', 4, 30, 0.9);
  } else if (kind === 'nerea') {
    g.fillStyle = '#2a5f9e';
    g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.6;
    blobs(300, () => (r() < 0.5 ? '#e8f2ff' : '#5c95d6'), 6, 45, 1);
  } else if (kind === 'moon') {
    g.fillStyle = '#8a8a88';
    g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.4;
    blobs(300, () => (r() < 0.5 ? '#6c6c6a' : '#a3a3a0'), 3, 30, 1);
  } else if (kind === 'barren') {
    g.fillStyle = '#5a5855';
    g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.5;
    blobs(400, () => (r() < 0.5 ? '#3e3d3b' : '#7a7874'), 2, 22, 1);
  } else if (kind === 'famine') {
    g.fillStyle = '#7a5a3a';
    g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.5;
    blobs(300, () => (r() < 0.5 ? '#5e4a36' : '#a88a5c'), 4, 40, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  // Lumières nocturnes en grappes (Terre).
  let emissiveMap = null;
  if (kind === 'earth') {
    const e = document.createElement('canvas');
    e.width = W;
    e.height = H;
    const eg = e.getContext('2d');
    eg.fillStyle = '#000';
    eg.fillRect(0, 0, W, H);
    for (let k = 0; k < 40; k++) {
      const cx = r() * W, cy = H / 2 + (r() - 0.5) * H * 0.6;
      for (let i = 0; i < 40; i++) {
        eg.fillStyle = `rgba(255,${180 + r() * 60},${90 + r() * 60},${0.5 + r() * 0.5})`;
        eg.fillRect(cx + (r() - 0.5) * 40, cy + (r() - 0.5) * 25, 1.5, 1.5);
      }
    }
    emissiveMap = new THREE.CanvasTexture(e);
    emissiveMap.colorSpace = THREE.SRGBColorSpace;
  }
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.9,
    metalness: 0,
    emissive: emissiveMap ? 0xffffff : 0x000000,
    emissiveMap,
    emissiveIntensity: emissiveMap ? 0.6 : 0,
  });
  const grp = new THREE.Group();
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 192, 96), mat);
  grp.add(sphere);
  if (atmo) {
    const am = new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(atmo) }, power: { value: 2.5 }, strength: { value: 1.2 } },
      vertexShader: `varying vec3 vN; varying vec3 vV;
        void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 color; uniform float power; uniform float strength; varying vec3 vN; varying vec3 vV;
        void main(){ float f = pow(1.0 - abs(dot(vN, vV)), power); gl_FragColor = vec4(color, f*strength); }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
    });
    const shell = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.025, 64, 32), am);
    grp.add(shell);
  }
  grp.userData.sphere = sphere;
  return grp;
}

// Tir d'impulsion : un trait lumineux qui se déplace entre deux points.
export function bolt(color = 0xffb060, len = 12, width = 0.4) {
  const g = new THREE.CylinderGeometry(width, width, len, 6, 1, true);
  g.rotateX(Math.PI / 2);
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const mesh = new THREE.Mesh(g, m);
  const h = glow(color, len * 0.8, 0.6);
  mesh.add(h);
  mesh.visible = false;
  mesh.userData.len = len;
  return mesh;
}

// Place un tir le long d'un segment selon une progression 0..1.
export function shootBolt(b, from, to, u) {
  if (u <= 0 || u >= 1) {
    b.visible = false;
    return;
  }
  b.visible = true;
  b.position.set(from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u, from[2] + (to[2] - from[2]) * u);
  b.lookAt(to[0], to[1], to[2]);
}

// Explosion simple : boule + éclats, pilotée par un âge 0..1.
export function explosion(color = 0xffa040, size = 20, seed = 9) {
  const grp = new THREE.Group();
  const core = glow(color, size, 1, 'hard');
  const halo = glow(0xff5020, size * 2.5, 0.6);
  const sp = sparkCloud({ count: 120, seed, color: 0xffd090, size: size * 0.08, spread: [size * 3, size * 3, size * 3] });
  grp.add(core, halo, sp);
  grp.userData = { core, halo, sp, size };
  grp.visible = false;
  return grp;
}

export function setExplosion(e, age) {
  if (age <= 0 || age >= 1) {
    e.visible = false;
    return;
  }
  e.visible = true;
  const { core, halo, sp, size } = e.userData;
  const k = Math.sqrt(age);
  core.scale.setScalar(size * (0.3 + 1.2 * k));
  core.material.opacity = 1 - age;
  halo.scale.setScalar(size * (1 + 3 * k));
  halo.material.opacity = 0.7 * (1 - age);
  sp.scale.setScalar(0.1 + 1.6 * k);
  sp.material.uniforms.amount.value = 1 - age;
  sp.material.uniforms.time.value = age * 3;
}
