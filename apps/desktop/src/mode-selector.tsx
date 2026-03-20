import React from 'react';

const MODE_KEY = 'zmanim-app-mode';

export type AppMode = 'fully-local' | 'hybrid' | 'display-only';

interface ModeCard {
  id: AppMode;
  title: string;
  description: string;
}

const MODES: ModeCard[] = [
  {
    id: 'fully-local',
    title: 'Fully Local',
    description: 'All data stored locally. No cloud sync. Works offline.',
  },
  {
    id: 'hybrid',
    title: 'Hybrid (Local + Cloud)',
    description: 'Local storage with optional cloud sync for backup and multi-device.',
  },
  {
    id: 'display-only',
    title: 'Display Only',
    description: 'Connect to a remote server. Display content only, no local data.',
  },
];

export function getStoredMode(): AppMode | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(MODE_KEY);
  if (stored === 'fully-local' || stored === 'hybrid' || stored === 'display-only') {
    return stored;
  }
  return null;
}

export function setStoredMode(mode: AppMode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MODE_KEY, mode);
  }
}

export function ModeSelector({
  onSelect,
}: {
  onSelect?: (mode: AppMode) => void;
}): React.ReactElement {
  const handleSelect = (mode: AppMode): void => {
    setStoredMode(mode);
    onSelect?.(mode);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 48,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f0f0f',
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 48 }}>Select Mode</h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          maxWidth: 900,
        }}
      >
        {MODES.map((mode) => (
          <div
            key={mode.id}
            style={{
              padding: 24,
              backgroundColor: '#1a1a1a',
              borderRadius: 12,
              border: '1px solid #333',
            }}
          >
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>{mode.title}</h2>
            <p style={{ color: '#aaa', marginBottom: 20, lineHeight: 1.5 }}>{mode.description}</p>
            <button
              onClick={() => handleSelect(mode.id)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Select
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
