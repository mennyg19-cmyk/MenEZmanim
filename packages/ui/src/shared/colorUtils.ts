export function hexToRgba(hex: string, opacity: number): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${opacity})`;
}

export function extractHex(color: string | undefined): string | null {
  if (!color) return null;
  if (color.startsWith('#')) return color;
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(parseInt(m[1]))}${toHex(parseInt(m[2]))}${toHex(parseInt(m[3]))}`;
}
