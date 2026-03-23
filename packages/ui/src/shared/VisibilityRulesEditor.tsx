'use client';

import React from 'react';
import { VISIBILITY_CONDITIONS, type VisibilityCondition, type VisibilityRule } from '@zmanim-app/core';

export interface VisibilityRulesEditorProps {
  rules: VisibilityRule[];
  onChange: (rules: VisibilityRule[]) => void;
}

/** Calendar visibility rules — same model as minyan events (ScheduleEditor). */
export function VisibilityRulesEditor({ rules, onChange }: VisibilityRulesEditorProps) {
  return (
    <>
      <div className="adm-hintSm" style={{ marginBottom: 8 }}>
        Show or hide based on calendar conditions (same rules as minyan events). Leave empty to always follow active dates only.
      </div>
      {rules.map((rule, rIdx) => (
        <div key={rIdx} className="adm-flex adm-gap4" style={{ marginBottom: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={rule.show ? 'show' : 'hide'}
            onChange={(e) => {
              const next = [...rules];
              next[rIdx] = { ...next[rIdx], show: e.target.value === 'show' };
              onChange(next);
            }}
            className="adm-select"
            style={{ width: 70 }}
            aria-label="Show or hide"
          >
            <option value="show">Show</option>
            <option value="hide">Hide</option>
          </select>
          <span style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>on</span>
          <select
            value={rule.condition}
            onChange={(e) => {
              const next = [...rules];
              next[rIdx] = { ...next[rIdx], condition: e.target.value as VisibilityCondition };
              onChange(next);
            }}
            className="adm-select"
            style={{ flex: 1, minWidth: 160 }}
            aria-label="Condition"
          >
            {VISIBILITY_CONDITIONS.map((vc) => (
              <option key={vc.value} value={vc.value}>
                {vc.labelHe} — {vc.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChange(rules.filter((_, i) => i !== rIdx))}
            className="adm-btnSmallDanger"
            style={{ padding: '2px 6px' }}
            aria-label="Remove rule"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rules, { condition: 'weekday' as VisibilityCondition, show: true }])}
        className="adm-btnSmallOutline"
        style={{ fontSize: 11, marginTop: 4, color: 'var(--adm-accent)' }}
      >
        + Add Rule
      </button>
    </>
  );
}
