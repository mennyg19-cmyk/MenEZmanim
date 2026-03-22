/**
 * Generate tileable texture images using node-canvas + Perlin noise.
 * Run: node scripts/generate-textures.js
 * Output: apps/web/public/textures/*.png
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZE = 512;
const OUT = path.join(__dirname, '..', 'apps', 'web', 'public', 'textures');

// ── Perlin noise (classic, tileable) ──

const PERM = new Uint8Array(512);
const GRAD = [
  [1,1],[-1,1],[1,-1],[-1,-1],
  [1,0],[-1,0],[0,1],[0,-1],
];
function initPerm(seed) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
}

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a, b, t) { return a + t * (b - a); }
function dot2(g, x, y) { return g[0] * x + g[1] * y; }

function perlin2(x, y) {
  const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x), yf = y - Math.floor(y);
  const u = fade(xf), v = fade(yf);
  const aa = PERM[PERM[xi] + yi], ab = PERM[PERM[xi] + yi + 1];
  const ba = PERM[PERM[xi + 1] + yi], bb = PERM[PERM[xi + 1] + yi + 1];
  return lerp(
    lerp(dot2(GRAD[aa & 7], xf, yf), dot2(GRAD[ba & 7], xf - 1, yf), u),
    lerp(dot2(GRAD[ab & 7], xf, yf - 1), dot2(GRAD[bb & 7], xf - 1, yf - 1), u),
    v,
  );
}

function fbm(x, y, octaves, lacunarity, gain) {
  let val = 0, amp = 1, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    val += perlin2(x * freq, y * freq) * amp;
    max += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return val / max;
}

/** Tileable fbm: wraps seamlessly at SIZE boundaries */
function fbmTile(px, py, scale, octaves, lac, gain) {
  const nx = px / SIZE, ny = py / SIZE;
  const angle1 = nx * Math.PI * 2, angle2 = ny * Math.PI * 2;
  const x = Math.cos(angle1) * scale, y = Math.sin(angle1) * scale;
  const z = Math.cos(angle2) * scale, w = Math.sin(angle2) * scale;
  // 4D noise approximated with 2 2D samples
  return (fbm(x + z * 0.3, y + w * 0.3, octaves, lac, gain) +
          fbm(x * 0.7 + 13.7, z * 0.7 + 27.3, octaves, lac, gain)) * 0.5;
}

function clamp(v, lo = 0, hi = 255) { return Math.max(lo, Math.min(hi, Math.round(v))); }

// ── Texture generators ──

