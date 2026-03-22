/**
 * Built-in texture backgrounds (CSS-only, no image assets).
 * Each `css` value is a full `background` shorthand suitable for inline styles.
 */

export type TextureCategory = 'stone' | 'wood' | 'fabric' | 'metal' | 'paper';

export interface TextureEntry {
  id: string;
  label: string;
  category: TextureCategory;
  /** Full CSS `background` value (may include multiple layers). */
  css: string;
}

export const TEXTURE_CATALOG: TextureEntry[] = [
  {
    id: 'marble-white',
    label: 'White Marble',
    category: 'stone',
    css: `
      radial-gradient(ellipse 80% 50% at 20% 30%, rgba(255,255,255,0.85) 0%, transparent 55%),
      radial-gradient(ellipse 60% 40% at 75% 70%, rgba(255,255,255,0.5) 0%, transparent 50%),
      linear-gradient(145deg, #f5f3f0 0%, #e8e6e1 40%, #dcd8d0 100%)
    `.replace(/\s+/g, ' ').trim(),
  },
  {
    id: 'marble-dark',
    label: 'Dark Marble',
    category: 'stone',
    css: `
      radial-gradient(ellipse at 25% 25%, rgba(255,255,255,0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 60%, rgba(0,0,0,0.25) 0%, transparent 45%),
      linear-gradient(160deg, #2a2a2e 0%, #1a1a1f 50%, #0f0f12 100%)
    `.replace(/\s+/g, ' ').trim(),
  },
  {
    id: 'marble-blue',
    label: 'Blue Marble',
    category: 'stone',
    css: `
      radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.35) 0%, transparent 55%),
      linear-gradient(135deg, #c5d4e8 0%, #8fa8c4 45%, #5a6d8a 100%)
    `.replace(/\s+/g, ' ').trim(),
  },
  {
    id: 'wood-oak',
    label: 'Oak Wood',
    category: 'wood',
    css: `
      repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 8px),
      repeating-linear-gradient(0deg, rgba(139,90,43,0.08) 0px, transparent 2px, transparent 14px),
      linear-gradient(180deg, #c4a574 0%, #a67c52 35%, #8b5a2b 100%)
    `.replace(/\s+/g, ' ').trim(),
  },
  {
    id: 'wood-walnut',
    label: 'Walnut',
    category: 'wood',
    css: `
      repeating-linear-gradient(88deg, rgba(0,0,0,0.12) 0px, transparent 1px, transparent 6px),
      linear-gradient(175deg, #5c4033 0%, #3d2817 50%, #2a1a10 100%)
    `.replace(/\s+/g, ' ').trim(),
  },
  {
    id: 'wood-pine',
    label: 'Pine',
    category: 'wood',
    css: `
      repeating-linear-gradient(92deg, rgba(255,255,255,0.04) 0px, transparent 2px, transparent 11px),
      linear-gradient(178deg, #e8d4a8 0%, #c9a86c 50%, #a67c3d 100%)
    `.replace(/\s+/g, ' ').trim(),
  },
  {
    id: 'linen',
    label: 'Linen',
    category: 'fabric',
    css: `
      repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 2px),
      repeating-linear-gradient(90deg, rgba(0,0,0,0.025) 0px, transparent 1px, transparent 2px),
      linear-gradient(180deg, #f2efe8 0%, #e5e0d6 100%)
    `.replace(/\s+/g, ' ').trim(),
  },
  {
    id: 'canvas-fabric',
    label: 'Canvas',
    category: 'fabric',
    css: `
      repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 3px),
      #d8d4cc
    `.replace(/\s+/g, ' ').trim(),
  },
  {
    id: 'concrete',
    label: 'Concrete',
    category: 'stone',
    css: `
      radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 40%),
      radial-gradient(circle at 80% 20%, rgba(0,0,0,0.06) 0%, transparent 35%),
      linear-gradient(165deg, #b8b8b8 0%, #8a8a8a 100%)
    `.replace(/\s+/g, ' ').trim(),
  },
  {
    id: 'brushed-metal',
    label: 'Brushed Metal',
    category: 'metal',
    css: `
      repeating-linear-gradient(90deg, rgba(255,255,255,0.15) 0px, rgba(0,0,0,0.05) 1px, transparent 2px, transparent 4px),
      linear-gradient(180deg, #c0c4cc 0%, #8e9299 50%, #6a6e75 100%)
    `.replace(/\s+/g, ' ').trim(),
  },
  {
    id: 'copper-patina',
    label: 'Copper Patina',
    category: 'metal',
    css: `
      radial-gradient(ellipse at 40% 30%, rgba(255,200,150,0.2) 0%, transparent 50%),
      linear-gradient(145deg, #6b8f7a 0%, #4a6b5c 50%, #2d4538 100%)
    `.replace(/\s+/g, ' ').trim(),
  },
  {
    id: 'paper-cream',
    label: 'Cream Paper',
    category: 'paper',
    css: `
      linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 30%),
      #faf6ef
    `.replace(/\s+/g, ' ').trim(),
  },
  {
    id: 'paper-parchment',
    label: 'Parchment',
    category: 'paper',
    css: `
      radial-gradient(ellipse at 50% 0%, rgba(255,240,200,0.5) 0%, transparent 55%),
      linear-gradient(180deg, #f4e8d0 0%, #e8d4b0 100%)
    `.replace(/\s+/g, ' ').trim(),
  },
  {
    id: 'slate',
    label: 'Slate',
    category: 'stone',
    css: `
      linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%),
      linear-gradient(180deg, #4a5568 0%, #2d3748 100%)
    `.replace(/\s+/g, ' ').trim(),
  },
  {
    id: 'leather',
    label: 'Leather',
    category: 'fabric',
    css: `
      radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 45%),
      repeating-linear-gradient(88deg, rgba(0,0,0,0.15) 0px, transparent 1px, transparent 5px),
      linear-gradient(165deg, #5c3d2e 0%, #3d2618 100%)
    `.replace(/\s+/g, ' ').trim(),
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
