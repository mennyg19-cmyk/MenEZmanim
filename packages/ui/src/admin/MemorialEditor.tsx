'use client';

import React, { useEffect, useState, useMemo } from 'react';

interface MemorialEditorProps {
  memorials: any[];
  onChange: (memorials: any[]) => void;
  embedded?: boolean;
  quickAddNonce?: number;
}

const HEBREW_MONTHS = [
  'Nisan', 'Iyar', 'Sivan', 'Tammuz', 'Av', 'Elul',
  'Tishrei', 'Cheshvan', 'Kislev', 'Teves', 'Shevat', 'Adar', 'Adar II',
];

const emptyMemorial = () => ({
  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  hebrewFirstName: '',
  hebrewFamilyName: '',
  benBat: 'ben',
  parentName: '',
  englishName: '',
  hebrewMonth: 'Tishrei',
  hebrewDay: 1,
  hebrewYear: 5780,
  civilDate: '',
  donorInfo: '',
  notes: '',
  active: true,
});

export function MemorialEditor({ memorials, onChange, embedded, quickAddNonce = 0 }: MemorialEditorProps) {
  const [editing, setEditing] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!quickAddNonce) return;
    setEditing(emptyMemorial());
  }, [quickAddNonce]);

  const filtered = useMemo(() => {
    if (!searchTerm) return memorials;
    const lower = searchTerm.toLowerCase();
    return memorials.filter(
      (m) =>
        m.hebrewFirstName?.toLowerCase().includes(lower) ||
        m.hebrewFamilyName?.toLowerCase().includes(lower) ||
        m.englishName?.toLowerCase().includes(lower)
    );
  }, [memorials, searchTerm]);

  const handleAdd = () => setEditing(emptyMemorial());
  const handleEdit = (m: any) => setEditing({ ...m });
  const handleDelete = (id: string) => onChange(memorials.filter((m) => m.id !== id));

  const handleSaveEdit = () => {
    if (!editing) return;
    const idx = memorials.findIndex((m) => m.id === editing.id);
    if (idx >= 0) {
      const next = [...memorials];
      next[idx] = editing;
      onChange(next);
    } else {
      onChange([...memorials, editing]);
    }
    setEditing(null);
  };

  return (
    <div className={embedded ? undefined : 'adm-card'}>
      {!embedded && (
        <div className="adm-pageHeader">
          <h2 className="adm-pageTitle">יארצייט — Yahrzeit Management</h2>
          <div className="adm-inlineGroup">
            <button type="button" onClick={() => {}} className="adm-btnCancel" style={{ padding: '8px 16px' }}>
              Import from File
            </button>
            <button type="button" onClick={handleAdd} className="adm-btnPrimary" style={{ padding: '8px 16px', fontSize: 14 }}>
              + Add Yahrzeit
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <input
          className="adm-input"
          style={{ maxWidth: 300 }}
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {editing && (
        <div className="adm-formPanel" style={{ marginBottom: 20 }}>
          <h3 className="adm-sectionTitle" style={{ margin: '0 0 12px' }}>
            {memorials.find((m) => m.id === editing.id) ? 'Edit' : 'Add'} Yahrzeit
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label className="adm-labelSm">Hebrew First Name / שם פרטי</label>
              <input className="adm-input" value={editing.hebrewFirstName} onChange={(e) => setEditing({ ...editing, hebrewFirstName: e.target.value })} />
            </div>
            <div>
              <label className="adm-labelSm">Hebrew Family Name / שם משפחה</label>
              <input className="adm-input" value={editing.hebrewFamilyName} onChange={(e) => setEditing({ ...editing, hebrewFamilyName: e.target.value })} />
            </div>
            <div>
              <label className="adm-labelSm">בן / בת</label>
              <select className="adm-select" value={editing.benBat} onChange={(e) => setEditing({ ...editing, benBat: e.target.value })}>
                <option value="ben">בן (ben)</option>
                <option value="bat">בת (bat)</option>
              </select>
            </div>
            <div>
              <label className="adm-labelSm">Parent Name / שם הורה</label>
              <input className="adm-input" value={editing.parentName} onChange={(e) => setEditing({ ...editing, parentName: e.target.value })} />
            </div>
            <div>
              <label className="adm-labelSm">English Name</label>
              <input className="adm-input" value={editing.englishName} onChange={(e) => setEditing({ ...editing, englishName: e.target.value })} />
            </div>
            <div>
              <label className="adm-labelSm">Civil Date</label>
              <input className="adm-input" type="date" value={editing.civilDate} onChange={(e) => setEditing({ ...editing, civilDate: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label className="adm-labelSm">Hebrew Month / חודש</label>
              <select className="adm-select" value={editing.hebrewMonth} onChange={(e) => setEditing({ ...editing, hebrewMonth: e.target.value })}>
                {HEBREW_MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="adm-labelSm">Hebrew Day / יום</label>
              <input className="adm-input" type="number" min={1} max={30} value={editing.hebrewDay} onChange={(e) => setEditing({ ...editing, hebrewDay: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
              <label className="adm-labelSm">Hebrew Year / שנה</label>
              <input className="adm-input" type="number" value={editing.hebrewYear} onChange={(e) => setEditing({ ...editing, hebrewYear: parseInt(e.target.value) || 5780 })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label className="adm-labelSm">Donor Info</label>
              <input className="adm-input" value={editing.donorInfo} onChange={(e) => setEditing({ ...editing, donorInfo: e.target.value })} />
            </div>
            <div>
              <label className="adm-labelSm">Notes</label>
              <input className="adm-input" value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
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
              <th className="adm-th" style={{ textAlign: 'right' }}>שם עברי</th>
              <th className="adm-th">English Name</th>
              <th className="adm-th">Hebrew Date</th>
              <th className="adm-th">Civil Date</th>
              <th className="adm-th">Active</th>
              <th className="adm-th" style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id}>
                <td className="adm-td" style={{ textAlign: 'right' }}>
                  {m.hebrewFirstName} {m.benBat === 'ben' ? 'בן' : 'בת'} {m.parentName}
                </td>
                <td className="adm-td">{m.englishName || '—'}</td>
                <td className="adm-td">{m.hebrewDay} {m.hebrewMonth} {m.hebrewYear}</td>
                <td className="adm-td">{m.civilDate || '—'}</td>
                <td className="adm-td">
                  <span className={m.active ? "adm-badgeSuccess" : "adm-badgeMuted"}>{m.active ? 'Yes' : 'No'}</span>
                </td>
                <td className="adm-tdActions">
                  <div className="adm-inlineGroup">
                    <button onClick={() => handleEdit(m)} className="adm-btnEdit">Edit</button>
                    <button onClick={() => handleDelete(m.id)} className="adm-btnDanger">Del</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="adm-empty">
                  {searchTerm ? 'No results found.' : 'No yahrzeits yet. Click "+ Add Yahrzeit" to create one.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
