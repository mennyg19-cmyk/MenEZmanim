'use client';

import React, { useState } from 'react';


interface SponsorManagerProps {
  sponsors: any[];
  onChange: (sponsors: any[]) => void;
}

const SPONSOR_TYPES = ['Parnas HaYom', 'Kiddush', 'Shalosh Seudos', 'Seudah Shlishit', 'Other'];

const emptySponsor = () => ({
  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  name: '',
  type: 'Parnas HaYom',
  hebrewText: '',
  englishText: '',
  date: '',
  recurring: false,
  active: true,
});

export function SponsorManager({ sponsors, onChange }: SponsorManagerProps) {
  const [editing, setEditing] = useState<any | null>(null);

  const handleAdd = () => setEditing(emptySponsor());
  const handleEdit = (s: any) => setEditing({ ...s });
  const handleDelete = (id: string) => onChange(sponsors.filter((s) => s.id !== id));

  const handleSaveEdit = () => {
    if (!editing) return;
    const idx = sponsors.findIndex((s) => s.id === editing.id);
    if (idx >= 0) {
      const next = [...sponsors];
      next[idx] = editing;
      onChange(next);
    } else {
      onChange([...sponsors, editing]);
    }
    setEditing(null);
  };

  return (
    <div className="adm-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>תורמים — Sponsors</h2>
        <button onClick={handleAdd} className="adm-btnPrimary" style={{ padding: '8px 16px', fontSize: 14 }}>
          + Add Sponsor
        </button>
      </div>

      {editing && (
        <div className="adm-formPanel" style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>
            {sponsors.find((s) => s.id === editing.id) ? 'Edit' : 'Add'} Sponsor
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label className="adm-labelSm">Sponsor Name</label>
              <input className="adm-input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className="adm-labelSm">Type</label>
              <select className="adm-input" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                {SPONSOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="adm-labelSm">Date</label>
              <input className="adm-input" type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label className="adm-labelSm">Hebrew Text / נוסח עברי</label>
              <textarea className="adm-textarea" value={editing.hebrewText} onChange={(e) => setEditing({ ...editing, hebrewText: e.target.value })} />
            </div>
            <div>
              <label className="adm-labelSm">English Text</label>
              <textarea className="adm-textarea" value={editing.englishText} onChange={(e) => setEditing({ ...editing, englishText: e.target.value })} />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={editing.recurring} onChange={(e) => setEditing({ ...editing, recurring: e.target.checked })} />
              Recurring / חוזר
            </label>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={handleSaveEdit} className="adm-btnSave" style={{ padding: '8px 16px', fontSize: 13 }}>Save</button>
            <button onClick={() => setEditing(null)} className="adm-btnCancel" style={{ padding: '8px 16px', fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="adm-table">
          <thead>
            <tr style={{ backgroundColor: 'var(--adm-bg-muted)' }}>
              <th className="adm-th">Sponsor Name</th>
              <th className="adm-th">Type</th>
              <th className="adm-th">Date</th>
              <th className="adm-th">Active</th>
              <th className="adm-th" style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sponsors.map((s) => (
              <tr key={s.id}>
                <td className="adm-td" style={{ fontWeight: 500 }}>{s.name || '—'}</td>
                <td className="adm-td">{s.type}</td>
                <td className="adm-td">{s.date || '—'}</td>
                <td className="adm-td">
                  <span style={{ color: s.active ? 'var(--adm-success)' : 'var(--adm-text-dim)' }}>{s.active ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="adm-tdActions">
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => handleEdit(s)} className="adm-btnSmall" style={{ backgroundColor: 'var(--adm-accent)', color: '#fff' }}>Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="adm-btnSmallDanger">Del</button>
                  </div>
                </td>
              </tr>
            ))}
            {sponsors.length === 0 && (
              <tr>
                <td colSpan={5} className="adm-empty">
                  No sponsors yet. Click "+ Add Sponsor" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
