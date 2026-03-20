'use client';

import React, { useState, useCallback } from 'react';
import {
  ScheduleRule,
  ScheduleConfig,
  ScheduleRuleType,
} from '@zmanim-app/core';


const HEBREW_MONTHS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'ניסן' },
  { value: 2, label: 'אייר' },
  { value: 3, label: 'סיון' },
  { value: 4, label: 'תמוז' },
  { value: 5, label: 'אב' },
  { value: 6, label: 'אלול' },
  { value: 7, label: 'תשרי' },
  { value: 8, label: 'חשון' },
  { value: 9, label: 'כסלו' },
  { value: 10, label: 'טבת' },
  { value: 11, label: 'שבט' },
  { value: 12, label: 'אדר' },
  { value: 13, label: 'אדר ב׳' },
];

const DAY_NAMES: Array<{ index: number; hebrew: string; en: string }> = [
  { index: 0, hebrew: 'ראשון', en: 'Sun' },
  { index: 1, hebrew: 'שני', en: 'Mon' },
  { index: 2, hebrew: 'שלישי', en: 'Tue' },
  { index: 3, hebrew: 'רביעי', en: 'Wed' },
  { index: 4, hebrew: 'חמישי', en: 'Thu' },
  { index: 5, hebrew: 'שישי', en: 'Fri' },
  { index: 6, hebrew: 'שבת', en: 'Sat' },
];

const GREGORIAN_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

const RULE_TYPE_LABELS: Record<ScheduleRuleType, string> = {
  gregorian_range: 'טווח תאריך לועזי',
  hebrew_range: 'טווח תאריך עברי',
  day_of_week: 'יום בשבוע',
  time_range: 'טווח שעות',
  dst_aware: 'שעון קיץ/חורף',
  zman_trigger: 'זמן לפי זמנים',
  group_trigger: 'קבוצת לוח',
  recurring: 'חוזר',
  one_time: 'פעם אחת',
  always: 'תמיד',
};

const RECURRING_FREQUENCIES: Array<{ value: RecurringRule['frequency']; label: string }> = [
  { value: 'daily', label: 'יומי' },
  { value: 'weekly', label: 'שבועי' },
  { value: 'monthly_gregorian', label: 'חודשי (לועזי)' },
  { value: 'monthly_hebrew', label: 'חודשי (עברי)' },
  { value: 'yearly_gregorian', label: 'שנתי (לועזי)' },
  { value: 'yearly_hebrew', label: 'שנתי (עברי)' },
];

type RecurringRule = Extract<ScheduleRule, { type: 'recurring' }>;

export interface ScheduleRuleEditorProps {
  config: ScheduleConfig;
  onChange: (config: ScheduleConfig) => void;
  availableGroups: Array<{ id: string; name: string; hebrewName: string }>;
  availableZmanim: Array<{ type: string; label: string; hebrewLabel: string }>;
}

function getRuleSummary(
  rule: ScheduleRule,
  availableZmanim?: Array<{ type: string; hebrewLabel: string }>
): string {
  switch (rule.type) {
    case 'gregorian_range':
      return `${rule.startMonth}/${rule.startDay} - ${rule.endMonth}/${rule.endDay}`;
    case 'hebrew_range': {
      const sm = HEBREW_MONTHS.find((m) => m.value === rule.startMonth)?.label ?? rule.startMonth;
      const em = HEBREW_MONTHS.find((m) => m.value === rule.endMonth)?.label ?? rule.endMonth;
      return `${sm} ${rule.startDay} - ${em} ${rule.endDay}`;
    }
    case 'day_of_week': {
      const days = DAY_NAMES.filter((d) => rule.mask[d.index] === '1').map((d) => d.hebrew);
      return days.join(', ');
    }
    case 'time_range':
      return `${rule.startTime} - ${rule.endTime}`;
    case 'dst_aware':
      return rule.showDuring === 'dst' ? 'שעון קיץ' : rule.showDuring === 'standard' ? 'שעון חורף' : 'שניהם';
    case 'zman_trigger': {
      const z = availableZmanim?.find((z) => z.type === rule.zmanType);
      const zmanLabel = z?.hebrewLabel ?? rule.zmanType;
      return `${zmanLabel} ${rule.offsetMinutes} דק׳ ${rule.showBefore ? 'לפני' : 'אחרי'}`;
    }
    case 'group_trigger':
      return rule.showWhenActive ? 'כאשר פעיל' : 'כאשר לא פעיל';
    case 'recurring':
      return `${rule.frequency} כל ${rule.interval}`;
    case 'one_time':
      return rule.date;
    case 'always':
      return 'תמיד';
    default:
      return '';
  }
}

