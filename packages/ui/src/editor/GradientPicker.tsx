'use client';

import React, { useState } from 'react';
import { GRADIENT_PRESETS, type GradientCategory } from '../shared/gradients';

interface GradientPickerProps {
  onChange: (gradientCss: string) => void;
}

const CATS: GradientCategory[] = ['warm', 'cool', 'neutral', 'vibrant'];

export function GradientPicker({ onChange }: GradientPickerProps) {
  const [angle, setAngle] = useState(135);
  const [c1, setC1] = useState('#667eea');
  const [c2, setC2] = useState('#764ba2');

  const custom = `linear-gradient(${angle}deg, ${c1} 0%, ${c2} 100%)`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="ed-sectionLabelSm">Presets</div>
      {CATS.map((cat) => (
        <div key={cat}>
          <div style={{ fontSize: 10, color: 'var(--ed-text-dim)', marginBottom: 4, textTransform: 'capitalize' }}>{cat}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {GRADIENT_PRESETS.filter((g) => g.category === cat).map((g) => {
              return (
                <button
                  key={g.id}
                  type="button"
                  title={g.label}
                  onClick={() => onChange(g.css)}
                  style={{
                    height: 36,
                    borderRadius: 6,
                    border: '1px solid var(--ed-border)',
                    background: g.css,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              );
            })}
          </div>
        </div>
      ))}

      <div className="ed-sectionLabelSm">Custom</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label>
          <span style={{ fontSize: 10, color: 'var(--ed-text-dim)' }}>Angle</span>
          <input
            type="range"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => setAngle(parseInt(e.target.value, 10))}
            className="ed-range"
            style={{ width: '100%' }}
          />
        </label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input type="color" value={c1} onChange={(e) => setC1(e.target.value)} className="ed-colorSwatch" style={{ width: 36, height: 28 }} />
          <input type="color" value={c2} onChange={(e) => setC2(e.target.value)} className="ed-colorSwatch" style={{ width: 36, height: 28 }} />
        </div>
      </div>
      <div
        style={{
          height: 44,
          borderRadius: 6,
          background: custom,
          border: '1px solid var(--ed-border)',
        }}
      />
      <button type="button" className="ed-btnSmall" style={{ width: '100%' }} onClick={() => onChange(custom)}>
        Use custom gradient
      </button>
    </div>
  );
}
