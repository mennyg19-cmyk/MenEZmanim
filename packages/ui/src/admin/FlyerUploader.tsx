'use client';

import React, { useEffect, useRef, useState } from 'react';

interface FlyerUploaderProps {
  media: any[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onChange: (media: any[]) => void;
  embedded?: boolean;
  /** Increment to open the file picker from parent */
  openUploadNonce?: number;
}

export function FlyerUploader({ media, onUpload, onDelete, onChange, embedded, openUploadNonce = 0 }: FlyerUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleToggleActive = (id: string) => {
    onChange(media.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));
  };

  useEffect(() => {
    if (!openUploadNonce || uploading) return;
    fileInputRef.current?.click();
  }, [openUploadNonce, uploading]);

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    const next = [...media];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, moved);
    onChange(next);
    setDragIdx(null);
  };

  return (
    <div className={embedded ? undefined : 'adm-card'}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
      {!embedded && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>מדיה ופליירים — Media & Flyers</h2>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="adm-btnPrimary"
              style={{ padding: '8px 16px', fontSize: 14, opacity: uploading ? 0.6 : 1 }}
            >
              {uploading ? 'Uploading...' : '+ Upload Image'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {media.map((item, idx) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            style={{
              border: '1px solid var(--adm-border)',
              borderRadius: 8,
              overflow: 'hidden',
              opacity: item.active ? 1 : 0.5,
              cursor: 'grab',
            }}
          >
            <div
              style={{
                height: 140,
                backgroundColor: 'var(--adm-bg-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {item.url ? (
                <img src={item.url} alt={item.filename} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: 'var(--adm-text-dim)', fontSize: 40 }}>🖼️</span>
              )}
            </div>
            <div style={{ padding: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.filename || 'Untitled'}
              </div>
              {item.scheduleRules && (
                <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginBottom: 6 }}>{item.scheduleRules}</div>
              )}
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button
                  onClick={() => handleToggleActive(item.id)}
                  className="adm-btnSmall"
                  style={{ backgroundColor: item.active ? 'var(--adm-warning)' : 'var(--adm-success)', color: '#fff', flex: 1 }}
                >
                  {item.active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="adm-btnSmallDanger"
                >
                  Del
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {media.length === 0 && (
        <div className="adm-empty">
          {embedded
            ? 'No media yet. Use Upload in the section header or the summary card.'
            : 'No media uploaded yet. Click "+ Upload Image" to add flyers and images.'}
        </div>
      )}
    </div>
  );
}
