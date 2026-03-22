/**
 * Built-in texture backgrounds using real tileable images.
 * Images are served from /textures/ in the public folder.
 */

export type TextureCategory = 'stone' | 'wood' | 'fabric' | 'metal' | 'paper';

export interface TextureEntry {
  id: string;
  label: string;
  category: TextureCategory;
  imageUrl: string;
  tileSize: number;
  /** Approximate dominant color of this texture for contrast calculations */
  dominantColor: string;
}

export const TEXTURE_CATALOG: TextureEntry[] = [
  { id: 'marble-black', label: 'Black Marble', category: 'stone', imageUrl: '/textures/marble-black.png', tileSize: 512, dominantColor: '#1a1a1a' },
  { id: 'marble-white', label: 'White Marble', category: 'stone', imageUrl: '/textures/marble-white.png', tileSize: 512, dominantColor: '#e8e0d8' },
  { id: 'marble-cream', label: 'Cream Marble', category: 'stone', imageUrl: '/textures/marble-cream.png', tileSize: 512, dominantColor: '#d4c8b0' },
  { id: 'marble-green', label: 'Green Marble', category: 'stone', imageUrl: '/textures/marble-green.png', tileSize: 512, dominantColor: '#2d4a3a' },
  { id: 'marble-blue', label: 'Blue Marble', category: 'stone', imageUrl: '/textures/marble-blue.png', tileSize: 512, dominantColor: '#2a3a5c' },
  { id: 'concrete', label: 'Concrete', category: 'stone', imageUrl: '/textures/concrete.png', tileSize: 512, dominantColor: '#9a9590' },
  { id: 'slate', label: 'Slate', category: 'stone', imageUrl: '/textures/slate.png', tileSize: 512, dominantColor: '#4a4a50' },
  { id: 'wood-oak', label: 'Oak', category: 'wood', imageUrl: '/textures/wood-oak.png', tileSize: 512, dominantColor: '#b08850' },
  { id: 'wood-walnut', label: 'Walnut', category: 'wood', imageUrl: '/textures/wood-walnut.png', tileSize: 512, dominantColor: '#5a3a20' },
  { id: 'wood-cherry', label: 'Cherry', category: 'wood', imageUrl: '/textures/wood-cherry.png', tileSize: 512, dominantColor: '#8a4028' },
  { id: 'wood-pine', label: 'Pine', category: 'wood', imageUrl: '/textures/wood-pine.png', tileSize: 512, dominantColor: '#c8a870' },
  { id: 'linen', label: 'Linen', category: 'fabric', imageUrl: '/textures/linen.png', tileSize: 512, dominantColor: '#d8d0c0' },
  { id: 'leather', label: 'Leather', category: 'fabric', imageUrl: '/textures/leather.png', tileSize: 512, dominantColor: '#6a4030' },
  { id: 'metal-brushed', label: 'Brushed Steel', category: 'metal', imageUrl: '/textures/metal-brushed.png', tileSize: 512, dominantColor: '#a0a0a8' },
  { id: 'metal-gold', label: 'Gold', category: 'metal', imageUrl: '/textures/metal-gold.png', tileSize: 512, dominantColor: '#c8a040' },
];

const TEXTURE_MAP = new Map(TEXTURE_CATALOG.map((t) => [t.id, t]));

export function getTextureById(textureId: string | undefined): TextureEntry | undefined {
  if (!textureId) return undefined;
  return TEXTURE_MAP.get(textureId);
}

/** Returns CSS properties for a texture background. */
export function getTextureStyles(textureId: string | undefined): React.CSSProperties {
  const tex = getTextureById(textureId);
  if (!tex) return { backgroundColor: '#64748b' };
  return {
    backgroundImage: `url(${tex.imageUrl})`,
    backgroundRepeat: 'repeat',
    backgroundSize: `${tex.tileSize}px ${tex.tileSize}px`,
  };
}

export function getTextureCategories(): TextureCategory[] {
  return ['stone', 'wood', 'fabric', 'metal', 'paper'];
}
