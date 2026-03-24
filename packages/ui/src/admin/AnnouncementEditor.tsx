'use client';

import React, { useEffect, useState } from 'react';
import type { VisibilityRule } from '@zmanim-app/core';
import { VisibilityRulesEditor } from '../shared/VisibilityRulesEditor';

interface AnnouncementEditorProps {
  announcements: any[];
  onChange: (announcements: any[]) => void;
  /** Nested in Content Hub — hide outer title row */
  embedded?: boolean;
  /** Increment to open &quot;new&quot; form from parent */
  quickAddNonce?: number;
}

const emptyAnnouncement = () => ({
  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  title: '',
  content: '',
  priority: 0,
  active: true,
  visibilityRules: [] as VisibilityRule[],
});

export function AnnouncementEditor({ announcements, onChange, embedded, quickAddNonce = 0 }: AnnouncementEditorProps) {
  const [editing, setEditing] = useState<any | null>(null);

  const handleAdd = () => {
    setEditing(emptyAnnouncement());
  };

  useEffect(() => {
    if (!quickAddNonce) return;
    setEditing(emptyAnnouncement());
  }, [quickAddNonce]);

  const handleEdit = (ann: any) => {
    setEditing({
      ...ann,
      visibilityRules: Array.isArray(ann.visibilityRules) ? ann.visibilityRules : [],
    });
  };

  const handleDelete = (id: string) => {
    onChange(announcements.filter((a) => a.id !== id));
  };

  const handleToggleActive = (id: string) => {
    onChange(
      announcements.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    const idx = announcements.findIndex((a) => a.id === editing.id);
    if (idx >= 0) {
      const next = [...announcements];
      next[idx] = editing;
      onChange(next);
    } else {
      onChange([...announcements, editing]);
    }
    setEditing(null);
  };

  return (
    <div className={embedded ? undefined : 'adm-card'}>
      {!embedded && (
        <div className="adm-pageHeader">
          <h2 className="adm-pageTitle">הודעות — Announcements</h2>
          <button type="button" onClick={handleAdd} className="adm-btnPrimary" style={{ padding: '8px 16px', fontSize: 14 }}>
            + Add Announcement
          </button>
        </div>
      )}

      {editing && (
        <div className="adm-formPanel" style={{ marginBottom: 20 }}>
          <h3 className="adm-sectionTitle" style={{ margin: '0 0 12px' }}>
            {announcements.find((a) => a.id === editing.id) ? 'Edit' : 'New'} Announcement
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="adm-labelSm">Title</label>
              <input className="adm-input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </div>
            <div>
              <label className="adm-labelSm">Priority</label>
              <input className="adm-input" type="number" value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label className="adm-labelSm">Visibility (calendar)</label>
            <VisibilityRulesEditor
              rules={editing.visibilityRules ?? []}
              onChange={(visibilityRules) => setEditing({ ...editing, visibilityRules })}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <label className="adm-labelSm">Content</label>
            <textarea
              className="adm-textarea"
              style={{ minHeight: 120 }}
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              placeholder="Announcement content..."
            />
          </div>
          <div className="adm-inlineGroup" style={{ marginTop: 12 }}>
            <button onClick={handleSaveEdit} className="adm-btnSave" style={{ padding: '8px 16px' }}>Save</button>
            <button onClick={() => setEditing(null)} className="adm-btnCancel" style={{ padding: '8px 16px' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className="adm-row"
            style={{
              gap: 12,
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--adm-border)',
              backgroundColor: ann.active ? 'var(--adm-bg)' : 'var(--adm-bg-hover)',
              opacity: ann.active ? 1 : 0.6,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{ann.title || '(Untitled)'}</div>
              <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginTop: 2 }}>
                {ann.content ? ann.content.slice(0, 100) + (ann.content.length > 100 ? '...' : '') : 'No content'}
              </div>
            </div>
            <span className={ann.active ? "adm-badgeSuccess" : "adm-badgeMuted"}>
              {ann.active ? 'Active' : 'Inactive'}
            </span>
            <div className="adm-inlineGroup">
              <button onClick={() => handleToggleActive(ann.id)} className="adm-btnCancel">
                {ann.active ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => handleEdit(ann)} className="adm-btnEdit">Edit</button>
              <button onClick={() => handleDelete(ann.id)} className="adm-btnDanger">Del</button>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="adm-empty">
            {embedded ? 'No announcements yet. Use + Add in the section header or the summary card.' : 'No announcements yet. Click "+ Add Announcement" to create one.'}
          </div>
        )}
      </div>
    </div>
  );
}
