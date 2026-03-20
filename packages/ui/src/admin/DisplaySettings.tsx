'use client';

import React, { useState, useEffect } from 'react';


interface DisplaySettingsProps {
  settings: any;
  onChange: (settings: any) => void;
}

const RESOLUTIONS = [
  { label: '1920 x 1080 (Full HD)', value: '1920x1080' },
  { label: '3840 x 2160 (4K UHD)', value: '3840x2160' },
  { label: '1280 x 720 (HD)', value: '1280x720' },
  { label: '1080 x 1920 (Portrait FHD)', value: '1080x1920' },
  { label: 'Custom', value: 'custom' },
];

const LANGUAGES = ['Hebrew', 'English', 'Yiddish'];

export function DisplaySettings({ settings, onChange }: DisplaySettingsProps) {
  const [form, setForm] = useState<any>({
    resolution: '1920x1080',
    customWidth: 1920,
    customHeight: 1080,
    defaultLanguage: 'Hebrew',
    fontFamily: 'system-ui, sans-serif',
    autoRefreshInterval: 60,
    kioskMode: false,
    kioskHideCursor: false,
    kioskAutoStart: false,
    ...settings,
  });

  useEffect(() => {
    setForm((prev: any) => ({ ...prev, ...settings }));
  }, [settings]);

  const update = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onChange(form);
  };

  return (
    <div className="adm-card" style={{ maxWidth: 560 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 600 }}>הגדרות תצוגה — Display Settings</h2>

      <div className="adm-fieldGroup">
        <label className="adm-label">Screen Resolution</label>
        <select className="adm-inputLg" value={form.resolution} onChange={(e) => update('resolution', e.target.value)}>
          {RESOLUTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        {form.resolution === 'custom' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              className="adm-inputLg"
              style={{ width: 100 }}
              type="number"
              placeholder="Width"
              value={form.customWidth}
              onChange={(e) => update('customWidth', parseInt(e.target.value) || 0)}
            />
            <span style={{ alignSelf: 'center', color: 'var(--adm-text-muted)' }}>x</span>
            <input
              className="adm-inputLg"
              style={{ width: 100 }}
              type="number"
              placeholder="Height"
              value={form.customHeight}
              onChange={(e) => update('customHeight', parseInt(e.target.value) || 0)}
            />
          </div>
        )}
      </div>

      <div className="adm-fieldGroup">
        <label className="adm-label">Default Language / שפה</label>
        <select className="adm-inputLg" value={form.defaultLanguage} onChange={(e) => update('defaultLanguage', e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      <div className="adm-fieldGroup">
        <label className="adm-label">Default Font Family</label>
        <input className="adm-inputLg" value={form.fontFamily} onChange={(e) => update('fontFamily', e.target.value)} placeholder="e.g. system-ui, Arial" />
      </div>

      <div className="adm-fieldGroup">
        <label className="adm-label">Auto-Refresh Interval (seconds)</label>
        <input className="adm-inputLg" style={{ maxWidth: 150 }} type="number" min={0} value={form.autoRefreshInterval} onChange={(e) => update('autoRefreshInterval', parseInt(e.target.value) || 0)} />
      </div>

      <div className="adm-formPanel" style={{ marginBottom: 16 }}>
        <label className="adm-label" style={{ marginBottom: 8 }}>Kiosk Mode Options</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={form.kioskMode} onChange={(e) => update('kioskMode', e.target.checked)} />
            Enable Kiosk Mode
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, opacity: form.kioskMode ? 1 : 0.5 }}>
            <input type="checkbox" checked={form.kioskHideCursor} disabled={!form.kioskMode} onChange={(e) => update('kioskHideCursor', e.target.checked)} />
            Hide Cursor
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, opacity: form.kioskMode ? 1 : 0.5 }}>
            <input type="checkbox" checked={form.kioskAutoStart} disabled={!form.kioskMode} onChange={(e) => update('kioskAutoStart', e.target.checked)} />
            Auto-Start on Boot
          </label>
        </div>
      </div>

      <button onClick={handleSave} className="adm-btnPrimary" style={{ padding: '10px 24px', fontSize: 14, fontWeight: 600 }}>
        Save / שמור
      </button>
    </div>
  );
}
