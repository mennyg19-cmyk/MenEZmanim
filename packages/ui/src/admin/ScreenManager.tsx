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

/* ── Data types ──────────────────────────────────────────── */

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
  onStyleCreate?: (name: string) => void;
  onStyleRename?: (styleId: string, name: string) => void;
  onStyleDuplicate?: (styleId: string) => void;
  onStyleDelete?: (styleId: string) => void;
  onStyleChange?: (style: DisplayStyle) => void;
  /** Navigate to the display editor with this style selected */
  onEditStyle?: (styleId: string) => void;
}

/* ── Constants ───────────────────────────────────────────── */

const HEBREW_MONTHS: { v: number; label: string }[] = [
  { v: 7, label: 'Tishrei' },
  { v: 8, label: 'Cheshvan' },
  { v: 9, label: 'Kislev' },
  { v: 10, label: 'Teves' },
  { v: 11, label: 'Shevat' },
  { v: 12, label: 'Adar' },
  { v: 13, label: 'Adar II' },
  { v: 1, label: 'Nissan' },
  { v: 2, label: 'Iyar' },
  { v: 3, label: 'Sivan' },
  { v: 4, label: 'Tammuz' },
  { v: 5, label: 'Av' },
  { v: 6, label: 'Elul' },
];

const GREG_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
].map((label, i) => ({ v: i + 1, label }));

const BP_LABELS: Record<ScreenStyleSchedule['breakpoint'], string> = {
  all: 'All views',
  mobile: 'Mobile',
  tablet: 'Tablet',
  full: 'Full / Desktop',
};

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Shabbos'];

/* ── Helpers ─────────────────────────────────────────────── */

