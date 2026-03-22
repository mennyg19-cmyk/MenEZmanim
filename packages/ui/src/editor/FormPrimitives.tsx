'use client';

import React, { useState, useCallback } from 'react';
import { useColorContext } from './ColorContext';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="ed-field">
      <div className="ed-fieldLabel">{label}</div>
      {children}
    </div>
  );
}

export function Section({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ed-section">
      <button onClick={() => setOpen(!open)} className="ed-sectionToggle">
        <span className="ed-sectionTitle">{title}</span>
        <span className="ed-sectionArrow" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>&#9660;</span>
      </button>
      {open && <div className="ed-sectionBody">{children}</div>}
    </div>
  );
}

export function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="ed-input" />;
}

export function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className="ed-input" />;
}

export function ColorInput({ value, onChange, recentColors: recentProp, themeColors: themeProp, onColorUsed: onUsedProp }: {
  value: string;
  onChange: (v: string) => void;
  recentColors?: string[];
  themeColors?: string[];
  onColorUsed?: (color: string) => void;
}) {
  const ctx = useColorContext();
  const recent = recentProp ?? ctx.recentColors;
  const theme = themeProp ?? ctx.themeColors;
  const trackColor = onUsedProp ?? ctx.addRecentColor;

  const pick = useCallback((color: string) => {
    onChange(color);
    trackColor(color);
  }, [onChange, trackColor]);

  const handleNativeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    trackColor(e.target.value);
  }, [onChange, trackColor]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="ed-colorRow">
        <input type="color" value={value} onChange={handleNativeChange} className="ed-colorSwatch" />
        <input value={value} onChange={(e) => onChange(e.target.value)} onBlur={() => trackColor(value)} className="ed-input" style={{ flex: 1 }} />
      </div>
      {theme.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, color: 'var(--ed-text-dim)', minWidth: 34 }}>Theme</span>
          {theme.map((c) => (
            <ColorDot key={c} color={c} active={value === c} onClick={() => pick(c)} />
          ))}
        </div>
      )}
      {recent.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, color: 'var(--ed-text-dim)', minWidth: 34 }}>Recent</span>
          {recent.slice(0, 12).map((c) => (
            <ColorDot key={c} color={c} active={value === c} onClick={() => pick(c)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ColorDot({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={color}
      style={{
        width: 18, height: 18, borderRadius: '50%', padding: 0,
        backgroundColor: color,
        border: active ? '2px solid var(--ed-accent-light)' : '1px solid var(--ed-border)',
        cursor: 'pointer', flexShrink: 0,
        boxShadow: active ? '0 0 0 1px var(--ed-accent-light)' : 'none',
      }}
    />
  );
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="ed-input">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={checked ? "ed-toggleOn" : "ed-toggleOff"}
    >
      <div className="ed-toggleKnob" style={{ left: checked ? 21 : 3 }} />
    </button>
  );
}
