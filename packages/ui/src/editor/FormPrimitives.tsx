'use client';

import React, { useState } from 'react';

export { ColorPicker, ColorDot, ColorPicker as ColorInput } from '../shared/ColorPicker';
export { Toggle } from '../shared/Toggle';

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

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="ed-input">
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}
