'use client';

import React from 'react';
import { TEXTURE_CATALOG, getTextureCategories, type TextureCategory } from '../shared/textures';

interface TexturePickerProps {
  value?: string;
  onChange: (textureId: string) => void;
}

export function TexturePicker({ value, onChange }: TexturePickerProps) {
  const categories = getTextureCategories();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {categories.map((cat: TextureCategory) => {
        const items = TEXTURE_CATALOG.filter((t) => t.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <div style={{ fontSize: 10, color: 'var(--ed-text-dim)', marginBottom: 6, textTransform: 'capitalize' }}>{cat}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {items.map((t) => {
                const active = value === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    title={t.label}
                    onClick={() => onChange(t.id)}
                    style={{
                      height: 48,
                      borderRadius: 6,
                      border: active ? '2px solid var(--ed-accent-light)' : '1px solid var(--ed-border)',
                      background: t.css,
                      cursor: 'pointer',
                      padding: 4,
                      fontSize: 10,
                      color: 'rgba(0,0,0,0.5)',
                      textShadow: '0 0 4px #fff',
                    }}
                  >
                    {t.label}
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
