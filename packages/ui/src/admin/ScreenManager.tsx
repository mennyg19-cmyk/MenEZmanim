'use client';

import React, { useMemo, useState } from 'react';
import type { DisplayStyle } from '@zmanim-app/core';
import {
  DAY_TYPE_OPTIONS,
  evaluateStyleScheduleRules,
  orderedScreenSchedulesForBreakpoint,
  resolveScreenStyleSchedules,
  type DayType,
  type DisplayBreakpoint,
  type ScreenStyleSchedule,
  type StyleScheduleRule,
} from '@zmanim-app/core';

interface ScreenRow {
  id: string;
  name: string;
  styleId: string;
  resolution: string;
  active: boolean;
  styleSchedules?: ScreenStyleSchedule[] | null;
}

interface ScreenManagerProps {
  screens: ScreenRow[];
  styles: DisplayStyle[];
  orgSlug?: string;
  onChange: (screens: ScreenRow[]) => void;
}

const HEBREW_MONTHS: { v: number; label: string }[] = [
  { v: 1, label: 'Nissan' },
  { v: 2, label: 'Iyar' },
  { v: 3, label: 'Sivan' },
  { v: 4, label: 'Tammuz' },
  { v: 5, label: 'Av' },
  { v: 6, label: 'Elul' },
  { v: 7, label: 'Tishrei' },
  { v: 8, label: 'Cheshvan' },
  { v: 9, label: 'Kislev' },
  { v: 10, label: 'Teves' },
  { v: 11, label: 'Shevat' },
  { v: 12, label: 'Adar' },
  { v: 13, label: 'Adar II' },
];

const GREG_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
].map((label, i) => ({ v: i + 1, label }));

const BP_OPTS: { v: ScreenStyleSchedule['breakpoint']; label: string }[] = [
  { v: 'all', label: 'All breakpoints' },
  { v: 'mobile', label: 'Mobile' },
  { v: 'tablet', label: 'Tablet' },
  { v: 'full', label: 'Full' },
];

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function newScheduleEntry(styles: DisplayStyle[], priority: number): ScreenStyleSchedule {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `sch-${Date.now()}-${priority}`,
    styleId: styles[0]?.id ?? '',
    breakpoint: 'all',
    rules: [{ type: 'default' }],
    priority,
  };
}

function effectiveSchedules(screen: ScreenRow, styles: DisplayStyle[]): ScreenStyleSchedule[] {
  if (screen.styleSchedules && screen.styleSchedules.length > 0) {
    return [...screen.styleSchedules].sort((a, b) => a.priority - b.priority);
  }
  return resolveScreenStyleSchedules(undefined, screen.styleId || undefined, styles);
}

function hasDefaultRule(schedules: ScreenStyleSchedule[]): boolean {
  return schedules.some((s) => s.rules.some((r) => r.type === 'default'));
}

function previewStyleForBp(
  schedules: ScreenStyleSchedule[],
  styles: DisplayStyle[],
  bp: DisplayBreakpoint,
): string {
  const ordered = orderedScreenSchedulesForBreakpoint(schedules, bp);
  const now = new Date();
  for (const e of ordered) {
    if (evaluateStyleScheduleRules(e.rules, now)) {
      const st = styles.find((x) => x.id === e.styleId);
      return st?.name ?? e.styleId;
    }
  }
  return '—';
}

