'use client';

import React, { useState, useEffect } from 'react';
import { ZmanType, ENGLISH_LABELS, HEBREW_LABELS } from '@zmanim-app/core';
import type { DisplayNameOverrides } from '@zmanim-app/core';
import { TEFILAH_LABELS_ENGLISH, TEFILAH_LABELS_HEBREW } from '../display/widgets/JewishInfoWidget';

const ZMAN_KEYS = Object.values(ZmanType).filter((k) => !k.includes('TUKACHINSKY'));
const TEFILAH_KEYS = Object.keys(TEFILAH_LABELS_ENGLISH);

interface DisplayNamesEditorProps {
  overrides: DisplayNameOverrides;
  onChange: (overrides: DisplayNameOverrides) => void;
}

const cellStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid var(--adm-border, #334155)',
  verticalAlign: 'middle',
  fontSize: 13,
};

const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  fontWeight: 600,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  color: 'var(--adm-text-muted, #94a3b8)',
  position: 'sticky',
  top: 0,
  background: 'var(--adm-bg-card, #1e293b)',
  zIndex: 1,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '5px 8px',
  fontSize: 13,
  border: '1px solid var(--adm-border, #334155)',
  borderRadius: 4,
  background: 'var(--adm-bg, #0f172a)',
  color: 'var(--adm-text, #e2e8f0)',
  outline: 'none',
  boxSizing: 'border-box',
};

function NameRow({
  itemKey,
  defaultEnglish,
  defaultHebrew,
  overrides,
  onUpdate,
}: {
  itemKey: string;
  defaultEnglish: string;
  defaultHebrew: string;
  overrides: DisplayNameOverrides;
  onUpdate: (key: string, field: 'english' | 'hebrew', value: string) => void;
}) {
  const entry = overrides[itemKey];
  return (
    <tr>
      <td style={cellStyle}>{defaultEnglish}</td>
      <td style={{ ...cellStyle, direction: 'rtl', textAlign: 'right' }}>{defaultHebrew}</td>
      <td style={cellStyle}>
        <input
          style={inputStyle}
          value={entry?.english ?? ''}
          onChange={(e) => onUpdate(itemKey, 'english', e.target.value)}
          placeholder={defaultEnglish}
        />
      </td>
      <td style={cellStyle}>
        <input
          style={{ ...inputStyle, direction: 'rtl', textAlign: 'right' }}
          value={entry?.hebrew ?? ''}
          onChange={(e) => onUpdate(itemKey, 'hebrew', e.target.value)}
          placeholder={defaultHebrew}
        />
      </td>
    </tr>
  );
}

export function DisplayNamesEditor({ overrides: initial, onChange }: DisplayNamesEditorProps) {
  const [data, setData] = useState<DisplayNameOverrides>(initial || {});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setData(initial || {});
    setDirty(false);
  }, [initial]);

  const update = (key: string, field: 'english' | 'hebrew', value: string) => {
    setData((prev) => {
      const entry = prev[key] || {};
      const updated = { ...entry, [field]: value || undefined };
      if (!updated.english && !updated.hebrew) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: updated };
    });
    setDirty(true);
  };

  const handleSave = () => {
    onChange(data);
    setDirty(false);
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
  };

  return (
    <div className="adm-card" style={{ maxWidth: 900 }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>
        שמות תצוגה — Display Names
      </h2>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--adm-text-muted, #94a3b8)' }}>
        Customize how zmanim and tefilah items appear on the display. Leave fields empty to use the default name.
      </p>

      <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 600 }}>Zmanim Names</h3>
      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <table style={tableStyle}>
          <colgroup>
            <col style={{ width: '22%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '28%' }} />
            <col style={{ width: '28%' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={headerCellStyle}>Default English</th>
              <th style={{ ...headerCellStyle, textAlign: 'right' }}>Default Hebrew</th>
              <th style={headerCellStyle}>Custom English</th>
              <th style={{ ...headerCellStyle, textAlign: 'right' }}>Custom Hebrew</th>
            </tr>
          </thead>
          <tbody>
            {ZMAN_KEYS.map((key) => (
              <NameRow
                key={key}
                itemKey={key}
                defaultEnglish={ENGLISH_LABELS[key]}
                defaultHebrew={HEBREW_LABELS[key]}
                overrides={data}
                onUpdate={update}
              />
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 600 }}>Tefilah / Davening Names</h3>
      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <table style={tableStyle}>
          <colgroup>
            <col style={{ width: '22%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '28%' }} />
            <col style={{ width: '28%' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={headerCellStyle}>Default English</th>
              <th style={{ ...headerCellStyle, textAlign: 'right' }}>Default Hebrew</th>
              <th style={headerCellStyle}>Custom English</th>
              <th style={{ ...headerCellStyle, textAlign: 'right' }}>Custom Hebrew</th>
            </tr>
          </thead>
          <tbody>
            {TEFILAH_KEYS.map((key) => (
              <NameRow
                key={key}
                itemKey={key}
                defaultEnglish={TEFILAH_LABELS_ENGLISH[key]}
                defaultHebrew={TEFILAH_LABELS_HEBREW[key]}
                overrides={data}
                onUpdate={update}
              />
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSave}
        className="adm-btnPrimary"
        style={{ padding: '10px 24px', fontSize: 14, fontWeight: 600, opacity: dirty ? 1 : 0.5 }}
        disabled={!dirty}
      >
        Save / שמור
      </button>
    </div>
  );
}
