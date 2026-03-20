'use client';

import React from 'react';


interface BackgroundPickerProps {
  currentImage?: string;
  currentColor: string;
  availableImages: string[];
  onImageChange: (image: string | undefined) => void;
  onColorChange: (color: string) => void;
}

export function BackgroundPicker({
  currentImage,
  currentColor,
  availableImages,
  onImageChange,
  onColorChange,
}: BackgroundPickerProps) {
  return (
    <div style={{ padding: 16, fontFamily: 'var(--font-system)', color: 'var(--ed-text)' }}>
      <div className="ed-sectionLabelSm" style={{ marginBottom: 8 }}>Current Background</div>
      <div
        style={{
          width: '100%',
          height: 100,
          backgroundColor: currentColor,
          backgroundImage: currentImage ? `url(${currentImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--ed-border)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!currentImage && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Solid Color</span>
        )}
      </div>

      <div className="ed-sectionLabelSm" style={{ marginBottom: 8 }}>Background Color</div>
      <div className="ed-colorRow" style={{ gap: 10, marginBottom: 16 }}>
        <input
          type="color"
          value={currentColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="ed-colorSwatch"
          style={{ width: 40, height: 32 }}
        />
        <input
          type="text"
          value={currentColor}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onColorChange(v);
          }}
          className="ed-input"
          style={{ flex: 1, fontFamily: 'monospace' }}
        />
      </div>

      <div className="ed-sectionLabelSm" style={{ marginBottom: 8 }}>Background Image</div>

      <div
        onClick={() => onImageChange(undefined)}
        className={!currentImage ? "ed-bgModeBtnActive" : "ed-bgModeBtn"}
        style={{ width: '100%', marginBottom: 8, textAlign: 'center', justifyContent: 'center', padding: '8px 0' }}
      >
        No Image
      </div>

      {availableImages.length === 0 ? (
        <div className="ed-smEmpty">No background images available.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {availableImages.map((img) => {
            const isSelected = currentImage === img;
            return (
              <div
                key={img}
                onClick={() => onImageChange(img)}
                style={{
                  aspectRatio: '16/9',
                  backgroundImage: `url(${img})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '2px solid var(--ed-accent-light)' : '1px solid var(--ed-border)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s',
                }}
              >
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      width: 18, height: 18, backgroundColor: 'var(--ed-accent-light)',
                      borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700,
                    }}
                  >
                    ✓
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '12px 6px 4px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    fontSize: 10, color: '#ccc', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {img.split('/').pop()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
