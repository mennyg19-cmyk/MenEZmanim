import type { ThemeColors } from '../editor/ThemePicker';

/**
 * Extract a dominant color palette from an image URL using canvas downsampling + median-cut quantization.
 */
export async function extractPaletteFromImage(imageUrl: string, count = 8): Promise<string[]> {
  if (typeof document === 'undefined') return [];

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 64;
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

        const palette = medianCut(pixels, count);
        resolve(palette.map(([r, g, b]) =>
          `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
        ));
      } catch {
        resolve([]);
      }
    };
    img.onerror = () => resolve([]);
    img.src = imageUrl;
  });
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
 * Map an extracted palette to ThemeColors by luminance and saturation.
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

  const bySat = [...palette].sort((a, b) => saturation(b) - saturation(a));
  const mostSaturated = bySat[0];

  const midDark = sorted[Math.floor(sorted.length * 0.25)] || darkest;
  const midLight = sorted[Math.floor(sorted.length * 0.75)] || lightest;

  const isDarkBg = luminance(darkest) < 128;

  return {
    canvasBg: darkest,
    widgetBg: isDarkBg ? lighten(darkest, 0.08) : darken(lightest, 0.95),
    widgetBorder: isDarkBg ? lighten(darkest, 0.15) : darken(lightest, 0.85),
    textPrimary: isDarkBg ? lightest : darkest,
    textSecondary: midLight,
    accent: mostSaturated,
    headerBg: midDark,
    headerText: isDarkBg ? lightest : darkest,
    tickerBg: midDark,
    tickerText: mostSaturated,
    rowAltBg: isDarkBg ? lighten(darkest, 0.05) : darken(lightest, 0.97),
  };
}
