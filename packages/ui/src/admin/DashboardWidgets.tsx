'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { DisplayStyle, DisplayObject, DisplayBreakpoint } from '@zmanim-app/core';
import { getVisibleObjects, buildScheduleContext } from '@zmanim-app/core';
import {
  evaluateStyleScheduleRules,
  orderedScreenSchedulesForBreakpoint,
  resolveScreenStyleSchedules,
  type ScreenStyleSchedule,
} from '@zmanim-app/core';
import { BoardRenderer } from '../display/BoardRenderer';
import { FrameRenderer } from '../display/FrameRenderer';
import { resolveCanvasBackground } from '../shared/backgroundUtils';
import type { CalendarInfo, AnnouncementData, MemorialData, MinyanData, MediaData, ZmanResult } from '../shared/types';
import type { DisplayNameOverrides } from '@zmanim-app/core';
import { formatTime12h } from '../shared/timeUtils';
import { Modal } from '../shared/Modal';

/* ── Quick-add forms ────────────────────────────────────── */

const TYPES = ['Shacharit', 'Mincha', 'Maariv', 'Other'];
const SPONSOR_TYPES = ['Parnas HaYom', 'Kiddush', 'Shalosh Seudos', 'Seudah Shlishit', 'Other'];
const HEBREW_MONTHS = [
  'Nisan', 'Iyar', 'Sivan', 'Tammuz', 'Av', 'Elul',
  'Tishrei', 'Cheshvan', 'Kislev', 'Teves', 'Shevat', 'Adar', 'Adar II',
];

function uid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function QuickAddEvent({ onSave, onClose }: { onSave: (item: any) => void; onClose: () => void }) {
  const [data, setData] = useState({
    id: uid(), orgId: 'default', name: '', type: 'Other',
    timeMode: 'fixed' as 'fixed' | 'dynamic', fixedTime: '08:00',
    daysActive: [true, true, true, true, true, true, true],
    sortOrder: 999, isPlaceholder: false,
  });
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Shab'];

  return (
    <div>
      <div className="adm-grid2 adm-mb12">
        <div>
          <label className="adm-labelSm">Name</label>
          <input className="adm-input" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="e.g. Vasikin" autoFocus />
        </div>
        <div>
          <label className="adm-labelSm">Type</label>
          <select className="adm-select" value={data.type} onChange={(e) => setData({ ...data, type: e.target.value })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="adm-labelSm">Fixed Time</label>
          <input className="adm-input" type="time" value={data.fixedTime} onChange={(e) => setData({ ...data, fixedTime: e.target.value })} />
        </div>
      </div>
      <div className="adm-mb12">
        <label className="adm-labelSm">Active Days</label>
        <div className="adm-dayToggles">
          {DAYS.map((d, i) => (
            <label key={d} className="adm-labelDay">
              <input
                type="checkbox"
                checked={data.daysActive[i]}
                onChange={() => {
                  const next = [...data.daysActive];
                  next[i] = !next[i];
                  setData({ ...data, daysActive: next });
                }}
              />
              {d}
            </label>
          ))}
        </div>
      </div>
      <div className="adm-modalActions">
        <button type="button" className="adm-btnCancel adm-btnPad" onClick={onClose}>Cancel</button>
        <button
          type="button"
          className="adm-btnSave adm-btnPad"
          onClick={() => { if (data.name.trim()) { onSave(data); onClose(); } }}
        >
          Save Event
        </button>
      </div>
    </div>
  );
}

function QuickAddAnnouncement({ onSave, onClose }: { onSave: (item: any) => void; onClose: () => void }) {
  const [data, setData] = useState({ id: uid(), title: '', content: '', priority: 0, active: true, scheduleRules: '' });
  return (
    <div>
      <div className="adm-grid2 adm-mb12">
        <div>
          <label className="adm-labelSm">Title</label>
          <input className="adm-input" value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} autoFocus />
        </div>
        <div>
          <label className="adm-labelSm">Priority</label>
          <input className="adm-input" type="number" value={data.priority} onChange={(e) => setData({ ...data, priority: +e.target.value || 0 })} />
        </div>
      </div>
      <div className="adm-mb12">
        <label className="adm-labelSm">Content</label>
        <textarea className="adm-textarea adm-textareaTall" value={data.content} onChange={(e) => setData({ ...data, content: e.target.value })} placeholder="Announcement text..." />
      </div>
      <div className="adm-modalActions">
        <button type="button" className="adm-btnCancel adm-btnPad" onClick={onClose}>Cancel</button>
        <button type="button" className="adm-btnSave adm-btnPad" onClick={() => { if (data.title.trim()) { onSave(data); onClose(); } }}>
          Save Announcement
        </button>
      </div>
    </div>
  );
}

