/**
 * Decorative frames using CSS border-image + 9-slice SVG assets.
 * `borderImageSlice` / `borderImageWidth` tuned per asset (SVG viewBox 90×90, slice 30).
 */

export type FrameCategory = 'ornamental' | 'modern' | 'minimal';

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

export interface FrameDefinition {
  id: string;
  label: string;
  category: FrameCategory;
  svgDataUri: string;
  borderImageSlice: string;
  borderImageWidth: string;
}

const SLICE_30 = '30 fill';

/** Standard 90×90 frame with 30px corners (3×3 grid). */
function frame90(
  id: string,
  label: string,
  category: FrameCategory,
  innerSvg: string,
  borderImageWidth = '28px',
): FrameDefinition {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 90 90">${innerSvg}</svg>`;
  return {
    id,
    label,
    category,
    svgDataUri: svgDataUri(svg),
    borderImageSlice: SLICE_30,
    borderImageWidth,
  };
}

export const FRAME_CATALOG: FrameDefinition[] = [
  frame90(
    'hairline',
    'Hairline',
    'minimal',
    `<rect x="1" y="1" width="88" height="88" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="2"/>`,
    '12px',
  ),
  frame90(
    'thin-line',
    'Thin Line',
    'modern',
    `<rect x="2" y="2" width="86" height="86" fill="none" stroke="#64748b" stroke-width="3" rx="2"/>`,
    '20px',
  ),
  frame90(
    'double-line',
    'Double Line',
    'modern',
    `<rect x="2" y="2" width="86" height="86" fill="none" stroke="#94a3b8" stroke-width="2"/><rect x="6" y="6" width="78" height="78" fill="none" stroke="#475569" stroke-width="2"/>`,
    '24px',
  ),
  frame90(
    'rounded-shadow',
    'Soft Shadow',
    'modern',
    `<defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.35"/></filter></defs><rect x="4" y="4" width="82" height="82" fill="none" stroke="#6366f1" stroke-width="4" rx="8" filter="url(#s)"/>`,
    '28px',
  ),
  frame90(
    'gold-classic',
    'Gold Classic',
    'ornamental',
    `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f6e27a"/><stop offset="50%" stop-color="#c9a227"/><stop offset="100%" stop-color="#8b6914"/></linearGradient></defs><rect x="2" y="2" width="86" height="86" fill="none" stroke="url(#g)" stroke-width="5" rx="2"/>`,
    '32px',
  ),
  frame90(
    'silver-filigree',
    'Silver Filigree',
    'ornamental',
    `<defs><linearGradient id="s" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f1f5f9"/><stop offset="100%" stop-color="#94a3b8"/></linearGradient></defs><rect x="2" y="2" width="86" height="86" fill="none" stroke="url(#s)" stroke-width="4"/><path d="M8 8h10v10H8zm64 0h10v10H72zM8 72h10v10H8zm64 0h10v10H72z" fill="#cbd5e1"/>`,
    '30px',
  ),
  frame90(
    'certificate',
    'Certificate',
    'ornamental',
    `<defs><linearGradient id="c" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#d4af37"/><stop offset="100%" stop-color="#7a5c1a"/></linearGradient></defs><rect x="2" y="2" width="86" height="86" fill="none" stroke="url(#c)" stroke-width="3"/><rect x="7" y="7" width="76" height="76" fill="none" stroke="url(#c)" stroke-width="2" opacity="0.7"/>`,
    '28px',
  ),
  frame90(
    'corner-accent',
    'Corner Accent',
    'minimal',
    `<path d="M4 4h22v6H10v22H4V4zm62 0h22v28H80V10H66V4zM4 62v22h28V80H10V66H4zm76 0v22H66V80h14V66h14z" fill="#334155"/>`,
    '26px',
  ),
  frame90(
    'ornate-victorian',
    'Ornate',
    'ornamental',
    `<defs><linearGradient id="v" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#5c4033"/><stop offset="100%" stop-color="#8b5a2b"/></linearGradient></defs><rect x="2" y="2" width="86" height="86" fill="none" stroke="url(#v)" stroke-width="5" rx="4"/><circle cx="8" cy="8" r="3" fill="url(#v)"/><circle cx="82" cy="8" r="3" fill="url(#v)"/><circle cx="8" cy="82" r="3" fill="url(#v)"/><circle cx="82" cy="82" r="3" fill="url(#v)"/>`,
    '34px',
  ),
  frame90(
    'midnight-glow',
    'Midnight Glow',
    'modern',
    `<defs><linearGradient id="m" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#6366f1"/></linearGradient></defs><rect x="2" y="2" width="86" height="86" fill="none" stroke="url(#m)" stroke-width="4" rx="6"/>`,
    '26px',
  ),
  frame90(
    'rose-gold',
    'Rose Gold',
    'ornamental',
    `<defs><linearGradient id="r" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fbcfe8"/><stop offset="100%" stop-color="#be185d"/></linearGradient></defs><rect x="2" y="2" width="86" height="86" fill="none" stroke="url(#r)" stroke-width="4" rx="10"/>`,
    '28px',
  ),
  frame90(
    'matte-black',
    'Matte Black',
    'minimal',
    `<rect x="2" y="2" width="86" height="86" fill="none" stroke="#0f172a" stroke-width="6" rx="2"/>`,
    '32px',
  ),
];

const FRAME_BY_ID = new Map(FRAME_CATALOG.map((f) => [f.id, f]));

export function getFrameById(id: string | undefined | null): FrameDefinition | undefined {
  if (!id) return undefined;
  return FRAME_BY_ID.get(id);
}
