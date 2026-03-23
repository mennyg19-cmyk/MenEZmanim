'use client';

import React, { useCallback } from 'react';
import { useColorContext } from '../editor/ColorContext';
import { extractHex } from './colorUtils';

export type ColorPickerVariant = 'full' | 'compact' | 'swatch-only';

export interface ColorPickerProps {
  value: string;
  onChange: (v: string) => void;
  /** Default `full` matches legacy ColorInput. */
  variant?: ColorPickerVariant;
  recentColors?: string[];
  themeColors?: string[];
  onColorUsed?: (color: string) => void;
  /** Extra classes for the native color input (swatch-only / compact swatch). */
  swatchClassName?: string;
  className?: string;
  textInputClassName?: string;
  id?: string;
}

export function ColorDot({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={color}
      className={active ? 'ed-colorDot ed-colorDot--active' : 'ed-colorDot'}
      style={{ backgroundColor: color }}
    />
  );
}

/**
 * Unified color control: full (editor + recent/theme dots), compact (swatch + hex text), or swatch-only.
 */
export function ColorPicker({
  value,
  onChange,
  variant = 'full',
  recentColors: recentProp,
  themeColors: themeProp,
  onColorUsed: onUsedProp,
  swatchClassName,
  className,
  textInputClassName,
  id,
}: ColorPickerProps) {
  if (variant === 'swatch-only') {
    return (
      <input
        id={id}
        type="color"
        value={extractHex(value) || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className={swatchClassName ?? 'ed-colorSwatch'}
        aria-label="Choose color"
      />
    );
  }

  if (variant === 'compact') {
    const hex = extractHex(value) || '#000000';
    return (
      <div className={className ?? 'ed-colorPickerCompact'}>
        <div className="ed-colorRow">
          <input
            type="color"
            value={hex}
            onChange={(e) => onChange(e.target.value)}
            className={swatchClassName ?? 'ed-colorSwatch'}
            aria-label="Choose color"
          />
          <input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={textInputClassName ?? 'ed-input ed-colorPickerCompactInput'}
          />
        </div>
      </div>
    );
  }

  const ctx = useColorContext();
  const recent = recentProp ?? ctx.recentColors;
  const theme = themeProp ?? ctx.themeColors;
  const trackColor = onUsedProp ?? ctx.addRecentColor;

  const pick = useCallback(
    (color: string) => {
      onChange(color);
      trackColor(color);
    },
    [onChange, trackColor],
  );

  const handleNativeLive = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const handleNativeCommit = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      trackColor(e.target.value);
    },
    [trackColor],
  );

  return (
    <div className={className ?? 'ed-colorPickerRoot'}>
      <div className="ed-colorRow">
        <input
          type="color"
          value={value}
          onChange={handleNativeLive}
          onBlur={handleNativeCommit}
          className={swatchClassName ?? 'ed-colorSwatch'}
        />
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => trackColor(value)}
          className={textInputClassName ?? 'ed-input ed-colorPickerFullText'}
        />
      </div>
      {theme.length > 0 && (
        <div className="ed-colorPickerDotsRow">
          <span className="ed-colorPickerDotsLabel">Theme</span>
          {theme.map((c) => (
            <ColorDot key={c} color={c} active={value === c} onClick={() => pick(c)} />
          ))}
        </div>
      )}
      {recent.length > 0 && (
        <div className="ed-colorPickerDotsRow">
          <span className="ed-colorPickerDotsLabel">Recent</span>
          {recent.slice(0, 12).map((c) => (
            <ColorDot key={c} color={c} active={value === c} onClick={() => pick(c)} />
          ))}
        </div>
      )}
    </div>
  );
}
