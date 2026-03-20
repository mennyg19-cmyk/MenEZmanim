'use client';

import React, { useMemo, useCallback } from 'react';


export interface ZmanLimitEditorProps {
  limits: {
    earliest?: string;
    latest?: string;
    roundTo?: number;
    offset?: number;
  };
  onChange: (limits: ZmanLimitEditorProps['limits']) => void;
  zmanLabel: string;
}

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function applyLimitsPreview(
  baseTime: string,
  limits: ZmanLimitEditorProps['limits']
): string {
  const [h, m] = baseTime.split(':').map(Number);
  const ref = new Date();
  let adjusted = new Date(ref);
  adjusted.setHours(h, m, 0, 0);

  if (!limits || Object.keys(limits).length === 0) {
    return formatTime(adjusted);
  }

  if (limits.offset) {
    adjusted = new Date(adjusted.getTime() + limits.offset * 60_000);
  }

  if (limits.roundTo && limits.roundTo > 0) {
    const ms = limits.roundTo * 60_000;
    adjusted = new Date(Math.round(adjusted.getTime() / ms) * ms);
  }

  if (limits.earliest) {
    const [eh, em] = limits.earliest.split(':').map(Number);
    const earliest = new Date(ref);
    earliest.setHours(eh, em, 0, 0);
    if (adjusted.getTime() < earliest.getTime()) {
      adjusted = earliest;
    }
  }

  if (limits.latest) {
    const [lh, lm] = limits.latest.split(':').map(Number);
    const latest = new Date(ref);
    latest.setHours(lh, lm, 0, 0);
    if (adjusted.getTime() > latest.getTime()) {
      adjusted = latest;
    }
  }

  return formatTime(adjusted);
}

export function ZmanLimitEditor({
  limits,
  onChange,
  zmanLabel,
}: ZmanLimitEditorProps) {
  const baseExample = '17:15';
  const resultExample = useMemo(
    () => applyLimitsPreview(baseExample, limits),
    [limits]
  );

  const update = useCallback(
    (key: keyof ZmanLimitEditorProps['limits'], value: string | number | undefined) => {
      const next = { ...limits };
      if (value === undefined || value === '' || (typeof value === 'number' && isNaN(value))) {
        delete next[key];
      } else {
        (next as Record<string, unknown>)[key] = value;
      }
      onChange(next);
    },
    [limits, onChange]
  );

  const baseStyle = {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 13,
    color: 'var(--ed-text)',
  };

  const fieldStyle = { marginBottom: 8 };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 4, fontSize: 12, color: 'var(--ed-text-dim)' };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap' as const,
  };

  return (
    <div style={{ ...baseStyle, padding: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>לא לפני / Not before</label>
          <div style={rowStyle}>
            <input
              type="time"
              value={limits.earliest ?? ''}
              onChange={(e) => update('earliest', e.target.value || undefined)}
              className="ed-input" style={{ width: 120 }}
            />
            {limits.earliest && (
              <button
                type="button"
                onClick={() => update('earliest', undefined)}
                style={{
                  padding: 4,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ed-danger)',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
                aria-label="Clear"
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>לא אחרי / Not after</label>
          <div style={rowStyle}>
            <input
              type="time"
              value={limits.latest ?? ''}
              onChange={(e) => update('latest', e.target.value || undefined)}
              className="ed-input" style={{ width: 120 }}
            />
            {limits.latest && (
              <button
                type="button"
                onClick={() => update('latest', undefined)}
                style={{
                  padding: 4,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ed-danger)',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
                aria-label="Clear"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>עיגול ל- / Round to nearest (דק׳)</label>
          <div style={rowStyle}>
            <input
              type="number"
              min={1}
              placeholder="—"
              value={limits.roundTo ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                update('roundTo', v ? parseInt(v, 10) : undefined);
              }}
              className="ed-input" style={{ width: 120 }}
            />
            {limits.roundTo != null && (
              <button
                type="button"
                onClick={() => update('roundTo', undefined)}
                style={{
                  padding: 4,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ed-danger)',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
                aria-label="Clear"
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>הוספה/הפחתה / Offset (דק׳)</label>
          <div style={rowStyle}>
            <input
              type="number"
              placeholder="—"
              value={limits.offset ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                update('offset', v ? parseInt(v, 10) : undefined);
              }}
              className="ed-input" style={{ width: 120 }}
            />
            {limits.offset != null && (
              <button
                type="button"
                onClick={() => update('offset', undefined)}
                style={{
                  padding: 4,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ed-danger)',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
                aria-label="Clear"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
          padding: 8,
          backgroundColor: 'var(--ed-bg)',
          borderRadius: 6,
          fontSize: 12,
          color: 'var(--ed-text-dim)',
        }}
      >
        <strong>דוגמה / Example:</strong> אם {zmanLabel} הוא 5:15 PM → {resultExample}
      </div>
    </div>
  );
}
