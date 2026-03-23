'use client';

import React from 'react';

export type ToggleVariant = 'admin' | 'editor';

export interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  variant?: ToggleVariant;
  'aria-label'?: string;
  id?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, variant = 'editor', 'aria-label': ariaLabel, id, disabled }: ToggleProps) {
  const on = variant === 'admin' ? 'adm-toggleOn' : 'ed-toggleOn';
  const off = variant === 'admin' ? 'adm-toggleOff' : 'ed-toggleOff';
  const knob = variant === 'admin' ? 'adm-toggleKnob' : 'ed-toggleKnob';

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={checked ? on : off}
    >
      <div className={knob} style={{ left: checked ? 21 : 3 }} />
    </button>
  );
}
