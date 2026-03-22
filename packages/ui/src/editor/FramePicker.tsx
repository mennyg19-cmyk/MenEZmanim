'use client';

import React from 'react';
import { FRAME_CATALOG, type FrameCategory } from '../shared/frames';

interface FramePickerProps {
  value?: string | null;
  onChange: (frameId: string | undefined) => void;
}

const ORDER: FrameCategory[] = ['minimal', 'modern', 'ornamental'];

export function FramePicker({ value, onChange }: FramePickerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button
        type="button"
        className={!value ? 'ed-bgModeBtnActive' : 'ed-bgModeBtn'}
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => onChange(undefined)}
      >
        None
      </button>
      {ORDER.map((cat) => (
        <div key={cat}>
          <div style={{ fontSize: 10, color: 'var(--ed-text-dim)', marginBottom: 6, textTransform: 'capitalize' }}>{cat}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {FRAME_CATALOG.filter((f) => f.category === cat).map((f) => {
              const active = value === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  title={f.label}
                  onClick={() => onChange(f.id)}
                  style={{
                    height: 56,
                    borderRadius: 6,
                    border: active ? '2px solid var(--ed-accent-light)' : '1px solid var(--ed-border)',
                    background: '#e2e8f0',
                    cursor: 'pointer',
                    padding: 0,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 6,
                      boxSizing: 'border-box',
                      borderStyle: 'solid',
                      borderWidth: 0,
                      borderImage: `url("${f.svgDataUri}") ${f.borderImageSlice} / ${f.borderImageWidth} / 0 stretch`,
                      background: 'rgba(255,255,255,0.5)',
                    }}
                  />
                  <span
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      fontSize: 9,
                      color: 'var(--ed-text-dim)',
                      display: 'block',
                      marginTop: 36,
                    }}
                  >
                    {f.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
