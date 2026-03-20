'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { VISIBILITY_CONDITIONS, type VisibilityCondition } from '@zmanim-app/core';


interface VisibilityRule {
  condition: VisibilityCondition;
  show: boolean;
}

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

interface ScheduleEditorProps {
  schedules: Schedule[];
  onChange: (schedules: Schedule[]) => void;
  groups: DaveningGroup[];
  onGroupsChange?: (groups: DaveningGroup[]) => void;
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
  Shacharit: '#f59e0b',
  Mincha: '#3b82f6',
  Maariv: '#8b5cf6',
  Other: '#64748b',
};


export function ScheduleEditor({ schedules, onChange, groups, onGroupsChange }: ScheduleEditorProps) {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(groups[0]?.id ?? null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [tab, setTab] = useState<'events' | 'groups'>('events');
  const [editingGroup, setEditingGroup] = useState<DaveningGroup | null>(null);

  const groupMap = useMemo(() => {
    const m = new Map<string, DaveningGroup>();
    groups.forEach((g) => m.set(g.id, g));
    return m;
  }, [groups]);

  const filteredEvents = useMemo(() => {
    if (!activeGroupId) return schedules;
    return schedules
      .filter((s) => s.groupId === activeGroupId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [schedules, activeGroupId]);

  const selectedEvent = schedules.find((s) => s.id === selectedEventId) ?? null;

  const updateEvent = useCallback((id: string, patch: Partial<Schedule>) => {
    onChange(schedules.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, [schedules, onChange]);

  const addEvent = useCallback((placeholder = false) => {
    const newId = `sched-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const maxSort = filteredEvents.reduce((m, s) => Math.max(m, s.sortOrder ?? 0), 0);
    const newEvent: Schedule = {
      id: newId,
      orgId: 'default',
      name: placeholder ? '' : 'New Event',
      type: 'Other',
      groupId: activeGroupId ?? undefined,
      timeMode: 'fixed',
      fixedTime: '08:00',
      daysActive: [true, true, true, true, true, true, true],
      sortOrder: maxSort + 1,
      isPlaceholder: placeholder,
      placeholderLabel: placeholder ? '---' : undefined,
    };
    onChange([...schedules, newEvent]);
    setSelectedEventId(newId);
  }, [schedules, onChange, filteredEvents, activeGroupId]);

  const deleteEvent = useCallback((id: string) => {
    onChange(schedules.filter((s) => s.id !== id));
    if (selectedEventId === id) setSelectedEventId(null);
  }, [schedules, onChange, selectedEventId]);

  const moveEvent = useCallback((idx: number, dir: -1 | 1) => {
    const events = [...filteredEvents];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= events.length) return;
    const temp = events[idx].sortOrder;
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
    setActiveGroupId(id);
  }, [groups, onGroupsChange]);

  const deleteGroup = useCallback((id: string) => {
    if (!onGroupsChange) return;
    onGroupsChange(groups.filter((g) => g.id !== id));
    if (activeGroupId === id) setActiveGroupId(groups.find((g) => g.id !== id)?.id ?? null);
  }, [groups, onGroupsChange, activeGroupId]);

  const updateGroup = useCallback((id: string, patch: Partial<DaveningGroup>) => {
    if (!onGroupsChange) return;
    onGroupsChange(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }, [groups, onGroupsChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div className="adm-tabBar">
        <button onClick={() => setTab('events')} className={tab === 'events' ? "adm-tabActive" : "adm-tab"}>
          Davening Times
        </button>
        <button onClick={() => setTab('groups')} className={tab === 'groups' ? "adm-tabActive" : "adm-tab"}>
          Groups ({groups.length})
        </button>
      </div>

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
                    <input type="color" value={editingGroup.color} onChange={(e) => setEditingGroup({ ...editingGroup, color: e.target.value })} style={{ width: 30, height: 24, border: 'none', cursor: 'pointer' }} />
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
          <button onClick={addGroup} className="adm-btnSmallOutline" style={{ width: '100%', marginTop: 8, color: 'var(--adm-accent)' }}>+ Add Group</button>
        </div>
      )}

      {tab === 'events' && (
        <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
          {/* Left: Group tabs + event list */}
          <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e5e7eb', paddingRight: 12 }}>
            {/* Group chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => { setActiveGroupId(g.id); setSelectedEventId(null); }}
                  style={{
                    padding: '4px 10px', borderRadius: 14, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    border: activeGroupId === g.id ? `2px solid ${g.color}` : '1px solid #d1d5db',
                    backgroundColor: activeGroupId === g.id ? `${g.color}15` : '#fff',
                    color: activeGroupId === g.id ? g.color : '#64748b',
                  }}
                >
                  {g.nameHebrew}
                </button>
              ))}
            </div>

            {/* Event list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredEvents.map((ev, idx) => {
                const isSel = ev.id === selectedEventId;
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
                    onClick={() => setSelectedEventId(ev.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', marginBottom: 2,
                      borderRadius: 4, cursor: 'pointer',
                      border: isSel ? '1px solid #60a5fa' : '1px solid transparent',
                      backgroundColor: isSel ? '#eff6ff' : (idx % 2 === 0 ? '#fff' : '#f9fafb'),
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: TYPE_COLORS[ev.type] ?? '#64748b', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{ev.name}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>
                        {ev.timeMode === 'dynamic' ? `${ev.baseZman ?? '?'} ${(ev.offset ?? 0) > 0 ? '+' : ''}${ev.offset ?? 0}m` : ev.fixedTime ?? ''}
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
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              <button onClick={() => addEvent(false)} className="adm-btnSmallOutline" style={{ flex: 1, color: 'var(--adm-accent)' }}>+ Event</button>
              <button onClick={() => addEvent(true)} className="adm-btnSmallOutline" style={{ flex: 1 }}>+ Spacer</button>
            </div>
          </div>

          {/* Right: Detail panel */}
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
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
                {/* Basic info */}
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

                {/* Time settings */}
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

                {/* Days active */}
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

                {/* Visibility rules */}
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

                {/* Delete */}
                <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                  <button onClick={() => deleteEvent(selectedEvent.id)} className="adm-btnSmallDanger">Delete Event</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
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