function uid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newScheduleEntry(styles: DisplayStyle[], priority: number): ScreenStyleSchedule {
  return {
    id: uid(),
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

function hasDefaultEntry(schedules: ScreenStyleSchedule[]): boolean {
  return schedules.some((s) => s.rules.length === 1 && s.rules[0].type === 'default');
}

function previewStyleForBp(
  schedules: ScreenStyleSchedule[],
  styles: DisplayStyle[],
  bp: DisplayBreakpoint,
): DisplayStyle | null {
  const ordered = orderedScreenSchedulesForBreakpoint(schedules, bp);
  const now = new Date();
  for (const e of ordered) {
    if (evaluateStyleScheduleRules(e.rules, now)) {
      return styles.find((x) => x.id === e.styleId) ?? null;
    }
  }
  return null;
}

function styleResLabel(s: DisplayStyle): string {
  return `${s.canvasWidth}x${s.canvasHeight}`;
}

function ruleSummary(rule: StyleScheduleRule): string {
  switch (rule.type) {
    case 'default':
      return 'Always (default fallback)';
    case 'hebrew_date_range': {
      const sm = HEBREW_MONTHS.find((m) => m.v === rule.startMonth)?.label ?? String(rule.startMonth);
      const em = HEBREW_MONTHS.find((m) => m.v === rule.endMonth)?.label ?? String(rule.endMonth);
      return `${sm} ${rule.startDay} – ${em} ${rule.endDay}`;
    }
    case 'gregorian_date_range': {
      const sm = GREG_MONTHS.find((m) => m.v === rule.startMonth)?.label ?? String(rule.startMonth);
      const em = GREG_MONTHS.find((m) => m.v === rule.endMonth)?.label ?? String(rule.endMonth);
      return `${sm} ${rule.startDay} – ${em} ${rule.endDay}`;
    }
    case 'hebrew_month':
      return HEBREW_MONTHS.find((m) => m.v === rule.month)?.label ?? `Hebrew month ${rule.month}`;
    case 'gregorian_month':
      return GREG_MONTHS.find((m) => m.v === rule.month)?.label ?? `Month ${rule.month}`;
    case 'day_of_week':
      return rule.days.map((d) => DOW_LABELS[d]).join(', ');
    case 'day_type':
      return DAY_TYPE_OPTIONS.find((o) => o.value === rule.dayType)?.label ?? rule.dayType;
    case 'week_of_month':
      return `Week ${rule.week} of month`;
    default:
      return '?';
  }
}

function entrySummary(entry: ScreenStyleSchedule, styles: DisplayStyle[]): string {
  const styleName = styles.find((s) => s.id === entry.styleId)?.name ?? 'Unknown';
  if (entry.rules.length === 1 && entry.rules[0].type === 'default') {
    return `${styleName} — Default`;
  }
  const conditions = entry.rules.map(ruleSummary).join(' + ');
  return `${styleName} — ${conditions}`;
}

/* ── Inline rule editor (compact) ────────────────────────── */

function RuleFields({
  rule,
  onChange,
}: {
  rule: StyleScheduleRule;
  onChange: (r: StyleScheduleRule) => void;
}) {
  switch (rule.type) {
    case 'default':
      return <span style={{ fontSize: 13, color: 'var(--adm-text-muted)' }}>Matches always (fallback)</span>;

    case 'hebrew_date_range':
      return (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="adm-select" value={rule.startMonth} onChange={(e) => onChange({ ...rule, startMonth: +e.target.value })}>
            {HEBREW_MONTHS.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
          </select>
          <input className="adm-input" type="number" min={1} max={30} style={{ width: 52 }} value={rule.startDay} onChange={(e) => onChange({ ...rule, startDay: +e.target.value || 1 })} />
          <span style={{ fontSize: 13 }}>to</span>
          <select className="adm-select" value={rule.endMonth} onChange={(e) => onChange({ ...rule, endMonth: +e.target.value })}>
            {HEBREW_MONTHS.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
          </select>
          <input className="adm-input" type="number" min={1} max={30} style={{ width: 52 }} value={rule.endDay} onChange={(e) => onChange({ ...rule, endDay: +e.target.value || 1 })} />
        </div>
      );

    case 'gregorian_date_range':
      return (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="adm-select" value={rule.startMonth} onChange={(e) => onChange({ ...rule, startMonth: +e.target.value })}>
            {GREG_MONTHS.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
          </select>
          <input className="adm-input" type="number" min={1} max={31} style={{ width: 52 }} value={rule.startDay} onChange={(e) => onChange({ ...rule, startDay: +e.target.value || 1 })} />
          <span style={{ fontSize: 13 }}>to</span>
          <select className="adm-select" value={rule.endMonth} onChange={(e) => onChange({ ...rule, endMonth: +e.target.value })}>
            {GREG_MONTHS.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
          </select>
          <input className="adm-input" type="number" min={1} max={31} style={{ width: 52 }} value={rule.endDay} onChange={(e) => onChange({ ...rule, endDay: +e.target.value || 1 })} />
        </div>
      );

    case 'hebrew_month':
      return (
        <select className="adm-select" value={rule.month} onChange={(e) => onChange({ ...rule, month: +e.target.value })}>
          {HEBREW_MONTHS.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
        </select>
      );

    case 'gregorian_month':
      return (
        <select className="adm-select" value={rule.month} onChange={(e) => onChange({ ...rule, month: +e.target.value })}>
          {GREG_MONTHS.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
        </select>
      );

    case 'day_of_week':
      return (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {DOW_LABELS.map((d, i) => (
            <label key={d} style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rule.days.includes(i)}
                onChange={() => {
                  const days = rule.days.includes(i) ? rule.days.filter((x) => x !== i) : [...rule.days, i].sort((a, b) => a - b);
                  onChange({ ...rule, days });
                }}
              />
              {d}
            </label>
          ))}
        </div>
      );

    case 'day_type':
      return (
        <select className="adm-select" value={rule.dayType} onChange={(e) => onChange({ type: 'day_type', dayType: e.target.value as DayType })}>
          {DAY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );

    case 'week_of_month':
      return (
        <input className="adm-input" type="number" min={1} max={5} style={{ width: 64 }} value={rule.week}
          onChange={(e) => onChange({ ...rule, week: Math.min(5, Math.max(1, +e.target.value || 1)) })} />
      );

    default:
      return null;
  }
}

/* ── Schedule entry editor (one row in the schedule) ─────── */

function ScheduleEntryEditor({
  entry,
  styles,
  isDefault,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  entry: ScreenStyleSchedule;
  styles: DisplayStyle[];
  isDefault: boolean;
  onChange: (e: ScreenStyleSchedule) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const selectedStyle = styles.find((s) => s.id === entry.styleId);

  const conditionLabel = isDefault
    ? 'Default fallback'
    : entry.rules.map(ruleSummary).join(' + ');

  return (
    <div style={{
      border: '1px solid var(--adm-border)',
      borderRadius: 8,
      overflow: 'hidden',
      background: isDefault ? 'var(--adm-bg)' : 'var(--adm-bg-hover)',
    }}>
      {/* Collapsed header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 14, opacity: 0.5, width: 18, textAlign: 'center' }}>
          {expanded ? '▾' : '▸'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {selectedStyle?.name ?? 'No style'}
            <span style={{ fontWeight: 400, color: 'var(--adm-text-muted)', marginLeft: 8, fontSize: 12 }}>
              {BP_LABELS[entry.breakpoint]}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginTop: 2 }}>
            {conditionLabel}
            {selectedStyle && (
              <span style={{ marginLeft: 8, opacity: 0.7 }}>
                ({styleResLabel(selectedStyle)})
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
          <button type="button" className="adm-btn" style={{ padding: '2px 6px', fontSize: 12 }} disabled={isFirst} onClick={onMoveUp}>▲</button>
          <button type="button" className="adm-btn" style={{ padding: '2px 6px', fontSize: 12 }} disabled={isLast} onClick={onMoveDown}>▼</button>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--adm-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <div>
              <label className="adm-labelSm">Style</label>
              <select className="adm-select" value={entry.styleId} onChange={(e) => onChange({ ...entry, styleId: e.target.value })}>
                {styles.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({styleResLabel(s)})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="adm-labelSm">Applies to</label>
              <select className="adm-select" value={entry.breakpoint}
                onChange={(e) => onChange({ ...entry, breakpoint: e.target.value as ScreenStyleSchedule['breakpoint'] })}>
                {Object.entries(BP_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label className="adm-labelSm" style={{ marginBottom: 6, display: 'block' }}>
              When to show {entry.rules.length > 1 ? '(all conditions must match)' : ''}
            </label>
            {entry.rules.map((rule, ri) => (
              <div key={ri} style={{
                display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8,
                padding: 8, borderRadius: 6, background: 'var(--adm-bg)',
                border: '1px solid var(--adm-border)',
              }}>
                <div style={{ flex: 1 }}>
                  <select
                    className="adm-select"
                    style={{ marginBottom: 6 }}
                    value={rule.type}
                    onChange={(e) => {
                      const t = e.target.value as StyleScheduleRule['type'];
                      let newRule: StyleScheduleRule;
                      switch (t) {
                        case 'default': newRule = { type: 'default' }; break;
                        case 'hebrew_date_range': newRule = { type: 'hebrew_date_range', startMonth: 6, startDay: 23, endMonth: 7, endDay: 23 }; break;
                        case 'gregorian_date_range': newRule = { type: 'gregorian_date_range', startMonth: 1, startDay: 1, endMonth: 12, endDay: 31 }; break;
                        case 'hebrew_month': newRule = { type: 'hebrew_month', month: 7 }; break;
                        case 'gregorian_month': newRule = { type: 'gregorian_month', month: 1 }; break;
                        case 'day_of_week': newRule = { type: 'day_of_week', days: [6] }; break;
                        case 'day_type': newRule = { type: 'day_type', dayType: 'shabbos' }; break;
                        case 'week_of_month': newRule = { type: 'week_of_month', week: 1 }; break;
                        default: return;
                      }
                      const rules = [...entry.rules];
                      rules[ri] = newRule;
                      onChange({ ...entry, rules });
                    }}
                  >
                    <option value="default">Always (default)</option>
                    <option value="hebrew_date_range">Hebrew date range</option>
                    <option value="gregorian_date_range">Gregorian date range</option>
                    <option value="hebrew_month">Hebrew month</option>
                    <option value="gregorian_month">Gregorian month</option>
                    <option value="day_of_week">Day of week</option>
                    <option value="day_type">Day type (Shabbos, Chag…)</option>
                    <option value="week_of_month">Week of month</option>
                  </select>
                  <RuleFields
                    rule={rule}
                    onChange={(r) => {
                      const rules = [...entry.rules];
                      rules[ri] = r;
                      onChange({ ...entry, rules });
                    }}
                  />
                </div>
                {entry.rules.length > 1 && (
                  <button type="button" className="adm-btnDanger" style={{ padding: '3px 8px', fontSize: 11, flexShrink: 0, marginTop: 2 }}
                    onClick={() => {
                      const rules = entry.rules.filter((_, i) => i !== ri);
                      onChange({ ...entry, rules: rules.length ? rules : [{ type: 'default' }] });
                    }}>
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="adm-btn" style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => onChange({ ...entry, rules: [...entry.rules, { type: 'day_type', dayType: 'shabbos' }] })}>
              + Add condition
            </button>
          </div>

          {!isDefault && (
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <button type="button" className="adm-btnDanger" style={{ padding: '5px 14px', fontSize: 13 }} onClick={onRemove}>
                Remove this entry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Resolution warning ──────────────────────────────────── */

function ResolutionWarnings({ schedules, styles }: { schedules: ScreenStyleSchedule[]; styles: DisplayStyle[] }) {
  const resolutions = new Map<string, Set<string>>();
  for (const entry of schedules) {
    const st = styles.find((s) => s.id === entry.styleId);
    if (!st) continue;
    const key = entry.breakpoint === 'all' ? 'all' : entry.breakpoint;
    if (!resolutions.has(key)) resolutions.set(key, new Set());
    resolutions.get(key)!.add(`${st.canvasWidth}x${st.canvasHeight}`);
  }

  // Collect all unique resolutions used across all entries
  const allRes = new Set<string>();
  for (const entry of schedules) {
    const st = styles.find((s) => s.id === entry.styleId);
    if (st) allRes.add(`${st.canvasWidth}x${st.canvasHeight}`);
  }

  if (allRes.size <= 1) return null;

  const warnings: string[] = [];
  for (const [bp, resSet] of resolutions) {
    if (resSet.size > 1) {
      const bpLabel = bp === 'all' ? 'All views' : BP_LABELS[bp as DisplayBreakpoint] ?? bp;
      warnings.push(`${bpLabel}: styles use different resolutions (${[...resSet].join(', ')})`);
    }
  }

  if (warnings.length === 0 && allRes.size > 1) {
    warnings.push(`Styles across entries use different resolutions (${[...allRes].join(', ')}). The display will scale to fit, but layouts may not align perfectly.`);
  }

  if (warnings.length === 0) return null;

  return (
    <div style={{
      padding: '8px 12px', borderRadius: 6, fontSize: 13,
      background: '#422006', border: '1px solid #92400e', color: '#fbbf24',
      marginBottom: 12,
    }}>
      <strong style={{ display: 'block', marginBottom: 2 }}>Resolution mismatch</strong>
      {warnings.map((w, i) => <div key={i}>{w}</div>)}
    </div>
  );
}

/* ── Today's preview panel ───────────────────────────────── */

function TodayPreview({ schedules, styles }: { schedules: ScreenStyleSchedule[]; styles: DisplayStyle[] }) {
  const bps: DisplayBreakpoint[] = ['full', 'tablet', 'mobile'];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
      padding: 10, borderRadius: 6, background: 'var(--adm-bg)', border: '1px dashed var(--adm-border)',
    }}>
      {bps.map((bp) => {
        const st = previewStyleForBp(schedules, styles, bp);
        return (
          <div key={bp} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, color: 'var(--adm-text-muted)', letterSpacing: 0.5 }}>
              {BP_LABELS[bp]}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>
              {st?.name ?? '—'}
            </div>
            {st && (
              <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>
                {styleResLabel(st)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Style list panel (left side) ─────────────────────────── */

const RESOLUTION_PRESETS = [
  { label: 'Full / Desktop — 1920×1080 (FHD)', w: 1920, h: 1080, group: 'Breakpoints' },
  { label: 'Tablet — 1024×768', w: 1024, h: 768, group: 'Breakpoints' },
  { label: 'Mobile — 390×844', w: 390, h: 844, group: 'Breakpoints' },
  { label: 'Mobile Small — 360×640', w: 360, h: 640, group: 'Breakpoints' },
  { label: 'Tablet Landscape — 1180×820', w: 1180, h: 820, group: 'Breakpoints' },
  { label: '4K — 3840×2160', w: 3840, h: 2160, group: 'Other' },
  { label: 'HD — 1280×720', w: 1280, h: 720, group: 'Other' },
  { label: 'Portrait — 1080×1920', w: 1080, h: 1920, group: 'Other' },
];

function StyleListPanel({
  styles,
  onStyleCreate,
  onStyleRename,
  onStyleDuplicate,
  onStyleDelete,
  onStyleChange,
  onEditStyle,
}: {
  styles: DisplayStyle[];
  onStyleCreate?: (name: string) => void;
  onStyleRename?: (styleId: string, name: string) => void;
  onStyleDuplicate?: (styleId: string) => void;
  onStyleDelete?: (styleId: string) => void;
  onStyleChange?: (style: DisplayStyle) => void;
  onEditStyle?: (styleId: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...styles].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name || !onStyleCreate) return;
    onStyleCreate(name);
    setNewName('');
    setCreating(false);
  };

  const handleRename = (id: string) => {
    const name = renameValue.trim();
    if (!name || !onStyleRename) return;
    onStyleRename(id, name);
    setRenamingId(null);
    setRenameValue('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--adm-border)' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Styles</h3>
        {onStyleCreate && (
          <button className="adm-btnPrimary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setCreating(true)}>
            + New
          </button>
        )}
      </div>

      {creating && (
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--adm-border)', display: 'flex', gap: 6 }}>
          <input
            className="adm-input"
            style={{ flex: 1, fontSize: 13 }}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
            placeholder="Style name..."
            autoFocus
          />
          <button className="adm-btnSave" style={{ padding: '4px 10px', fontSize: 12 }} onClick={handleCreate}>Add</button>
          <button className="adm-btnCancel" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setCreating(false)}>Cancel</button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {sorted.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--adm-text-muted)', fontSize: 13 }}>
            No styles yet. Create one to get started.
          </div>
        )}

        {sorted.map((style) => {
          const isExpanded = expandedId === style.id;
          return (
            <div key={style.id} style={{
              border: '1px solid var(--adm-border)', borderRadius: 8, marginBottom: 6,
              overflow: 'hidden', background: 'var(--adm-bg)',
            }}>
              {/* Style preview + name */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : style.id)}
                style={{ padding: '8px 10px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{
                  width: '100%', height: 36, borderRadius: 4, marginBottom: 6,
                  backgroundColor: style.backgroundColor || '#000',
                  backgroundImage: style.backgroundImage ? `url(${style.backgroundImage})` : undefined,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  position: 'relative', overflow: 'hidden',
                  border: '1px solid var(--adm-border)',
                }}>
                  {style.objects.slice(0, 5).map((obj) => (
                    <div key={obj.id} style={{
                      position: 'absolute',
                      left: `${(obj.position.x / (style.canvasWidth || 1920)) * 100}%`,
                      top: `${(obj.position.y / (style.canvasHeight || 1080)) * 100}%`,
                      width: `${(obj.position.width / (style.canvasWidth || 1920)) * 100}%`,
                      height: `${(obj.position.height / (style.canvasHeight || 1080)) * 100}%`,
                      backgroundColor: 'rgba(74, 158, 255, 0.3)',
                      border: '1px solid rgba(74, 158, 255, 0.5)',
                      borderRadius: 1,
                    }} />
                  ))}
                </div>

                {renamingId === style.id ? (
                  <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      className="adm-input"
                      style={{ flex: 1, fontSize: 12, padding: '3px 6px' }}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRename(style.id); if (e.key === 'Escape') setRenamingId(null); }}
                      autoFocus
                    />
                    <button className="adm-btnSave" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => handleRename(style.id)}>OK</button>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{style.name}</div>
                )}
                <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 1 }}>
                  {styleResLabel(style)} &middot; {style.objects.length} object{style.objects.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Expanded actions */}
              {isExpanded && (
                <div style={{ padding: '0 10px 10px', borderTop: '1px solid var(--adm-border)' }}>
                  {/* Resolution changer */}
                  {onStyleChange && (
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                      <label className="adm-labelSm">Resolution</label>
                      <select
                        className="adm-select"
                        value={`${style.canvasWidth}x${style.canvasHeight}`}
                        onChange={(e) => {
                          const preset = RESOLUTION_PRESETS.find((p) => `${p.w}x${p.h}` === e.target.value);
                          if (preset) {
                            onStyleChange({ ...style, canvasWidth: preset.w, canvasHeight: preset.h });
                          }
                        }}
                      >
                        {(['Breakpoints', 'Other'] as const).map((g) => (
                          <optgroup key={g} label={g}>
                            {RESOLUTION_PRESETS.filter((p) => p.group === g).map((p) => (
                              <option key={`${p.w}x${p.h}`} value={`${p.w}x${p.h}`}>{p.label}</option>
                            ))}
                          </optgroup>
                        ))}
                        {!RESOLUTION_PRESETS.some((p) => p.w === style.canvasWidth && p.h === style.canvasHeight) && (
                          <option value={`${style.canvasWidth}x${style.canvasHeight}`}>
                            {style.canvasWidth}x{style.canvasHeight} (custom)
                          </option>
                        )}
                      </select>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {onEditStyle && (
                      <button className="adm-btnPrimary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => onEditStyle(style.id)}>
                        Open in Editor
                      </button>
                    )}
                    {onStyleRename && (
                      <button className="adm-btn" style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => { setRenamingId(style.id); setRenameValue(style.name); setExpandedId(null); }}>
                        Rename
                      </button>
                    )}
                    {onStyleDuplicate && (
                      <button className="adm-btn" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => onStyleDuplicate(style.id)}>
                        Duplicate
                      </button>
                    )}
                    {onStyleDelete && (
                      <button className="adm-btnDanger" style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => { if (window.confirm(`Delete style "${style.name}"?`)) onStyleDelete(style.id); }}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */

const emptyScreen = (styles: DisplayStyle[]): ScreenRow => ({
  id: uid(),
  name: '',
  styleId: styles[0]?.id ?? '',
  resolution: '1920x1080',
  active: true,
  styleSchedules: [newScheduleEntry(styles, 0)],
});

export function ScreenManager({
  screens, styles, orgSlug = 'demo', onChange,
  onStyleCreate, onStyleRename, onStyleDuplicate, onStyleDelete, onStyleChange, onEditStyle,
}: ScreenManagerProps) {
  const [editing, setEditing] = useState<ScreenRow | null>(null);

  const handleAdd = () => setEditing(emptyScreen(styles));
  const handleEdit = (s: ScreenRow) => {
    const scheds = effectiveSchedules(s, styles);
    setEditing({ ...s, styleSchedules: scheds });
  };
  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this screen?')) return;
    onChange(screens.filter((s) => s.id !== id));
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    let scheds = editing.styleSchedules?.length
      ? [...editing.styleSchedules]
      : [newScheduleEntry(styles, 0)];

    if (!hasDefaultEntry(scheds)) {
      window.alert('You need at least one entry with an "Always (default)" condition as a fallback.');
      return;
    }

    scheds = scheds.map((s, i) => ({ ...s, priority: i }));
    const toSave: ScreenRow = { ...editing, styleSchedules: scheds };

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

  const editingSchedules = useMemo(() => {
    if (!editing) return [];
    return editing.styleSchedules?.length ? editing.styleSchedules : [newScheduleEntry(styles, 0)];
  }, [editing, styles]);

  const updateSchedules = (next: ScreenStyleSchedule[]) => {
    if (!editing) return;
    setEditing({ ...editing, styleSchedules: next });
  };

  const moveEntry = (from: number, to: number) => {
    const arr = [...editingSchedules];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    updateSchedules(arr.map((s, i) => ({ ...s, priority: i })));
  };

  const hasStyleCallbacks = !!(onStyleCreate || onStyleDelete || onStyleDuplicate || onStyleRename);

  return (
    <div style={{ display: 'flex', gap: 0, minHeight: 0, height: '100%' }}>
      {/* ── Left: Styles panel ── */}
      {hasStyleCallbacks && (
        <div style={{
          width: 280, minWidth: 240, maxWidth: 320, flexShrink: 0,
          borderRight: '1px solid var(--adm-border)',
          background: 'var(--adm-bg-hover)',
          borderRadius: '8px 0 0 8px',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <StyleListPanel
            styles={styles}
            onStyleCreate={onStyleCreate}
            onStyleRename={onStyleRename}
            onStyleDuplicate={onStyleDuplicate}
            onStyleDelete={onStyleDelete}
            onStyleChange={onStyleChange}
            onEditStyle={onEditStyle}
          />
        </div>
      )}

      {/* ── Right: Screens panel ── */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
        <div className="adm-card" style={{ borderRadius: hasStyleCallbacks ? '0 8px 8px 0' : undefined, border: hasStyleCallbacks ? 'none' : undefined, height: '100%' }}>
          <div className="adm-pageHeader">
            <h2 className="adm-pageTitle">Screens</h2>
            <button onClick={handleAdd} className="adm-btnPrimary" style={{ padding: '8px 16px', fontSize: 14 }}>
              + Add Screen
            </button>
          </div>

          {/* ── Screen edit form ── */}
          {editing && (
            <div className="adm-formPanel" style={{ marginBottom: 20 }}>
              <h3 className="adm-sectionTitle" style={{ margin: '0 0 16px' }}>
                {screens.find((s) => s.id === editing.id) ? 'Edit Screen' : 'New Screen'}
              </h3>

              {/* Basic info */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label className="adm-labelSm">Screen name</label>
                  <input
                    className="adm-input"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="e.g. Main Hall, Lobby TV"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, padding: '6px 0' }}>
                    <input
                      type="checkbox"
                      checked={editing.active}
                      onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
              </div>

              {/* Schedule section */}
              <div style={{ marginBottom: 16 }}>
                <h4 className="adm-sectionTitle" style={{ margin: '0 0 4px' }}>Style schedule</h4>
                <p style={{ fontSize: 13, color: 'var(--adm-text-muted)', margin: '0 0 12px' }}>
                  Entries are checked top to bottom. The first entry whose conditions match today is used.
                  You need at least one &quot;Always (default)&quot; entry as a fallback.
                  Use breakpoint-specific entries to show different styles on mobile vs desktop.
                </p>

                <ResolutionWarnings schedules={editingSchedules} styles={styles} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {editingSchedules.map((entry, ei) => {
                    const isDefault = entry.rules.length === 1 && entry.rules[0].type === 'default';
                    return (
                      <ScheduleEntryEditor
                        key={entry.id}
                        entry={entry}
                        styles={styles}
                        isDefault={isDefault}
                        onChange={(updated) => {
                          const next = [...editingSchedules];
                          next[ei] = updated;
                          updateSchedules(next);
                        }}
                        onRemove={() => updateSchedules(editingSchedules.filter((_, i) => i !== ei))}
                        onMoveUp={() => moveEntry(ei, ei - 1)}
                        onMoveDown={() => moveEntry(ei, ei + 1)}
                        isFirst={ei === 0}
                        isLast={ei === editingSchedules.length - 1}
                      />
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="adm-btnPrimary"
                  style={{ marginTop: 10, padding: '6px 14px', fontSize: 13 }}
                  onClick={() => {
                    const next = [...editingSchedules, {
                      id: uid(),
                      styleId: styles[0]?.id ?? '',
                      breakpoint: 'all' as const,
                      rules: [{ type: 'day_type' as const, dayType: 'shabbos' as const }],
                      priority: editingSchedules.length,
                    }];
                    updateSchedules(next);
                  }}
                >
                  + Add schedule entry
                </button>
              </div>

              {/* Today's preview */}
              <div style={{ marginBottom: 16 }}>
                <label className="adm-labelSm" style={{ marginBottom: 6, display: 'block' }}>Today&apos;s active style</label>
                <TodayPreview schedules={editingSchedules} styles={styles} />
              </div>

              {/* Actions */}
              <div className="adm-inlineGroup" style={{ gap: 8 }}>
                <button onClick={handleSaveEdit} className="adm-btnSave" style={{ padding: '8px 20px' }}>
                  Save
                </button>
                <button onClick={() => setEditing(null)} className="adm-btnCancel" style={{ padding: '8px 20px' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Screen list ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {screens.map((s) => {
              const eff = effectiveSchedules(s, styles);
              const bps: DisplayBreakpoint[] = ['full', 'tablet', 'mobile'];
              return (
                <div key={s.id} style={{
                  border: '1px solid var(--adm-border)', borderRadius: 8,
                  padding: 14, background: 'var(--adm-bg)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        {s.name || 'Unnamed screen'}
                        <span className={s.active ? 'adm-badgeSuccess' : 'adm-badgeMuted'} style={{ marginLeft: 8, fontSize: 11 }}>
                          {s.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginTop: 2 }}>
                        {eff.length} schedule {eff.length === 1 ? 'entry' : 'entries'}
                      </div>
                    </div>
                    <div className="adm-inlineGroup" style={{ gap: 6 }}>
                      <button
                        onClick={() => {
                          const idx = screens.indexOf(s);
                          window.open(`/${orgSlug}/${idx + 1}`, '_blank');
                        }}
                        className="adm-btn"
                        style={{ backgroundColor: '#8b5cf6', color: '#fff', padding: '5px 12px', fontSize: 13 }}
                      >
                        Preview
                      </button>
                      <button onClick={() => handleEdit(s)} className="adm-btnEdit" style={{ padding: '5px 12px', fontSize: 13 }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="adm-btnDanger" style={{ padding: '5px 12px', fontSize: 13 }}>
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Schedule summary */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
                    {eff.slice(0, 4).map((entry) => (
                      <div key={entry.id} style={{ fontSize: 12, color: 'var(--adm-text-muted)', display: 'flex', gap: 6 }}>
                        <span style={{ opacity: 0.5, minWidth: 60 }}>{BP_LABELS[entry.breakpoint]}</span>
                        <span>{entrySummary(entry, styles)}</span>
                      </div>
                    ))}
                    {eff.length > 4 && (
                      <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', fontStyle: 'italic' }}>
                        +{eff.length - 4} more…
                      </div>
                    )}
                  </div>

                  {/* Today's active */}
                  <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                    {bps.map((bp) => {
                      const st = previewStyleForBp(eff, styles, bp);
                      return (
                        <span key={bp} style={{ color: 'var(--adm-text-muted)' }}>
                          <strong>{BP_LABELS[bp]}:</strong> {st?.name ?? '—'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {screens.length === 0 && (
              <div className="adm-empty" style={{ padding: 32, textAlign: 'center' }}>
                No screens configured. Click &quot;+ Add Screen&quot; to create one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
