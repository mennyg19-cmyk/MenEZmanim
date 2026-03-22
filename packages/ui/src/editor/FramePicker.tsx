'use client';

import React, { useRef, useState } from 'react';
import { FRAME_CATALOG, type FrameCategory } from '../shared/frames';

interface FramePickerProps {
  value?: string | null;
  onChange: (frameId: string | undefined) => void;
  /** Current thickness multiplier (default 1.0) */
  thickness?: number;
  /** Called when thickness changes */
  onThicknessChange?: (thickness: number) => void;
  /** Called when user uploads a custom frame image. Should return the URL. */
  onUploadCustomFrame?: (file: File) => Promise<string | undefined>;
}

const ORDER: FrameCategory[] = ['ornamental', 'modern', 'minimal'];

const CAT_LABELS: Record<FrameCategory, string> = {
  ornamental: 'Ornamental',
  modern: 'Modern',
  minimal: 'Minimal',
};

/** Custom frames are stored as "custom:<url>:<slice>" */
export function isCustomFrame(id: string | null | undefined): boolean {
  return typeof id === 'string' && id.startsWith('custom:');
}

export function parseCustomFrame(id: string): { url: string; slice: number } | undefined {
  if (!id.startsWith('custom:')) return undefined;
  const rest = id.slice(7);
  const lastColon = rest.lastIndexOf(':');
  if (lastColon === -1) return { url: rest, slice: 30 };
  const url = rest.slice(0, lastColon);
  const slice = parseInt(rest.slice(lastColon + 1), 10);
  return { url, slice: isNaN(slice) ? 30 : slice };
}

function buildCustomFrameId(url: string, slice: number): string {
  return `custom:${url}:${slice}`;
}

export function FramePicker({ value, onChange, thickness = 1, onThicknessChange, onUploadCustomFrame }: FramePickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const customParsed = value && isCustomFrame(value) ? parseCustomFrame(value) : undefined;

  const handleUpload = async (file: File) => {
    if (!onUploadCustomFrame) return;
    setUploading(true);
    try {
      const url = await onUploadCustomFrame(file);
      if (url) {
        onChange(buildCustomFrameId(url, 30));
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* None button */}
      <button
        type="button"
        className={!value ? 'ed-bgModeBtnActive' : 'ed-bgModeBtn'}
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => onChange(undefined)}
      >
        None
      </button>

      {/* Thickness slider */}
      {value && onThicknessChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--ed-text-dim)', whiteSpace: 'nowrap' }}>Thickness</span>
          <input
            type="range"
            min={0.3}
            max={3}
            step={0.1}
            value={thickness}
            onChange={(e) => onThicknessChange(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 10, color: 'var(--ed-text-dim)', minWidth: 28, textAlign: 'right' }}>
            {thickness.toFixed(1)}x
          </span>
        </div>
      )}

      {/* Custom frame slice control */}
      {customParsed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--ed-text-dim)', whiteSpace: 'nowrap' }}>Border slice</span>
          <input
            type="range"
            min={5}
            max={48}
            step={1}
            value={customParsed.slice}
            onChange={(e) => {
              const s = parseInt(e.target.value, 10);
              onChange(buildCustomFrameId(customParsed.url, s));
            }}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 10, color: 'var(--ed-text-dim)', minWidth: 24, textAlign: 'right' }}>
            {customParsed.slice}%
          </span>
        </div>
      )}

      {/* Frame presets */}
      {ORDER.map((cat) => {
        const items = FRAME_CATALOG.filter((f) => f.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <div style={{ fontSize: 10, color: 'var(--ed-text-dim)', marginBottom: 6 }}>{CAT_LABELS[cat]}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {items.map((f) => {
                const active = value === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    title={f.label}
                    onClick={() => onChange(f.id)}
                    style={{
                      height: 64,
                      borderRadius: 6,
                      border: active ? '2px solid var(--ed-accent-light)' : '1px solid var(--ed-border)',
                      background: '#e2e8f0',
                      cursor: 'pointer',
                      padding: 4,
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                    }}
                  >
                    <img
                      src={f.previewUrl}
                      alt={f.label}
                      style={{ width: 48, height: 48, objectFit: 'contain' }}
                      draggable={false}
                    />
                    <span style={{ fontSize: 8, color: 'var(--ed-text-dim)', lineHeight: 1 }}>{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Custom frame upload */}
      {onUploadCustomFrame && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--ed-text-dim)', marginBottom: 6 }}>Custom Frame</div>
          {customParsed && (
            <div style={{
              marginBottom: 6, height: 48, borderRadius: 6, border: '2px solid var(--ed-accent-light)',
              background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <div style={{
                width: 40, height: 40,
                borderStyle: 'solid', borderWidth: 0, boxSizing: 'border-box',
                borderImage: `url("${customParsed.url}") ${customParsed.slice}% / 12px / 0 stretch`,
                background: 'rgba(255,255,255,0.5)',
              }} />
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/svg+xml"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="ed-btnSmall"
            style={{ width: '100%', justifyContent: 'center', fontSize: 10 }}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Custom Frame (PNG)'}
          </button>
          <div style={{ fontSize: 9, color: 'var(--ed-text-dim)', marginTop: 4 }}>
            Use a square PNG with transparent center. Adjust &quot;Border slice&quot; to set corner size.
          </div>
        </div>
      )}
    </div>
  );
}
