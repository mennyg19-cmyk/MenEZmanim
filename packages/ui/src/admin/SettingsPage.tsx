'use client';

import React, { useEffect, useState } from 'react';
import type { DisplayNameOverrides } from '@zmanim-app/core';
import { LocationSetup } from './LocationSetup';
import { DisplayNamesEditor } from './DisplayNamesEditor';

const LANGUAGES = ['Hebrew', 'English', 'Yiddish'];

export interface DisplayPrefsSettings {
  defaultLanguage?: string;
  kioskMode?: boolean;
  kioskHideCursor?: boolean;
  kioskAutoStart?: boolean;
}

export interface SettingsPageProps {
  location: any;
  onLocationChange: (loc: any) => void;
  displayNames: DisplayNameOverrides;
  onDisplayNamesChange: (names: DisplayNameOverrides) => void;
  displayPrefs: DisplayPrefsSettings;
  onDisplayPrefsChange: (prefs: DisplayPrefsSettings) => void;
}

export function SettingsPage({
  location,
  onLocationChange,
  displayNames,
  onDisplayNamesChange,
  displayPrefs,
  onDisplayPrefsChange,
}: SettingsPageProps) {
  const [form, setForm] = useState<DisplayPrefsSettings>({
    defaultLanguage: 'Hebrew',
    kioskMode: false,
    kioskHideCursor: false,
    kioskAutoStart: false,
    ...displayPrefs,
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, ...displayPrefs }));
  }, [displayPrefs]);

  const updatePref = (key: keyof DisplayPrefsSettings, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveDisplayPrefs = () => {
    onDisplayPrefsChange(form);
  };

  return (
    <div>
      <h2 className="adm-pageTitle" style={{ margin: '0 0 20px', fontSize: 24 }}>
        Settings
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--adm-text-muted)' }}>
        Location, display labels, and default preferences for this organization.
      </p>

      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
        {/* Location — 25% */}
        <div className="adm-card" style={{ flex: '0 0 25%', minWidth: 0 }}>
          <div className="adm-sectionHeader">
            <h3 className="adm-sectionTitle" style={{ fontSize: 15 }}>Location</h3>
          </div>
          <LocationSetup embedded compact location={location} onChange={onLocationChange} />
        </div>

        {/* Language & Kiosk — 25% */}
        <div className="adm-card" style={{ flex: '0 0 25%', minWidth: 0 }}>
          <div className="adm-sectionHeader">
            <h3 className="adm-sectionTitle" style={{ fontSize: 15 }}>Language &amp; Kiosk</h3>
          </div>

          <div className="adm-fieldGroup">
            <label className="adm-label" style={{ fontSize: 12 }}>Default Language / שפה</label>
            <select
              className="adm-inputLg"
              style={{ fontSize: 13 }}
              value={form.defaultLanguage ?? 'Hebrew'}
              onChange={(e) => updatePref('defaultLanguage', e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="adm-formPanel" style={{ marginBottom: 12 }}>
            <label className="adm-label" style={{ marginBottom: 6, fontSize: 12 }}>
              Kiosk mode
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={!!form.kioskMode}
                  onChange={(e) => updatePref('kioskMode', e.target.checked)}
                />
                Enable kiosk mode
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  opacity: form.kioskMode ? 1 : 0.5,
                }}
              >
                <input
                  type="checkbox"
                  checked={!!form.kioskHideCursor}
                  disabled={!form.kioskMode}
                  onChange={(e) => updatePref('kioskHideCursor', e.target.checked)}
                />
                Hide cursor
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  opacity: form.kioskMode ? 1 : 0.5,
                }}
              >
                <input
                  type="checkbox"
                  checked={!!form.kioskAutoStart}
                  disabled={!form.kioskMode}
                  onChange={(e) => updatePref('kioskAutoStart', e.target.checked)}
                />
                Auto-start on boot
              </label>
            </div>
          </div>

          <button type="button" onClick={saveDisplayPrefs} className="adm-btnPrimary" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>
            Save
          </button>
        </div>

        {/* Display Names — 50% */}
        <div className="adm-card" style={{ flex: '1 1 50%', minWidth: 0, overflow: 'hidden' }}>
          <div className="adm-sectionHeader">
            <h3 className="adm-sectionTitle" style={{ fontSize: 15 }}>Display Names</h3>
          </div>
          <DisplayNamesEditor embedded overrides={displayNames} onChange={onDisplayNamesChange} />
        </div>
      </div>
    </div>
  );
}
