'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'zmanim-recent-colors';
const MAX_RECENT = 16;

function normalizeHex(color: string): string {
  if (!color || !color.startsWith('#')) return color;
  return color.toLowerCase().slice(0, 7);
}

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
      const filtered = prev.filter((c) => c !== hex);
      const next = [hex, ...filtered].slice(0, MAX_RECENT);
      saveRecent(next);
      return next;
    });
  }, []);

  return { recentColors, addRecentColor };
}