function generateMarble(ctx, baseR, baseG, baseB, veinR, veinG, veinB, seed) {
  initPerm(seed);
  const img = ctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const n1 = fbmTile(x, y, 2.5, 6, 2.0, 0.5);
      const n2 = fbmTile(x + 100, y + 200, 4.0, 4, 2.0, 0.5);
      const vein = Math.abs(Math.sin((x / SIZE * 6 + n1 * 4) * Math.PI));
      const detail = Math.abs(Math.sin((y / SIZE * 4 + n2 * 3) * Math.PI));
      const v = vein * 0.6 + detail * 0.4;
      const t = v * v;
      const r = clamp(lerp(baseR, veinR, t) + (n1 * 15));
      const g = clamp(lerp(baseG, veinG, t) + (n1 * 15));
      const b = clamp(lerp(baseB, veinB, t) + (n1 * 15));
      const i = (y * SIZE + x) * 4;
      img.data[i] = r; img.data[i+1] = g; img.data[i+2] = b; img.data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function generateWood(ctx, baseR, baseG, baseB, darkR, darkG, darkB, seed) {
  initPerm(seed);
  const img = ctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const n = fbmTile(x, y, 1.5, 4, 2.0, 0.5);
      const ring = Math.abs(Math.sin((x / SIZE * 20 + n * 5) * Math.PI));
      const grain = fbmTile(x, y, 8.0, 2, 2.0, 0.5) * 0.15;
      const t = ring * 0.7 + grain;
      const r = clamp(lerp(baseR, darkR, t));
      const g = clamp(lerp(baseG, darkG, t));
      const b = clamp(lerp(baseB, darkB, t));
      const i = (y * SIZE + x) * 4;
      img.data[i] = r; img.data[i+1] = g; img.data[i+2] = b; img.data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function generateMetal(ctx, baseR, baseG, baseB, hiR, hiG, hiB, seed) {
  initPerm(seed);
  const img = ctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const brush = fbmTile(x, y, 12.0, 3, 2.0, 0.5) * 0.3;
      const n = fbmTile(x, y, 3.0, 4, 2.0, 0.5) * 0.15;
      const t = 0.5 + brush + n;
      const r = clamp(lerp(baseR, hiR, t));
      const g = clamp(lerp(baseG, hiG, t));
      const b = clamp(lerp(baseB, hiB, t));
      const i = (y * SIZE + x) * 4;
      img.data[i] = r; img.data[i+1] = g; img.data[i+2] = b; img.data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function generateFabric(ctx, baseR, baseG, baseB, threadR, threadG, threadB, seed, weaveScale) {
  initPerm(seed);
  const img = ctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const warp = Math.sin(x / weaveScale * Math.PI * 2) * 0.5 + 0.5;
      const weft = Math.sin(y / weaveScale * Math.PI * 2) * 0.5 + 0.5;
      const weave = (warp + weft) * 0.5;
      const n = fbmTile(x, y, 4.0, 3, 2.0, 0.5) * 0.1;
      const t = weave * 0.3 + n;
      const r = clamp(lerp(baseR, threadR, t));
      const g = clamp(lerp(baseG, threadG, t));
      const b = clamp(lerp(baseB, threadB, t));
      const i = (y * SIZE + x) * 4;
      img.data[i] = r; img.data[i+1] = g; img.data[i+2] = b; img.data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function generateStone(ctx, baseR, baseG, baseB, spotR, spotG, spotB, seed) {
  initPerm(seed);
  const img = ctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const n1 = fbmTile(x, y, 3.0, 5, 2.0, 0.5);
      const n2 = fbmTile(x + 300, y + 500, 6.0, 3, 2.0, 0.5);
      const t = (n1 * 0.5 + 0.5) * 0.7 + n2 * 0.15;
      const r = clamp(lerp(baseR, spotR, t));
      const g = clamp(lerp(baseG, spotG, t));
      const b = clamp(lerp(baseB, spotB, t));
      const i = (y * SIZE + x) * 4;
      img.data[i] = r; img.data[i+1] = g; img.data[i+2] = b; img.data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

// ── Main ──

const TEXTURES = [
  { name: 'marble-black', fn: (ctx) => generateMarble(ctx, 18, 18, 22, 180, 175, 170, 42) },
  { name: 'marble-white', fn: (ctx) => generateMarble(ctx, 235, 230, 225, 170, 165, 158, 77) },
  { name: 'marble-cream', fn: (ctx) => generateMarble(ctx, 230, 218, 195, 185, 165, 135, 123) },
  { name: 'marble-green', fn: (ctx) => generateMarble(ctx, 30, 60, 40, 140, 180, 145, 201) },
  { name: 'marble-blue', fn: (ctx) => generateMarble(ctx, 40, 55, 80, 150, 170, 200, 311) },
  { name: 'wood-oak', fn: (ctx) => generateWood(ctx, 196, 165, 116, 139, 90, 43, 55) },
  { name: 'wood-walnut', fn: (ctx) => generateWood(ctx, 92, 64, 51, 42, 26, 16, 88) },
  { name: 'wood-cherry', fn: (ctx) => generateWood(ctx, 139, 64, 48, 92, 32, 24, 99) },
  { name: 'wood-pine', fn: (ctx) => generateWood(ctx, 220, 200, 160, 170, 140, 90, 144) },
  { name: 'metal-brushed', fn: (ctx) => generateMetal(ctx, 140, 144, 150, 200, 204, 210, 177) },
  { name: 'metal-gold', fn: (ctx) => generateMetal(ctx, 170, 135, 50, 220, 190, 100, 222) },
  { name: 'concrete', fn: (ctx) => generateStone(ctx, 160, 160, 160, 130, 130, 130, 333) },
  { name: 'slate', fn: (ctx) => generateStone(ctx, 74, 85, 104, 50, 58, 72, 444) },
  { name: 'linen', fn: (ctx) => generateFabric(ctx, 235, 230, 220, 215, 210, 200, 555, 3) },
  { name: 'leather', fn: (ctx) => generateFabric(ctx, 92, 61, 46, 62, 38, 24, 666, 5) },
];

fs.mkdirSync(OUT, { recursive: true });

for (const tex of TEXTURES) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  tex.fn(ctx);
  const buf = canvas.toBuffer('image/png');
  const outPath = path.join(OUT, `${tex.name}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`  ✓ ${tex.name}.png (${(buf.length / 1024).toFixed(0)} KB)`);
}

console.log(`\nDone! ${TEXTURES.length} textures written to ${OUT}`);
