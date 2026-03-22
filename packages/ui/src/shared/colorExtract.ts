import type { ThemeColors } from '../editor/ThemePicker';
import type { DisplayObject, DisplayStyle } from '@zmanim-app/core';
import { getTextureById } from './textures';

/**
 * Sample the actual visual background behind an object by rendering it
 * to an offscreen canvas and extracting the average color of that region.
 * Works for solid colors, gradients, textures, and uploaded images.
 * Returns a promise that resolves to a hex color string.
 */
export async function sampleBackgroundAtObject(
  obj: DisplayObject,
  style: DisplayStyle,
  canvasW: number,
  canvasH: number,
): Promise<string> {
  if (typeof document === 'undefined') return '#808080';

  const bgMode = style.backgroundMode ?? (style.backgroundImage ? 'image' : 'solid');

  // For solid color, no need to render
  if (bgMode === 'solid') {
    return style.backgroundColor || '#000000';
  }

  // For textures with known dominant colors, use that as a fast path
  if (bgMode === 'texture' && style.backgroundTexture) {
    const tex = getTextureById(style.backgroundTexture);
    if (tex) return tex.dominantColor;
  }

  // For gradients, render to canvas and sample
  if (bgMode === 'gradient' && style.backgroundGradient) {
    return sampleGradientAtRegion(
      style.backgroundGradient,
      canvasW, canvasH,
      obj.position.x, obj.position.y,
      obj.position.width, obj.position.height,
    );
  }

  // For images, load and sample the region behind the object
  const imgUrl = style.backgroundImage;
  if (bgMode === 'image' && imgUrl) {
    return sampleImageAtRegion(
      imgUrl,
      canvasW, canvasH,
      obj.position.x, obj.position.y,
      obj.position.width, obj.position.height,
    );
  }

  // For textures without a known dominant color, try loading the image
  if (bgMode === 'texture' && style.backgroundTexture) {
    const tex = getTextureById(style.backgroundTexture);
    if (tex) {
      return sampleImageAverage(tex.imageUrl);
    }
  }

  return style.backgroundColor || '#808080';
}

function sampleGradientAtRegion(
  gradient: string,
  fullW: number, fullH: number,
  x: number, y: number, w: number, h: number,
): string {
  try {
    const canvas = document.createElement('canvas');
    const sampleW = 32, sampleH = 32;
    canvas.width = sampleW;
    canvas.height = sampleH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#808080';

    // Scale the gradient to the full canvas size, then offset to the object region
    const scaleX = sampleW / w;
    const scaleY = sampleH / h;
    ctx.save();
    ctx.scale(scaleX, scaleY);
    ctx.translate(-x, -y);

    // Create a temporary div to parse the CSS gradient
    const div = document.createElement('div');
    div.style.cssText = `position:fixed;left:-9999px;width:${fullW}px;height:${fullH}px;background:${gradient}`;
    document.body.appendChild(div);
    const computed = getComputedStyle(div).backgroundImage;
    document.body.removeChild(div);

    // Draw a rect with the gradient -- we can approximate by filling with the
    // average of the gradient at this position
    ctx.restore();

    // Simpler approach: just compute what percentage through the canvas the object center is
    const cx = (x + w / 2) / fullW;
    const cy = (y + h / 2) / fullH;
    const t = (cx + cy) / 2; // rough position along a typical diagonal gradient
    // Parse gradient colors
    const colorMatches = computed.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g);
    if (colorMatches && colorMatches.length >= 2) {
      return interpolateColors(colorMatches[0], colorMatches[colorMatches.length - 1], t);
    }
    return '#808080';
  } catch {
    return '#808080';
  }
}

