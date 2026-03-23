'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'zmanim-recent-colors';
const MAX_RECENT = 16;

function normalizeHex(color: string): string {
  if (!color || !color.startsWith('#')) return color;
  return color.toLowerCase().slice(0, 7);
}

function parseHexRgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

/** Manhattan distance between two hex colours. Returns Infinity for unparseable values. */
function colorDistance(a: string, b: string): number {
  const ra = parseHexRgb(a);
  const rb = parseHexRgb(b);
  if (!ra || !rb) return Infinity;
  return Math.abs(ra[0] - rb[0]) + Math.abs(ra[1] - rb[1]) + Math.abs(ra[2] - rb[2]);
}

const NEAR_DUPLICATE_THRESHOLD = 12;

function loadRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(colors: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors.slice(0, MAX_RECENT)));
  } catch { /* quota exceeded or private mode */ }
}

export function useRecentColors() {
  const [recentColors, setRecentColors] = useState<string[]>([]);

  useEffect(() => {
    setRecentColors(loadRecent());
  }, []);

  const addRecentColor = useCallback((color: string) => {
    const hex = normalizeHex(color);
    if (!hex || hex.length < 4) return;
    setRecentColors((prev) => {
      const filtered = prev.filter(
        (c) => c !== hex && colorDistance(c, hex) > NEAR_DUPLICATE_THRESHOLD,
      );
      const next = [hex, ...filtered].slice(0, MAX_RECENT);
      saveRecent(next);
      return next;
    });
  }, []);

  return { recentColors, addRecentColor };
}