function createDefaultRule(type: ScheduleRuleType): ScheduleRule {
  switch (type) {
    case 'gregorian_range':
      return { type: 'gregorian_range', startMonth: 1, startDay: 1, endMonth: 12, endDay: 31 };
    case 'hebrew_range':
      return { type: 'hebrew_range', startMonth: 1, startDay: 1, endMonth: 13, endDay: 29 };
    case 'day_of_week':
      return { type: 'day_of_week', mask: '0000000' };
    case 'time_range':
      return { type: 'time_range', startTime: '08:00', endTime: '18:00' };
    case 'dst_aware':
      return { type: 'dst_aware', showDuring: 'both' };
    case 'zman_trigger':
      return { type: 'zman_trigger', zmanType: '', offsetMinutes: 0, showBefore: true };
    case 'group_trigger':
      return { type: 'group_trigger', groupIds: [], showWhenActive: true };
    case 'recurring':
      return { type: 'recurring', frequency: 'daily', interval: 1 };
    case 'one_time':
      return { type: 'one_time', date: new Date().toISOString().slice(0, 10) };
    case 'always':
      return { type: 'always' };
  }
}

export function ScheduleRuleEditor({
  config,
  onChange,
  availableGroups,
  availableZmanim,
}: ScheduleRuleEditorProps) {
  const [addRuleOpen, setAddRuleOpen] = useState(false);

  const updateConfig = useCallback(
    (updater: (prev: ScheduleConfig) => ScheduleConfig) => {
      onChange(updater(config));
    },
    [config, onChange]
  );

  const addRule = useCallback(
    (type: ScheduleRuleType) => {
      updateConfig((prev) => ({
        ...prev,
        rules: [...prev.rules, createDefaultRule(type)],
      }));
      setAddRuleOpen(false);
    },
    [updateConfig]
  );

  const removeRule = useCallback(
    (index: number) => {
      updateConfig((prev) => ({
        ...prev,
        rules: prev.rules.filter((_, i) => i !== index),
      }));
    },
    [updateConfig]
  );

  const updateRule = useCallback(
    (index: number, rule: ScheduleRule) => {
      updateConfig((prev) => ({
        ...prev,
        rules: prev.rules.map((r, i) => (i === index ? rule : r)),
      }));
    },
    [updateConfig]
  );

  const setCombineMode = useCallback(
    (mode: 'all' | 'any') => {
      updateConfig((prev) => ({ ...prev, combineMode: mode }));
    },
    [updateConfig]
  );

  const baseStyle = {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 14,
    color: 'var(--ed-text)',
  };

  return (
    <div style={{ ...baseStyle, padding: 12 }}>
      {/* Combine mode */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
          מצב שילוב / Combine mode
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setCombineMode('all')}
            style={{
              padding: '8px 16px',
              paddingInlineStart: 16,
              paddingInlineEnd: 16,
              paddingBlock: 8,
              border: '1px solid var(--ed-border)',
              borderRadius: 6,
              background: config.combineMode === 'all' ? 'var(--ed-active-bg)' : 'var(--ed-bg)',
              cursor: 'pointer',
              fontWeight: config.combineMode === 'all' ? 600 : 400,
            }}
          >
            AND (כולם)
          </button>
          <button
            type="button"
            onClick={() => setCombineMode('any')}
            style={{
              padding: '8px 16px',
              paddingInlineStart: 16,
              paddingInlineEnd: 16,
              paddingBlock: 8,
              border: '1px solid var(--ed-border)',
              borderRadius: 6,
              background: config.combineMode === 'any' ? 'var(--ed-active-bg)' : 'var(--ed-bg)',
              cursor: 'pointer',
              fontWeight: config.combineMode === 'any' ? 600 : 400,
            }}
          >
            OR (אחד מהם)
          </button>
        </div>
      </div>

      {/* Rules list */}
      <div style={{ marginBottom: 12 }}>
        {config.rules.map((rule, index) => (
          <div
            key={index}
            style={{
              border: '1px solid var(--ed-border)',
              borderRadius: 8,
              padding: 12,
              marginBottom: 10,
              backgroundColor: 'var(--ed-bg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 4,
                    backgroundColor: 'var(--ed-border)',
                    fontSize: 12,
                    marginInlineEnd: 8,
                  }}
                >
                  {RULE_TYPE_LABELS[rule.type]}
                </span>
                <span style={{ fontSize: 12, color: 'var(--ed-text-dim)' }}>{getRuleSummary(rule, availableZmanim)}</span>
              </div>
              <button
                type="button"
                onClick={() => removeRule(index)}
                aria-label="Remove"
                style={{
                  padding: 4,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--ed-danger)',
                  fontSize: 18,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <RuleInlineEditor
              rule={rule}
              onChange={(r) => updateRule(index, r)}
              availableGroups={availableGroups}
              availableZmanim={availableZmanim}
            />
          </div>
        ))}
      </div>

      {/* Add rule */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setAddRuleOpen(!addRuleOpen)}
          style={{
            padding: '8px 16px',
            border: '1px dashed var(--ed-border)',
            borderRadius: 6,
            background: 'var(--ed-bg)',
            cursor: 'pointer',
            color: 'var(--ed-text-dim)',
          }}
        >
          + הוסף כלל / Add Rule
        </button>
        {addRuleOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              insetInlineStart: 0,
              marginTop: 4,
              background: 'var(--ed-bg-deep)',
              border: '1px solid var(--ed-border)',
              borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              padding: 8,
              zIndex: 10,
              minWidth: 200,
            }}
          >
            {(Object.keys(RULE_TYPE_LABELS) as ScheduleRuleType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addRule(type)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'start',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--ed-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {RULE_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface RuleInlineEditorProps {
  rule: ScheduleRule;
  onChange: (rule: ScheduleRule) => void;
  availableGroups: Array<{ id: string; name: string; hebrewName: string }>;
  availableZmanim: Array<{ type: string; label: string; hebrewLabel: string }>;
}

function RuleInlineEditor({
  rule,
  onChange,
  availableGroups,
  availableZmanim,
}: RuleInlineEditorProps) {
  const fieldStyle = { marginBottom: 8 };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 4, fontSize: 12, color: 'var(--ed-text-dim)' };

  switch (rule.type) {
    case 'gregorian_range': {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>חודש התחלה / Start month</label>
            <select
              value={rule.startMonth}
              onChange={(e) =>
                onChange({ ...rule, startMonth: parseInt(e.target.value, 10) })
              }
              className="ed-input" style={{ maxWidth: 200 }}
            >
              {GREGORIAN_MONTHS.map((_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1} - {GREGORIAN_MONTHS[i]}
                </option>
              ))}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>יום התחלה / Start day</label>
            <input
              type="number"
              min={1}
              max={31}
              value={rule.startDay}
              onChange={(e) =>
                onChange({ ...rule, startDay: parseInt(e.target.value, 10) || 1 })
              }
              className="ed-input" style={{ maxWidth: 200 }}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>חודש סיום / End month</label>
            <select
              value={rule.endMonth}
              onChange={(e) =>
                onChange({ ...rule, endMonth: parseInt(e.target.value, 10) })
              }
              className="ed-input" style={{ maxWidth: 200 }}
            >
              {GREGORIAN_MONTHS.map((_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1} - {GREGORIAN_MONTHS[i]}
                </option>
              ))}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>יום סיום / End day</label>
            <input
              type="number"
              min={1}
              max={31}
              value={rule.endDay}
              onChange={(e) =>
                onChange({ ...rule, endDay: parseInt(e.target.value, 10) || 1 })
              }
              className="ed-input" style={{ maxWidth: 200 }}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>שנת התחלה (אופציונלי)</label>
            <input
              type="number"
              placeholder="—"
              value={rule.startYear ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                onChange({ ...rule, startYear: v ? parseInt(v, 10) : undefined });
              }}
              className="ed-input" style={{ maxWidth: 200 }}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>שנת סיום (אופציונלי)</label>
            <input
              type="number"
              placeholder="—"
              value={rule.endYear ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                onChange({ ...rule, endYear: v ? parseInt(v, 10) : undefined });
              }}
              className="ed-input" style={{ maxWidth: 200 }}
            />
          </div>
        </div>
      );
    }

    case 'hebrew_range': {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>חודש התחלה</label>
            <select
              value={rule.startMonth}
              onChange={(e) =>
                onChange({ ...rule, startMonth: parseInt(e.target.value, 10) })
              }
              className="ed-input" style={{ maxWidth: 200 }}
            >
              {HEBREW_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>יום התחלה</label>
            <input
              type="number"
              min={1}
              max={30}
              value={rule.startDay}
              onChange={(e) =>
                onChange({ ...rule, startDay: parseInt(e.target.value, 10) || 1 })
              }
              className="ed-input" style={{ maxWidth: 200 }}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>חודש סיום</label>
            <select
              value={rule.endMonth}
              onChange={(e) =>
                onChange({ ...rule, endMonth: parseInt(e.target.value, 10) })
              }
              className="ed-input" style={{ maxWidth: 200 }}
            >
              {HEBREW_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>יום סיום</label>
            <input
              type="number"
              min={1}
              max={30}
              value={rule.endDay}
              onChange={(e) =>
                onChange({ ...rule, endDay: parseInt(e.target.value, 10) || 1 })
              }
              className="ed-input" style={{ maxWidth: 200 }}
            />
          </div>
        </div>
      );
    }

    case 'day_of_week': {
      const mask = rule.mask.padEnd(7, '0').slice(0, 7);
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {DAY_NAMES.map((d) => (
            <label
              key={d.index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                border: '1px solid var(--ed-border)',
                borderRadius: 6,
                cursor: 'pointer',
                backgroundColor: mask[d.index] === '1' ? 'var(--ed-active-bg)' : 'var(--ed-bg)',
              }}
            >
              <input
                type="checkbox"
                checked={mask[d.index] === '1'}
                onChange={(e) => {
                  const arr = mask.split('');
                  arr[d.index] = e.target.checked ? '1' : '0';
                  onChange({ ...rule, mask: arr.join('') });
                }}
              />
              <span>{d.hebrew}</span>
            </label>
          ))}
        </div>
      );
    }

    case 'time_range': {
      return (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>משעה / From</label>
            <input
              type="time"
              value={rule.startTime}
              onChange={(e) => onChange({ ...rule, startTime: e.target.value })}
              className="ed-input" style={{ maxWidth: 200 }}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>עד שעה / To</label>
            <input
              type="time"
              value={rule.endTime}
              onChange={(e) => onChange({ ...rule, endTime: e.target.value })}
              className="ed-input" style={{ maxWidth: 200 }}
            />
          </div>
        </div>
      );
    }

    case 'dst_aware': {
      return (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {(['dst', 'standard', 'both'] as const).map((opt) => (
            <label
              key={opt}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                border: '1px solid var(--ed-border)',
                borderRadius: 6,
                cursor: 'pointer',
                backgroundColor: rule.showDuring === opt ? 'var(--ed-active-bg)' : 'var(--ed-bg)',
              }}
            >
              <input
                type="radio"
                name="dst-aware"
                checked={rule.showDuring === opt}
                onChange={() => onChange({ ...rule, showDuring: opt })}
              />
              <span>
                {opt === 'dst' ? 'שעון קיץ' : opt === 'standard' ? 'שעון חורף' : 'שניהם'}
              </span>
            </label>
          ))}
        </div>
      );
    }

    case 'zman_trigger': {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>סוג זמן</label>
            <select
              value={rule.zmanType}
              onChange={(e) => onChange({ ...rule, zmanType: e.target.value })}
              className="ed-input" style={{ maxWidth: 200 }}
            >
              <option value="">— בחר —</option>
              {availableZmanim.map((z) => (
                <option key={z.type} value={z.type}>
                  {z.hebrewLabel} / {z.label}
                </option>
              ))}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>היסט (דקות)</label>
            <input
              type="number"
              value={rule.offsetMinutes}
              onChange={(e) =>
                onChange({
                  ...rule,
                  offsetMinutes: parseInt(e.target.value, 10) || 0,
                })
              }
              className="ed-input" style={{ maxWidth: 200 }}
            />
          </div>
          <div style={{ ...fieldStyle, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="radio"
                name="zman-before-after"
                checked={rule.showBefore}
                onChange={() => onChange({ ...rule, showBefore: true })}
              />
              <span>לפני</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="radio"
                name="zman-before-after"
                checked={!rule.showBefore}
                onChange={() => onChange({ ...rule, showBefore: false })}
              />
              <span>אחרי</span>
            </label>
          </div>
        </div>
      );
    }

    case 'group_trigger': {
      return (
        <div>
          <div style={{ ...fieldStyle, marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rule.showWhenActive}
                onChange={(e) =>
                  onChange({ ...rule, showWhenActive: e.target.checked })
                }
              />
              <span>הצג כאשר פעיל</span>
            </label>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {availableGroups.map((g) => (
              <label
                key={g.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  border: '1px solid var(--ed-border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  backgroundColor: rule.groupIds.includes(g.id) ? 'var(--ed-active-bg)' : 'var(--ed-bg)',
                }}
              >
                <input
                  type="checkbox"
                  checked={rule.groupIds.includes(g.id)}
                  onChange={(e) => {
                    const ids = e.target.checked
                      ? [...rule.groupIds, g.id]
                      : rule.groupIds.filter((id) => id !== g.id);
                    onChange({ ...rule, groupIds: ids });
                  }}
                />
                <span>{g.hebrewName || g.name}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    case 'recurring': {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>תדירות</label>
            <select
              value={rule.frequency}
              onChange={(e) =>
                onChange({
                  ...rule,
                  frequency: e.target.value as RecurringRule['frequency'],
                })
              }
              className="ed-input" style={{ maxWidth: 200 }}
            >
              {RECURRING_FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>מרווח</label>
            <input
              type="number"
              min={1}
              value={rule.interval}
              onChange={(e) =>
                onChange({
                  ...rule,
                  interval: parseInt(e.target.value, 10) || 1,
                })
              }
              className="ed-input" style={{ maxWidth: 200 }}
            />
          </div>
          {(rule.frequency === 'monthly_gregorian' ||
            rule.frequency === 'monthly_hebrew' ||
            rule.frequency === 'yearly_gregorian' ||
            rule.frequency === 'yearly_hebrew') && (
            <>
              <div style={fieldStyle}>
                <label style={labelStyle}>יום בחודש</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={rule.dayOfMonth ?? 1}
                  onChange={(e) =>
                    onChange({
                      ...rule,
                      dayOfMonth: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="ed-input" style={{ maxWidth: 200 }}
                />
              </div>
              {(rule.frequency === 'yearly_gregorian' ||
                rule.frequency === 'yearly_hebrew') && (
                <div style={fieldStyle}>
                  <label style={labelStyle}>חודש</label>
                  <select
                    value={rule.monthOfYear ?? 1}
                    onChange={(e) =>
                      onChange({
                        ...rule,
                        monthOfYear: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="ed-input" style={{ maxWidth: 200 }}
                  >
                    {rule.frequency === 'yearly_hebrew'
                      ? HEBREW_MONTHS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))
                      : GREGORIAN_MONTHS.map((_, i) => (
                          <option key={i} value={i + 1}>
                            {i + 1} - {GREGORIAN_MONTHS[i]}
                          </option>
                        ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    case 'one_time': {
      return (
        <div style={fieldStyle}>
          <label style={labelStyle}>תאריך</label>
          <input
            type="date"
            value={rule.date}
            onChange={(e) => onChange({ ...rule, date: e.target.value })}
            className="ed-input" style={{ maxWidth: 200 }}
          />
        </div>
      );
    }

    case 'always':
      return (
        <div style={{ color: 'var(--ed-text-dim)', fontSize: 13 }}>תמיד פעיל / Always active</div>
      );

    default:
      return null;
  }
}