function interpolateColors(c1: string, c2: string, t: number): string {
  const rgb1 = parseColorToRgb(c1);
  const rgb2 = parseColorToRgb(c2);
  if (!rgb1 || !rgb2) return c1;
  const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * t);
  const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * t);
  const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function parseColorToRgb(color: string): [number, number, number] | null {
  if (color.startsWith('#')) {
    const hex = color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
  return null;
}

function sampleImageAtRegion(
  imageUrl: string,
  fullW: number, fullH: number,
  x: number, y: number, w: number, h: number,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const sampleSize = 32;
        const canvas = document.createElement('canvas');
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve('#808080'); return; }

        // The background image is displayed as "cover" on the full canvas.
        // Compute the cover transform.
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const canvasAspect = fullW / fullH;
        let drawW: number, drawH: number, drawX: number, drawY: number;
        if (imgAspect > canvasAspect) {
          drawH = fullH;
          drawW = fullH * imgAspect;
          drawX = (fullW - drawW) / 2;
          drawY = 0;
        } else {
          drawW = fullW;
          drawH = fullW / imgAspect;
          drawX = 0;
          drawY = (fullH - drawH) / 2;
        }

        // Map the object region to image coordinates
        const scaleX = sampleSize / w;
        const scaleY = sampleSize / h;
        ctx.scale(scaleX, scaleY);
        ctx.translate(-x, -y);
        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          rSum += data[i]; gSum += data[i + 1]; bSum += data[i + 2];
          count++;
        }
        if (count === 0) { resolve('#808080'); return; }
        const r = Math.round(rSum / count);
        const g = Math.round(gSum / count);
        const b = Math.round(bSum / count);
        resolve(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
      } catch {
        resolve('#808080');
      }
    };
    img.onerror = () => resolve('#808080');
    img.src = imageUrl;
  });
}

function sampleImageAverage(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve('#808080'); return; }
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          rSum += data[i]; gSum += data[i + 1]; bSum += data[i + 2]; count++;
        }
        if (count === 0) { resolve('#808080'); return; }
        const r = Math.round(rSum / count);
        const g = Math.round(gSum / count);
        const b = Math.round(bSum / count);
        resolve(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
      } catch { resolve('#808080'); }
    };
    img.onerror = () => resolve('#808080');
    img.src = imageUrl;
  });
}

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
 * Given a background color and a palette of available colors, pick the best
 * text color. Prefers palette colors that have sufficient contrast and
 * visual richness (saturation) over generic black/white.
 *
 * For light backgrounds: picks the darkest, most saturated palette color
 * (e.g. a rich mahogany or deep blue rather than plain black).
 * For dark backgrounds: picks the lightest, most saturated palette color.
 * Falls back to a generic high-contrast color if no palette color qualifies.
 */
export function bestTextColorFromPalette(bgHex: string, palette: string[]): string {
  if (!palette.length) return contrastTextColor(bgHex);

  const bgLum = luminance(bgHex);
  const isDarkBg = bgLum < 140;

  // Minimum contrast distance in luminance (0-255 scale) for readability
  const MIN_CONTRAST = 80;

  // Score each palette color: we want good contrast AND visual richness
  const scored = palette
    .map((c) => {
      const cLum = luminance(c);
      const contrast = Math.abs(cLum - bgLum);
      const sat = saturation(c);
      const directionOk = isDarkBg ? cLum > bgLum : cLum < bgLum;
      return { color: c, contrast, sat, directionOk, lum: cLum };
    })
    .filter((c) => c.contrast >= MIN_CONTRAST && c.directionOk);

  if (scored.length > 0) {
    // Rank by weighted score: contrast matters most, saturation is a bonus
    // so we prefer a rich brown over plain gray at similar contrast levels
    scored.sort((a, b) => {
      const scoreA = a.contrast + a.sat * 80;
      const scoreB = b.contrast + b.sat * 80;
      return scoreB - scoreA;
    });
    return scored[0].color;
  }

  // No palette color qualifies -- always fall back to a guaranteed readable color.
  // Use the generic contrast color (white on dark, dark slate on light).
  return contrastTextColor(bgHex);
}
