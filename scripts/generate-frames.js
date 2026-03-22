/**
 * Generate 8-piece frame image sets using node-canvas.
 * Each frame is rendered at high resolution, then sliced into:
 *   tl, t, tr, l, r, bl, b, br  (corners + sides)
 *   + preview.png (thumbnail)
 *
 * Run: node scripts/generate-frames.js
 * Output: apps/web/public/frames/{frameId}/
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'apps', 'web', 'public', 'frames');

/**
 * Render a full frame on a canvas, then slice into 8 pieces.
 * @param {string} id - frame identifier
 * @param {number} fullSize - full canvas size (square)
 * @param {number} thickness - border thickness in px
 * @param {function} drawFn - (ctx, fullSize, thickness) => void
 */
function generateFrame(id, fullSize, thickness, drawFn) {
  const dir = path.join(OUT, id);
  fs.mkdirSync(dir, { recursive: true });

  const canvas = createCanvas(fullSize, fullSize);
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, fullSize, fullSize);
  drawFn(ctx, fullSize, thickness);

  const corner = thickness;
  const side = fullSize - 2 * corner;

  const pieces = {
    tl: [0, 0, corner, corner],
    t:  [corner, 0, side, corner],
    tr: [fullSize - corner, 0, corner, corner],
    l:  [0, corner, corner, side],
    r:  [fullSize - corner, corner, corner, side],
    bl: [0, fullSize - corner, corner, corner],
    b:  [corner, fullSize - corner, side, corner],
    br: [fullSize - corner, fullSize - corner, corner, corner],
  };

  for (const [name, [sx, sy, sw, sh]] of Object.entries(pieces)) {
    const pc = createCanvas(sw, sh);
    const pctx = pc.getContext('2d');
    pctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    const buf = pc.toBuffer('image/png');
    fs.writeFileSync(path.join(dir, `${name}.png`), buf);
  }

  // Preview: scale down to 120x120
  const prev = createCanvas(120, 120);
  const prevCtx = prev.getContext('2d');
  prevCtx.drawImage(canvas, 0, 0, 120, 120);
  fs.writeFileSync(path.join(dir, 'preview.png'), prev.toBuffer('image/png'));

  const totalKB = Object.entries(pieces).reduce((sum, [name]) => {
    return sum + fs.statSync(path.join(dir, `${name}.png`)).size;
  }, 0) / 1024;
  console.log(`  ✓ ${id} (${Object.keys(pieces).length} pieces, ~${totalKB.toFixed(0)} KB total, corner=${corner}px)`);
}

// ── Drawing helpers ──

function goldGradient(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, '#f6e27a');
  g.addColorStop(0.2, '#d4a843');
  g.addColorStop(0.45, '#c49530');
  g.addColorStop(0.55, '#d4a843');
  g.addColorStop(0.8, '#b8862a');
  g.addColorStop(1, '#f6e27a');
  return g;
}

function silverGradient(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, '#e8e8ee');
  g.addColorStop(0.25, '#c0c0cc');
  g.addColorStop(0.5, '#9090a0');
  g.addColorStop(0.75, '#c0c0cc');
  g.addColorStop(1, '#e8e8ee');
  return g;
}

function woodGradient(ctx, x0, y0, x1, y1, dark) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  if (dark) {
    g.addColorStop(0, '#6b4d2a');
    g.addColorStop(0.3, '#5a3d1a');
    g.addColorStop(0.5, '#4a3018');
    g.addColorStop(0.7, '#5a3d1a');
    g.addColorStop(1, '#6b4d2a');
  } else {
    g.addColorStop(0, '#c4a574');
    g.addColorStop(0.3, '#a68850');
    g.addColorStop(0.5, '#8b6d3a');
    g.addColorStop(0.7, '#a68850');
    g.addColorStop(1, '#c4a574');
  }
  return g;
}

function drawBeveledRect(ctx, x, y, w, h, bevel, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.fillRect(x, y, w, h);

  // Light bevel (top-left edges)
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(x, y, w, bevel);
  ctx.fillRect(x, y, bevel, h);

  // Dark bevel (bottom-right edges)
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x, y + h - bevel, w, bevel);
  ctx.fillRect(x + w - bevel, y, bevel, h);
}

