'use client';

import React from 'react';
import { TEXTURE_CATALOG, getTextureCategories, type TextureCategory } from '../shared/textures';

interface TexturePickerProps {
  value?: string;
  onChange: (textureId: string) => void;
}

const CAT_LABELS: Record<TextureCategory, string> = {
  stone: 'Stone & Marble',
  wood: 'Wood',
  fabric: 'Fabric',
  metal: 'Metal',
  paper: 'Paper',
};

export function TexturePicker({ value, onChange }: TexturePickerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {getTextureCategories().map((cat) => {
        const items = TEXTURE_CATALOG.filter((t) => t.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <div style={{ fontSize: 10, color: 'var(--ed-text-dim)', marginBottom: 6 }}>{CAT_LABELS[cat]}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {items.map((t) => {
                const active = value === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    title={t.label}
                    onClick={() => onChange(t.id)}
                    style={{
                      height: 52,
                      borderRadius: 6,
                      border: active ? '2px solid var(--ed-accent-light)' : '1px solid var(--ed-border)',
                      cursor: 'pointer',
                      padding: 0,
                      position: 'relative',
                      overflow: 'hidden',
                      backgroundImage: `url(${t.imageUrl})`,
                      backgroundSize: '128px 128px',
                      backgroundRepeat: 'repeat',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        fontSize: 8,
                        color: '#fff',
                        background: 'rgba(0,0,0,0.55)',
                        padding: '2px 4px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
