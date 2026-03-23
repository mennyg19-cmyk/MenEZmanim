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

      <div className="adm-settingsGrid">
        <div className="adm-card">
          <div className="adm-sectionHeader">
            <h3 className="adm-sectionTitle">Location &amp; zmanim</h3>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--adm-text-muted)' }}>
            מיקום — Used for zmanim calculations (coordinates, timezone, Israel flag, candle lighting).
          </p>
          <LocationSetup embedded location={location} onChange={onLocationChange} />
        </div>

        <div className="adm-card">
          <div className="adm-sectionHeader">
            <h3 className="adm-sectionTitle">Language &amp; kiosk</h3>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--adm-text-muted)' }}>
            Default language for the admin app context; kiosk options for future dedicated display hardware.
          </p>

          <div className="adm-fieldGroup">
            <label className="adm-label">Default Language / שפה</label>
            <select
              className="adm-inputLg"
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

          <div className="adm-formPanel" style={{ marginBottom: 16 }}>
            <label className="adm-label" style={{ marginBottom: 8 }}>
              Kiosk mode options
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
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
                  gap: 8,
                  fontSize: 14,
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
                  gap: 8,
                  fontSize: 14,
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

          <button type="button" onClick={saveDisplayPrefs} className="adm-btnPrimary" style={{ padding: '10px 24px', fontSize: 14, fontWeight: 600 }}>
            Save language &amp; kiosk
          </button>
        </div>

        <div className="adm-card" style={{ gridColumn: '1 / -1' }}>
          <div className="adm-sectionHeader">
            <h3 className="adm-sectionTitle">Display names</h3>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--adm-text-muted)' }}>
            Override English and Hebrew labels for zmanim and tefilah on the public display.
          </p>
          <DisplayNamesEditor embedded overrides={displayNames} onChange={onDisplayNamesChange} />
        </div>
      </div>
    </div>
  );
}
