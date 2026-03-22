import type { ThemeColors } from '../editor/ThemePicker';

/**
 * Extract a dominant color palette from an image URL using canvas downsampling + median-cut quantization.
 */
export async function extractPaletteFromImage(imageUrl: string, count = 12): Promise<string[]> {
  if (typeof document === 'undefined') return [];

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve([]); return; }

        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        const pixels: [number, number, number][] = [];
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 128) continue;
          pixels.push([data[i], data[i + 1], data[i + 2]]);
        }

        if (pixels.length === 0) { resolve([]); return; }

        // Extract more colors than needed, then deduplicate
        const rawPalette = medianCut(pixels, count * 2);
        const hexColors = rawPalette.map(([r, g, b]) =>
          `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
        );

        // Remove near-duplicate colors (within distance 30 in RGB space)
        const deduped = deduplicateColors(hexColors, 30);
        resolve(deduped.slice(0, count));
      } catch {
        resolve([]);
      }
    };
    img.onerror = () => resolve([]);
    img.src = imageUrl;
  });
}

function colorDistance(hex1: string, hex2: string): number {
  const r1 = parseInt(hex1.slice(1, 3), 16), g1 = parseInt(hex1.slice(3, 5), 16), b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16), g2 = parseInt(hex2.slice(3, 5), 16), b2 = parseInt(hex2.slice(5, 7), 16);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function deduplicateColors(colors: string[], minDist: number): string[] {
  const result: string[] = [];
  for (const c of colors) {
    if (result.every((r) => colorDistance(c, r) >= minDist)) {
      result.push(c);
    }
  }
  return result;
}

function medianCut(pixels: [number, number, number][], depth: number): [number, number, number][] {
  if (depth <= 1 || pixels.length <= 1) {
    return [average(pixels)];
  }

  const ranges = [0, 1, 2].map((ch) => {
    let min = 255, max = 0;
    for (const p of pixels) { if (p[ch] < min) min = p[ch]; if (p[ch] > max) max = p[ch]; }
    return max - min;
  });

  const channel = ranges.indexOf(Math.max(...ranges));
  pixels.sort((a, b) => a[channel] - b[channel]);
  const mid = Math.floor(pixels.length / 2);

  return [
    ...medianCut(pixels.slice(0, mid), depth - 1),
    ...medianCut(pixels.slice(mid), depth - 1),
  ];
}

function average(pixels: [number, number, number][]): [number, number, number] {
  if (pixels.length === 0) return [0, 0, 0];
  let r = 0, g = 0, b = 0;
  for (const p of pixels) { r += p[0]; g += p[1]; b += p[2]; }
  const n = pixels.length;
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function saturation(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

function darken(hex: string, factor: number): string {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lighten(hex: string, factor: number): string {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) + (255 - parseInt(hex.slice(1, 3), 16)) * factor));
  const g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) + (255 - parseInt(hex.slice(3, 5), 16)) * factor));
  const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) + (255 - parseInt(hex.slice(5, 7), 16)) * factor));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Map an extracted palette to ThemeColors.
 * Analyzes the dominant background color and creates a harmonious theme
 * with good contrast ratios for readability.
 */
export function paletteToThemeColors(palette: string[]): ThemeColors {
  if (palette.length === 0) {
    return {
      canvasBg: '#0f172a', widgetBg: '#1e293b', widgetBorder: '#334155',
      textPrimary: '#e2e8f0', textSecondary: '#94a3b8', accent: '#38bdf8',
      headerBg: '#1e293b', headerText: '#f1f5f9', tickerBg: '#1e293b',
      tickerText: '#38bdf8', rowAltBg: '#1e293b',
    };
  }

  const sorted = [...palette].sort((a, b) => luminance(a) - luminance(b));
  const darkest = sorted[0];
  const lightest = sorted[sorted.length - 1];
  const bgLum = luminance(sorted[0]);

  // Determine if the image is predominantly dark or light
  const avgLum = palette.reduce((s, c) => s + luminance(c), 0) / palette.length;
  const isDark = avgLum < 140;

  // Find the most saturated color for accent, but ensure it has decent saturation
  const bySat = [...palette].sort((a, b) => saturation(b) - saturation(a));
  let accent = bySat[0];
  if (saturation(accent) < 0.15) {
    // Palette is very desaturated (e.g. marble, wood) -- generate a complementary accent
    accent = isDark ? '#60a5fa' : '#2563eb';
  }

  // For dark backgrounds: light text, slightly lighter widget bg
  // For light backgrounds: dark text, slightly darker widget bg
  if (isDark) {
    const bg = bgLum < 30 ? darkest : darken(darkest, 0.7);
    return {
      canvasBg: bg,
      widgetBg: lighten(bg, 0.06),
      widgetBorder: lighten(bg, 0.14),
      textPrimary: '#f1f5f9',
      textSecondary: '#cbd5e1',
      accent,
      headerBg: lighten(bg, 0.08),
      headerText: '#f8fafc',
      tickerBg: lighten(bg, 0.04),
      tickerText: accent,
      rowAltBg: lighten(bg, 0.03),
    };
  } else {
    const bg = lightest;
    return {
      canvasBg: bg,
      widgetBg: darken(bg, 0.97),
      widgetBorder: darken(bg, 0.88),
      textPrimary: '#1e293b',
      textSecondary: '#475569',
      accent,
      headerBg: darken(bg, 0.95),
      headerText: '#0f172a',
      tickerBg: darken(bg, 0.97),
      tickerText: accent,
      rowAltBg: darken(bg, 0.98),
    };
  }
}

/**
 * Given a background color (hex), return a contrasting text color.
 * Returns white for dark backgrounds, dark slate for light backgrounds.
 */
export function contrastTextColor(bgHex: string): string {
  const lum = luminance(bgHex);
  return lum < 140 ? '#f1f5f9' : '#1e293b';
}

/**
 * Given a background color, pick the best text color from a set of theme/palette colors.
 * Prefers colors with high contrast against the background.
 */
export function bestTextColorFromPalette(bgHex: string, palette: string[]): string {
  if (!palette.length) return contrastTextColor(bgHex);
  const bgLum = luminance(bgHex);
  const isDarkBg = bgLum < 140;

  // Filter to colors that have good contrast
  const candidates = palette.filter((c) => {
    const cLum = luminance(c);
    return isDarkBg ? cLum > 170 : cLum < 80;
  });

  if (candidates.length === 0) return contrastTextColor(bgHex);

  // Pick the one with highest contrast ratio
  return candidates.sort((a, b) => {
    const contrastA = Math.abs(luminance(a) - bgLum);
    const contrastB = Math.abs(luminance(b) - bgLum);
    return contrastB - contrastA;
  })[0];
}
