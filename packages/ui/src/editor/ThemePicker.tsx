'use client';

import React, { useState } from 'react';
import { extractPaletteFromImage, paletteToThemeColors } from '../shared/colorExtract';
import { ColorPicker } from '../shared/ColorPicker';


export interface ColorTheme {
  id: string;
  name: string;
  builtIn: boolean;
  colors: ThemeColors;
}

export interface ThemeColors {
  canvasBg: string;
  widgetBg: string;
  widgetBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  headerBg: string;
  headerText: string;
  tickerBg: string;
  tickerText: string;
  rowAltBg: string;
}

const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  canvasBg: 'Canvas Background',
  widgetBg: 'Widget Background',
  widgetBorder: 'Widget Border',
  textPrimary: 'Primary Text',
  textSecondary: 'Secondary Text',
  accent: 'Accent',
  headerBg: 'Header Background',
  headerText: 'Header Text',
  tickerBg: 'Ticker Background',
  tickerText: 'Ticker Text',
  rowAltBg: 'Table Alt Row',
};

export const BUILT_IN_THEMES: ColorTheme[] = [
  { id: 'classic-dark', name: 'Classic Dark', builtIn: true, colors: { canvasBg: '#0f172a', widgetBg: 'rgba(15,23,42,0.85)', widgetBorder: '#1e293b', textPrimary: '#e2e8f0', textSecondary: '#94a3b8', accent: '#38bdf8', headerBg: '#1e293b', headerText: '#f1f5f9', tickerBg: '#1e293b', tickerText: '#38bdf8', rowAltBg: '#1e293b' } },
  { id: 'midnight-blue', name: 'Midnight Blue', builtIn: true, colors: { canvasBg: '#0a1628', widgetBg: 'rgba(10,22,40,0.9)', widgetBorder: '#1a2d4a', textPrimary: '#c8ddf5', textSecondary: '#6b8ab5', accent: '#4a90d9', headerBg: '#0d2240', headerText: '#e0ecf9', tickerBg: '#0d2240', tickerText: '#5ba3f5', rowAltBg: '#122b4d' } },
  { id: 'warm-gold', name: 'Warm Gold', builtIn: true, colors: { canvasBg: '#1a1207', widgetBg: 'rgba(30,22,10,0.9)', widgetBorder: '#3d2e14', textPrimary: '#f5e6c8', textSecondary: '#b5956b', accent: '#d4a34a', headerBg: '#2a1f0d', headerText: '#f5e6c8', tickerBg: '#2a1f0d', tickerText: '#d4a34a', rowAltBg: '#2e2210' } },
  { id: 'royal-purple', name: 'Royal Purple', builtIn: true, colors: { canvasBg: '#120b20', widgetBg: 'rgba(20,14,35,0.9)', widgetBorder: '#2d1f4e', textPrimary: '#ddd0f0', textSecondary: '#9b85c4', accent: '#a78bfa', headerBg: '#1c1035', headerText: '#ede5ff', tickerBg: '#1c1035', tickerText: '#a78bfa', rowAltBg: '#221545' } },
  { id: 'forest-green', name: 'Forest Green', builtIn: true, colors: { canvasBg: '#0a1a0f', widgetBg: 'rgba(12,28,18,0.9)', widgetBorder: '#1a3d24', textPrimary: '#c8f0d5', textSecondary: '#6bb580', accent: '#34d399', headerBg: '#0d2a16', headerText: '#d5f5e0', tickerBg: '#0d2a16', tickerText: '#34d399', rowAltBg: '#12301a' } },
  { id: 'clean-white', name: 'Clean White', builtIn: true, colors: { canvasBg: '#f8fafc', widgetBg: 'rgba(255,255,255,0.95)', widgetBorder: '#e2e8f0', textPrimary: '#1e293b', textSecondary: '#64748b', accent: '#2563eb', headerBg: '#ffffff', headerText: '#0f172a', tickerBg: '#f1f5f9', tickerText: '#1e40af', rowAltBg: '#e8edf4' } },
  { id: 'sunset-red', name: 'Sunset Red', builtIn: true, colors: { canvasBg: '#1a0a0a', widgetBg: 'rgba(30,12,12,0.9)', widgetBorder: '#3d1414', textPrimary: '#f5c8c8', textSecondary: '#b56b6b', accent: '#f87171', headerBg: '#2a0d0d', headerText: '#fde2e2', tickerBg: '#2a0d0d', tickerText: '#f87171', rowAltBg: '#351212' } },
  { id: 'ocean-teal', name: 'Ocean Teal', builtIn: true, colors: { canvasBg: '#0a1a1a', widgetBg: 'rgba(12,28,28,0.9)', widgetBorder: '#1a3d3d', textPrimary: '#c8f0f0', textSecondary: '#6bb5b5', accent: '#2dd4bf', headerBg: '#0d2a2a', headerText: '#d5f5f5', tickerBg: '#0d2a2a', tickerText: '#2dd4bf', rowAltBg: '#123232' } },
];