function drawCornerOrnament(ctx, cx, cy, radius, fillStyle) {
  ctx.save();
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(cx - radius * 0.15, cy - radius * 0.15, radius * 0.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.arc(cx + radius * 0.1, cy + radius * 0.1, radius * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEdgeDot(ctx, cx, cy, r, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

// ── Frame definitions ──

const FRAMES = [
  {
    id: 'gold-classic',
    fullSize: 400,
    thickness: 50,
    draw(ctx, S, T) {
      const g = goldGradient(ctx, 0, 0, S, S);
      // Outer frame
      drawBeveledRect(ctx, 0, 0, S, T, 3, g);       // top
      drawBeveledRect(ctx, 0, S - T, S, T, 3, g);    // bottom
      drawBeveledRect(ctx, 0, T, T, S - 2*T, 3, g);  // left
      drawBeveledRect(ctx, S - T, T, T, S - 2*T, 3, g); // right

      // Inner groove
      const gi = goldGradient(ctx, T*0.6, T*0.6, S - T*0.6, S - T*0.6);
      ctx.strokeStyle = gi;
      ctx.lineWidth = 3;
      ctx.strokeRect(T * 0.75, T * 0.75, S - T * 1.5, S - T * 1.5);

      // Outer edge line
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, S - 2, S - 2);

      // Inner edge line
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(T - 1, T - 1, S - 2*T + 2, S - 2*T + 2);

      // Corner ornaments
      const ornG = goldGradient(ctx, 0, 0, T, T);
      const cr = T * 0.28;
      drawCornerOrnament(ctx, T * 0.5, T * 0.5, cr, ornG);
      drawCornerOrnament(ctx, S - T * 0.5, T * 0.5, cr, ornG);
      drawCornerOrnament(ctx, T * 0.5, S - T * 0.5, cr, ornG);
      drawCornerOrnament(ctx, S - T * 0.5, S - T * 0.5, cr, ornG);
    },
  },
  {
    id: 'gold-ornate',
    fullSize: 480,
    thickness: 65,
    draw(ctx, S, T) {
      const g = goldGradient(ctx, 0, 0, S, S);
      // Thick outer band
      drawBeveledRect(ctx, 0, 0, S, T, 4, g);
      drawBeveledRect(ctx, 0, S - T, S, T, 4, g);
      drawBeveledRect(ctx, 0, T, T, S - 2*T, 4, g);
      drawBeveledRect(ctx, S - T, T, T, S - 2*T, 4, g);

      // Middle groove
      const mid = T * 0.55;
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(mid, mid, S - 2*mid, S - 2*mid);

      // Inner lip
      const inner = T * 0.8;
      const gi = goldGradient(ctx, inner, inner, S - inner, S - inner);
      ctx.strokeStyle = gi;
      ctx.lineWidth = 4;
      ctx.strokeRect(inner, inner, S - 2*inner, S - 2*inner);

      // Outer border
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, S - 2, S - 2);

      // Inner border
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(T - 1, T - 1, S - 2*T + 2, S - 2*T + 2);

      // Corner L-brackets
      const ornG = goldGradient(ctx, 0, 0, T, T);
      const bw = T * 0.35, bh = T * 0.12;
      // TL
      ctx.fillStyle = ornG; ctx.fillRect(T*0.15, T*0.15, bw, bh); ctx.fillRect(T*0.15, T*0.15, bh, bw);
      // TR
      ctx.fillStyle = ornG; ctx.fillRect(S - T*0.15 - bw, T*0.15, bw, bh); ctx.fillRect(S - T*0.15 - bh, T*0.15, bh, bw);
      // BL
      ctx.fillStyle = ornG; ctx.fillRect(T*0.15, S - T*0.15 - bh, bw, bh); ctx.fillRect(T*0.15, S - T*0.15 - bw, bh, bw);
      // BR
      ctx.fillStyle = ornG; ctx.fillRect(S - T*0.15 - bw, S - T*0.15 - bh, bw, bh); ctx.fillRect(S - T*0.15 - bh, S - T*0.15 - bw, bh, bw);

      // Corner medallions
      const cr = T * 0.2;
      drawCornerOrnament(ctx, T * 0.5, T * 0.5, cr, ornG);
      drawCornerOrnament(ctx, S - T * 0.5, T * 0.5, cr, ornG);
      drawCornerOrnament(ctx, T * 0.5, S - T * 0.5, cr, ornG);
      drawCornerOrnament(ctx, S - T * 0.5, S - T * 0.5, cr, ornG);

      // Edge dots
      const dotR = T * 0.08;
      for (let i = 1; i <= 3; i++) {
        const pos = S * i / 4;
        drawEdgeDot(ctx, pos, T * 0.5, dotR, ornG);
        drawEdgeDot(ctx, pos, S - T * 0.5, dotR, ornG);
        drawEdgeDot(ctx, T * 0.5, pos, dotR, ornG);
        drawEdgeDot(ctx, S - T * 0.5, pos, dotR, ornG);
      }
    },
  },
  {
    id: 'wood-dark',
    fullSize: 400,
    thickness: 50,
    draw(ctx, S, T) {
      const g = woodGradient(ctx, 0, 0, S, S, true);
      drawBeveledRect(ctx, 0, 0, S, T, 3, g);
      drawBeveledRect(ctx, 0, S - T, S, T, 3, g);
      drawBeveledRect(ctx, 0, T, T, S - 2*T, 3, g);
      drawBeveledRect(ctx, S - T, T, T, S - 2*T, 3, g);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const y = T * (0.15 + i * 0.1);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, S - y); ctx.lineTo(S, S - y); ctx.stroke();
      }
      for (let i = 0; i < 8; i++) {
        const x = T * (0.15 + i * 0.1);
        ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, S - T); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(S - x, T); ctx.lineTo(S - x, S - T); ctx.stroke();
      }

      // Inner groove
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(T * 0.85, T * 0.85, S - T * 1.7, S - T * 1.7);

      // Outer/inner edges
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, S - 2, S - 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(T - 1, T - 1, S - 2*T + 2, S - 2*T + 2);
    },
  },
  {
    id: 'wood-light',
    fullSize: 400,
    thickness: 50,
    draw(ctx, S, T) {
      const g = woodGradient(ctx, 0, 0, S, S, false);
      drawBeveledRect(ctx, 0, 0, S, T, 3, g);
      drawBeveledRect(ctx, 0, S - T, S, T, 3, g);
      drawBeveledRect(ctx, 0, T, T, S - 2*T, 3, g);
      drawBeveledRect(ctx, S - T, T, T, S - 2*T, 3, g);

      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const y = T * (0.2 + i * 0.12);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, S - y); ctx.lineTo(S, S - y); ctx.stroke();
      }
      for (let i = 0; i < 6; i++) {
        const x = T * (0.2 + i * 0.12);
        ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, S - T); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(S - x, T); ctx.lineTo(S - x, S - T); ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(T * 0.85, T * 0.85, S - T * 1.7, S - T * 1.7);

      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, S - 2, S - 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(T - 1, T - 1, S - 2*T + 2, S - 2*T + 2);
    },
  },
  {
    id: 'silver-classic',
    fullSize: 400,
    thickness: 45,
    draw(ctx, S, T) {
      const g = silverGradient(ctx, 0, 0, S, S);
      drawBeveledRect(ctx, 0, 0, S, T, 3, g);
      drawBeveledRect(ctx, 0, S - T, S, T, 3, g);
      drawBeveledRect(ctx, 0, T, T, S - 2*T, 3, g);
      drawBeveledRect(ctx, S - T, T, T, S - 2*T, 3, g);

      // Inner groove
      const gi = silverGradient(ctx, T*0.7, T*0.7, S - T*0.7, S - T*0.7);
      ctx.strokeStyle = gi;
      ctx.lineWidth = 3;
      ctx.strokeRect(T * 0.75, T * 0.75, S - T * 1.5, S - T * 1.5);

      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, S - 2, S - 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(T - 1, T - 1, S - 2*T + 2, S - 2*T + 2);

      // Corner ornaments
      const cr = T * 0.25;
      drawCornerOrnament(ctx, T * 0.5, T * 0.5, cr, gi);
      drawCornerOrnament(ctx, S - T * 0.5, T * 0.5, cr, gi);
      drawCornerOrnament(ctx, T * 0.5, S - T * 0.5, cr, gi);
      drawCornerOrnament(ctx, S - T * 0.5, S - T * 0.5, cr, gi);
    },
  },
  {
    id: 'black-modern',
    fullSize: 360,
    thickness: 35,
    draw(ctx, S, T) {
      // Solid black with subtle bevel
      const g = ctx.createLinearGradient(0, 0, S, S);
      g.addColorStop(0, '#2a2a2e');
      g.addColorStop(0.5, '#1a1a1e');
      g.addColorStop(1, '#2a2a2e');

      drawBeveledRect(ctx, 0, 0, S, T, 2, g);
      drawBeveledRect(ctx, 0, S - T, S, T, 2, g);
      drawBeveledRect(ctx, 0, T, T, S - 2*T, 2, g);
      drawBeveledRect(ctx, S - T, T, T, S - 2*T, 2, g);

      // Thin silver inner line
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(T * 0.85, T * 0.85, S - T * 1.7, S - T * 1.7);

      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(2, 2, S - 4, S - 4);

      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, S, S);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(T, T, S - 2*T, S - 2*T);
    },
  },
  {
    id: 'certificate',
    fullSize: 400,
    thickness: 40,
    draw(ctx, S, T) {
      const g = goldGradient(ctx, 0, 0, S, S);

      // Outer band
      ctx.strokeStyle = g;
      ctx.lineWidth = 5;
      ctx.strokeRect(4, 4, S - 8, S - 8);

      // Middle band
      ctx.lineWidth = 3;
      ctx.strokeRect(T * 0.4, T * 0.4, S - T * 0.8, S - T * 0.8);

      // Inner band
      ctx.lineWidth = 2;
      ctx.strokeRect(T * 0.75, T * 0.75, S - T * 1.5, S - T * 1.5);

      // Outer edge
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, S - 2, S - 2);

      // Inner edge
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(T - 1, T - 1, S - 2*T + 2, S - 2*T + 2);

      // Corner dots
      const cr = 4;
      const ornG = goldGradient(ctx, 0, 0, T, T);
      drawEdgeDot(ctx, T * 0.55, T * 0.55, cr, ornG);
      drawEdgeDot(ctx, S - T * 0.55, T * 0.55, cr, ornG);
      drawEdgeDot(ctx, T * 0.55, S - T * 0.55, cr, ornG);
      drawEdgeDot(ctx, S - T * 0.55, S - T * 0.55, cr, ornG);
    },
  },
];

// ── Main ──

fs.mkdirSync(OUT, { recursive: true });

for (const frame of FRAMES) {
  generateFrame(frame.id, frame.fullSize, frame.thickness, frame.draw);
}

console.log(`\nDone! ${FRAMES.length} frame sets written to ${OUT}`);
