/**
 * Decorative frames using CSS border-image + 9-slice SVG assets.
 * SVGs use a 120×120 viewBox with 40px corners for rich ornamental detail.
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

function frame(
  id: string,
  label: string,
  category: FrameCategory,
  innerSvg: string,
  opts: { vb?: number; slice?: number; width?: string } = {},
): FrameDefinition {
  const vb = opts.vb ?? 120;
  const slice = opts.slice ?? 40;
  const width = opts.width ?? '40px';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${vb}" height="${vb}" viewBox="0 0 ${vb} ${vb}">${innerSvg}</svg>`;
  return {
    id,
    label,
    category,
    svgDataUri: svgDataUri(svg),
    borderImageSlice: `${slice} fill`,
    borderImageWidth: width,
  };
}

// Gold gradient definitions reused across frames
const GOLD_DEFS = `<defs>
  <linearGradient id="gOuter" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#f6e27a"/>
    <stop offset="20%" stop-color="#d4a843"/>
    <stop offset="50%" stop-color="#c49530"/>
    <stop offset="80%" stop-color="#d4a843"/>
    <stop offset="100%" stop-color="#f6e27a"/>
  </linearGradient>
  <linearGradient id="gInner" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#f6e27a"/>
    <stop offset="30%" stop-color="#c49530"/>
    <stop offset="70%" stop-color="#8b6914"/>
    <stop offset="100%" stop-color="#c49530"/>
  </linearGradient>
  <linearGradient id="gHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="rgba(255,255,255,0.4)"/>
    <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
  </linearGradient>
</defs>`;

const WOOD_DEFS = `<defs>
  <linearGradient id="wOuter" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#8b6d4a"/>
    <stop offset="20%" stop-color="#6b4d2a"/>
    <stop offset="50%" stop-color="#5a3d1a"/>
    <stop offset="80%" stop-color="#6b4d2a"/>
    <stop offset="100%" stop-color="#8b6d4a"/>
  </linearGradient>
  <linearGradient id="wInner" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#a07850"/>
    <stop offset="50%" stop-color="#6b4d2a"/>
    <stop offset="100%" stop-color="#4a3018"/>
  </linearGradient>
  <linearGradient id="wHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="rgba(255,255,255,0.2)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0.15)"/>
  </linearGradient>
</defs>`;

const SILVER_DEFS = `<defs>
  <linearGradient id="sOuter" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#e8e8ee"/>
    <stop offset="20%" stop-color="#b0b0bb"/>
    <stop offset="50%" stop-color="#8a8a99"/>
    <stop offset="80%" stop-color="#b0b0bb"/>
    <stop offset="100%" stop-color="#e8e8ee"/>
  </linearGradient>
  <linearGradient id="sInner" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#d0d0dd"/>
    <stop offset="50%" stop-color="#9090a0"/>
    <stop offset="100%" stop-color="#707080"/>
  </linearGradient>
</defs>`;

export const FRAME_CATALOG: FrameDefinition[] = [
  // ── Minimal ──
  frame(
    'hairline',
    'Hairline',
    'minimal',
    `<rect x="1" y="1" width="88" height="88" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="1.5"/>`,
    { vb: 90, slice: 30, width: '10px' },
  ),
  frame(
    'thin-line',
    'Thin Line',
    'minimal',
    `<rect x="2" y="2" width="86" height="86" fill="none" stroke="#64748b" stroke-width="2.5" rx="2"/>`,
    { vb: 90, slice: 30, width: '16px' },
  ),
  frame(
    'matte-black',
    'Matte Black',
    'minimal',
    `<rect x="1" y="1" width="88" height="88" fill="none" stroke="#0f172a" stroke-width="6" rx="1"/>`,
    { vb: 90, slice: 30, width: '28px' },
  ),
  frame(
    'corner-accent',
    'Corner Accent',
    'minimal',
    `<path d="M4 4h18v5H9v18H4V4zm64 0h18v23H81V9H68V4zM4 68v18h23V81H9V73H4zm78 0v18H64V81h14v-8h9z" fill="#334155"/>`,
    { vb: 90, slice: 30, width: '22px' },
  ),

  // ── Modern ──
  frame(
    'double-line',
    'Double Line',
    'modern',
    `<rect x="2" y="2" width="86" height="86" fill="none" stroke="#94a3b8" stroke-width="2"/>
     <rect x="7" y="7" width="76" height="76" fill="none" stroke="#475569" stroke-width="2"/>`,
    { vb: 90, slice: 30, width: '24px' },
  ),
  frame(
    'midnight-glow',
    'Midnight Glow',
    'modern',
    `<defs><linearGradient id="mg" x1="0%" y1="0%" x2="100%" y2="100%">
       <stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#6366f1"/>
     </linearGradient></defs>
     <rect x="2" y="2" width="86" height="86" fill="none" stroke="url(#mg)" stroke-width="4" rx="6"/>`,
    { vb: 90, slice: 30, width: '26px' },
  ),
  frame(
    'rose-gold',
    'Rose Gold',
    'modern',
    `<defs><linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
       <stop offset="0%" stop-color="#f5c6d0"/><stop offset="50%" stop-color="#d4956a"/><stop offset="100%" stop-color="#c07850"/>
     </linearGradient></defs>
     <rect x="2" y="2" width="116" height="116" fill="none" stroke="url(#rg)" stroke-width="6" rx="3"/>
     <rect x="8" y="8" width="104" height="104" fill="none" stroke="url(#rg)" stroke-width="1.5" rx="2" opacity="0.5"/>`,
    { width: '30px' },
  ),

  // ── Ornamental: Gold ──
  frame(
    'gold-classic',
    'Gold Classic',
    'ornamental',
    `${GOLD_DEFS}
     <rect x="2" y="2" width="116" height="116" rx="3" fill="none" stroke="url(#gOuter)" stroke-width="8"/>
     <rect x="10" y="10" width="100" height="100" rx="2" fill="none" stroke="url(#gInner)" stroke-width="3"/>
     <rect x="3" y="3" width="114" height="114" rx="3" fill="none" stroke="url(#gHighlight)" stroke-width="1"/>
     <circle cx="14" cy="14" r="5" fill="url(#gInner)" stroke="url(#gOuter)" stroke-width="1.5"/>
     <circle cx="106" cy="14" r="5" fill="url(#gInner)" stroke="url(#gOuter)" stroke-width="1.5"/>
     <circle cx="14" cy="106" r="5" fill="url(#gInner)" stroke="url(#gOuter)" stroke-width="1.5"/>
     <circle cx="106" cy="106" r="5" fill="url(#gInner)" stroke="url(#gOuter)" stroke-width="1.5"/>`,
    { width: '42px' },
  ),
  frame(
    'gold-ornate',
    'Gold Ornate',
    'ornamental',
    `${GOLD_DEFS}
     <rect x="1" y="1" width="118" height="118" rx="2" fill="none" stroke="url(#gOuter)" stroke-width="10"/>
     <rect x="11" y="11" width="98" height="98" rx="1" fill="none" stroke="url(#gInner)" stroke-width="4"/>
     <rect x="16" y="16" width="88" height="88" fill="none" stroke="url(#gOuter)" stroke-width="1" opacity="0.6"/>
     <rect x="2" y="2" width="116" height="116" rx="2" fill="none" stroke="url(#gHighlight)" stroke-width="1.5"/>
     <!-- Corner ornaments -->
     <path d="M8 8 L22 8 L22 12 L12 12 L12 22 L8 22 Z" fill="url(#gInner)"/>
     <path d="M98 8 L112 8 L112 22 L108 22 L108 12 L98 12 Z" fill="url(#gInner)"/>
     <path d="M8 98 L8 112 L22 112 L22 108 L12 108 L12 98 Z" fill="url(#gInner)"/>
     <path d="M108 98 L108 108 L98 108 L98 112 L112 112 L112 98 Z" fill="url(#gInner)"/>
     <circle cx="15" cy="15" r="4" fill="url(#gOuter)" opacity="0.8"/>
     <circle cx="105" cy="15" r="4" fill="url(#gOuter)" opacity="0.8"/>
     <circle cx="15" cy="105" r="4" fill="url(#gOuter)" opacity="0.8"/>
     <circle cx="105" cy="105" r="4" fill="url(#gOuter)" opacity="0.8"/>
     <!-- Edge ornaments -->
     <circle cx="60" cy="6" r="3" fill="url(#gInner)" opacity="0.7"/>
     <circle cx="60" cy="114" r="3" fill="url(#gInner)" opacity="0.7"/>
     <circle cx="6" cy="60" r="3" fill="url(#gInner)" opacity="0.7"/>
     <circle cx="114" cy="60" r="3" fill="url(#gInner)" opacity="0.7"/>`,
    { width: '48px' },
  ),
  frame(
    'gold-filigree',
    'Gold Filigree',
    'ornamental',
    `${GOLD_DEFS}
     <rect x="1" y="1" width="118" height="118" rx="1" fill="none" stroke="url(#gOuter)" stroke-width="6"/>
     <rect x="7" y="7" width="106" height="106" fill="none" stroke="url(#gInner)" stroke-width="2"/>
     <rect x="10" y="10" width="100" height="100" fill="none" stroke="url(#gOuter)" stroke-width="1" opacity="0.5"/>
     <!-- Filigree corner scrolls -->
     <path d="M12 6 Q18 6 18 12 Q18 18 12 18 Q6 18 6 12 Q6 6 12 6 Z" fill="none" stroke="url(#gInner)" stroke-width="1.5"/>
     <path d="M108 6 Q114 6 114 12 Q114 18 108 18 Q102 18 102 12 Q102 6 108 6 Z" fill="none" stroke="url(#gInner)" stroke-width="1.5"/>
     <path d="M12 102 Q18 102 18 108 Q18 114 12 114 Q6 114 6 108 Q6 102 12 102 Z" fill="none" stroke="url(#gInner)" stroke-width="1.5"/>
     <path d="M108 102 Q114 102 114 108 Q114 114 108 114 Q102 114 102 108 Q102 102 108 102 Z" fill="none" stroke="url(#gInner)" stroke-width="1.5"/>
     <circle cx="12" cy="12" r="2" fill="url(#gOuter)"/>
     <circle cx="108" cy="12" r="2" fill="url(#gOuter)"/>
     <circle cx="12" cy="108" r="2" fill="url(#gOuter)"/>
     <circle cx="108" cy="108" r="2" fill="url(#gOuter)"/>`,
    { width: '38px' },
  ),

  // ── Ornamental: Wood ──
  frame(
    'wood-classic',
    'Wood Classic',
    'ornamental',
    `${WOOD_DEFS}
     <rect x="1" y="1" width="118" height="118" rx="2" fill="url(#wOuter)" stroke="#3a2510" stroke-width="1"/>
     <rect x="9" y="9" width="102" height="102" rx="1" fill="none" stroke="url(#wInner)" stroke-width="3"/>
     <rect x="13" y="13" width="94" height="94" fill="none" stroke="#3a2510" stroke-width="1"/>
     <rect x="2" y="2" width="116" height="116" rx="2" fill="url(#wHighlight)" stroke="none"/>
     <!-- Inner clear area -->
     <rect x="14" y="14" width="92" height="92" fill="rgba(0,0,0,0)"/>`,
    { width: '44px' },
  ),
  frame(
    'wood-ornate',
    'Wood Ornate',
    'ornamental',
    `${WOOD_DEFS}
     <rect x="1" y="1" width="118" height="118" rx="3" fill="url(#wOuter)" stroke="#2a1808" stroke-width="1.5"/>
     <rect x="8" y="8" width="104" height="104" rx="2" fill="none" stroke="url(#wInner)" stroke-width="4"/>
     <rect x="14" y="14" width="92" height="92" fill="none" stroke="#2a1808" stroke-width="1.5"/>
     <rect x="2" y="2" width="116" height="116" rx="3" fill="url(#wHighlight)" stroke="none"/>
     <!-- Corner carvings -->
     <path d="M10 4 L20 4 L20 8 L14 8 L14 14 L8 14 L8 8 L4 8 L4 4 Z" fill="url(#wInner)" stroke="#2a1808" stroke-width="0.5"/>
     <path d="M100 4 L116 4 L116 8 L112 8 L112 14 L106 14 L106 8 L100 8 Z" fill="url(#wInner)" stroke="#2a1808" stroke-width="0.5"/>
     <path d="M4 100 L8 100 L8 106 L14 106 L14 112 L8 112 L8 116 L4 116 Z" fill="url(#wInner)" stroke="#2a1808" stroke-width="0.5"/>
     <path d="M106 106 L112 106 L112 100 L116 100 L116 116 L100 116 L100 112 L106 112 Z" fill="url(#wInner)" stroke="#2a1808" stroke-width="0.5"/>
     <rect x="15" y="15" width="90" height="90" fill="rgba(0,0,0,0)"/>`,
    { width: '48px' },
  ),

  // ── Ornamental: Silver ──
  frame(
    'silver-classic',
    'Silver Classic',
    'ornamental',
    `${SILVER_DEFS}
     <rect x="2" y="2" width="116" height="116" rx="2" fill="none" stroke="url(#sOuter)" stroke-width="7"/>
     <rect x="9" y="9" width="102" height="102" rx="1" fill="none" stroke="url(#sInner)" stroke-width="3"/>
     <rect x="13" y="13" width="94" height="94" fill="none" stroke="url(#sOuter)" stroke-width="1" opacity="0.5"/>
     <circle cx="13" cy="13" r="4" fill="url(#sOuter)" stroke="url(#sInner)" stroke-width="1"/>
     <circle cx="107" cy="13" r="4" fill="url(#sOuter)" stroke="url(#sInner)" stroke-width="1"/>
     <circle cx="13" cy="107" r="4" fill="url(#sOuter)" stroke="url(#sInner)" stroke-width="1"/>
     <circle cx="107" cy="107" r="4" fill="url(#sOuter)" stroke="url(#sInner)" stroke-width="1"/>`,
    { width: '42px' },
  ),

  // ── Ornamental: Certificate / Formal ──
  frame(
    'certificate',
    'Certificate',
    'ornamental',
    `${GOLD_DEFS}
     <rect x="3" y="3" width="114" height="114" fill="none" stroke="url(#gOuter)" stroke-width="4"/>
     <rect x="9" y="9" width="102" height="102" fill="none" stroke="url(#gInner)" stroke-width="2" opacity="0.7"/>
     <rect x="13" y="13" width="94" height="94" fill="none" stroke="url(#gOuter)" stroke-width="1" opacity="0.4"/>`,
    { width: '34px' },
  ),
];

const FRAME_BY_ID = new Map(FRAME_CATALOG.map((f) => [f.id, f]));

export function getFrameById(id: string | undefined | null): FrameDefinition | undefined {
  if (!id) return undefined;
  return FRAME_BY_ID.get(id);
}
