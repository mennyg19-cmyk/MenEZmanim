'use client';

import React, { useState } from 'react';


interface ScreenManagerProps {
  screens: any[];
  styles: any[];
  orgSlug?: string;
  onChange: (screens: any[]) => void;
}

const emptyScreen = () => ({
  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  name: '',
  styleId: '',
  resolution: '1920x1080',
  active: true,
});

export function ScreenManager({ screens, styles, orgSlug = 'demo', onChange }: ScreenManagerProps) {
  const [editing, setEditing] = useState<any | null>(null);

  const handleAdd = () => setEditing(emptyScreen());
  const handleEdit = (s: any) => setEditing({ ...s });
  const handleDelete = (id: string) => onChange(screens.filter((s) => s.id !== id));

  const handleSaveEdit = () => {
    if (!editing) return;
    const idx = screens.findIndex((s) => s.id === editing.id);
    if (idx >= 0) {
      const next = [...screens];
      next[idx] = editing;
      onChange(next);
    } else {
      onChange([...screens, editing]);
    }
    setEditing(null);
  };

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
              <input className="adm-input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Main Hall, Lobby" />
            </div>
            <div>
              <label className="adm-labelSm">Assigned Style</label>
              <select className="adm-select" value={editing.styleId} onChange={(e) => setEditing({ ...editing, styleId: e.target.value })}>
                <option value="">— No Style —</option>
                {styles.map((s) => (
                  <option key={s.id} value={s.id}>{s.name || s.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="adm-labelSm">Resolution</label>
              <select className="adm-select" value={editing.resolution} onChange={(e) => setEditing({ ...editing, resolution: e.target.value })}>
                <option value="1920x1080">1920x1080 (FHD)</option>
                <option value="3840x2160">3840x2160 (4K)</option>
                <option value="1280x720">1280x720 (HD)</option>
                <option value="1080x1920">1080x1920 (Portrait)</option>
              </select>
            </div>
            <div>
              <label className="adm-labelSm">Active</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, marginTop: 4 }}>
                <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
                Screen is active
              </label>
            </div>
          </div>
          <div className="adm-inlineGroup" style={{ marginTop: 12 }}>
            <button onClick={handleSaveEdit} className="adm-btnSave" style={{ padding: '8px 16px' }}>Save</button>
            <button onClick={() => setEditing(null)} className="adm-btnCancel" style={{ padding: '8px 16px' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="adm-table">
          <thead>
            <tr>
              <th className="adm-th">Screen Name</th>
              <th className="adm-th">Assigned Style</th>
              <th className="adm-th">Resolution</th>
              <th className="adm-th">Active</th>
              <th className="adm-th" style={{ width: 140 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {screens.map((s) => {
              const styleName = styles.find((st: any) => st.id === s.styleId)?.name || s.styleId || '—';
              return (
                <tr key={s.id}>
                  <td className="adm-td" style={{ fontWeight: 500 }}>{s.name || '—'}</td>
                  <td className="adm-td">{styleName}</td>
                  <td className="adm-td">{s.resolution || '—'}</td>
                  <td className="adm-td">
                    <span className={s.active ? "adm-badgeSuccess" : "adm-badgeMuted"}>{s.active ? 'Active' : 'Inactive'}</span>
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
                      <button onClick={() => handleEdit(s)} className="adm-btnEdit">Edit</button>
                      <button onClick={() => handleDelete(s.id)} className="adm-btnDanger">Del</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {screens.length === 0 && (
              <tr>
                <td colSpan={5} className="adm-empty">
                  No screens configured. Click "+ Add Screen" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