function QuickAddYahrzeit({ onSave, onClose }: { onSave: (item: any) => void; onClose: () => void }) {
  const [data, setData] = useState({
    id: uid(), hebrewFirstName: '', hebrewFamilyName: '', benBat: 'ben', parentName: '',
    englishName: '', hebrewMonth: 'Tishrei', hebrewDay: 1, hebrewYear: 5780,
    civilDate: '', donorInfo: '', notes: '', active: true,
  });
  return (
    <div>
      <div className="adm-grid3 adm-mb12">
        <div>
          <label className="adm-labelSm">Hebrew First Name</label>
          <input className="adm-input" value={data.hebrewFirstName} onChange={(e) => setData({ ...data, hebrewFirstName: e.target.value })} autoFocus />
        </div>
        <div>
          <label className="adm-labelSm">Hebrew Family Name</label>
          <input className="adm-input" value={data.hebrewFamilyName} onChange={(e) => setData({ ...data, hebrewFamilyName: e.target.value })} />
        </div>
        <div>
          <label className="adm-labelSm">Ben / Bat</label>
          <select className="adm-select" value={data.benBat} onChange={(e) => setData({ ...data, benBat: e.target.value })}>
            <option value="ben">Ben</option>
            <option value="bat">Bat</option>
          </select>
        </div>
        <div>
          <label className="adm-labelSm">Parent Name</label>
          <input className="adm-input" value={data.parentName} onChange={(e) => setData({ ...data, parentName: e.target.value })} />
        </div>
        <div>
          <label className="adm-labelSm">English Name</label>
          <input className="adm-input" value={data.englishName} onChange={(e) => setData({ ...data, englishName: e.target.value })} />
        </div>
        <div>
          <label className="adm-labelSm">Civil Date</label>
          <input className="adm-input" type="date" value={data.civilDate} onChange={(e) => setData({ ...data, civilDate: e.target.value })} />
        </div>
      </div>
      <div className="adm-grid3 adm-mb12">
        <div>
          <label className="adm-labelSm">Hebrew Month</label>
          <select className="adm-select" value={data.hebrewMonth} onChange={(e) => setData({ ...data, hebrewMonth: e.target.value })}>
            {HEBREW_MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="adm-labelSm">Hebrew Day</label>
          <input className="adm-input" type="number" min={1} max={30} value={data.hebrewDay} onChange={(e) => setData({ ...data, hebrewDay: +e.target.value || 1 })} />
        </div>
        <div>
          <label className="adm-labelSm">Hebrew Year</label>
          <input className="adm-input" type="number" value={data.hebrewYear} onChange={(e) => setData({ ...data, hebrewYear: +e.target.value || 5780 })} />
        </div>
      </div>
      <div className="adm-modalActions">
        <button type="button" className="adm-btnCancel adm-btnPad" onClick={onClose}>Cancel</button>
        <button type="button" className="adm-btnSave adm-btnPad" onClick={() => { if (data.hebrewFirstName.trim()) { onSave(data); onClose(); } }}>
          Save Yahrzeit
        </button>
      </div>
    </div>
  );
}

function QuickAddSponsor({ onSave, onClose }: { onSave: (item: any) => void; onClose: () => void }) {
  const [data, setData] = useState({
    id: uid(), name: '', type: 'Parnas HaYom', hebrewText: '', englishText: '',
    date: '', recurring: false, active: true,
  });
  return (
    <div>
      <div className="adm-grid3 adm-mb12">
        <div>
          <label className="adm-labelSm">Sponsor Name</label>
          <input className="adm-input" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} autoFocus />
        </div>
        <div>
          <label className="adm-labelSm">Type</label>
          <select className="adm-select" value={data.type} onChange={(e) => setData({ ...data, type: e.target.value })}>
            {SPONSOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="adm-labelSm">Date</label>
          <input className="adm-input" type="date" value={data.date} onChange={(e) => setData({ ...data, date: e.target.value })} />
        </div>
      </div>
      <div className="adm-grid2 adm-mb12">
        <div>
          <label className="adm-labelSm">Hebrew Text</label>
          <textarea className="adm-textarea" value={data.hebrewText} onChange={(e) => setData({ ...data, hebrewText: e.target.value })} />
        </div>
        <div>
          <label className="adm-labelSm">English Text</label>
          <textarea className="adm-textarea" value={data.englishText} onChange={(e) => setData({ ...data, englishText: e.target.value })} />
        </div>
      </div>
      <div className="adm-mb12">
        <label className="adm-labelRow">
          <input type="checkbox" checked={data.recurring} onChange={(e) => setData({ ...data, recurring: e.target.checked })} />
          Recurring
        </label>
      </div>
      <div className="adm-modalActions">
        <button type="button" className="adm-btnCancel adm-btnPad" onClick={onClose}>Cancel</button>
        <button type="button" className="adm-btnSave adm-btnPad" onClick={() => { if (data.name.trim()) { onSave(data); onClose(); } }}>
          Save Sponsor
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EXPORTED: Quick Actions Panel
   ═══════════════════════════════════════════════════════════ */

export type QuickActionType = 'event' | 'announcement' | 'yahrzeit' | 'sponsor';

export interface QuickActionsProps {
  showEditorLink: boolean;
  onNavigate: (section: string) => void;
  onAddEvent: (item: any) => void;
  onAddAnnouncement: (item: any) => void;
  onAddYahrzeit: (item: any) => void;
  onAddSponsor: (item: any) => void;
}

export function QuickActionsPanel({
  showEditorLink,
  onNavigate,
  onAddEvent,
  onAddAnnouncement,
  onAddYahrzeit,
  onAddSponsor,
}: QuickActionsProps) {
  const [modal, setModal] = useState<QuickActionType | null>(null);

  const actions: { key: QuickActionType; icon: string; label: string; color: string; navigateTo: string }[] = [
    { key: 'event', icon: '📅', label: 'Add Event', color: '#f59e0b', navigateTo: 'schedules' },
    { key: 'announcement', icon: '📢', label: 'Add Announcement', color: '#10b981', navigateTo: 'announcements' },
    { key: 'yahrzeit', icon: '🕯️', label: 'Add Yahrzeit', color: '#a78bfa', navigateTo: 'yahrzeit' },
    { key: 'sponsor', icon: '💰', label: 'Add Sponsor', color: '#f472b6', navigateTo: 'sponsors' },
  ];

  return (
    <div className="adm-card">
      <h3 className="adm-sectionTitle adm-sectionTitleTight">Quick Actions</h3>
      <div className="adm-quickCardGrid">
        {showEditorLink && (
          <div className="adm-quickActionCard">
            <button type="button" className="adm-quickActionCardMain" onClick={() => onNavigate('editor')}>
              <span className="adm-quickActionCardIcon">🎨</span>
              <span>Display Editor</span>
            </button>
            <button
              type="button"
              className="adm-quickActionCardViewAll"
              onClick={() => onNavigate('screens')}
            >
              Screens &amp; styles
            </button>
          </div>
        )}
        {actions.map((a) => (
          <div key={a.key} className="adm-quickActionCard">
            <button type="button" className="adm-quickActionCardMain" onClick={() => setModal(a.key)}>
              <span className="adm-quickActionCardIcon">{a.icon}</span>
              <span>{a.label}</span>
            </button>
            <button
              type="button"
              className="adm-quickActionCardViewAll"
              onClick={() => onNavigate(a.navigateTo)}
            >
              View all
            </button>
          </div>
        ))}
        <div className="adm-quickActionCard">
          <button type="button" className="adm-quickActionCardMain" onClick={() => onNavigate('media')}>
            <span className="adm-quickActionCardIcon">🖼️</span>
            <span>Upload Media</span>
          </button>
          <button type="button" className="adm-quickActionCardViewAll" onClick={() => onNavigate('media')}>
            Open library
          </button>
        </div>
      </div>

      <Modal open={modal === 'event'} onClose={() => setModal(null)} title="Quick Add — Davening Time" className="adm-modal--scroll">
        <QuickAddEvent onSave={onAddEvent} onClose={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'announcement'} onClose={() => setModal(null)} title="Quick Add — Announcement" className="adm-modal--scroll">
        <QuickAddAnnouncement onSave={onAddAnnouncement} onClose={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'yahrzeit'} onClose={() => setModal(null)} title="Quick Add — Yahrzeit" className="adm-modal--scroll">
        <QuickAddYahrzeit onSave={onAddYahrzeit} onClose={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'sponsor'} onClose={() => setModal(null)} title="Quick Add — Sponsor" className="adm-modal--scroll">
        <QuickAddSponsor onSave={onAddSponsor} onClose={() => setModal(null)} />
      </Modal>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   EXPORTED: Live Screen Preview Widget
   ═══════════════════════════════════════════════════════════ */

function computeMinyanTime(schedule: any, zmanim: ZmanResult[]): string {
  if (schedule.isPlaceholder) return '';
  if (typeof schedule.time === 'string' && schedule.time) return schedule.time;

  const mode: 'fixed' | 'dynamic' =
    schedule.timeMode ?? (schedule.baseZman ? 'dynamic' : 'fixed');
  if (mode === 'fixed' && typeof schedule.fixedTime === 'string' && schedule.fixedTime) {
    const [hStr, mStr] = schedule.fixedTime.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return schedule.fixedTime;
    const base = new Date();
    base.setHours(h, m, 0, 0);
    return formatTime12h(base);
  }
  return '';
}

function resolveActiveStyleForScreen(
  screen: { id: string; styleId?: string; styleSchedules?: ScreenStyleSchedule[] | null },
  allStyles: DisplayStyle[],
  breakpoint: DisplayBreakpoint,
): DisplayStyle | null {
  let schedules: ScreenStyleSchedule[] = [];
  if (screen.styleSchedules && screen.styleSchedules.length > 0) {
    schedules = screen.styleSchedules;
  } else {
    schedules = resolveScreenStyleSchedules(undefined, screen.styleId, allStyles);
  }

  if (schedules.length > 0) {
    const ordered = orderedScreenSchedulesForBreakpoint(schedules, breakpoint);
    const now = new Date();
    for (const entry of ordered) {
      if (evaluateStyleScheduleRules(entry.rules, now)) {
        const chosen = allStyles.find((s) => s.id === entry.styleId);
        if (chosen) return chosen;
      }
    }
  }

  if (screen.styleId) {
    const assigned = allStyles.find((s) => s.id === screen.styleId);
    if (assigned) return assigned;
  }

  return allStyles[0] ?? null;
}

export interface ScreenPreviewProps {
  screens: { id: string; name: string; styleId: string; active: boolean; styleSchedules?: ScreenStyleSchedule[] | null }[];
  styles: DisplayStyle[];
  orgSlug: string;
  zmanim: ZmanResult[];
  calendarInfo: CalendarInfo | null;
  announcements: AnnouncementData[];
  memorials: MemorialData[];
  schedules: any[];
  media: MediaData[];
  displayNames: DisplayNameOverrides;
  onEditStyle: (styleId: string) => void;
}

const BP_OPTIONS: { value: DisplayBreakpoint; label: string }[] = [
  { value: 'full', label: 'Desktop / Full' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'mobile', label: 'Mobile' },
];

export function ScreenPreviewWidget({
  screens,
  styles,
  orgSlug,
  zmanim,
  calendarInfo,
  announcements,
  memorials,
  schedules,
  media,
  displayNames,
  onEditStyle,
}: ScreenPreviewProps) {
  const [selectedScreenId, setSelectedScreenId] = useState<string>(screens[0]?.id ?? '');
  const [breakpoint, setBreakpoint] = useState<DisplayBreakpoint>('full');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 400, h: 225 });

  useEffect(() => {
    if (screens.length > 0 && !screens.find((s) => s.id === selectedScreenId)) {
      setSelectedScreenId(screens[0].id);
    }
  }, [screens, selectedScreenId]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setContainerSize({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const selectedScreen = screens.find((s) => s.id === selectedScreenId) ?? null;
  const activeStyle = useMemo(() => {
    if (!selectedScreen) return null;
    return resolveActiveStyleForScreen(selectedScreen, styles, breakpoint);
  }, [selectedScreen, styles, breakpoint]);

  const visibleObjects = useMemo(() => {
    if (!activeStyle) return [];
    const now = new Date();
    const zmanimMap = new Map<string, Date | null>();
    for (const z of zmanim) zmanimMap.set(z.type, z.time);
    const ctx = buildScheduleContext(now, Intl.DateTimeFormat().resolvedOptions().timeZone, zmanimMap, new Set());
    return getVisibleObjects(activeStyle, ctx);
  }, [activeStyle, zmanim]);

  const minyans: MinyanData[] = useMemo(() => {
    return (schedules || []).map((s: any) => ({
      id: s.id, name: s.name, hebrewName: s.hebrewName ?? s.name,
      time: computeMinyanTime(s, zmanim), room: s.room, type: s.type,
      groupId: s.groupId, isPlaceholder: s.isPlaceholder,
      placeholderLabel: s.placeholderLabel, durationMinutes: s.durationMinutes,
    }));
  }, [schedules, zmanim]);

  const canvasW = activeStyle?.canvasWidth ?? 1920;
  const canvasH = activeStyle?.canvasHeight ?? 1080;
  const scaleX = containerSize.w / canvasW;
  const scaleY = containerSize.h / canvasH;
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (containerSize.w - canvasW * scale) / 2;
  const offsetY = (containerSize.h - canvasH * scale) / 2;

  const screenIndex = screens.findIndex((s) => s.id === selectedScreenId);
  const previewUrl = `/show/${orgSlug}/${screenIndex >= 0 ? screenIndex + 1 : 1}`;

  return (
    <div className="adm-card adm-cardStretch">
      <h3 className="adm-sectionTitle adm-sectionTitleLoose">Live Preview</h3>

      {/* Selectors */}
      <div className="adm-flex adm-gap8 adm-mb12 adm-flexWrap">
        <select
          className="adm-select adm-selectFlex"
          value={selectedScreenId}
          onChange={(e) => setSelectedScreenId(e.target.value)}
        >
          {screens.length === 0 && <option value="">No screens</option>}
          {screens.map((s) => (
            <option key={s.id} value={s.id}>{s.name || 'Unnamed screen'}</option>
          ))}
        </select>
        <select
          className="adm-select adm-selectBp"
          value={breakpoint}
          onChange={(e) => setBreakpoint(e.target.value as DisplayBreakpoint)}
        >
          {BP_OPTIONS.map((bp) => (
            <option key={bp.value} value={bp.value}>{bp.label}</option>
          ))}
        </select>
      </div>

      {/* Preview area */}
      <div ref={containerRef} className="adm-previewShell">
        {activeStyle ? (
          <div style={{ position: 'absolute', left: offsetX, top: offsetY, transformOrigin: 'top left', transform: `scale(${scale})`, width: canvasW, height: canvasH, pointerEvents: 'none', ...resolveCanvasBackground(activeStyle, canvasW, canvasH) }}>
            <FrameRenderer frameId={activeStyle.backgroundFrameId} thickness={activeStyle.backgroundFrameThickness ?? 1}>
              <BoardRenderer
                objects={visibleObjects}
                canvasWidth={canvasW}
                canvasHeight={canvasH}
                canvasBgColor={activeStyle.backgroundColor ?? '#000'}
                canvasBgImage={activeStyle.backgroundImage}
                canvasBgExtras={{
                  backgroundMode: activeStyle.backgroundMode,
                  backgroundGradient: activeStyle.backgroundGradient,
                  backgroundTexture: activeStyle.backgroundTexture,
                  backgroundImage: activeStyle.backgroundImage,
                }}
                zmanim={zmanim}
                calendarInfo={calendarInfo ?? undefined}
                announcements={announcements}
                memorials={memorials}
                minyans={minyans}
                media={media}
                displayNames={displayNames}
              />
            </FrameRenderer>
          </div>
        ) : (
          <div className="adm-previewEmpty">
            {screens.length === 0 ? 'No screens configured' : 'No active style'}
          </div>
        )}
      </div>

      {/* Info bar */}
      {activeStyle && (
        <div className="adm-previewInfoBar">
          <span>
            Style: <strong>{activeStyle.name}</strong> ({canvasW}x{canvasH})
          </span>
          <span style={{ textTransform: 'capitalize' }}>{breakpoint} view</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="adm-previewActions">
        {activeStyle && (
          <button
            type="button"
            className="adm-btnPrimary adm-btnStretch"
            onClick={() => {
              if (selectedScreen && activeStyle) {
                onEditStyle(activeStyle.id);
              }
            }}
          >
            Edit in Display Editor
          </button>
        )}
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener"
          className="adm-btn adm-linkAsBtn"
        >
          Open Full Screen
        </a>
      </div>
    </div>
  );
}
