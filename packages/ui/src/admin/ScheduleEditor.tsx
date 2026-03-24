'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { VISIBILITY_CONDITIONS, type VisibilityCondition, type VisibilityRule } from '@zmanim-app/core';
import { ColorPicker } from '../shared/ColorPicker';
import type { ScheduleRecord as Schedule, DaveningGroupRecord as DaveningGroup, WeekExportFetcher } from './ScheduleImportExportPanel';

export type { WeekExportFetcher } from './ScheduleImportExportPanel';

export type ScheduleEditorTab = 'events' | 'table' | 'groups';

interface ScheduleEditorProps {
  schedules: Schedule[];
  onChange: (schedules: Schedule[]) => void;
  groups: DaveningGroup[];
  onGroupsChange?: (groups: DaveningGroup[]) => void;
  weekExportFetcher?: WeekExportFetcher;
  activeTab?: ScheduleEditorTab;
  onActiveTabChange?: (tab: ScheduleEditorTab) => void;
  embedded?: boolean;
  quickAddNonce?: number;
}

const TYPES = ['Shacharit', 'Mincha', 'Maariv', 'Other'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Shab'];
const DAYS_HE = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const ZMANIM = [
  { value: 'alos', label: 'Alos HaShachar' },
  { value: 'netz', label: 'Netz HaChama' },
  { value: 'sofZmanShma', label: 'Sof Zman Shma' },
  { value: 'chatzos', label: 'Chatzos' },
  { value: 'minchaGedola', label: 'Mincha Gedola' },
  { value: 'minchaKetana', label: 'Mincha Ketana' },
  { value: 'plag', label: 'Plag HaMincha' },
  { value: 'shkia', label: 'Shkia' },
  { value: 'tzeit', label: 'Tzeit HaKochavim' },
];
const ROUND_OPTIONS = [1, 5, 10, 15, 30, 60];

const TYPE_COLORS: Record<string, string> = {
  Shacharit: 'var(--adm-type-shacharit)',
  Mincha: 'var(--adm-type-mincha)',
  Maariv: 'var(--adm-type-maariv)',
  Other: 'var(--adm-type-other)',
};

type FilterMode = 'all' | 'ungrouped' | string;

type TriState = 'ignore' | 'show' | 'hide';

function triStateIcon(s: TriState): string {
  if (s === 'show') return '✓';
  if (s === 'hide') return '✗';
  return '—';
}

function cycleTriState(s: TriState): TriState {
  if (s === 'ignore') return 'show';
  if (s === 'show') return 'hide';
  return 'ignore';
}

function rulesToTriMap(rules: VisibilityRule[]): Record<string, TriState> {
  const m: Record<string, TriState> = {};
  for (const r of rules) {
    m[r.condition] = r.show ? 'show' : 'hide';
  }
  return m;
}

function triMapToRules(m: Record<string, TriState>): VisibilityRule[] {
  const rules: VisibilityRule[] = [];
  for (const [condition, state] of Object.entries(m)) {
    if (state === 'ignore') continue;
    rules.push({ condition: condition as VisibilityCondition, show: state === 'show' });
  }
  return rules;
}

export function ScheduleEditor({
  schedules,
  onChange,
  groups,
  onGroupsChange,
  embedded,
  quickAddNonce = 0,
}: ScheduleEditorProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingGroup, setEditingGroup] = useState<DaveningGroup | null>(null);
  const [bulkAction, setBulkAction] = useState<'copy' | 'move' | null>(null);
  const [bulkTargetGroup, setBulkTargetGroup] = useState('');
  const [showGroupPanel, setShowGroupPanel] = useState(false);

  const groupMap = useMemo(() => {
    const m = new Map<string, DaveningGroup>();
    groups.forEach((g) => m.set(g.id, g));
    return m;
  }, [groups]);

  const ungroupedCount = useMemo(() => schedules.filter((s) => !s.groupId).length, [schedules]);

  const filteredEvents = useMemo(() => {
    let result: Schedule[];
    if (filterMode === 'all') {
      result = [...schedules];
    } else if (filterMode === 'ungrouped') {
      result = schedules.filter((s) => !s.groupId);
    } else {
      result = schedules.filter((s) => s.groupId === filterMode);
    }
    return result.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [schedules, filterMode]);

  React.useEffect(() => {
    if (!quickAddNonce) return;
    addEvent(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickAddNonce]);

  const updateEvent = useCallback((id: string, patch: Partial<Schedule>) => {
    onChange(schedules.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, [schedules, onChange]);

  const addEvent = useCallback((placeholder = false) => {
    const newId = `sched-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const maxSort = filteredEvents.reduce((m, s) => Math.max(m, s.sortOrder ?? 0), 0);
    const groupId = filterMode !== 'all' && filterMode !== 'ungrouped' ? filterMode : undefined;
    const newEvent: Schedule = {
      id: newId,
      orgId: 'default',
      name: placeholder ? '' : 'New Event',
      type: 'Other',
      groupId,
      timeMode: 'fixed',
      fixedTime: '08:00',
      daysActive: [true, true, true, true, true, true, true],
      sortOrder: maxSort + 1,
      isPlaceholder: placeholder,
      placeholderLabel: placeholder ? '---' : undefined,
      priority: 0,
    };
    onChange([...schedules, newEvent]);
    setExpandedEventId(newId);
  }, [schedules, onChange, filteredEvents, filterMode]);

  const deleteEvent = useCallback((id: string) => {
    onChange(schedules.filter((s) => s.id !== id));
    if (expandedEventId === id) setExpandedEventId(null);
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }, [schedules, onChange, expandedEventId]);

  const moveEvent = useCallback((idx: number, dir: -1 | 1) => {
    const events = [...filteredEvents];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= events.length) return;
    const ids = events.map((e) => e.id);
    [ids[idx], ids[targetIdx]] = [ids[targetIdx], ids[idx]];
    const updated = schedules.map((s) => {
      const posInFiltered = ids.indexOf(s.id);
      if (posInFiltered >= 0) return { ...s, sortOrder: posInFiltered };
      return s;
    });
    onChange(updated);
  }, [filteredEvents, schedules, onChange]);

  const addGroup = useCallback(() => {
    if (!onGroupsChange) return;
    const id = `group-${Date.now()}`;
    const g: DaveningGroup = { id, name: 'New Group', nameHebrew: 'קבוצה חדשה', color: '#3b82f6', sortOrder: groups.length, active: true };
    onGroupsChange([...groups, g]);
    setFilterMode(id);
  }, [groups, onGroupsChange]);

  const deleteGroup = useCallback((id: string) => {
    if (!onGroupsChange) return;
    onGroupsChange(groups.filter((g) => g.id !== id));
    if (filterMode === id) setFilterMode('all');
  }, [groups, onGroupsChange, filterMode]);

  const updateGroup = useCallback((id: string, patch: Partial<DaveningGroup>) => {
    if (!onGroupsChange) return;
    onGroupsChange(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }, [groups, onGroupsChange]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const allFilteredIds = filteredEvents.filter((e) => !e.isPlaceholder).map((e) => e.id);
    const allSelected = allFilteredIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allFilteredIds));
    }
  }, [filteredEvents, selectedIds]);

  const executeBulkAction = useCallback(() => {
    if (!bulkAction || !bulkTargetGroup || selectedIds.size === 0) return;
    if (bulkAction === 'move') {
      const targetGroup = bulkTargetGroup === '__none__' ? undefined : bulkTargetGroup;
      onChange(schedules.map((s) => selectedIds.has(s.id) ? { ...s, groupId: targetGroup } : s));
    } else if (bulkAction === 'copy') {
      const copies: Schedule[] = [];
      const targetGroup = bulkTargetGroup === '__none__' ? undefined : bulkTargetGroup;
      const maxSort = schedules.reduce((m, s) => Math.max(m, s.sortOrder ?? 0), 0);
      let sortCounter = maxSort + 1;
      for (const id of selectedIds) {
        const original = schedules.find((s) => s.id === id);
        if (!original) continue;
        copies.push({ ...original, id: `sched-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, groupId: targetGroup, sortOrder: sortCounter++ });
      }
      onChange([...schedules, ...copies]);
    }
    setSelectedIds(new Set());
    setBulkAction(null);
    setBulkTargetGroup('');
  }, [bulkAction, bulkTargetGroup, selectedIds, schedules, onChange]);

  const getTimeDisplay = (ev: Schedule) => {
    if (ev.isPlaceholder) return ev.placeholderLabel || '— spacer —';
    if (ev.timeMode === 'dynamic') {
      const zman = ZMANIM.find((z) => z.value === ev.baseZman)?.label ?? ev.baseZman ?? '?';
      const off = ev.offset ?? 0;
      return `${zman} ${off > 0 ? '+' : ''}${off !== 0 ? `${off}m` : ''}`.trim();
    }
    return ev.fixedTime ?? '';
  };

  const getDaysShort = (ev: Schedule) => {
    if (!ev.daysActive) return 'All';
    const active = ev.daysActive.map((d, i) => d ? DAYS_HE[i] : null).filter(Boolean);
    if (active.length === 7) return 'All';
    if (active.length === 0) return 'None';
    return active.join('');
  };

  const getGroupName = (groupId?: string) => {
    if (!groupId) return '';
    const g = groupMap.get(groupId);
    return g ? g.nameHebrew : '';
  };

  return (
    <div className="adm-schedEditor">
      {/* Top toolbar */}
      <div className="adm-schedToolbar">
        <div className="adm-schedFilters">
          <FilterChip label={`All (${schedules.length})`} active={filterMode === 'all'} color="var(--adm-type-other)" onClick={() => setFilterMode('all')} />
          {ungroupedCount > 0 && (
            <FilterChip label={`Ungrouped (${ungroupedCount})`} active={filterMode === 'ungrouped'} color="var(--adm-danger)" onClick={() => setFilterMode('ungrouped')} />
          )}
          {groups.map((g) => (
            <FilterChip key={g.id} label={`${g.nameHebrew} (${schedules.filter((s) => s.groupId === g.id).length})`} active={filterMode === g.id} color={g.color} onClick={() => setFilterMode(g.id)} />
          ))}
        </div>
        <div className="adm-schedActions">
          <button type="button" className="adm-btnSmallOutline" onClick={() => setShowGroupPanel(!showGroupPanel)}>
            {showGroupPanel ? 'Hide Groups' : 'Groups'} ({groups.length})
          </button>
          <button type="button" className="adm-btnSmallOutline" style={{ color: 'var(--adm-accent)' }} onClick={() => addEvent(false)}>+ Event</button>
          <button type="button" className="adm-btnSmallOutline" onClick={() => addEvent(true)}>+ Spacer</button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="adm-schedBulkBar">
          <strong style={{ color: 'var(--adm-text)', fontSize: 12 }}>{selectedIds.size} selected</strong>
          <button type="button" className="adm-linkBtn" style={{ fontSize: 11, color: 'var(--adm-accent)' }} onClick={() => setSelectedIds(new Set())}>Clear</button>
          <select className="adm-schedBulkSelect" value={bulkAction ?? ''} onChange={(e) => setBulkAction(e.target.value as any || null)}>
            <option value="">Action...</option>
            <option value="copy">Copy to group</option>
            <option value="move">Move to group</option>
          </select>
          {bulkAction && (
            <>
              <select className="adm-schedBulkSelect" value={bulkTargetGroup} onChange={(e) => setBulkTargetGroup(e.target.value)}>
                <option value="">Select group...</option>
                <option value="__none__">No group</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.nameHebrew} ({g.name})</option>)}
              </select>
              <button type="button" className="adm-schedBulkApply" onClick={executeBulkAction} disabled={!bulkTargetGroup}>Apply</button>
            </>
          )}
          <button type="button" className="adm-dangerLink" style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600 }} onClick={() => {
            onChange(schedules.filter((s) => !selectedIds.has(s.id)));
            setSelectedIds(new Set());
            setExpandedEventId(null);
          }}>Delete selected</button>
        </div>
      )}

      {/* Groups panel (collapsible) */}
      {showGroupPanel && (
        <div className="adm-schedGroupPanel">
          <div className="adm-schedGroupPanelTitle">Groups</div>
          {groups.map((g) => (
            <div key={g.id} className="adm-schedGroupRow">
              <span className="adm-schedGroupDot" style={{ backgroundColor: g.color }} />
              {editingGroup?.id === g.id ? (
                <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input value={editingGroup.name} onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })} placeholder="English" className="adm-input" style={{ width: 100, flex: '0 1 100px' }} />
                  <input value={editingGroup.nameHebrew} onChange={(e) => setEditingGroup({ ...editingGroup, nameHebrew: e.target.value })} placeholder="עברית" className="adm-input" style={{ width: 100, flex: '0 1 100px' }} />
                  <ColorPicker variant="swatch-only" value={editingGroup.color} onChange={(v) => setEditingGroup({ ...editingGroup, color: v })} swatchClassName="adm-schedColorSwatch" />
                  <button onClick={() => { updateGroup(g.id, editingGroup); setEditingGroup(null); }} className="adm-btnSmallSave">Save</button>
                  <button onClick={() => setEditingGroup(null)} className="adm-btnSmallOutline">Cancel</button>
                </div>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--adm-text)' }}>
                    <strong>{g.nameHebrew}</strong> <span style={{ color: 'var(--adm-text-muted)' }}>({g.name}) — {schedules.filter((s) => s.groupId === g.id).length} events</span>
                  </span>
                  <button onClick={() => setEditingGroup({ ...g })} className="adm-btnSmallOutline" style={{ fontSize: 10, padding: '2px 6px' }}>Edit</button>
                  <button onClick={() => deleteGroup(g.id)} className="adm-btnSmallDanger" style={{ fontSize: 10, padding: '2px 6px' }}>×</button>
                </>
              )}
            </div>
          ))}
          <button type="button" onClick={addGroup} className="adm-btnSmallOutline" style={{ width: '100%', marginTop: 4, color: 'var(--adm-accent)', fontSize: 11 }}>+ Add Group</button>
        </div>
      )}

      {/* Event list with inline expansion */}
      <div className="adm-schedList">
        {/* Header row */}
        <div className="adm-schedHeaderRow">
          <span className="adm-schedCellCheck">
            <input type="checkbox" checked={filteredEvents.filter((e) => !e.isPlaceholder).length > 0 && filteredEvents.filter((e) => !e.isPlaceholder).every((e) => selectedIds.has(e.id))} onChange={toggleSelectAll} />
          </span>
          <span className="adm-schedCellName">Name</span>
          <span className="adm-schedCellType">Type</span>
          <span className="adm-schedCellTime">Time</span>
          <span className="adm-schedCellDays">Days</span>
          <span className="adm-schedCellGroup">Group</span>
          <span className="adm-schedCellPri">Pri</span>
          <span className="adm-schedCellActions" />
        </div>

        {filteredEvents.length === 0 && (
          <div className="adm-schedEmpty">
            {embedded ? 'No events yet. Use + Event above or + Add in the section header.' : 'No events yet. Click + Event to create one.'}
          </div>
        )}

        {filteredEvents.map((ev, idx) => {
          const isExpanded = expandedEventId === ev.id;
          const isChecked = selectedIds.has(ev.id);

          if (ev.isPlaceholder) {
            return (
              <div key={ev.id} className={`adm-schedRow adm-schedRow--spacer ${isExpanded ? 'adm-schedRow--expanded' : ''}`}>
                <div className="adm-schedRowSummary" onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}>
                  <span className="adm-schedCellCheck" />
                  <span className="adm-schedCellName" style={{ fontStyle: 'italic', color: 'var(--adm-text-muted)' }}>{ev.placeholderLabel || '— spacer —'}</span>
                  <span className="adm-schedCellType" />
                  <span className="adm-schedCellTime" />
                  <span className="adm-schedCellDays" />
                  <span className="adm-schedCellGroup" />
                  <span className="adm-schedCellPri" />
                  <span className="adm-schedCellActions">
                    <button type="button" onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }} className="adm-schedDeleteBtn">×</button>
                  </span>
                </div>
                {isExpanded && (
                  <div className="adm-schedInlineEdit">
                    <InlineField label="Label">
                      <input value={ev.placeholderLabel ?? ''} onChange={(e) => updateEvent(ev.id, { placeholderLabel: e.target.value })} placeholder="e.g. --- or section name" className="adm-input" style={{ maxWidth: 200 }} />
                    </InlineField>
                    <InlineField label="Group">
                      <select value={ev.groupId ?? ''} onChange={(e) => updateEvent(ev.id, { groupId: e.target.value || undefined })} className="adm-select" style={{ maxWidth: 180 }}>
                        <option value="">None</option>
                        {groups.map((g) => <option key={g.id} value={g.id}>{g.nameHebrew}</option>)}
                      </select>
                    </InlineField>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={ev.id} className={`adm-schedRow ${isExpanded ? 'adm-schedRow--expanded' : ''} ${isChecked ? 'adm-schedRow--checked' : ''} ${idx % 2 === 0 ? '' : 'adm-schedRow--alt'}`}>
              {/* Summary row */}
              <div className="adm-schedRowSummary" onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}>
                <span className="adm-schedCellCheck" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(ev.id)} />
                </span>
                <span className="adm-schedCellName">
                  <span className="adm-schedTypeDot" style={{ backgroundColor: TYPE_COLORS[ev.type] ?? 'var(--adm-type-other)' }} />
                  {ev.name}
                </span>
                <span className="adm-schedCellType">{ev.type}</span>
                <span className="adm-schedCellTime">{getTimeDisplay(ev)}</span>
                <span className="adm-schedCellDays">{getDaysShort(ev)}</span>
                <span className="adm-schedCellGroup">
                  {ev.groupId && (
                    <span className="adm-schedGroupPill" style={{ borderColor: groupMap.get(ev.groupId)?.color ?? 'var(--adm-border)', color: groupMap.get(ev.groupId)?.color ?? 'var(--adm-text-muted)' }}>
                      {getGroupName(ev.groupId)}
                    </span>
                  )}
                </span>
                <span className="adm-schedCellPri">{ev.priority ?? 0}</span>
                <span className="adm-schedCellActions">
                  <button type="button" onClick={(e) => { e.stopPropagation(); moveEvent(idx, -1); }} className="adm-schedMoveBtn" title="Move up">▲</button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); moveEvent(idx, 1); }} className="adm-schedMoveBtn" title="Move down">▼</button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }} className="adm-schedDeleteBtn" title="Delete">×</button>
                </span>
              </div>

              {/* Inline expanded editor */}
              {isExpanded && (
                <InlineEventEditor
                  ev={ev}
                  groups={groups}
                  onUpdate={(patch) => updateEvent(ev.id, patch)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Inline Event Editor (compact, BeeZee-inspired) ─── */

function InlineEventEditor({ ev, groups, onUpdate }: { ev: Schedule; groups: DaveningGroup[]; onUpdate: (patch: Partial<Schedule>) => void }) {
  const triMap = useMemo(() => rulesToTriMap(ev.visibilityRules ?? []), [ev.visibilityRules]);

  const setTriState = useCallback((condition: string, state: TriState) => {
    const next = { ...triMap, [condition]: state };
    onUpdate({ visibilityRules: triMapToRules(next) });
  }, [triMap, onUpdate]);

  return (
    <div className="adm-schedInlineEdit">
      {/* Row 1: Core fields */}
      <div className="adm-schedEditRow">
        <InlineField label="Name">
          <input value={ev.name} onChange={(e) => onUpdate({ name: e.target.value })} className="adm-input" style={{ maxWidth: 180 }} />
        </InlineField>
        <InlineField label="Type">
          <select value={ev.type} onChange={(e) => onUpdate({ type: e.target.value })} className="adm-select" style={{ maxWidth: 120 }}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </InlineField>
        <InlineField label="Group">
          <select value={ev.groupId ?? ''} onChange={(e) => onUpdate({ groupId: e.target.value || undefined })} className="adm-select" style={{ maxWidth: 150 }}>
            <option value="">None</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.nameHebrew} ({g.name})</option>)}
          </select>
        </InlineField>
        <InlineField label="Room">
          <input value={ev.room ?? ''} onChange={(e) => onUpdate({ room: e.target.value })} className="adm-input" style={{ maxWidth: 100 }} />
        </InlineField>
        <InlineField label="Priority">
          <input type="number" value={ev.priority ?? 0} onChange={(e) => onUpdate({ priority: parseInt(e.target.value) || 0 })} className="adm-input" style={{ maxWidth: 60 }} title="Higher priority overrides lower. 0 = default." />
        </InlineField>
      </div>

      {/* Row 2: Time configuration */}
      <div className="adm-schedEditRow">
        <InlineField label="Time">
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <select value={ev.timeMode ?? 'fixed'} onChange={(e) => onUpdate({ timeMode: e.target.value as any })} className="adm-select" style={{ maxWidth: 90 }}>
              <option value="fixed">Fixed</option>
              <option value="dynamic">Dynamic</option>
            </select>
            {(ev.timeMode ?? 'fixed') === 'fixed' ? (
              <input type="time" value={ev.fixedTime ?? ''} onChange={(e) => onUpdate({ fixedTime: e.target.value })} className="adm-input" style={{ maxWidth: 100 }} />
            ) : (
              <>
                <select value={ev.baseZman ?? ''} onChange={(e) => onUpdate({ baseZman: e.target.value })} className="adm-select" style={{ maxWidth: 140 }}>
                  <option value="">Zman...</option>
                  {ZMANIM.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
                </select>
                <input type="number" value={ev.offset ?? 0} onChange={(e) => onUpdate({ offset: parseInt(e.target.value) || 0 })} className="adm-input" style={{ maxWidth: 55 }} title="Offset (min)" placeholder="±min" />
              </>
            )}
          </div>
        </InlineField>
        {(ev.timeMode ?? 'fixed') === 'dynamic' && (
          <>
            <InlineField label="Round">
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <select value={ev.roundTo ?? 1} onChange={(e) => onUpdate({ roundTo: parseInt(e.target.value) })} className="adm-select" style={{ maxWidth: 65 }}>
                  {ROUND_OPTIONS.map((r) => <option key={r} value={r}>{r}m</option>)}
                </select>
                <select value={ev.roundMode ?? 'nearest'} onChange={(e) => onUpdate({ roundMode: e.target.value as any })} className="adm-select" style={{ maxWidth: 80 }}>
                  <option value="nearest">Nearest</option>
                  <option value="before">Before</option>
                  <option value="after">After</option>
                </select>
              </div>
            </InlineField>
            <InlineField label="Refresh">
              <select value={ev.refreshMode ?? 'daily'} onChange={(e) => onUpdate({ refreshMode: e.target.value as any })} className="adm-select" style={{ maxWidth: 90 }}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </InlineField>
          </>
        )}
        <InlineField label="Earliest">
          <input type="time" value={ev.limitBefore ?? ''} onChange={(e) => onUpdate({ limitBefore: e.target.value || undefined })} className="adm-input" style={{ maxWidth: 90 }} />
        </InlineField>
        <InlineField label="Latest">
          <input type="time" value={ev.limitAfter ?? ''} onChange={(e) => onUpdate({ limitAfter: e.target.value || undefined })} className="adm-input" style={{ maxWidth: 90 }} />
        </InlineField>
        <InlineField label="Duration">
          <input type="number" value={ev.durationMinutes ?? ''} onChange={(e) => onUpdate({ durationMinutes: parseInt(e.target.value) || undefined })} placeholder="min" className="adm-input" style={{ maxWidth: 55 }} />
        </InlineField>
      </div>

      {/* Row 3: Active days + Nearest event */}
      <div className="adm-schedEditRow">
        <InlineField label="Active Days">
          <div className="adm-schedDayGrid">
            {DAYS.map((d, i) => {
              const active = ev.daysActive?.[i] ?? true;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    const days = [...(ev.daysActive ?? [true, true, true, true, true, true, true])];
                    days[i] = !days[i];
                    onUpdate({ daysActive: days });
                  }}
                  className={`adm-schedDayBtn ${active ? 'adm-schedDayBtn--on' : ''}`}
                  title={d}
                >
                  {DAYS_HE[i]}
                </button>
              );
            })}
          </div>
        </InlineField>
        <InlineField label="Nearest Event">
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--adm-text)', cursor: 'pointer' }}>
              <input type="checkbox" checked={ev.nearestEvent ?? false} onChange={(e) => onUpdate({ nearestEvent: e.target.checked })} />
              On
            </label>
            {ev.nearestEvent && (
              <>
                <input type="number" value={ev.nearestBefore ?? 10} onChange={(e) => onUpdate({ nearestBefore: parseInt(e.target.value) || 0 })} className="adm-input" style={{ maxWidth: 45 }} title="Minutes before" />
                <span style={{ fontSize: 10, color: 'var(--adm-text-muted)' }}>before</span>
                <input type="number" value={ev.nearestAfter ?? 5} onChange={(e) => onUpdate({ nearestAfter: parseInt(e.target.value) || 0 })} className="adm-input" style={{ maxWidth: 45 }} title="Minutes after" />
                <span style={{ fontSize: 10, color: 'var(--adm-text-muted)' }}>after</span>
              </>
            )}
          </div>
        </InlineField>
      </div>

      {/* Row 4: Display conditions (tri-state checkboxes) */}
      <div className="adm-schedEditRow">
        <InlineField label="Display Conditions">
          <div className="adm-schedTriGrid">
            {VISIBILITY_CONDITIONS.map((vc) => {
              const state = triMap[vc.value] ?? 'ignore';
              return (
                <button
                  key={vc.value}
                  type="button"
                  className={`adm-schedTriBtn adm-schedTriBtn--${state}`}
                  onClick={() => setTriState(vc.value, cycleTriState(state))}
                  title={`${vc.label}: ${state === 'ignore' ? 'No rule (—)' : state === 'show' ? 'Show only (✓)' : 'Hide (✗)'}\nClick to cycle: — → ✓ → ✗ → —`}
                >
                  <span className="adm-schedTriIcon">{triStateIcon(state)}</span>
                  <span className="adm-schedTriLabel">{vc.labelHe}</span>
                </button>
              );
            })}
          </div>
        </InlineField>
      </div>

      {/* Row 5: Date ranges */}
      <div className="adm-schedEditRow">
        <InlineField label="Date Range (Gregorian)">
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input type="date" value={ev.startDateGregorian ?? ''} onChange={(e) => onUpdate({ startDateGregorian: e.target.value || undefined })} className="adm-input" style={{ maxWidth: 130 }} />
            <span style={{ fontSize: 10, color: 'var(--adm-text-muted)' }}>to</span>
            <input type="date" value={ev.endDateGregorian ?? ''} onChange={(e) => onUpdate({ endDateGregorian: e.target.value || undefined })} className="adm-input" style={{ maxWidth: 130 }} />
          </div>
        </InlineField>
        <InlineField label="Date Range (Hebrew)">
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input value={ev.startDateHebrew ?? ''} onChange={(e) => onUpdate({ startDateHebrew: e.target.value || undefined })} placeholder="e.g. 1 Tishrei" className="adm-input" style={{ maxWidth: 100 }} />
            <span style={{ fontSize: 10, color: 'var(--adm-text-muted)' }}>to</span>
            <input value={ev.endDateHebrew ?? ''} onChange={(e) => onUpdate({ endDateHebrew: e.target.value || undefined })} placeholder="e.g. 10 Tishrei" className="adm-input" style={{ maxWidth: 100 }} />
          </div>
        </InlineField>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function FilterChip({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`adm-schedFilterChip ${active ? 'adm-schedFilterChip--active' : ''}`}
      style={active ? { borderColor: color, color, backgroundColor: `color-mix(in srgb, ${color} 10%, var(--adm-bg))` } : undefined}
    >
      {label}
    </button>
  );
}

function InlineField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="adm-schedInlineField">
      <label className="adm-schedInlineLabel">{label}</label>
      {children}
    </div>
  );
}