function RuleEditor({
  rule,
  onChange,
  onRemove,
}: {
  rule: StyleScheduleRule;
  onChange: (r: StyleScheduleRule) => void;
  onRemove: () => void;
}) {
  const type = rule.type;

  return (
    <div
      style={{
        border: '1px solid var(--adm-border)',
        borderRadius: 6,
        padding: 8,
        marginBottom: 6,
        background: 'var(--adm-bg)',
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
        <label className="adm-labelSm">Rule type</label>
        <select
          className="adm-select"
          style={{ minWidth: 160 }}
          value={type}
          onChange={(e) => {
            const t = e.target.value as StyleScheduleRule['type'];
            if (t === 'default') onChange({ type: 'default' });
            else if (t === 'hebrew_date_range') {
              onChange({
                type: 'hebrew_date_range',
                startMonth: 6,
                startDay: 23,
                endMonth: 7,
                endDay: 23,
              });
            } else if (t === 'gregorian_date_range') {
              onChange({
                type: 'gregorian_date_range',
                startMonth: 1,
                startDay: 1,
                endMonth: 12,
                endDay: 31,
              });
            } else if (t === 'hebrew_month') onChange({ type: 'hebrew_month', month: 7 });
            else if (t === 'gregorian_month') onChange({ type: 'gregorian_month', month: 1 });
            else if (t === 'day_of_week') onChange({ type: 'day_of_week', days: [6] });
            else if (t === 'day_type') onChange({ type: 'day_type', dayType: 'shabbos' });
            else if (t === 'week_of_month') onChange({ type: 'week_of_month', week: 1 });
          }}
        >
          <option value="default">Default (fallback)</option>
          <option value="hebrew_date_range">Hebrew date range</option>
          <option value="gregorian_date_range">Gregorian date range</option>
          <option value="hebrew_month">Hebrew month</option>
          <option value="gregorian_month">Gregorian month</option>
          <option value="day_of_week">Day of week</option>
          <option value="day_type">Day type (chag, fast…)</option>
          <option value="week_of_month">Week of month</option>
        </select>
        <button type="button" className="adm-btnDanger" style={{ padding: '4px 8px', fontSize: 12 }} onClick={onRemove}>
          Remove rule
        </button>
      </div>

      {type === 'hebrew_date_range' && rule.type === 'hebrew_date_range' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="adm-labelSm">From</span>
          <select
            className="adm-select"
            value={rule.startMonth}
            onChange={(e) =>
              onChange({ ...rule, startMonth: parseInt(e.target.value, 10) })
            }
          >
            {HEBREW_MONTHS.map((m) => (
              <option key={m.v} value={m.v}>
                {m.label}
              </option>
            ))}
          </select>
          <input
            className="adm-input"
            type="number"
            min={1}
            max={30}
            style={{ width: 56 }}
            value={rule.startDay}
            onChange={(e) =>
              onChange({ ...rule, startDay: parseInt(e.target.value, 10) || 1 })
            }
          />
          <span className="adm-labelSm">to</span>
          <select
            className="adm-select"
            value={rule.endMonth}
            onChange={(e) =>
              onChange({ ...rule, endMonth: parseInt(e.target.value, 10) })
            }
          >
            {HEBREW_MONTHS.map((m) => (
              <option key={m.v} value={m.v}>
                {m.label}
              </option>
            ))}
          </select>
          <input
            className="adm-input"
            type="number"
            min={1}
            max={30}
            style={{ width: 56 }}
            value={rule.endDay}
            onChange={(e) =>
              onChange({ ...rule, endDay: parseInt(e.target.value, 10) || 1 })
            }
          />
        </div>
      )}

      {type === 'gregorian_date_range' && rule.type === 'gregorian_date_range' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="adm-labelSm">From</span>
          <select
            className="adm-select"
            value={rule.startMonth}
            onChange={(e) =>
              onChange({ ...rule, startMonth: parseInt(e.target.value, 10) })
            }
          >
            {GREG_MONTHS.map((m) => (
              <option key={m.v} value={m.v}>
                {m.label}
              </option>
            ))}
          </select>
          <input
            className="adm-input"
            type="number"
            min={1}
            max={31}
            style={{ width: 56 }}
            value={rule.startDay}
            onChange={(e) =>
              onChange({ ...rule, startDay: parseInt(e.target.value, 10) || 1 })
            }
          />
          <span className="adm-labelSm">to</span>
          <select
            className="adm-select"
            value={rule.endMonth}
            onChange={(e) =>
              onChange({ ...rule, endMonth: parseInt(e.target.value, 10) })
            }
          >
            {GREG_MONTHS.map((m) => (
              <option key={m.v} value={m.v}>
                {m.label}
              </option>
            ))}
          </select>
          <input
            className="adm-input"
            type="number"
            min={1}
            max={31}
            style={{ width: 56 }}
            value={rule.endDay}
            onChange={(e) =>
              onChange({ ...rule, endDay: parseInt(e.target.value, 10) || 1 })
            }
          />
        </div>
      )}

      {type === 'hebrew_month' && rule.type === 'hebrew_month' && (
        <select
          className="adm-select"
          value={rule.month}
          onChange={(e) =>
            onChange({ ...rule, month: parseInt(e.target.value, 10) })
          }
        >
          {HEBREW_MONTHS.map((m) => (
            <option key={m.v} value={m.v}>
              {m.label}
            </option>
          ))}
        </select>
      )}

      {type === 'gregorian_month' && rule.type === 'gregorian_month' && (
        <select
          className="adm-select"
          value={rule.month}
          onChange={(e) =>
            onChange({ ...rule, month: parseInt(e.target.value, 10) })
          }
        >
          {GREG_MONTHS.map((m) => (
            <option key={m.v} value={m.v}>
              {m.label}
            </option>
          ))}
        </select>
      )}

      {type === 'day_of_week' && rule.type === 'day_of_week' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DOW.map((d, i) => (
            <label key={d} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="checkbox"
                checked={rule.days.includes(i)}
                onChange={() => {
                  const days = rule.days.includes(i)
                    ? rule.days.filter((x) => x !== i)
                    : [...rule.days, i].sort((a, b) => a - b);
                  onChange({ ...rule, days });
                }}
              />
              {d}
            </label>
          ))}
        </div>
      )}

      {type === 'day_type' && rule.type === 'day_type' && (
        <select
          className="adm-select"
          value={rule.dayType}
          onChange={(e) =>
            onChange({ type: 'day_type', dayType: e.target.value as DayType })
          }
        >
          {DAY_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}

      {type === 'week_of_month' && rule.type === 'week_of_month' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="adm-labelSm">Week 1–5</span>
          <input
            className="adm-input"
            type="number"
            min={1}
            max={5}
            style={{ width: 64 }}
            value={rule.week}
            onChange={(e) =>
              onChange({
                ...rule,
                week: Math.min(5, Math.max(1, parseInt(e.target.value, 10) || 1)),
              })
            }
          />
        </label>
      )}
    </div>
  );
}

