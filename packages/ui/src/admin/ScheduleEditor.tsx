'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { VISIBILITY_CONDITIONS, type VisibilityCondition, type VisibilityRule } from '@zmanim-app/core';
import { ColorPicker } from '../shared/ColorPicker';
import {
  generateGroupsSampleCsv, generateEventsSampleCsv,
  parseGroupsCsv, parseEventsCsv,
  exportGroupsCsv, exportEventsCsv,
  downloadCsv, readFileAsText,
  type CsvGroup, type CsvSchedule,
} from '../shared/csvImportExport';
import {
  type WeeklyExportConfig, type WeekData,
  buildWeeklyExportCsv, getNextDayOfWeek, formatDateDisplay, formatDateYMD,
} from '../shared/weeklyExport';

interface Schedule {
  id: string;
  orgId: string;
  name: string;
  type: string;
  groupId?: string;
  timeMode?: 'fixed' | 'dynamic';
  fixedTime?: string;
  baseZman?: string;
  offset?: number;
  roundTo?: number;
  roundMode?: 'nearest' | 'before' | 'after';
  limitBefore?: string;
  limitAfter?: string;
  refreshMode?: 'daily' | 'weekly' | 'monthly';
  refreshAnchorDay?: number;
  durationMinutes?: number;
  daysActive?: boolean[];
  visibilityRules?: VisibilityRule[];
  room?: string;
  sortOrder?: number;
  isPlaceholder?: boolean;
  placeholderLabel?: string;
}

interface DaveningGroup {
  id: string;
  name: string;
  nameHebrew: string;
  color: string;
  sortOrder: number;
  active: boolean;
}

export interface WeekExportFetcher {
  /** Fetch zmanim for a date, return array with { type, time } */
  fetchZmanim: (date: Date) => Promise<Array<{ type: string; time: Date | null; label: string; hebrewLabel: string }>>;
  /** Fetch calendar info for a date, return { parsha: { upcoming, upcomingHebrew } } */
  fetchCalendar: (date: Date) => Promise<{ parsha?: { upcoming?: string; upcomingHebrew?: string; parsha?: string; parshaHebrew?: string } }>;
}

export type ScheduleEditorTab = 'events' | 'table' | 'groups' | 'import';

