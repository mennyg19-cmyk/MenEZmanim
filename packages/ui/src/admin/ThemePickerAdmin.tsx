'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

export const ADMIN_THEME_KEY = 'zmanim-admin-theme';
export const ADMIN_CUSTOM_THEME_KEY = 'zmanim-admin-custom-theme';

export type AdminThemeId = 'light' | 'dark' | 'monochrome-light' | 'monochrome-dark' | 'custom';

export interface AdminCustomThemeColors {
  bg: string;
  text: string;
  accent: string;
  sidebarBg: string;
  sidebarText: string;
  border: string;
  danger: string;
  success: string;
}

export const DEFAULT_CUSTOM_LIGHT: AdminCustomThemeColors = {
  bg: '#ffffff',
  text: '#374151',
  accent: '#3b82f6',
  sidebarBg: '#111827',
  sidebarText: '#d1d5db',
  border: '#e5e7eb',
  danger: '#ef4444',
  success: '#059669',
};

const CUSTOM_VAR_PREFIX = '--custom-adm-';

const VAR_MAP: Record<keyof AdminCustomThemeColors, string> = {
  bg: 'bg',
  text: 'text',
  accent: 'accent',
  sidebarBg: 'sidebar-bg',
  sidebarText: 'sidebar-text',
  border: 'border',
  danger: 'danger',
  success: 'success',
};

function hexLuminance(hex: string): number {
  const m = hex.replace('#', '');
  if (m.length !== 6) return 0.5;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Apply CSS custom properties for [data-theme='custom'] */
export function applyCustomThemeColors(colors: AdminCustomThemeColors): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  (Object.entries(VAR_MAP) as [keyof AdminCustomThemeColors, string][]).forEach(([key, cssSuffix]) => {
    root.style.setProperty(`${CUSTOM_VAR_PREFIX}${cssSuffix}`, colors[key]);
  });
  const dark = hexLuminance(colors.bg) < 0.35;
  if (dark) root.setAttribute('data-custom-dark', '1');
  else root.removeAttribute('data-custom-dark');
}

export function clearCustomThemeColors(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  Object.values(VAR_MAP).forEach((cssSuffix) => {
    root.style.removeProperty(`${CUSTOM_VAR_PREFIX}${cssSuffix}`);
  });
  root.removeAttribute('data-custom-dark');
}

export function loadCustomThemeFromStorage(): AdminCustomThemeColors | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_CUSTOM_THEME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AdminCustomThemeColors>;
    return { ...DEFAULT_CUSTOM_LIGHT, ...parsed };
  } catch {
    return null;
  }
}

export function saveCustomThemeToStorage(colors: AdminCustomThemeColors): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_CUSTOM_THEME_KEY, JSON.stringify(colors));
}

const CUSTOM_LABELS: Record<keyof AdminCustomThemeColors, string> = {
  bg: 'Background',
  text: 'Text',
  accent: 'Accent',
  sidebarBg: 'Sidebar bg',
  sidebarText: 'Sidebar text',
  border: 'Border',
  danger: 'Danger',
  success: 'Success',
};

const PRESETS: { id: AdminThemeId; label: string; hint: string }[] = [
  { id: 'light', label: 'Light', hint: 'Classic light' },
  { id: 'dark', label: 'Dark', hint: 'Classic dark' },
  { id: 'monochrome-light', label: 'Mono light', hint: 'Black & white' },
  { id: 'monochrome-dark', label: 'Mono dark', hint: 'Grey on black' },
  { id: 'custom', label: 'Custom', hint: 'Your colors' },
];

export interface ThemePickerAdminProps {
  collapsed?: boolean;
  currentTheme: AdminThemeId;
  customColors: AdminCustomThemeColors;
  onSelectTheme: (id: AdminThemeId) => void;
  onCustomColorsChange: (colors: AdminCustomThemeColors) => void;
}

export function ThemePickerAdmin({
  collapsed,
  currentTheme,
  customColors,
  onSelectTheme,
  onCustomColorsChange,
}: ThemePickerAdminProps) {
  const [open, setOpen] = useState(false);

  const panelId = useMemo(() => 'adm-theme-picker-panel', []);

  const handlePresetClick = useCallback(
    (id: AdminThemeId) => {
      onSelectTheme(id);
      if (id !== 'custom') setOpen(false);
    },
    [onSelectTheme],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="adm-themePickerWrap">
      <button
        type="button"
        className={`adm-themeToggle ${collapsed ? 'adm-themeToggle--collapsed' : ''}`}
        title="Choose admin theme"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden>🎨</span>
        {!collapsed && <span>Theme</span>}
      </button>
      {open && (
        <>
          <button type="button" className="adm-themePickerBackdrop" aria-label="Close" onClick={() => setOpen(false)} />
          <div id={panelId} className="adm-themePickerPanel" role="dialog" aria-label="Admin theme">
            <div className="adm-themePickerGrid">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`adm-themePreset ${currentTheme === p.id ? 'adm-themePreset--active' : ''}`}
                  onClick={() => handlePresetClick(p.id)}
                >
                  <span className="adm-themePresetLabel">{p.label}</span>
                  <span className="adm-themePresetHint">{p.hint}</span>
                </button>
              ))}
            </div>
            {currentTheme === 'custom' && (
              <div className="adm-themeCustomFields">
                {(Object.keys(DEFAULT_CUSTOM_LIGHT) as (keyof AdminCustomThemeColors)[]).map((key) => (
                  <label key={key} className="adm-themeColorRow">
                    <span className="adm-themeColorLabel">{CUSTOM_LABELS[key]}</span>
                    <input
                      type="color"
                      value={
                        /^#[0-9A-Fa-f]{6}$/.test(customColors[key]) ? customColors[key] : '#888888'
                      }
                      onChange={(e) => onCustomColorsChange({ ...customColors, [key]: e.target.value })}
                      className="adm-themeColorInput"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
