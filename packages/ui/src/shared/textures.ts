/**
 * Built-in texture backgrounds using layered CSS gradients.
 * Marble textures use many overlapping radial/linear gradients to simulate veining.
 */

export type TextureCategory = 'stone' | 'wood' | 'fabric' | 'metal' | 'paper';

export interface TextureEntry {
  id: string;
  label: string;
  category: TextureCategory;
  /** Full CSS `background` value (may include multiple layers). */
  css: string;
}

function m(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

export const TEXTURE_CATALOG: TextureEntry[] = [
  // ── Stone / Marble ──
  {
    id: 'marble-white',
    label: 'White Marble',
    category: 'stone',
    css: m(`
      radial-gradient(ellipse 120% 30% at 15% 55%, rgba(180,175,168,0.45) 0%, transparent 70%),
      radial-gradient(ellipse 80% 15% at 60% 30%, rgba(160,155,145,0.35) 0%, transparent 65%),
      radial-gradient(ellipse 50% 8% at 35% 70%, rgba(140,135,125,0.3) 0%, transparent 60%),
      radial-gradient(ellipse 90% 12% at 80% 50%, rgba(170,165,155,0.25) 0%, transparent 55%),
      linear-gradient(32deg, transparent 40%, rgba(200,195,188,0.2) 42%, transparent 44%),
      linear-gradient(148deg, transparent 55%, rgba(185,180,170,0.25) 57%, transparent 59%),
      linear-gradient(72deg, transparent 30%, rgba(195,190,180,0.15) 31%, transparent 33%),
      linear-gradient(165deg, transparent 65%, rgba(175,170,160,0.2) 66%, transparent 68%),
      radial-gradient(ellipse 200% 200% at 50% 50%, rgba(245,242,238,1) 0%, rgba(230,226,220,1) 40%, rgba(218,214,206,1) 100%)
    `),
  },
  {
    id: 'marble-dark',
    label: 'Black Marble',
    category: 'stone',
    css: m(`
      linear-gradient(38deg, transparent 20%, rgba(255,255,255,0.08) 21%, rgba(255,255,255,0.12) 21.5%, transparent 22.5%),
      linear-gradient(38deg, transparent 45%, rgba(255,255,255,0.06) 46%, rgba(255,255,255,0.1) 46.5%, transparent 47.5%),
      linear-gradient(38deg, transparent 70%, rgba(255,255,255,0.05) 71%, rgba(255,255,255,0.08) 71.5%, transparent 72.5%),
      linear-gradient(155deg, transparent 30%, rgba(200,200,210,0.07) 31%, rgba(200,200,210,0.1) 31.5%, transparent 32.5%),
      linear-gradient(155deg, transparent 55%, rgba(200,200,210,0.06) 56%, rgba(200,200,210,0.09) 56.5%, transparent 57.5%),
      linear-gradient(155deg, transparent 80%, rgba(200,200,210,0.05) 81%, rgba(200,200,210,0.08) 81.5%, transparent 82.5%),
      radial-gradient(ellipse 150% 40% at 25% 40%, rgba(255,255,255,0.06) 0%, transparent 50%),
      radial-gradient(ellipse 100% 25% at 70% 65%, rgba(255,255,255,0.04) 0%, transparent 45%),
      linear-gradient(160deg, #1e1e22 0%, #141418 30%, #0c0c10 60%, #18181c 100%)
    `),
  },
  {
    id: 'marble-cream',
    label: 'Cream Marble',
    category: 'stone',
    css: m(`
      linear-gradient(42deg, transparent 25%, rgba(180,160,130,0.12) 26%, rgba(180,160,130,0.18) 26.5%, transparent 27.5%),
      linear-gradient(42deg, transparent 50%, rgba(170,150,120,0.1) 51%, rgba(170,150,120,0.15) 51.5%, transparent 52.5%),
      linear-gradient(42deg, transparent 75%, rgba(160,140,110,0.08) 76%, rgba(160,140,110,0.12) 76.5%, transparent 77.5%),
      linear-gradient(160deg, transparent 35%, rgba(190,170,140,0.1) 36%, rgba(190,170,140,0.14) 36.5%, transparent 37.5%),
      linear-gradient(160deg, transparent 60%, rgba(185,165,135,0.08) 61%, rgba(185,165,135,0.12) 61.5%, transparent 62.5%),
      radial-gradient(ellipse 120% 35% at 30% 45%, rgba(200,185,160,0.15) 0%, transparent 55%),
      radial-gradient(ellipse 80% 20% at 75% 60%, rgba(195,180,155,0.1) 0%, transparent 45%),
      linear-gradient(165deg, #f0e6d4 0%, #e8dcc6 35%, #ddd0b8 65%, #e5d9c5 100%)
    `),
  },
  {
    id: 'marble-green',
    label: 'Green Marble',
    category: 'stone',
    css: m(`
      linear-gradient(35deg, transparent 22%, rgba(255,255,255,0.06) 23%, rgba(255,255,255,0.1) 23.5%, transparent 24.5%),
      linear-gradient(35deg, transparent 48%, rgba(255,255,255,0.05) 49%, rgba(255,255,255,0.08) 49.5%, transparent 50.5%),
      linear-gradient(35deg, transparent 72%, rgba(255,255,255,0.04) 73%, rgba(255,255,255,0.07) 73.5%, transparent 74.5%),
      linear-gradient(150deg, transparent 32%, rgba(200,220,200,0.08) 33%, rgba(200,220,200,0.12) 33.5%, transparent 34.5%),
      linear-gradient(150deg, transparent 58%, rgba(200,220,200,0.06) 59%, rgba(200,220,200,0.1) 59.5%, transparent 60.5%),
      radial-gradient(ellipse 130% 30% at 40% 35%, rgba(100,140,100,0.15) 0%, transparent 50%),
      linear-gradient(160deg, #2a4a38 0%, #1e3828 30%, #152a1e 60%, #1a3424 100%)
    `),
  },
  // ── Wood ──
  {
    id: 'wood-oak',
    label: 'Oak',
    category: 'wood',
    css: m(`
      repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0px, transparent 1px, transparent 4px, rgba(0,0,0,0.02) 5px, transparent 6px, transparent 12px),
      repeating-linear-gradient(88deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 7px),
      radial-gradient(ellipse 200% 15% at 50% 25%, rgba(160,120,60,0.15) 0%, transparent 100%),
      radial-gradient(ellipse 200% 15% at 50% 75%, rgba(140,100,40,0.12) 0%, transparent 100%),
      linear-gradient(180deg, #c4a574 0%, #b08850 25%, #a67c42 50%, #9a7038 75%, #8b5a2b 100%)
    `),
  },
  {
    id: 'wood-walnut',
    label: 'Walnut',
    category: 'wood',
    css: m(`
      repeating-linear-gradient(89deg, rgba(0,0,0,0.08) 0px, transparent 1px, transparent 3px, rgba(0,0,0,0.04) 4px, transparent 5px, transparent 9px),
      repeating-linear-gradient(91deg, rgba(0,0,0,0.06) 0px, transparent 1px, transparent 6px),
      radial-gradient(ellipse 200% 12% at 50% 30%, rgba(100,60,30,0.12) 0%, transparent 100%),
      linear-gradient(178deg, #5c4033 0%, #4a3025 30%, #3d2817 55%, #2a1a10 100%)
    `),
  },
  {
    id: 'wood-cherry',
    label: 'Cherry',
    category: 'wood',
    css: m(`
      repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0px, transparent 1px, transparent 5px, rgba(0,0,0,0.02) 6px, transparent 7px, transparent 11px),
      radial-gradient(ellipse 200% 10% at 50% 40%, rgba(180,80,50,0.12) 0%, transparent 100%),
      linear-gradient(180deg, #8b4030 0%, #7a3528 30%, #6b2a20 60%, #5c2018 100%)
    `),
  },
  // ── Fabric ──
  {
    id: 'linen',
    label: 'Linen',
    category: 'fabric',
    css: m(`
      repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 2px),
      repeating-linear-gradient(90deg, rgba(0,0,0,0.025) 0px, transparent 1px, transparent 2px),
      linear-gradient(180deg, #f2efe8 0%, #e8e4db 50%, #e5e0d6 100%)
    `),
  },
  {
    id: 'leather',
    label: 'Leather',
    category: 'fabric',
    css: m(`
      radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.08) 0%, transparent 45%),
      repeating-linear-gradient(88deg, rgba(0,0,0,0.12) 0px, transparent 1px, transparent 5px),
      repeating-linear-gradient(2deg, rgba(0,0,0,0.06) 0px, transparent 1px, transparent 4px),
      linear-gradient(165deg, #5c3d2e 0%, #4a2e1e 50%, #3d2618 100%)
    `),
  },
  {
    id: 'velvet',
    label: 'Velvet',
    category: 'fabric',
    css: m(`
      radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 70%, rgba(0,0,0,0.1) 0%, transparent 50%),
      linear-gradient(160deg, #2a1030 0%, #1e0824 50%, #140418 100%)
    `),
  },
  // ── Metal ──
  {
    id: 'brushed-metal',
    label: 'Brushed Steel',
    category: 'metal',
    css: m(`
      repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0px, rgba(0,0,0,0.04) 1px, transparent 2px, transparent 4px),
      linear-gradient(180deg, #c0c4cc 0%, #a0a4ac 25%, #8e9299 50%, #7a7e86 75%, #6a6e75 100%)
    `),
  },
  {
    id: 'gold-metal',
    label: 'Gold',
    category: 'metal',
    css: m(`
      repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0px, transparent 1px, transparent 3px),
      radial-gradient(ellipse at 30% 30%, rgba(255,240,180,0.3) 0%, transparent 50%),
      linear-gradient(160deg, #d4a843 0%, #c49530 25%, #b8862a 50%, #a07520 75%, #8b6518 100%)
    `),
  },
  // ── Paper ──
  {
    id: 'paper-cream',
    label: 'Cream Paper',
    category: 'paper',
    css: m(`
      radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.4) 0%, transparent 55%),
      linear-gradient(180deg, #faf6ef 0%, #f4efe4 50%, #efe8da 100%)
    `),
  },
  {
    id: 'parchment',
    label: 'Parchment',
    category: 'paper',
    css: m(`
      radial-gradient(ellipse at 20% 80%, rgba(180,150,100,0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(180,150,100,0.08) 0%, transparent 45%),
      linear-gradient(180deg, #f4e8d0 0%, #ecdcb8 50%, #e8d4b0 100%)
    `),
  },
  {
    id: 'concrete',
    label: 'Concrete',
    category: 'stone',
    css: m(`
      radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 40%),
      radial-gradient(circle at 80% 20%, rgba(0,0,0,0.05) 0%, transparent 35%),
      radial-gradient(circle at 50% 50%, rgba(0,0,0,0.03) 0%, transparent 30%),
      linear-gradient(165deg, #b8b8b8 0%, #a0a0a0 50%, #8a8a8a 100%)
    `),
  },
  {
    id: 'slate',
    label: 'Slate',
    category: 'stone',
    css: m(`
      linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 40%),
      repeating-linear-gradient(175deg, rgba(0,0,0,0.04) 0px, transparent 1px, transparent 6px),
      linear-gradient(180deg, #4a5568 0%, #3a4558 50%, #2d3748 100%)
    `),
  },
];

const TEXTURE_MAP = new Map(TEXTURE_CATALOG.map((t) => [t.id, t]));

export function getTextureCss(textureId: string | undefined): string {
  if (!textureId) return '#64748b';
  return TEXTURE_MAP.get(textureId)?.css ?? '#64748b';
}

export function getTextureCategories(): TextureCategory[] {
  return ['stone', 'wood', 'fabric', 'metal', 'paper'];
}
