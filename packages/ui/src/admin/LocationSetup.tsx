'use client';

import React, { useState, useEffect } from 'react';


interface LocationSetupProps {
  location: any;
  onChange: (location: any) => void;
  /** When true, omit outer card wrapper (for unified Settings page). */
  embedded?: boolean;
}

const TIMEZONES = [
  'Asia/Jerusalem', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Toronto', 'America/Montreal', 'Europe/London',
  'Europe/Paris', 'Europe/Berlin', 'Australia/Sydney', 'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires', 'Africa/Johannesburg',
];

const DIALECTS = ['Ashkenazi', 'Sephardi', 'Yemenite'];

export function LocationSetup({ location, onChange, embedded }: LocationSetupProps) {
  const [form, setForm] = useState<any>({
    name: '',
    latitude: '',
    longitude: '',
    elevation: 0,
    timezone: 'Asia/Jerusalem',
    inIsrael: true,
    dialect: 'Ashkenazi',
    candleLightingMinutes: 18,
    shabbatEndType: 'degrees',
    shabbatEndValue: 8.5,
    rabbeinuTamType: 'degrees',
    rabbeinuTamValue: 16.01,
    ampmFormat: false,
    ...location,
  });

  useEffect(() => {
    setForm((prev: any) => ({ ...prev, ...location }));
  }, [location]);

  const update = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onChange(form);
  };

  const inner = (
    <>
      {!embedded && (
        <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 600 }}>הגדרת מיקום — Location Setup</h2>
      )}

      <div className="adm-fieldGroup">
        <label className="adm-label">שם / Name</label>
        <input className="adm-inputLg" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Congregation Name" />
      </div>

      <div className="adm-fieldGroup" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label className="adm-label">Latitude</label>
          <input className="adm-inputLg" type="number" step="any" value={form.latitude} onChange={(e) => update('latitude', parseFloat(e.target.value) || '')} />
        </div>
        <div>
          <label className="adm-label">Longitude</label>
          <input className="adm-inputLg" type="number" step="any" value={form.longitude} onChange={(e) => update('longitude', parseFloat(e.target.value) || '')} />
        </div>
        <div>
          <label className="adm-label">Elevation (m)</label>
          <input className="adm-inputLg" type="number" value={form.elevation} onChange={(e) => update('elevation', parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <div className="adm-fieldGroup" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="adm-label">Timezone</label>
          <select className="adm-inputLg" value={form.timezone} onChange={(e) => update('timezone', e.target.value)}>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="adm-label">Dialect / נוסח</label>
          <select className="adm-inputLg" value={form.dialect} onChange={(e) => update('dialect', e.target.value)}>
            {DIALECTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="adm-fieldGroup" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <label className="adm-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={form.inIsrael} onChange={(e) => update('inIsrael', e.target.checked)} />
          In Israel / בארץ ישראל
        </label>
        <label className="adm-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={form.ampmFormat} onChange={(e) => update('ampmFormat', e.target.checked)} />
          AM/PM Format
        </label>
      </div>

      <div className="adm-fieldGroup">
        <label className="adm-label">Candle Lighting Minutes / דקות הדלקת נרות</label>
        <input className="adm-inputLg" style={{ maxWidth: 120 }} type="number" value={form.candleLightingMinutes} onChange={(e) => update('candleLightingMinutes', parseInt(e.target.value) || 18)} />
      </div>

      <div className="adm-fieldGroup" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="adm-label">Shabbat End Type / סוג צאת שבת</label>
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
              <input type="radio" name="shabbatEndType" value="degrees" checked={form.shabbatEndType === 'degrees'} onChange={() => update('shabbatEndType', 'degrees')} />
              Degrees
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
              <input type="radio" name="shabbatEndType" value="minutes" checked={form.shabbatEndType === 'minutes'} onChange={() => update('shabbatEndType', 'minutes')} />
              Minutes
            </label>
          </div>
          <input className="adm-inputLg" style={{ marginTop: 8, maxWidth: 120 }} type="number" step="any" value={form.shabbatEndValue} onChange={(e) => update('shabbatEndValue', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label className="adm-label">Rabbeinu Tam Type / רבינו תם</label>
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
              <input type="radio" name="rabbeinuTamType" value="degrees" checked={form.rabbeinuTamType === 'degrees'} onChange={() => update('rabbeinuTamType', 'degrees')} />
              Degrees
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
              <input type="radio" name="rabbeinuTamType" value="minutes" checked={form.rabbeinuTamType === 'minutes'} onChange={() => update('rabbeinuTamType', 'minutes')} />
              Minutes
            </label>
          </div>
          <input className="adm-inputLg" style={{ marginTop: 8, maxWidth: 120 }} type="number" step="any" value={form.rabbeinuTamValue} onChange={(e) => update('rabbeinuTamValue', parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <button onClick={handleSave} className="adm-btnPrimary" style={{ padding: '10px 24px', fontSize: 14, fontWeight: 600 }}>
        Save / שמור
      </button>
    </>
  );

  if (embedded) {
    return <div style={{ maxWidth: '100%' }}>{inner}</div>;
  }

  return (
    <div className="adm-card" style={{ maxWidth: 640 }}>
      {inner}
    </div>
  );
}