interface ThemePickerProps {
  activeThemeId: string | null;
  customThemes: ColorTheme[];
  onApplyTheme: (theme: ColorTheme) => void;
  onSaveCustomTheme: (theme: ColorTheme) => void;
  onDeleteCustomTheme: (themeId: string) => void;
  /** Current background image URL for auto-generating a theme palette */
  backgroundImageUrl?: string;
}

export function ThemePicker({
  activeThemeId,
  customThemes,
  onApplyTheme,
  onSaveCustomTheme,
  onDeleteCustomTheme,
  backgroundImageUrl,
}: ThemePickerProps) {
  const allThemes = [...BUILT_IN_THEMES, ...customThemes];
  const [editingColors, setEditingColors] = useState<ThemeColors | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingBaseId, setEditingBaseId] = useState<string | null>(null);
  const [autoGenerating, setAutoGenerating] = useState(false);

  const handleAutoGenerate = async () => {
    if (!backgroundImageUrl) return;
    setAutoGenerating(true);
    try {
      const palette = await extractPaletteFromImage(backgroundImageUrl, 12);
      if (palette.length === 0) return;
      const colors = paletteToThemeColors(palette);
      const theme: ColorTheme = {
        id: `auto-${Date.now()}`,
        name: 'Auto (from background)',
        builtIn: false,
        colors,
      };
      onSaveCustomTheme(theme);
      onApplyTheme(theme);
    } finally {
      setAutoGenerating(false);
    }
  };

  const startCustomize = (theme: ColorTheme) => {
    setEditingColors({ ...theme.colors });
    setEditingName(theme.builtIn ? `${theme.name} (Custom)` : theme.name);
    setEditingBaseId(theme.id);
  };

  const applyAndClose = () => {
    if (!editingColors) return;
    const theme: ColorTheme = {
      id: editingBaseId && !BUILT_IN_THEMES.find((t) => t.id === editingBaseId)
        ? editingBaseId
        : `custom-${Date.now()}`,
      name: editingName,
      builtIn: false,
      colors: editingColors,
    };
    onApplyTheme(theme);
    setEditingColors(null);
  };

  const saveAsNew = () => {
    if (!editingColors) return;
    const theme: ColorTheme = {
      id: `custom-${Date.now()}`,
      name: editingName || 'Custom Theme',
      builtIn: false,
      colors: { ...editingColors },
    };
    onSaveCustomTheme(theme);
    onApplyTheme(theme);
    setEditingColors(null);
  };

  if (editingColors) {
    return (
      <div className="ed-panelBody">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={() => setEditingColors(null)} className="ed-btnGhost" style={{ fontSize: 13 }}>&larr; Back</button>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ed-text)' }}>Customize Theme</div>
          <div style={{ width: 40 }} />
        </div>

        <div className="ed-field">
          <div className="ed-fieldLabel">Theme Name</div>
          <input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="ed-input" />
        </div>

        <div style={{ marginBottom: 16, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--ed-border)' }}>
          <div style={{ height: 60, backgroundColor: editingColors.canvasBg, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 12px' }}>
            <div style={{ backgroundColor: editingColors.headerBg, padding: '4px 12px', borderRadius: 4 }}>
              <span style={{ color: editingColors.headerText, fontSize: 11, fontWeight: 600 }}>Header</span>
            </div>
            <div style={{ backgroundColor: editingColors.widgetBg, border: `1px solid ${editingColors.widgetBorder}`, padding: '4px 12px', borderRadius: 4 }}>
              <span style={{ color: editingColors.textPrimary, fontSize: 11 }}>Widget</span>
            </div>
            <span style={{ color: editingColors.accent, fontSize: 11, fontWeight: 600 }}>Accent</span>
          </div>
          <div style={{ height: 20, backgroundColor: editingColors.tickerBg, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
            <span style={{ color: editingColors.tickerText, fontSize: 9 }}>Ticker text preview</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {(Object.keys(COLOR_LABELS) as (keyof ThemeColors)[]).map((key) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--ed-text-muted)' }}>{COLOR_LABELS[key]}</span>
              <ColorPicker
                variant="compact"
                value={editingColors[key]}
                onChange={(v) => setEditingColors({ ...editingColors, [key]: v })}
                textInputClassName="ed-input ed-themeColorInput"
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={applyAndClose} className="ed-btnPrimary" style={{ flex: 1, padding: '8px 0', justifyContent: 'center' }}>Apply</button>
          <button onClick={saveAsNew} className="ed-btnSmall" style={{ flex: 1, padding: '8px 0', justifyContent: 'center' }}>Save as New</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ed-panelBody">
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ed-text)', marginBottom: 12 }}>Color Themes</div>

      {backgroundImageUrl && (
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={handleAutoGenerate}
            disabled={autoGenerating}
            className="ed-btnPrimary"
            style={{ width: '100%', padding: '8px 0', justifyContent: 'center', fontSize: 12 }}
          >
            {autoGenerating ? 'Generating...' : 'Auto-Generate from Background'}
          </button>
          <div style={{ fontSize: 9, color: 'var(--ed-text-dim)', marginTop: 4, textAlign: 'center' }}>
            Creates a matching color theme from the background image
          </div>
        </div>
      )}

      <div className="ed-sectionLabelSm" style={{ marginBottom: 8 }}>Built-in</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {BUILT_IN_THEMES.map((theme) => (
          <ThemeCard key={theme.id} theme={theme} isActive={activeThemeId === theme.id} onApply={() => onApplyTheme(theme)} onCustomize={() => startCustomize(theme)} />
        ))}
      </div>

      {customThemes.length > 0 && (
        <>
          <div className="ed-sectionLabelSm" style={{ marginBottom: 8 }}>Custom</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {customThemes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} isActive={activeThemeId === theme.id} onApply={() => onApplyTheme(theme)} onCustomize={() => startCustomize(theme)} onDelete={() => onDeleteCustomTheme(theme.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ThemeCard({ theme, isActive, onApply, onCustomize, onDelete }: {
  theme: ColorTheme; isActive: boolean; onApply: () => void; onCustomize: () => void; onDelete?: () => void;
}) {
  return (
    <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: isActive ? '2px solid var(--ed-accent)' : '1px solid var(--ed-border)', cursor: 'pointer', transition: 'border-color 0.15s' }}>
      <div onClick={onApply} style={{ height: 40, backgroundColor: theme.colors.canvasBg, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '0 6px' }}>
        {[theme.colors.headerBg, theme.colors.widgetBg, theme.colors.accent, theme.colors.textPrimary].map((c, i) => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: c, border: '1px solid rgba(255,255,255,0.15)' }} />
        ))}
      </div>
      <div style={{ padding: '6px 8px', backgroundColor: 'var(--ed-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--ed-text)', fontWeight: isActive ? 600 : 400 }}>{theme.name}</span>
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={onCustomize} title="Customize" className="ed-btnGhost" style={{ fontSize: 12 }}>&#9998;</button>
          {onDelete && <button onClick={onDelete} title="Delete" className="ed-btnGhost" style={{ fontSize: 12, color: 'var(--ed-danger-border)' }}>&times;</button>}
        </div>
      </div>
    </div>
  );
}