interface ScheduleEditorProps {
  schedules: Schedule[];
  onChange: (schedules: Schedule[]) => void;
  groups: DaveningGroup[];
  onGroupsChange?: (groups: DaveningGroup[]) => void;
  /** Optional: enables multi-week export when provided */
  weekExportFetcher?: WeekExportFetcher;
  /** Controlled tab (e.g. tutorial navigation). When omitted, tab is internal. */
  activeTab?: ScheduleEditorTab;
  onActiveTabChange?: (tab: ScheduleEditorTab) => void;
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

export function ScheduleEditor({
  schedules,
  onChange,
  groups,
  onGroupsChange,
  weekExportFetcher,
  activeTab: activeTabProp,
  onActiveTabChange,
}: ScheduleEditorProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [internalTab, setInternalTab] = useState<ScheduleEditorTab>('events');
  const tab = activeTabProp ?? internalTab;
  const setTab = useCallback(
    (t: ScheduleEditorTab) => {
      onActiveTabChange?.(t);
      if (activeTabProp === undefined) setInternalTab(t);
    },
    [activeTabProp, onActiveTabChange],
  );
  const [editingGroup, setEditingGroup] = useState<DaveningGroup | null>(null);
  const [bulkAction, setBulkAction] = useState<'copy' | 'move' | null>(null);
  const [bulkTargetGroup, setBulkTargetGroup] = useState('');
  const [tableSortCol, setTableSortCol] = useState<string>('name');
  const [tableSortDir, setTableSortDir] = useState<'asc' | 'desc'>('asc');

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

  const selectedEvent = schedules.find((s) => s.id === selectedEventId) ?? null;

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
    };
    onChange([...schedules, newEvent]);
    setSelectedEventId(newId);
  }, [schedules, onChange, filteredEvents, filterMode]);

  const deleteEvent = useCallback((id: string) => {
    onChange(schedules.filter((s) => s.id !== id));
    if (selectedEventId === id) setSelectedEventId(null);
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }, [schedules, onChange, selectedEventId]);

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

  const toggleSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
      onChange(schedules.map((s) =>
        selectedIds.has(s.id) ? { ...s, groupId: targetGroup } : s
      ));
    } else if (bulkAction === 'copy') {
      const copies: Schedule[] = [];
      const targetGroup = bulkTargetGroup === '__none__' ? undefined : bulkTargetGroup;
      const maxSort = schedules.reduce((m, s) => Math.max(m, s.sortOrder ?? 0), 0);
      let sortCounter = maxSort + 1;
      for (const id of selectedIds) {
        const original = schedules.find((s) => s.id === id);
        if (!original) continue;
        copies.push({
          ...original,
          id: `sched-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          groupId: targetGroup,
          sortOrder: sortCounter++,
        });
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

  const getGroupName = (groupId?: string) => {
    if (!groupId) return '—';
    const g = groupMap.get(groupId);
    return g ? g.nameHebrew : groupId;
  };

  const getDaysDisplay = (ev: Schedule) => {
    if (!ev.daysActive) return 'All';
    const active = ev.daysActive.map((d, i) => d ? DAYS_HE[i] : null).filter(Boolean);
    if (active.length === 7) return 'All';
    if (active.length === 0) return 'None';
    return active.join(' ');
  };

  const tableSorted = useMemo(() => {
    const items = [...filteredEvents];
    items.sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      switch (tableSortCol) {
        case 'name': va = a.name; vb = b.name; break;
        case 'type': va = a.type; vb = b.type; break;
        case 'group': va = getGroupName(a.groupId); vb = getGroupName(b.groupId); break;
        case 'time': va = getTimeDisplay(a); vb = getTimeDisplay(b); break;
        case 'room': va = a.room ?? ''; vb = b.room ?? ''; break;
        case 'days': va = getDaysDisplay(a); vb = getDaysDisplay(b); break;
        default: va = a.sortOrder ?? 0; vb = b.sortOrder ?? 0;
      }
      if (typeof va === 'string' && typeof vb === 'string') {
        return tableSortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return tableSortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return items;
  }, [filteredEvents, tableSortCol, tableSortDir]);

  const handleTableSort = (col: string) => {
    if (tableSortCol === col) {
      setTableSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setTableSortCol(col);
      setTableSortDir('asc');
    }
  };

  return (
    <div className="adm-schedRoot">
      {/* Tab bar */}
      <div className="adm-tabBar" data-tutorial="sched-tab-bar">
        <button
          type="button"
          data-tutorial="sched-tab-events"
          onClick={() => setTab('events')}
          className={tab === 'events' ? "adm-tabActive" : "adm-tab"}
        >
          Davening Times
        </button>
        <button type="button" onClick={() => setTab('table')} className={tab === 'table' ? "adm-tabActive" : "adm-tab"}>
          All Events ({schedules.length})
        </button>
        <button
          type="button"
          data-tutorial="sched-tab-groups"
          onClick={() => setTab('groups')}
          className={tab === 'groups' ? "adm-tabActive" : "adm-tab"}
        >
          Groups ({groups.length})
        </button>
        <button type="button" onClick={() => setTab('import')} className={tab === 'import' ? "adm-tabActive" : "adm-tab"}>
          Import / Export
        </button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (tab === 'events' || tab === 'table') && (
        <div className="adm-schedBulkBar">
          <strong className="adm-schedBulkStrong">{selectedIds.size} selected</strong>
          <button type="button" className="adm-linkBtn" style={{ fontSize: 12 }} onClick={() => setSelectedIds(new Set())}>
            Clear
          </button>
          <span style={{ color: 'var(--adm-sched-bulk-muted)' }}>|</span>
          <select
            className="adm-schedBulkSelect"
            value={bulkAction ?? ''}
            onChange={(e) => setBulkAction(e.target.value as 'copy' | 'move' | null)}
          >
            <option value="">Action...</option>
            <option value="copy">Copy to group</option>
            <option value="move">Move to group</option>
          </select>
          {bulkAction && (
            <>
              <select className="adm-schedBulkSelect" value={bulkTargetGroup} onChange={(e) => setBulkTargetGroup(e.target.value)}>
                <option value="">Select group...</option>
                <option value="__none__">No group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.nameHebrew} ({g.name})</option>
                ))}
              </select>
              <button type="button" className="adm-schedBulkApply" onClick={executeBulkAction} disabled={!bulkTargetGroup}>
                Apply
              </button>
            </>
          )}
          <button
            type="button"
            className="adm-dangerLink adm-mlAuto"
            style={{ fontSize: 12, fontWeight: 600 }}
            onClick={() => {
              onChange(schedules.filter((s) => !selectedIds.has(s.id)));
              setSelectedIds(new Set());
              setSelectedEventId(null);
            }}
          >
            Delete selected
          </button>
        </div>
      )}

      {/* ─── GROUPS TAB ─── */}
      {tab === 'groups' && (
        <div style={{ padding: '0 4px' }}>
          {groups.map((g) => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 6, borderRadius: 6, border: '1px solid #e5e7eb', background: editingGroup?.id === g.id ? '#f0f9ff' : '#fff' }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: g.color, flexShrink: 0 }} />
              {editingGroup?.id === g.id ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <input value={editingGroup.name} onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })} placeholder="English name" className="adm-input" />
                  <input value={editingGroup.nameHebrew} onChange={(e) => setEditingGroup({ ...editingGroup, nameHebrew: e.target.value })} placeholder="Hebrew name" className="adm-input" />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <ColorPicker
                      variant="swatch-only"
                      value={editingGroup.color}
                      onChange={(v) => setEditingGroup({ ...editingGroup, color: v })}
                      swatchClassName="adm-schedColorSwatch"
                    />
                    <button onClick={() => { updateGroup(g.id, editingGroup); setEditingGroup(null); }} className="adm-btnSmallSave">Save</button>
                    <button onClick={() => setEditingGroup(null)} className="adm-btnSmallOutline">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{g.nameHebrew}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{g.name} — {schedules.filter((s) => s.groupId === g.id).length} events</div>
                  </div>
                  <button onClick={() => setEditingGroup({ ...g })} className="adm-btnSmallOutline">Edit</button>
                  <button onClick={() => deleteGroup(g.id)} className="adm-btnSmallDanger">×</button>
                </>
              )}
            </div>
          ))}
          <button
            type="button"
            data-tutorial="sched-add-group"
            onClick={addGroup}
            className="adm-btnSmallOutline"
            style={{ width: '100%', marginTop: 8, color: 'var(--adm-accent)' }}
          >
            + Add Group
          </button>
        </div>
      )}

      {/* ─── TABLE VIEW TAB ─── */}
      {tab === 'table' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '0 4px' }}>
          {/* Filter chips for table too */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10, marginTop: 8 }}>
            <FilterChip
              label={`All (${schedules.length})`}
              active={filterMode === 'all'}
              color="#475569"
              onClick={() => setFilterMode('all')}
            />
            {ungroupedCount > 0 && (
              <FilterChip
                label={`Ungrouped (${ungroupedCount})`}
                active={filterMode === 'ungrouped'}
                color="#ef4444"
                onClick={() => setFilterMode('ungrouped')}
              />
            )}
            {groups.map((g) => (
              <FilterChip
                key={g.id}
                label={`${g.nameHebrew} (${schedules.filter((s) => s.groupId === g.id).length})`}
                active={filterMode === g.id}
                color={g.color}
                onClick={() => setFilterMode(g.id)}
              />
            ))}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={thStyle}>
                  <input
                    type="checkbox"
                    checked={filteredEvents.filter((e) => !e.isPlaceholder).length > 0 && filteredEvents.filter((e) => !e.isPlaceholder).every((e) => selectedIds.has(e.id))}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <ThSortable col="name" label="Name" current={tableSortCol} dir={tableSortDir} onClick={handleTableSort} />
                <ThSortable col="type" label="Type" current={tableSortCol} dir={tableSortDir} onClick={handleTableSort} />
                <ThSortable col="group" label="Group" current={tableSortCol} dir={tableSortDir} onClick={handleTableSort} />
                <ThSortable col="time" label="Time" current={tableSortCol} dir={tableSortDir} onClick={handleTableSort} />
                <ThSortable col="room" label="Room" current={tableSortCol} dir={tableSortDir} onClick={handleTableSort} />
                <ThSortable col="days" label="Days" current={tableSortCol} dir={tableSortDir} onClick={handleTableSort} />
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableSorted.map((ev, idx) => {
                const isSelected = selectedIds.has(ev.id);
                return (
                  <tr
                    key={ev.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: isSelected ? '#eff6ff' : (idx % 2 === 0 ? '#fff' : '#f9fafb'),
                      cursor: 'pointer',
                    }}
                    onClick={() => { setSelectedEventId(ev.id); setTab('events'); }}
                  >
                    <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      {!ev.isPlaceholder && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedIds((prev) => {
                              const n = new Set(prev);
                              if (n.has(ev.id)) n.delete(ev.id); else n.add(ev.id);
                              return n;
                            });
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: TYPE_COLORS[ev.type] ?? 'var(--adm-type-other)', flexShrink: 0 }} />
                        <span style={{ fontWeight: 500, ...(ev.isPlaceholder ? { fontStyle: 'italic', color: '#94a3b8' } : {}) }}>
                          {ev.isPlaceholder ? (ev.placeholderLabel || '— spacer —') : ev.name}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>{ev.isPlaceholder ? '' : ev.type}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                        background: ev.groupId
                          ? `${groupMap.get(ev.groupId)?.color ?? '#64748b'}20`
                          : 'var(--adm-sched-ungrouped-pill-bg)',
                        color: ev.groupId ? (groupMap.get(ev.groupId)?.color ?? 'var(--adm-type-other)') : 'var(--adm-danger)',
                      }}>
                        {getGroupName(ev.groupId)}
                      </span>
                    </td>
                    <td style={tdStyle}>{getTimeDisplay(ev)}</td>
                    <td style={tdStyle}>{ev.room ?? ''}</td>
                    <td style={tdStyle}>{ev.isPlaceholder ? '' : getDaysDisplay(ev)}</td>
                    <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => deleteEvent(ev.id)}
                        style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {tableSorted.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: 24 }}>
                    No events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── EVENTS TAB (list + detail) ─── */}
      {tab === 'events' && (
        <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
          {/* Left: Group chips + event list */}
          <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e5e7eb', paddingRight: 12 }}>
            {/* Filter chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              <FilterChip
                label={`All (${schedules.length})`}
                active={filterMode === 'all'}
                color="#475569"
                onClick={() => { setFilterMode('all'); setSelectedEventId(null); }}
              />
              {ungroupedCount > 0 && (
                <FilterChip
                  label={`Ungrouped (${ungroupedCount})`}
                  active={filterMode === 'ungrouped'}
                  color="#ef4444"
                  onClick={() => { setFilterMode('ungrouped'); setSelectedEventId(null); }}
                />
              )}
              {groups.map((g) => (
                <FilterChip
                  key={g.id}
                  label={g.nameHebrew}
                  active={filterMode === g.id}
                  color={g.color}
                  onClick={() => { setFilterMode(g.id); setSelectedEventId(null); }}
                />
              ))}
            </div>

            {/* Event list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredEvents.map((ev, idx) => {
                const isSel = ev.id === selectedEventId;
                const isChecked = selectedIds.has(ev.id);
                const firstRealIdx = filteredEvents.findIndex((e) => !e.isPlaceholder);
                const isFirstReal = idx === firstRealIdx && !ev.isPlaceholder;
                if (ev.isPlaceholder) {
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEventId(ev.id)}
                      style={{
                        padding: '4px 8px', marginBottom: 2, borderRadius: 4, cursor: 'pointer',
                        border: isSel ? '1px solid #60a5fa' : '1px dashed #d1d5db',
                        backgroundColor: isSel ? '#eff6ff' : '#fafafa',
                        textAlign: 'center', fontSize: 11, color: '#94a3b8',
                      }}
                    >
                      {ev.placeholderLabel || '— spacer —'}
                    </div>
                  );
                }
                return (
                  <div
                    key={ev.id}
                    data-tutorial={isFirstReal ? 'sched-first-event-row' : undefined}
                    onClick={() => setSelectedEventId(ev.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', marginBottom: 2,
                      borderRadius: 4, cursor: 'pointer',
                      border: isSel ? '1px solid #60a5fa' : '1px solid transparent',
                      backgroundColor: isChecked ? '#dbeafe' : (isSel ? '#eff6ff' : (idx % 2 === 0 ? '#fff' : '#f9fafb')),
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => toggleSelect(ev.id, e as any)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: TYPE_COLORS[ev.type] ?? 'var(--adm-type-other)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{ev.name}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>
                        {getTimeDisplay(ev)}
                        {filterMode === 'all' && ev.groupId && (
                          <span style={{ marginLeft: 4, color: groupMap.get(ev.groupId)?.color ?? 'var(--adm-type-other)' }}>
                            [{groupMap.get(ev.groupId)?.nameHebrew ?? ''}]
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <button onClick={(e) => { e.stopPropagation(); moveEvent(idx, -1); }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 10, color: '#94a3b8', padding: 0, lineHeight: 1 }}>▲</button>
                      <button onClick={(e) => { e.stopPropagation(); moveEvent(idx, 1); }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 10, color: '#94a3b8', padding: 0, lineHeight: 1 }}>▼</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add buttons */}
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }} data-tutorial="sched-add-event-wrap">
              <button
                type="button"
                data-tutorial="sched-add-event"
                onClick={() => addEvent(false)}
                className="adm-btnSmallOutline"
                style={{ flex: 1, color: 'var(--adm-accent)' }}
              >
                + Event
              </button>
              <button type="button" onClick={() => addEvent(true)} className="adm-btnSmallOutline" style={{ flex: 1 }}>
                + Spacer
              </button>
            </div>
          </div>

          {/* Right: Detail panel */}
          <div data-tutorial="sched-event-detail" style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
            {!selectedEvent ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 14 }}>
                Select an event to edit
              </div>
            ) : selectedEvent.isPlaceholder ? (
              <div>
                <SectionHeader title="Spacer / Divider" />
                <FormRow label="Label">
                  <input value={selectedEvent.placeholderLabel ?? ''} onChange={(e) => updateEvent(selectedEvent.id, { placeholderLabel: e.target.value })} placeholder="e.g. --- or section name" className="adm-input" />
                </FormRow>
                <FormRow label="Group">
                  <select value={selectedEvent.groupId ?? ''} onChange={(e) => updateEvent(selectedEvent.id, { groupId: e.target.value || undefined })} className="adm-select">
                    <option value="">None</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.nameHebrew} ({g.name})</option>)}
                  </select>
                </FormRow>
                <div style={{ marginTop: 12 }}>
                  <button onClick={() => deleteEvent(selectedEvent.id)} className="adm-btnSmallDanger">Delete Spacer</button>
                </div>
              </div>
            ) : (
              <div>
                <SectionHeader title="Event Details" />
                <FormRow label="Name">
                  <input value={selectedEvent.name} onChange={(e) => updateEvent(selectedEvent.id, { name: e.target.value })} className="adm-input" />
                </FormRow>
                <FormRow label="Type">
                  <select value={selectedEvent.type} onChange={(e) => updateEvent(selectedEvent.id, { type: e.target.value })} className="adm-select">
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormRow>
                <FormRow label="Group">
                  <select value={selectedEvent.groupId ?? ''} onChange={(e) => updateEvent(selectedEvent.id, { groupId: e.target.value || undefined })} className="adm-select">
                    <option value="">None</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.nameHebrew} ({g.name})</option>)}
                  </select>
                </FormRow>
                <FormRow label="Room">
                  <input value={selectedEvent.room ?? ''} onChange={(e) => updateEvent(selectedEvent.id, { room: e.target.value })} className="adm-input" />
                </FormRow>

                <SectionHeader title="Time" />
                <FormRow label="Time Mode">
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['fixed', 'dynamic'] as const).map((m) => (
                      <button key={m} onClick={() => updateEvent(selectedEvent.id, { timeMode: m })} className="adm-btnSmallOutline" style={{ flex: 1, backgroundColor: (selectedEvent.timeMode ?? 'fixed') === m ? 'var(--adm-bg-active)' : undefined, borderColor: (selectedEvent.timeMode ?? 'fixed') === m ? 'var(--adm-accent)' : undefined, color: (selectedEvent.timeMode ?? 'fixed') === m ? 'var(--adm-accent)' : undefined, fontWeight: (selectedEvent.timeMode ?? 'fixed') === m ? 600 : 400 }}>
                        {m === 'fixed' ? 'Fixed Time' : 'Dynamic (Zman)'}
                      </button>
                    ))}
                  </div>
                </FormRow>
                {(selectedEvent.timeMode ?? 'fixed') === 'fixed' ? (
                  <FormRow label="Time">
                    <input type="time" value={selectedEvent.fixedTime ?? ''} onChange={(e) => updateEvent(selectedEvent.id, { fixedTime: e.target.value })} className="adm-input" />
                  </FormRow>
                ) : (
                  <>
                    <FormRow label="Based on Zman">
                      <select value={selectedEvent.baseZman ?? ''} onChange={(e) => updateEvent(selectedEvent.id, { baseZman: e.target.value })} className="adm-select">
                        <option value="">Select...</option>
                        {ZMANIM.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
                      </select>
                    </FormRow>
                    <FormRow label="Offset (minutes)">
                      <input type="number" value={selectedEvent.offset ?? 0} onChange={(e) => updateEvent(selectedEvent.id, { offset: parseInt(e.target.value) || 0 })} className="adm-input" />
                    </FormRow>
                    <FormRow label="Round to nearest">
                      <select value={selectedEvent.roundTo ?? 1} onChange={(e) => updateEvent(selectedEvent.id, { roundTo: parseInt(e.target.value) })} className="adm-select">
                        {ROUND_OPTIONS.map((r) => <option key={r} value={r}>{r} min</option>)}
                      </select>
                    </FormRow>
                    <FormRow label="Round direction">
                      <select value={selectedEvent.roundMode ?? 'nearest'} onChange={(e) => updateEvent(selectedEvent.id, { roundMode: e.target.value as any })} className="adm-select">
                        <option value="nearest">Nearest</option>
                        <option value="before">Before (earlier)</option>
                        <option value="after">After (later)</option>
                      </select>
                    </FormRow>
                  </>
                )}
                <FormRow label="Earliest limit">
                  <input type="time" value={selectedEvent.limitBefore ?? ''} onChange={(e) => updateEvent(selectedEvent.id, { limitBefore: e.target.value || undefined })} className="adm-input" />
                </FormRow>
                <FormRow label="Latest limit">
                  <input type="time" value={selectedEvent.limitAfter ?? ''} onChange={(e) => updateEvent(selectedEvent.id, { limitAfter: e.target.value || undefined })} className="adm-input" />
                </FormRow>
                <FormRow label="Duration (minutes)">
                  <input type="number" value={selectedEvent.durationMinutes ?? ''} onChange={(e) => updateEvent(selectedEvent.id, { durationMinutes: parseInt(e.target.value) || undefined })} placeholder="e.g. 30" className="adm-input" />
                </FormRow>

                {(selectedEvent.timeMode ?? 'fixed') === 'dynamic' && (
                  <>
                    <SectionHeader title="Refresh Frequency" />
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>How often the dynamic time recalculates. Weekly/monthly uses the latest zman in the period.</div>
                    <FormRow label="Refresh">
                      <select value={selectedEvent.refreshMode ?? 'daily'} onChange={(e) => updateEvent(selectedEvent.id, { refreshMode: e.target.value as any })} className="adm-select">
                        <option value="daily">Daily (recalculate every day)</option>
                        <option value="weekly">Weekly (same time all week)</option>
                        <option value="monthly">Monthly (same time all month)</option>
                      </select>
                    </FormRow>
                    {selectedEvent.refreshMode === 'weekly' && (
                      <FormRow label="Week starts">
                        <select value={selectedEvent.refreshAnchorDay ?? 0} onChange={(e) => updateEvent(selectedEvent.id, { refreshAnchorDay: parseInt(e.target.value) })} className="adm-select">
                          {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                        </select>
                      </FormRow>
                    )}
                  </>
                )}

                <SectionHeader title="Active Days" />
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                  {DAYS.map((d, i) => {
                    const active = selectedEvent.daysActive?.[i] ?? true;
                    return (
                      <button
                        key={d}
                        onClick={() => {
                          const days = [...(selectedEvent.daysActive ?? [true, true, true, true, true, true, true])];
                          days[i] = !days[i];
                          updateEvent(selectedEvent.id, { daysActive: days });
                        }}
                        style={{
                          flex: 1, padding: '6px 2px', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontWeight: 600,
                          border: `1px solid ${active ? '#3b82f6' : '#d1d5db'}`,
                          backgroundColor: active ? '#eff6ff' : '#fff',
                          color: active ? '#3b82f6' : '#94a3b8',
                        }}
                        title={d}
                      >
                        {DAYS_HE[i]}
                      </button>
                    );
                  })}
                </div>

                <SectionHeader title="Visibility Rules" />
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>Show or hide this event based on calendar conditions.</div>
                {(selectedEvent.visibilityRules ?? []).map((rule, rIdx) => (
                  <div key={rIdx} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
                    <select
                      value={rule.show ? 'show' : 'hide'}
                      onChange={(e) => {
                        const rules = [...(selectedEvent.visibilityRules ?? [])];
                        rules[rIdx] = { ...rules[rIdx], show: e.target.value === 'show' };
                        updateEvent(selectedEvent.id, { visibilityRules: rules });
                      }}
                      className="adm-select"
                      style={{ width: 70 }}
                    >
                      <option value="show">Show</option>
                      <option value="hide">Hide</option>
                    </select>
                    <span style={{ fontSize: 11, color: '#64748b' }}>on</span>
                    <select
                      value={rule.condition}
                      onChange={(e) => {
                        const rules = [...(selectedEvent.visibilityRules ?? [])];
                        rules[rIdx] = { ...rules[rIdx], condition: e.target.value as VisibilityCondition };
                        updateEvent(selectedEvent.id, { visibilityRules: rules });
                      }}
                      className="adm-select"
                      style={{ flex: 1 }}
                    >
                      {VISIBILITY_CONDITIONS.map((vc) => (
                        <option key={vc.value} value={vc.value}>{vc.labelHe} — {vc.label}</option>
                      ))}
                    </select>
                    <button onClick={() => {
                      const rules = (selectedEvent.visibilityRules ?? []).filter((_, i) => i !== rIdx);
                      updateEvent(selectedEvent.id, { visibilityRules: rules });
                    }} className="adm-btnSmallDanger" style={{ padding: '2px 6px' }}>×</button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const rules = [...(selectedEvent.visibilityRules ?? []), { condition: 'weekday' as VisibilityCondition, show: true }];
                    updateEvent(selectedEvent.id, { visibilityRules: rules });
                  }}
                  className="adm-btnSmallOutline"
                  style={{ fontSize: 11, marginTop: 4, color: 'var(--adm-accent)' }}
                >
                  + Add Rule
                </button>

                <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                  <button onClick={() => deleteEvent(selectedEvent.id)} className="adm-btnSmallDanger">Delete Event</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── IMPORT / EXPORT TAB ─── */}
      {tab === 'import' && (
        <ImportExportPanel
          schedules={schedules}
          groups={groups}
          onChange={onChange}
          onGroupsChange={onGroupsChange}
          weekExportFetcher={weekExportFetcher}
        />
      )}
    </div>
  );
}

/* ─── Import / Export panel ─── */

function ImportExportPanel({
  schedules,
  groups,
  onChange,
  onGroupsChange,
  weekExportFetcher,
}: {
  schedules: Schedule[];
  groups: DaveningGroup[];
  onChange: (s: Schedule[]) => void;
  onGroupsChange?: (g: DaveningGroup[]) => void;
  weekExportFetcher?: WeekExportFetcher;
}) {
  const [importMode, setImportMode] = useState<'replace' | 'append'>('append');
  const [groupsPreview, setGroupsPreview] = useState<CsvGroup[] | null>(null);
  const [eventsPreview, setEventsPreview] = useState<CsvSchedule[] | null>(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const groupsFileRef = useRef<HTMLInputElement>(null);
  const eventsFileRef = useRef<HTMLInputElement>(null);

  const handleGroupsFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess('');
    setGroupsPreview(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const parsed = parseGroupsCsv(text);
      if (parsed.length === 0) { setImportError('No groups found in the file. Make sure the CSV has headers and data rows.'); return; }
      setGroupsPreview(parsed);
    } catch (err: any) {
      setImportError(`Failed to parse groups file: ${err.message}`);
    }
  };

  const handleEventsFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess('');
    setEventsPreview(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const parsed = parseEventsCsv(text);
      if (parsed.length === 0) { setImportError('No events found in the file. Make sure the CSV has headers and data rows.'); return; }
      setEventsPreview(parsed);
    } catch (err: any) {
      setImportError(`Failed to parse events file: ${err.message}`);
    }
  };

  const confirmGroupsImport = () => {
    if (!groupsPreview || !onGroupsChange) return;
    if (importMode === 'replace') {
      onGroupsChange(groupsPreview);
    } else {
      onGroupsChange([...groups, ...groupsPreview]);
    }
    setGroupsPreview(null);
    setImportSuccess(`Imported ${groupsPreview.length} group(s) successfully.`);
    if (groupsFileRef.current) groupsFileRef.current.value = '';
  };

  const confirmEventsImport = () => {
    if (!eventsPreview) return;
    if (importMode === 'replace') {
      onChange(eventsPreview as Schedule[]);
    } else {
      const maxSort = schedules.reduce((m, s) => Math.max(m, s.sortOrder ?? 0), 0);
      const withSort = eventsPreview.map((ev, i) => ({
        ...ev,
        orgId: 'default',
        sortOrder: (ev.sortOrder ?? 0) + maxSort + 1 + i,
      }));
      onChange([...schedules, ...withSort] as Schedule[]);
    }
    setEventsPreview(null);
    setImportSuccess(`Imported ${eventsPreview.length} event(s) successfully.`);
    if (eventsFileRef.current) eventsFileRef.current.value = '';
  };

  return (
    <div style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {importError && (
        <div style={{ padding: 10, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#dc2626', fontSize: 13 }}>
          {importError}
        </div>
      )}
      {importSuccess && (
        <div style={{ padding: 10, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, color: '#16a34a', fontSize: 13 }}>
          {importSuccess}
        </div>
      )}

      {/* ── Download sample files ── */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--adm-text)' }}>
          1. Download sample files
        </div>
        <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginBottom: 10 }}>
          Download a sample CSV, edit it in Excel / Google Sheets, then upload it below. The sample includes every possible column with example data.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => downloadCsv(generateGroupsSampleCsv(), 'groups-sample.csv')}
            className="adm-btnSmallOutline"
            style={{ padding: '8px 16px', color: 'var(--adm-accent)' }}
          >
            Download Groups Sample
          </button>
          <button
            onClick={() => downloadCsv(generateEventsSampleCsv(), 'events-sample.csv')}
            className="adm-btnSmallOutline"
            style={{ padding: '8px 16px', color: 'var(--adm-accent)' }}
          >
            Download Events Sample
          </button>
        </div>
      </div>

      {/* ── Import mode ── */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--adm-text)' }}>
          2. Choose import mode
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['append', 'replace'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setImportMode(m)}
              className="adm-btnSmallOutline"
              style={{
                padding: '8px 16px',
                backgroundColor: importMode === m ? 'var(--adm-bg-active)' : undefined,
                borderColor: importMode === m ? 'var(--adm-accent)' : undefined,
                color: importMode === m ? 'var(--adm-accent)' : undefined,
                fontWeight: importMode === m ? 700 : 400,
              }}
            >
              {m === 'append' ? 'Add to existing' : 'Replace all'}
            </button>
          ))}
        </div>
        {importMode === 'replace' && (
          <div style={{ fontSize: 11, color: '#dc2626', marginTop: 6 }}>
            Warning: Replace mode will delete all existing data of that type before importing.
          </div>
        )}
      </div>

      {/* ── Upload groups ── */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--adm-text)' }}>
          3. Upload Groups CSV
        </div>
        <input ref={groupsFileRef} type="file" accept=".csv,.txt" onChange={handleGroupsFile} style={{ fontSize: 13 }} />
        {groupsPreview && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Preview: {groupsPreview.length} group(s) found
            </div>
            <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--adm-border)', borderRadius: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Hebrew</th>
                    <th style={thStyle}>Color</th>
                    <th style={thStyle}>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {groupsPreview.map((g, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}>{g.name}</td>
                      <td style={tdStyle}>{g.nameHebrew}</td>
                      <td style={tdStyle}><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', backgroundColor: g.color, verticalAlign: 'middle' }} /> {g.color}</td>
                      <td style={tdStyle}>{g.active ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={confirmGroupsImport} className="adm-btnSave" style={{ padding: '8px 16px' }}>
                Import {groupsPreview.length} Group(s)
              </button>
              <button onClick={() => { setGroupsPreview(null); if (groupsFileRef.current) groupsFileRef.current.value = ''; }} className="adm-btnCancel" style={{ padding: '8px 16px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Upload events ── */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--adm-text)' }}>
          4. Upload Events CSV
        </div>
        <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginBottom: 6 }}>
          Make sure to import groups first if your events reference group IDs.
        </div>
        <input ref={eventsFileRef} type="file" accept=".csv,.txt" onChange={handleEventsFile} style={{ fontSize: 13 }} />
        {eventsPreview && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Preview: {eventsPreview.length} event(s) found
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--adm-border)', borderRadius: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Group</th>
                    <th style={thStyle}>Time</th>
                    <th style={thStyle}>Days</th>
                    <th style={thStyle}>Rules</th>
                  </tr>
                </thead>
                <tbody>
                  {eventsPreview.map((ev, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}>{ev.isPlaceholder ? `[spacer] ${ev.placeholderLabel ?? ''}` : ev.name}</td>
                      <td style={tdStyle}>{ev.type}</td>
                      <td style={tdStyle}>{ev.groupId ?? '—'}</td>
                      <td style={tdStyle}>
                        {ev.timeMode === 'dynamic'
                          ? `${ev.baseZman ?? '?'} ${(ev.offset ?? 0) > 0 ? '+' : ''}${ev.offset ?? 0}m`
                          : ev.fixedTime ?? ''}
                      </td>
                      <td style={tdStyle}>{ev.daysActive?.filter(Boolean).length === 7 ? 'All' : `${ev.daysActive?.filter(Boolean).length ?? 0}/7`}</td>
                      <td style={tdStyle}>{(ev.visibilityRules ?? []).length > 0 ? `${ev.visibilityRules!.length} rule(s)` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={confirmEventsImport} className="adm-btnSave" style={{ padding: '8px 16px' }}>
                Import {eventsPreview.length} Event(s)
              </button>
              <button onClick={() => { setEventsPreview(null); if (eventsFileRef.current) eventsFileRef.current.value = ''; }} className="adm-btnCancel" style={{ padding: '8px 16px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Export current data ── */}
      <div style={{ borderTop: '1px solid var(--adm-border)', paddingTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--adm-text)' }}>
          Export current data
        </div>
        <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginBottom: 10 }}>
          Download your current groups and events as CSV files.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => downloadCsv(exportGroupsCsv(groups as CsvGroup[]), `groups-export-${new Date().toISOString().slice(0, 10)}.csv`)}
            className="adm-btnSmallOutline"
            style={{ padding: '8px 16px' }}
            disabled={groups.length === 0}
          >
            Export Groups ({groups.length})
          </button>
          <button
            onClick={() => downloadCsv(exportEventsCsv(schedules as CsvSchedule[]), `events-export-${new Date().toISOString().slice(0, 10)}.csv`)}
            className="adm-btnSmallOutline"
            style={{ padding: '8px 16px' }}
            disabled={schedules.length === 0}
          >
            Export Events ({schedules.length})
          </button>
        </div>
      </div>

      {/* ── Multi-week schedule export ── */}
      {weekExportFetcher && (
        <MultiWeekExportSection
          schedules={schedules}
          groups={groups}
          fetcher={weekExportFetcher}
        />
      )}
    </div>
  );
}

/* ─── Multi-week export ─── */

function computeTimeForExport(
  schedule: Schedule,
  zmanim: Array<{ type: string; time: Date | null }>,
): string {
  if (schedule.isPlaceholder) return '';
  const mode = schedule.timeMode ?? (schedule.baseZman ? 'dynamic' : 'fixed');
  if (mode === 'fixed') return schedule.fixedTime ?? '';

  if (!schedule.baseZman) return '';
  const targetKey = String(schedule.baseZman).toLowerCase().replace(/[^a-z]/g, '');
  const z = zmanim.find((zr) => {
    const normType = (zr.type || '').toLowerCase().replace(/[^a-z]/g, '');
    return normType.includes(targetKey);
  });
  if (!z?.time) return '';
  let t = new Date(z.time);
  t = new Date(t.getTime() + (schedule.offset ?? 0) * 60_000);

  const roundTo = schedule.roundTo ?? 1;
  const roundMode = schedule.roundMode ?? 'nearest';
  if (roundTo > 1) {
    const mins = t.getHours() * 60 + t.getMinutes();
    const q = mins / roundTo;
    let rounded: number;
    if (roundMode === 'before') rounded = Math.floor(q) * roundTo;
    else if (roundMode === 'after') rounded = Math.ceil(q) * roundTo;
    else rounded = Math.round(q) * roundTo;
    t.setHours(Math.floor(rounded / 60), rounded % 60, 0, 0);
  }

  if (schedule.limitBefore) {
    const [hh, mm] = schedule.limitBefore.split(':').map(Number);
    if (!isNaN(hh) && !isNaN(mm)) { const m = new Date(t); m.setHours(hh, mm, 0, 0); if (t < m) t = m; }
  }
  if (schedule.limitAfter) {
    const [hh, mm] = schedule.limitAfter.split(':').map(Number);
    if (!isNaN(hh) && !isNaN(mm)) { const m = new Date(t); m.setHours(hh, mm, 0, 0); if (t > m) t = m; }
  }

  const h = t.getHours();
  const m = t.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function MultiWeekExportSection({
  schedules,
  groups,
  fetcher,
}: {
  schedules: Schedule[];
  groups: DaveningGroup[];
  fetcher: WeekExportFetcher;
}) {
  const [weeks, setWeeks] = useState(20);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [parshaAxis, setParshaAxis] = useState<'columns' | 'rows'>('columns');
  const [eventNamesPos, setEventNamesPos] = useState<'left' | 'right'>('left');
  const [showDate, setShowDate] = useState(true);
  const [dateDay, setDateDay] = useState<'sunday' | 'shabbos'>('shabbos');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  const filteredEvents = useMemo(() => {
    const evts = schedules.filter((s) => !s.isPlaceholder);
    if (selectedGroupIds.length === 0) return evts;
    return evts.filter((s) => selectedGroupIds.includes(s.groupId ?? ''));
  }, [schedules, selectedGroupIds]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError('');
    try {
      const startDate = getNextDayOfWeek(new Date(), 0); // next Sunday
      const weekDataList: WeekData[] = [];
      const eventNames = filteredEvents.map((e) => e.name);

      for (let w = 0; w < weeks; w++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + w * 7);

        const shabbos = new Date(weekStart);
        shabbos.setDate(shabbos.getDate() + 6);

        const dateForDisplay = dateDay === 'sunday' ? weekStart : shabbos;
        const zmanimDate = dateDay === 'shabbos' ? shabbos : weekStart;

        const [zmanimResult, calResult] = await Promise.all([
          fetcher.fetchZmanim(zmanimDate),
          fetcher.fetchCalendar(shabbos),
        ]);

        const parsha = calResult?.parsha?.parshaHebrew
          || calResult?.parsha?.parsha
          || calResult?.parsha?.upcomingHebrew
          || calResult?.parsha?.upcoming
          || `Week ${w + 1}`;

        const eventTimes: Record<string, string> = {};
        for (const ev of filteredEvents) {
          eventTimes[ev.name] = computeTimeForExport(ev, zmanimResult);
        }

        weekDataList.push({
          parsha,
          date: formatDateDisplay(dateForDisplay),
          eventTimes,
        });
      }

      const config: WeeklyExportConfig = {
        weeks,
        groupIds: selectedGroupIds,
        parshaAxis,
        eventNamesPosition: eventNamesPos,
        showDate,
        dateDay,
      };

      const csv = buildWeeklyExportCsv(config, weekDataList, eventNames);
      downloadCsv(csv, `schedule-${weeks}wk-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err: any) {
      setGenError(err.message || 'Export failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ borderTop: '1px solid var(--adm-border)', paddingTop: 16, marginTop: 4 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--adm-text)' }}>
        Multi-week schedule export
      </div>
      <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginBottom: 12 }}>
        Export a table of event times across multiple weeks with parsha headers. Great for printing seasonal schedules.
      </div>

      {genError && (
        <div style={{ padding: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#dc2626', fontSize: 12, marginBottom: 10 }}>
          {genError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label className="adm-labelSm">Number of weeks</label>
          <input type="number" className="adm-input" value={weeks} onChange={(e) => setWeeks(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={52} />
        </div>
        <div>
          <label className="adm-labelSm">Parsha / weeks on</label>
          <select className="adm-select" value={parshaAxis} onChange={(e) => setParshaAxis(e.target.value as any)}>
            <option value="columns">Columns (X axis)</option>
            <option value="rows">Rows (Y axis)</option>
          </select>
        </div>
        <div>
          <label className="adm-labelSm">Event names position</label>
          <select className="adm-select" value={eventNamesPos} onChange={(e) => setEventNamesPos(e.target.value as any)}>
            <option value="left">Left / Top</option>
            <option value="right">Right / Bottom</option>
          </select>
        </div>
        <div>
          <label className="adm-labelSm">Date display day</label>
          <select className="adm-select" value={dateDay} onChange={(e) => setDateDay(e.target.value as any)}>
            <option value="shabbos">Shabbos</option>
            <option value="sunday">Sunday</option>
          </select>
        </div>
      </div>

      <label className="adm-labelSm" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <input type="checkbox" checked={showDate} onChange={(e) => setShowDate(e.target.checked)} />
        Show Gregorian date
      </label>

      <div style={{ marginBottom: 12 }}>
        <label className="adm-labelSm">Filter by groups (empty = all events)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
          {groups.map((g) => (
            <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedGroupIds.includes(g.id)}
                onChange={(e) => {
                  if (e.target.checked) setSelectedGroupIds((p) => [...p, g.id]);
                  else setSelectedGroupIds((p) => p.filter((id) => id !== g.id));
                }}
              />
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: g.color, display: 'inline-block' }} />
              {g.nameHebrew}
            </label>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginBottom: 8 }}>
        Will export <strong>{filteredEvents.length}</strong> event(s) across <strong>{weeks}</strong> week(s).
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating || filteredEvents.length === 0}
        className="adm-btnPrimary"
        style={{ padding: '10px 24px', fontSize: 14, fontWeight: 600, opacity: generating || filteredEvents.length === 0 ? 0.6 : 1 }}
      >
        {generating ? 'Generating...' : 'Generate & Download'}
      </button>
    </div>
  );
}

/* ─── Sub-components ─── */

function FilterChip({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px', borderRadius: 14, fontSize: 11, fontWeight: 600, cursor: 'pointer',
        border: active ? `2px solid ${color}` : '1px solid #d1d5db',
        backgroundColor: active ? `${color}15` : '#fff',
        color: active ? color : '#64748b',
      }}
    >
      {label}
    </button>
  );
}

function ThSortable({ col, label, current, dir, onClick }: { col: string; label: string; current: string; dir: string; onClick: (col: string) => void }) {
  return (
    <th
      onClick={() => onClick(col)}
      style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      {label}{current === col ? (dir === 'asc' ? ' ▲' : ' ▼') : ''}
    </th>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="adm-sectionHeader" style={{ marginTop: 14, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid var(--adm-border)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      <span className="adm-sectionTitle" style={{ fontSize: 12 }}>{title}</span>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="adm-inlineGroup" style={{ marginBottom: 6 }}>
      <label className="adm-labelSm" style={{ width: 110, flexShrink: 0, marginBottom: 0 }}>{label}</label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 11,
  fontWeight: 700,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const tdStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 12,
  verticalAlign: 'middle',
};
