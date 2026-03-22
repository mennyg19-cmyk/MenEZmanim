/**
 * Decorative frames using 8-piece image sets (4 corners + 4 sides).
 * Images are served from /frames/{id}/ in the public folder.
 */

export type FrameCategory = 'ornamental' | 'modern' | 'minimal';

export interface FrameDefinition {
  id: string;
  label: string;
  category: FrameCategory;
  /** Base path to the frame's image directory, e.g. '/frames/gold-classic' */
  basePath: string;
  /** Size of corner pieces in px (square) */
  cornerSize: number;
  /** Thickness of side pieces in px */
  sideThickness: number;
  /** Preview thumbnail URL */
  previewUrl: string;
}

export const FRAME_CATALOG: FrameDefinition[] = [
  {
    id: 'gold-classic',
    label: 'Gold Classic',
    category: 'ornamental',
    basePath: '/frames/gold-classic',
    cornerSize: 50,
    sideThickness: 50,
    previewUrl: '/frames/gold-classic/preview.png',
  },
  {
    id: 'gold-ornate',
    label: 'Gold Ornate',
    category: 'ornamental',
    basePath: '/frames/gold-ornate',
    cornerSize: 65,
    sideThickness: 65,
    previewUrl: '/frames/gold-ornate/preview.png',
  },
  {
    id: 'wood-dark',
    label: 'Dark Wood',
    category: 'ornamental',
    basePath: '/frames/wood-dark',
    cornerSize: 50,
    sideThickness: 50,
    previewUrl: '/frames/wood-dark/preview.png',
  },
  {
    id: 'wood-light',
    label: 'Light Wood',
    category: 'ornamental',
    basePath: '/frames/wood-light',
    cornerSize: 50,
    sideThickness: 50,
    previewUrl: '/frames/wood-light/preview.png',
  },
  {
    id: 'silver-classic',
    label: 'Silver Classic',
    category: 'ornamental',
    basePath: '/frames/silver-classic',
    cornerSize: 45,
    sideThickness: 45,
    previewUrl: '/frames/silver-classic/preview.png',
  },
  {
    id: 'black-modern',
    label: 'Black Modern',
    category: 'modern',
    basePath: '/frames/black-modern',
    cornerSize: 35,
    sideThickness: 35,
    previewUrl: '/frames/black-modern/preview.png',
  },
  {
    id: 'certificate',
    label: 'Certificate',
    category: 'minimal',
    basePath: '/frames/certificate',
    cornerSize: 40,
    sideThickness: 40,
    previewUrl: '/frames/certificate/preview.png',
  },
];

const FRAME_BY_ID = new Map(FRAME_CATALOG.map((f) => [f.id, f]));

export function getFrameById(id: string | undefined | null): FrameDefinition | undefined {
  if (!id) return undefined;
  return FRAME_BY_ID.get(id);
}
