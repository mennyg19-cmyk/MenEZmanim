'use client';

import React, { useState } from 'react';
import { DisplayStyle } from '@zmanim-app/core';
import { ConfirmDialog } from '../shared/Modal';


interface StyleManagerProps {
  styles: DisplayStyle[];
  activeStyleId: string | null;
  onStyleSelect: (styleId: string) => void;
  onStyleCreate: (name: string) => void;
  onStyleDelete: (styleId: string) => void;
  onStyleDuplicate: (styleId: string) => void;
  onStyleRename: (styleId: string, name: string) => void;
}

export function StyleManager({
  styles: styleList,
  activeStyleId,
  onStyleSelect,
  onStyleCreate,
  onStyleDelete,
  onStyleDuplicate,
  onStyleRename,
}: StyleManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteDraft, setDeleteDraft] = useState<{ id: string; name: string } | null>(null);

  const sorted = [...styleList].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    onStyleCreate(name);
    setNewName('');
    setIsCreating(false);
  };

  const handleRename = (id: string) => {
    const name = renameValue.trim();
    if (!name) return;
    onStyleRename(id, name);
    setRenamingId(null);
    setRenameValue('');
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    onStyleSelect(sorted[index].id);
  };

  const handleMoveDown = (index: number) => {
    if (index >= sorted.length - 1) return;
    onStyleSelect(sorted[index].id);
  };

  return (
    <div className="ed-smContainer" data-tutorial="editor-style-manager">
      <div className="ed-panelHeader">
        <span style={{ fontSize: 13, fontWeight: 600 }}>Styles</span>
        <button type="button" data-tutorial="editor-style-new" onClick={() => setIsCreating(true)} className="ed-btnPrimary">+ New</button>
      </div>

      {isCreating && (
        <div className="ed-panelHeader" style={{ gap: 6 }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setIsCreating(false); }}
            placeholder="Style name..."
            autoFocus
            className="ed-smInput"
          />
          <button onClick={handleCreate} className="ed-btnSmall" style={{ color: '#6aff6a', borderColor: '#2a6a3a' }}>Add</button>
          <button onClick={() => setIsCreating(false)} className="ed-btnSmall">✕</button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {sorted.length === 0 && (
          <div className="ed-smEmpty">No styles yet. Click &quot;+ New&quot; to create one.</div>
        )}

        {sorted.map((style, index) => {
          const isActive = style.id === activeStyleId;
          return (
            <div
              key={style.id}
              onClick={() => onStyleSelect(style.id)}
              className={isActive ? "ed-smCardActive" : "ed-smCard"}
            >
              <div
                style={{
                  width: '100%',
                  height: 48,
                  backgroundColor: style.backgroundColor || '#000',
                  backgroundImage: style.backgroundImage ? `url(${style.backgroundImage})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 4,
                  marginBottom: 8,
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid var(--ed-border)',
                }}
              >
                {style.objects.slice(0, 5).map((obj) => (
                  <div
                    key={obj.id}
                    style={{
                      position: 'absolute',
                      left: `${(obj.position.x / (style.canvasWidth || 1920)) * 100}%`,
                      top: `${(obj.position.y / (style.canvasHeight || 1080)) * 100}%`,
                      width: `${(obj.position.width / (style.canvasWidth || 1920)) * 100}%`,
                      height: `${(obj.position.height / (style.canvasHeight || 1080)) * 100}%`,
                      backgroundColor: 'rgba(74, 158, 255, 0.3)',
                      border: '1px solid rgba(74, 158, 255, 0.5)',
                      borderRadius: 1,
                    }}
                  />
                ))}
              </div>

              {renamingId === style.id ? (
                <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRename(style.id); if (e.key === 'Escape') setRenamingId(null); }}
                    autoFocus
                    className="ed-smInput"
                  />
                  <button onClick={() => handleRename(style.id)} className="ed-btnSmall" style={{ fontSize: 10 }}>✓</button>
                </div>
              ) : (
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{style.name}</div>
              )}

              <div className="ed-smMeta">
                {style.objects.length} object{style.objects.length !== 1 ? 's' : ''}
              </div>

              <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => { setRenamingId(style.id); setRenameValue(style.name); }} className="ed-btnSmall" title="Rename">Rename</button>
                <button onClick={() => onStyleDuplicate(style.id)} className="ed-btnSmall" title="Duplicate">Dup</button>
                <button type="button" onClick={() => setDeleteDraft({ id: style.id, name: style.name })} className="ed-btnDanger" title="Delete">Del</button>
                <div style={{ flex: 1 }} />
                <button onClick={() => handleMoveUp(index)} disabled={index === 0} className="ed-btnSmall" style={{ opacity: index === 0 ? 0.3 : 1 }} title="Move up">▲</button>
                <button onClick={() => handleMoveDown(index)} disabled={index === sorted.length - 1} className="ed-btnSmall" style={{ opacity: index === sorted.length - 1 ? 0.3 : 1 }} title="Move down">▼</button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={deleteDraft !== null}
        title="Delete style?"
        message={deleteDraft ? `Delete style "${deleteDraft.name}"?` : ''}
        danger
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteDraft) onStyleDelete(deleteDraft.id);
        }}
        onClose={() => setDeleteDraft(null)}
      />
    </div>
  );
}
