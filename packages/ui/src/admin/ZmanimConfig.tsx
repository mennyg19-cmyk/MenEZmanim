'use client';

import React, { useState, useEffect } from 'react';


interface ZmanimConfigProps {
  configs: any[];
  onChange: (configs: any[]) => void;
}

const ZMAN_TYPES = [
  { id: 'alos', he: 'עלות השחר', en: 'Alos HaShachar' },
  { id: 'misheyakir', he: 'משיכיר', en: 'Misheyakir' },
  { id: 'hanetz', he: 'הנץ החמה', en: 'Hanetz HaChama' },
  { id: 'sofZmanShma', he: 'סוף זמן שמע', en: 'Sof Zman Shma' },
  { id: 'sofZmanTfila', he: 'סוף זמן תפילה', en: 'Sof Zman Tefilla' },
  { id: 'chatzos', he: 'חצות היום', en: 'Chatzos HaYom' },
  { id: 'minchaGedola', he: 'מנחה גדולה', en: 'Mincha Gedola' },
  { id: 'minchaKetana', he: 'מנחה קטנה', en: 'Mincha Ketana' },
  { id: 'plagHamincha', he: 'פלג המנחה', en: 'Plag HaMincha' },
  { id: 'shkia', he: 'שקיעה', en: 'Shkia' },
  { id: 'tzeis', he: 'צאת הכוכבים', en: 'Tzeis HaKochavim' },
  { id: 'rabbeinuTam', he: 'ר"ת', en: 'Rabbeinu Tam' },
  { id: 'chatzosLayla', he: 'חצות הלילה', en: 'Chatzos HaLayla' },
];

const AUTHORITIES = ['GRA', 'Magen Avraham', 'Tukachinsky', 'Baal HaTanya', 'DEGREES', 'FIXED_MINUTES'];

const GRA_DEFAULTS: Record<string, string> = {
  alos: 'GRA', misheyakir: 'GRA', hanetz: 'GRA', sofZmanShma: 'GRA',
  sofZmanTfila: 'GRA', chatzos: 'GRA', minchaGedola: 'GRA', minchaKetana: 'GRA',
  plagHamincha: 'GRA', shkia: 'GRA', tzeis: 'GRA', rabbeinuTam: 'GRA', chatzosLayla: 'GRA',
};

const TUKACHINSKY_DEFAULTS: Record<string, string> = {
  alos: 'Tukachinsky', misheyakir: 'Tukachinsky', hanetz: 'Tukachinsky', sofZmanShma: 'GRA',
  sofZmanTfila: 'GRA', chatzos: 'GRA', minchaGedola: 'GRA', minchaKetana: 'GRA',
  plagHamincha: 'GRA', shkia: 'Tukachinsky', tzeis: 'Tukachinsky', rabbeinuTam: 'Tukachinsky', chatzosLayla: 'GRA',
};

export function ZmanimConfig({ configs, onChange }: ZmanimConfigProps) {
  const [rows, setRows] = useState<any[]>(() =>
    ZMAN_TYPES.map((z) => {
      const existing = configs.find((c: any) => c.id === z.id);
      return existing || { id: z.id, authority: 'GRA', customDegrees: '', customMinutes: '', limitBefore: '', limitAfter: '' };
    })
  );

  useEffect(() => {
    if (configs.length > 0) {
      setRows(
        ZMAN_TYPES.map((z) => {
          const existing = configs.find((c: any) => c.id === z.id);
          return existing || { id: z.id, authority: 'GRA', customDegrees: '', customMinutes: '', limitBefore: '', limitAfter: '' };
        })
      );
    }
  }, [configs]);

  const updateRow = (idx: number, key: string, value: any) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  };

  const applyProfile = (profile: Record<string, string>) => {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        authority: profile[row.id] || row.authority,
        customDegrees: '',
        customMinutes: '',
      }))
    );
  };

  const handleSave = () => {
    onChange(rows);
  };

  return (
    <div className="adm-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>הגדרות זמנים — Zmanim Config</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => applyProfile(TUKACHINSKY_DEFAULTS)}
            className="adm-btnSave"
            style={{ padding: '6px 14px' }}
          >
            Apply Tukachinsky Profile
          </button>
          <button
            onClick={() => applyProfile(GRA_DEFAULTS)}
            className="adm-btn"
            style={{ padding: '6px 14px', backgroundColor: '#7c3aed', color: '#fff' }}
          >
            Apply GRA Profile
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="adm-table">
          <thead>
            <tr style={{ backgroundColor: 'var(--adm-bg-muted)' }}>
              <th className="adm-th" style={{ textAlign: 'right' }}>זמן / Zman</th>
              <th className="adm-th">Authority</th>
              <th className="adm-th">Custom Degrees</th>
              <th className="adm-th">Custom Minutes</th>
              <th className="adm-th">Limit Before</th>
              <th className="adm-th">Limit After</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const zman = ZMAN_TYPES.find((z) => z.id === row.id)!;
              return (
                <tr key={row.id}>
                  <td className="adm-td" style={{ textAlign: 'right' }}>
                    <strong>{zman.he}</strong>
                    <br />
                    <span style={{ color: 'var(--adm-text-muted)', fontSize: 12 }}>{zman.en}</span>
                  </td>
                  <td className="adm-td">
                    <select
                      className="adm-input"
                      style={{ width: 150 }}
                      value={row.authority}
                      onChange={(e) => updateRow(idx, 'authority', e.target.value)}
                    >
                      {AUTHORITIES.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </td>
                  <td className="adm-td">
                    <input
                      className="adm-input"
                      style={{ width: 80 }}
                      type="number"
                      step="any"
                      value={row.customDegrees}
                      disabled={row.authority !== 'DEGREES'}
                      onChange={(e) => updateRow(idx, 'customDegrees', e.target.value)}
                    />
                  </td>
                  <td className="adm-td">
                    <input
                      className="adm-input"
                      style={{ width: 80 }}
                      type="number"
                      value={row.customMinutes}
                      disabled={row.authority !== 'FIXED_MINUTES'}
                      onChange={(e) => updateRow(idx, 'customMinutes', e.target.value)}
                    />
                  </td>
                  <td className="adm-td">
                    <input
                      className="adm-input"
                      style={{ width: 80 }}
                      type="text"
                      placeholder="e.g. 05:00"
                      value={row.limitBefore}
                      onChange={(e) => updateRow(idx, 'limitBefore', e.target.value)}
                    />
                  </td>
                  <td className="adm-td">
                    <input
                      className="adm-input"
                      style={{ width: 80 }}
                      type="text"
                      placeholder="e.g. 20:00"
                      value={row.limitAfter}
                      onChange={(e) => updateRow(idx, 'limitAfter', e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={handleSave} className="adm-btnPrimary" style={{ padding: '10px 24px', fontSize: 14, fontWeight: 600 }}>
          Save / שמור
        </button>
      </div>
    </div>
  );
}