const emptyScreen = (styles: DisplayStyle[]): ScreenRow => ({
  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  name: '',
  styleId: styles[0]?.id ?? '',
  resolution: '1920x1080',
  active: true,
  styleSchedules: [newScheduleEntry(styles, 0)],
});

export function ScreenManager({ screens, styles, orgSlug = 'demo', onChange }: ScreenManagerProps) {
  const [editing, setEditing] = useState<ScreenRow | null>(null);

  const handleAdd = () => setEditing(emptyScreen(styles));
  const handleEdit = (s: ScreenRow) =>
    setEditing({
      ...s,
      styleSchedules:
        s.styleSchedules?.length && hasDefaultRule(s.styleSchedules)
          ? [...s.styleSchedules]
          : effectiveSchedules(s, styles),
    });
  const handleDelete = (id: string) => onChange(screens.filter((s) => s.id !== id));

  const handleSaveEdit = () => {
    if (!editing) return;
    let scheds = editing.styleSchedules?.length
      ? [...editing.styleSchedules].sort((a, b) => a.priority - b.priority)
      : [newScheduleEntry(styles, 0)];
    if (!hasDefaultRule(scheds)) {
      window.alert('Add at least one schedule entry with a "Default" rule (fallback).');
      return;
    }
    scheds = scheds.map((s, i) => ({ ...s, priority: i }));
    const toSave = { ...editing, styleSchedules: scheds };

    const idx = screens.findIndex((s) => s.id === editing.id);
    if (idx >= 0) {
      const next = [...screens];
      next[idx] = toSave;
      onChange(next);
    } else {
      onChange([...screens, toSave]);
    }
    setEditing(null);
  };

  const editingSchedules = editing
    ? editing.styleSchedules?.length
      ? editing.styleSchedules
      : [newScheduleEntry(styles, 0)]
    : [];

  const previewLines = useMemo(() => {
    if (!editing) return null;
    const eff = effectiveSchedules(editing, styles);
    const bps: DisplayBreakpoint[] = ['mobile', 'tablet', 'full'];
    return bps.map((bp) => `${bp}: ${previewStyleForBp(eff, styles, bp)}`);
  }, [editing, styles]);

  return (
    <div className="adm-card">
      <div className="adm-pageHeader">
        <h2 className="adm-pageTitle">ניהול מסכים — Screen Manager</h2>
        <button onClick={handleAdd} className="adm-btnPrimary" style={{ padding: '8px 16px', fontSize: 14 }}>
          + Add Screen
        </button>
      </div>

      {editing && (
        <div className="adm-formPanel" style={{ marginBottom: 20 }}>
          <h3 className="adm-sectionTitle" style={{ margin: '0 0 12px' }}>
            {screens.find((s) => s.id === editing.id) ? 'Edit' : 'Add'} Screen
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="adm-labelSm">Screen Name</label>
              <input
                className="adm-input"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="e.g. Main Hall, Lobby"
              />
            </div>
            <div>
              <label className="adm-labelSm">Primary style (legacy sync)</label>
              <select
                className="adm-select"
                value={editing.styleId}
                onChange={(e) => setEditing({ ...editing, styleId: e.target.value })}
              >
                <option value="">— No Style —</option>
                {styles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.id}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: 11, color: 'var(--adm-text-muted)', margin: '4px 0 0' }}>
                Kept for compatibility; schedule below decides which style is shown.
              </p>
            </div>
            <div>
              <label className="adm-labelSm">Resolution</label>
              <select
                className="adm-select"
                value={editing.resolution}
                onChange={(e) => setEditing({ ...editing, resolution: e.target.value })}
              >
                <option value="1920x1080">1920x1080 (FHD)</option>
                <option value="3840x2160">3840x2160 (4K)</option>
                <option value="1280x720">1280x720 (HD)</option>
                <option value="1080x1920">1080x1920 (Portrait)</option>
              </select>
            </div>
            <div>
              <label className="adm-labelSm">Active</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                />
                Screen is active
              </label>
            </div>
          </div>

          <h4 className="adm-sectionTitle" style={{ margin: '16px 0 8px' }}>
            Style schedule
          </h4>
          <p style={{ fontSize: 13, color: 'var(--adm-text-muted)', marginBottom: 8 }}>
            Order matters: first matching entry wins. Use breakpoint-specific rows before &quot;All breakpoints&quot; for
            overrides. Include one entry with a <strong>Default</strong> rule as fallback.
          </p>

          {editingSchedules.map((entry, ei) => (
            <div
              key={entry.id}
              style={{
                border: '1px solid var(--adm-border)',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                background: 'var(--adm-bg-hover)',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', marginBottom: 8 }}>
                <div>
                  <label className="adm-labelSm">Style</label>
                  <select
                    className="adm-select"
                    value={entry.styleId}
                    onChange={(e) => {
                      const next = [...editingSchedules];
                      next[ei] = { ...entry, styleId: e.target.value };
                      setEditing({ ...editing, styleSchedules: next });
                    }}
                  >
                    {styles.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="adm-labelSm">Breakpoint</label>
                  <select
                    className="adm-select"
                    value={entry.breakpoint}
                    onChange={(e) => {
                      const next = [...editingSchedules];
                      next[ei] = {
                        ...entry,
                        breakpoint: e.target.value as ScreenStyleSchedule['breakpoint'],
                      };
                      setEditing({ ...editing, styleSchedules: next });
                    }}
                  >
                    {BP_OPTS.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="adm-labelSm">Priority</label>
                  <input
                    className="adm-input"
                    type="number"
                    style={{ width: 72 }}
                    value={entry.priority}
                    onChange={(e) => {
                      const next = [...editingSchedules];
                      next[ei] = { ...entry, priority: parseInt(e.target.value, 10) || 0 };
                      setEditing({ ...editing, styleSchedules: next });
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="adm-btn"
                  onClick={() => {
                    if (editingSchedules.length <= 1) return;
                    const next = editingSchedules.filter((_, i) => i !== ei);
                    setEditing({ ...editing, styleSchedules: next });
                  }}
                  disabled={editingSchedules.length <= 1}
                >
                  Remove entry
                </button>
              </div>
              <div style={{ marginBottom: 6 }}>
                <span className="adm-labelSm">Rules (all must match)</span>
                {entry.rules.map((rule, ri) => (
                  <RuleEditor
                    key={`${entry.id}-r-${ri}`}
                    rule={rule}
                    onChange={(r) => {
                      const next = [...editingSchedules];
                      const rules = [...next[ei].rules];
                      rules[ri] = r;
                      next[ei] = { ...next[ei], rules };
                      setEditing({ ...editing, styleSchedules: next });
                    }}
                    onRemove={() => {
                      const next = [...editingSchedules];
                      const rules = next[ei].rules.filter((_, i) => i !== ri);
                      if (rules.length === 0) rules.push({ type: 'default' });
                      next[ei] = { ...next[ei], rules };
                      setEditing({ ...editing, styleSchedules: next });
                    }}
                  />
                ))}
                <button
                  type="button"
                  className="adm-btn"
                  style={{ marginTop: 4 }}
                  onClick={() => {
                    const next = [...editingSchedules];
                    next[ei] = {
                      ...next[ei],
                      rules: [...next[ei].rules, { type: 'default' }],
                    };
                    setEditing({ ...editing, styleSchedules: next });
                  }}
                >
                  + Add rule
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="adm-btnPrimary"
            style={{ marginBottom: 12 }}
            onClick={() => {
              const next = [...editingSchedules, newScheduleEntry(styles, editingSchedules.length)];
              setEditing({ ...editing, styleSchedules: next });
            }}
          >
            + Add schedule entry
          </button>

          {previewLines && (
            <div
              style={{
                fontSize: 13,
                padding: 10,
                borderRadius: 6,
                background: 'var(--adm-bg)',
                border: '1px dashed var(--adm-border)',
              }}
            >
              <strong>Today&apos;s preview</strong>
              {previewLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          )}

          <div className="adm-inlineGroup" style={{ marginTop: 12 }}>
            <button onClick={handleSaveEdit} className="adm-btnSave" style={{ padding: '8px 16px' }}>
              Save
            </button>
            <button onClick={() => setEditing(null)} className="adm-btnCancel" style={{ padding: '8px 16px' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="adm-table">
          <thead>
            <tr>
              <th className="adm-th">Screen Name</th>
              <th className="adm-th">Primary style</th>
              <th className="adm-th">Schedule</th>
              <th className="adm-th">Resolution</th>
              <th className="adm-th">Active</th>
              <th className="adm-th" style={{ width: 140 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {screens.map((s) => {
              const styleName = styles.find((st) => st.id === s.styleId)?.name || s.styleId || '—';
              const eff = effectiveSchedules(s, styles);
              const schedSummary = `${eff.length} entr${eff.length !== 1 ? 'ies' : 'y'}`;
              return (
                <tr key={s.id}>
                  <td className="adm-td" style={{ fontWeight: 500 }}>
                    {s.name || '—'}
                  </td>
                  <td className="adm-td">{styleName}</td>
                  <td className="adm-td">{schedSummary}</td>
                  <td className="adm-td">{s.resolution || '—'}</td>
                  <td className="adm-td">
                    <span className={s.active ? 'adm-badgeSuccess' : 'adm-badgeMuted'}>
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="adm-tdActions">
                    <div className="adm-inlineGroup">
                      <button
                        onClick={() => {
                          const idx = screens.indexOf(s);
                          window.open(`/${orgSlug}/${idx + 1}`, '_blank');
                        }}
                        className="adm-btn"
                        style={{ backgroundColor: '#8b5cf6', color: '#fff' }}
                      >
                        Preview
                      </button>
                      <button onClick={() => handleEdit(s)} className="adm-btnEdit">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="adm-btnDanger">
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {screens.length === 0 && (
              <tr>
                <td colSpan={6} className="adm-empty">
                  No screens configured. Click &quot;+ Add Screen&quot; to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
