'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DisplayObject, DisplayObjectType, DisplayStyle, Position } from '@zmanim-app/core';
import { ThemePicker, ColorTheme, ThemeColors, BUILT_IN_THEMES } from './ThemePicker';
import { renderWidget } from '../display/BoardRenderer';
import { TYPE_LABELS, TYPE_ICONS, FONT_CATEGORIES } from '../shared/constants';
import { resolveObjBackground, getObjBgMode, resolveCanvasBackground, getCanvasBgMode } from '../shared/backgroundUtils';
import { FrameRenderer } from '../display/FrameRenderer';
import { ScrollWrapper, type ScrollConfig } from '../display/ScrollWrapper';
import { EditorPropertyPanel } from './EditorPropertyPanel';
import { GradientPicker } from './GradientPicker';
import { TexturePicker } from './TexturePicker';
import { FramePicker } from './FramePicker';
import { ColorProvider } from './ColorContext';
import { ColorInput } from './FormPrimitives';


/* ── Types ─────────────────────────────────────────────── */

interface DaveningGroupInfo {
  id: string;
  name: string;
  nameHebrew: string;
  color: string;
}

interface PreviewCalendarInfo {
  date?: { formattedHebrew?: string; formattedEnglish?: string; dayOfWeekHebrew?: string };
  parsha?: { parshaHebrew?: string; parsha?: string; upcomingHebrew?: string; upcoming?: string };
  holiday?: { nameHebrew?: string; name?: string };
  omer?: { day?: number; formattedHebrew?: string };
  dafYomi?: { formattedHebrew?: string; formatted?: string };
  tefilah?: any;
}

interface PreviewScheduleItem {
  name: string;
  hebrewName?: string;
  type: string;
  groupId?: string;
  time?: string;
  fixedTime?: string;
  isPlaceholder?: boolean;
  placeholderLabel?: string;
}

interface ScreenInfo {
  id: string;
  name?: string;
  styleId?: string;
}

interface StyleInfo {
  id: string;
  name: string;
}

interface EditorSettingsProps {
  screens: ScreenInfo[];
  styles: StyleInfo[];
  activeScreenId: string | null;
  activeStyleId: string | null;
  onScreenChange: (id: string | null) => void;
  onStyleSelect: (id: string | null) => void;
  onStyleCreate: (name: string) => void;
  onStyleDelete: (id: string) => void;
  previewUrl?: string;
  bgUploading: boolean;
  onBgUpload: (file: File) => Promise<void>;
}

interface WysiwygCanvasProps {
  style: DisplayStyle;
  onStyleChange: (style: DisplayStyle) => void;
  customThemes?: ColorTheme[];
  onSaveCustomTheme?: (theme: ColorTheme) => void;
  onDeleteCustomTheme?: (themeId: string) => void;
  daveningGroups?: DaveningGroupInfo[];
  onUploadImage?: (file: File) => Promise<string | null>;
  previewCalendar?: PreviewCalendarInfo | null;
  previewSchedules?: PreviewScheduleItem[];
  announcements?: any[];
  memorials?: any[];
  media?: any[];
  zmanim?: any[];
  minyans?: any[];
  editorSettings?: EditorSettingsProps;
  canvasWidth?: number;
  canvasHeight?: number;
  snapToGrid?: boolean;
  gridSize?: number;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface DragState {
  type: 'move' | 'resize';
  objectId: string;
  startMouseX: number;
  startMouseY: number;
  startPos: Position;
  handle?: ResizeHandle;
}

interface SnapGuide {
  orientation: 'h' | 'v';
  position: number;
}

/* ── Canvas Constants ──────────────────────────────────── */

const MIN_SIZE = 20;
const HANDLE_SIZE = 8;
const SNAP_THRESHOLD = 6;
const PANEL_WIDTH = 300;

const HANDLE_DEFS: { key: ResizeHandle; cursor: string; getPos: (w: number, h: number) => { top: number; left: number } }[] = [
  { key: 'nw', cursor: 'nwse-resize', getPos: () => ({ top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 }) },
  { key: 'n',  cursor: 'ns-resize',   getPos: (w) => ({ top: -HANDLE_SIZE / 2, left: w / 2 - HANDLE_SIZE / 2 }) },
  { key: 'ne', cursor: 'nesw-resize', getPos: (w) => ({ top: -HANDLE_SIZE / 2, left: w - HANDLE_SIZE / 2 }) },
  { key: 'e',  cursor: 'ew-resize',   getPos: (w, h) => ({ top: h / 2 - HANDLE_SIZE / 2, left: w - HANDLE_SIZE / 2 }) },
  { key: 'se', cursor: 'nwse-resize', getPos: (w, h) => ({ top: h - HANDLE_SIZE / 2, left: w - HANDLE_SIZE / 2 }) },
  { key: 's',  cursor: 'ns-resize',   getPos: (w, h) => ({ top: h - HANDLE_SIZE / 2, left: w / 2 - HANDLE_SIZE / 2 }) },
  { key: 'sw', cursor: 'nesw-resize', getPos: (_, h) => ({ top: h - HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 }) },
  { key: 'w',  cursor: 'ew-resize',   getPos: (_, h) => ({ top: h / 2 - HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 }) },
];

const ALIGN_ICONS: Record<string, React.ReactNode> = {
  'align-left': <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="1" height="14" fill="currentColor"/><rect x="4" y="3" width="10" height="4" rx="1" fill="currentColor" opacity="0.7"/><rect x="4" y="9" width="6" height="4" rx="1" fill="currentColor" opacity="0.7"/></svg>,
  'align-center-h': <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="7.5" y="1" width="1" height="14" fill="currentColor"/><rect x="3" y="3" width="10" height="4" rx="1" fill="currentColor" opacity="0.7"/><rect x="5" y="9" width="6" height="4" rx="1" fill="currentColor" opacity="0.7"/></svg>,
  'align-right': <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="14" y="1" width="1" height="14" fill="currentColor"/><rect x="2" y="3" width="10" height="4" rx="1" fill="currentColor" opacity="0.7"/><rect x="6" y="9" width="6" height="4" rx="1" fill="currentColor" opacity="0.7"/></svg>,
  'align-top': <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="1" fill="currentColor"/><rect x="3" y="4" width="4" height="10" rx="1" fill="currentColor" opacity="0.7"/><rect x="9" y="4" width="4" height="6" rx="1" fill="currentColor" opacity="0.7"/></svg>,
  'align-center-v': <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="7.5" width="14" height="1" fill="currentColor"/><rect x="3" y="3" width="4" height="10" rx="1" fill="currentColor" opacity="0.7"/><rect x="9" y="5" width="4" height="6" rx="1" fill="currentColor" opacity="0.7"/></svg>,
  'align-bottom': <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="14" width="14" height="1" fill="currentColor"/><rect x="3" y="2" width="4" height="10" rx="1" fill="currentColor" opacity="0.7"/><rect x="9" y="6" width="4" height="6" rx="1" fill="currentColor" opacity="0.7"/></svg>,
  'center-both': <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="7.5" y="1" width="1" height="14" fill="currentColor" opacity="0.4"/><rect x="1" y="7.5" width="14" height="1" fill="currentColor" opacity="0.4"/><rect x="4" y="4" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.7"/></svg>,
  'distribute-h': <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="1" height="14" fill="currentColor" opacity="0.4"/><rect x="14" y="1" width="1" height="14" fill="currentColor" opacity="0.4"/><rect x="3" y="4" width="3" height="8" rx="1" fill="currentColor" opacity="0.7"/><rect x="7" y="4" width="3" height="8" rx="1" fill="currentColor" opacity="0.7"/><rect x="11" y="4" width="2" height="8" rx="1" fill="currentColor" opacity="0.7"/></svg>,
  'distribute-v': <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="1" fill="currentColor" opacity="0.4"/><rect x="1" y="14" width="14" height="1" fill="currentColor" opacity="0.4"/><rect x="4" y="3" width="8" height="3" rx="1" fill="currentColor" opacity="0.7"/><rect x="4" y="7" width="8" height="3" rx="1" fill="currentColor" opacity="0.7"/><rect x="4" y="11" width="8" height="2" rx="1" fill="currentColor" opacity="0.7"/></svg>,
};

/* ── Helpers ───────────────────────────────────────────── */

function snap(value: number, gridSize: number, doSnap: boolean): number {
  if (!doSnap) return Math.round(value);
  return Math.round(value / gridSize) * gridSize;
}

function computeSnapGuides(
  movingObj: DisplayObject,
  allObjects: DisplayObject[],
  canvasW: number,
  canvasH: number,
): { guides: SnapGuide[]; snapX: number | null; snapY: number | null } {
  const guides: SnapGuide[] = [];
  let snapX: number | null = null;
  let snapY: number | null = null;
  const m = movingObj.position;
  const mx = m.x, my = m.y, mw = m.width, mh = m.height;
  const mCx = mx + mw / 2, mCy = my + mh / 2;
  const mR = mx + mw, mB = my + mh;

  const vCandidates: number[] = [0, canvasW / 2, canvasW];
  const hCandidates: number[] = [0, canvasH / 2, canvasH];

  for (const o of allObjects) {
    if (o.id === movingObj.id) continue;
    const p = o.position;
    vCandidates.push(p.x, p.x + p.width / 2, p.x + p.width);
    hCandidates.push(p.y, p.y + p.height / 2, p.y + p.height);
  }

  const movingVEdges = [mx, mCx, mR];
  const movingHEdges = [my, mCy, mB];

  for (const cand of vCandidates) {
    for (const edge of movingVEdges) {
      if (Math.abs(edge - cand) < SNAP_THRESHOLD) {
        if (snapX === null) snapX = cand - (edge - mx);
        guides.push({ orientation: 'v', position: cand });
        break;
      }
    }
  }

  for (const cand of hCandidates) {
    for (const edge of movingHEdges) {
      if (Math.abs(edge - cand) < SNAP_THRESHOLD) {
        if (snapY === null) snapY = cand - (edge - my);
        guides.push({ orientation: 'h', position: cand });
        break;
      }
    }
  }

  return { guides, snapX, snapY };
}

function newId(): string {
  return `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createObject(type: DisplayObjectType, x: number, y: number): DisplayObject {
  return {
    id: newId(),
    type,
    name: TYPE_LABELS[type],
    position: { x, y, width: 300, height: 200 },
    zIndex: 0,
    font: { family: "'Heebo', sans-serif", size: 16, bold: false, italic: false, color: '#ffffff' },
    backgroundColor: 'rgba(0,0,0,0.5)',
    language: 'hebrew',
    content: {},
    visible: true,
  };
}

function AlignBtn({ title, iconKey, onClick }: { title: string; iconKey: string; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick} className="ed-alignBtn">
      {ALIGN_ICONS[iconKey] ?? iconKey}
    </button>
  );
}

/* ── Main Component ───────────────────────────────────── */

export function WysiwygCanvas({
  style,
  onStyleChange,
  customThemes = [],
  onSaveCustomTheme,
  onDeleteCustomTheme,
  daveningGroups = [],
  onUploadImage,
  previewCalendar,
  previewSchedules = [],
  announcements = [],
  memorials = [],
  media = [],
  zmanim,
  minyans,
  editorSettings,
  canvasWidth = 1920,
  canvasHeight = 1080,
  snapToGrid = true,
  gridSize = 10,
}: WysiwygCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [fitScale, setFitScale] = useState(0.5);
  const [fillScale, setFillScale] = useState(0.5);
  const [zoomMode, setZoomMode] = useState<'fit' | 'fill' | 'custom'>('fit');
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([]);
  const [popupId, setPopupId] = useState<string | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [popupTab, setPopupTab] = useState<'general' | 'appearance' | 'content'>('general');
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [themePanelOpen, setThemePanelOpen] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const [boxBgUploading, setBoxBgUploading] = useState(false);
  const boxBgFileRef = useRef<HTMLInputElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const popupObj = style.objects.find((o) => o.id === popupId) ?? null;
  const allSelected = selectedIds.size > 0 ? selectedIds : (selectedId ? new Set([selectedId]) : new Set<string>());

  const activeThemeColors = React.useMemo(() => {
    const allThemes = [...BUILT_IN_THEMES, ...customThemes];
    const theme = activeThemeId ? allThemes.find((t) => t.id === activeThemeId) : null;
    if (!theme) return [] as string[];
    const vals = Object.values(theme.colors) as string[];
    const unique = [...new Set(vals.map((v) => {
      if (v.startsWith('rgba')) {
        const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) return `#${parseInt(m[1]).toString(16).padStart(2, '0')}${parseInt(m[2]).toString(16).padStart(2, '0')}${parseInt(m[3]).toString(16).padStart(2, '0')}`;
      }
      return v;
    }))];
    return unique;
  }, [activeThemeId, customThemes]);

  const zoomModeRef = useRef(zoomMode);
  zoomModeRef.current = zoomMode;

  /* ── Zoom / Resize observer ─────────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const recalc = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === 0 || h === 0) return;
      setContainerSize({ w, h });
      const sx = w / canvasWidth;
      const sy = h / canvasHeight;
      const newFit = Math.min(sx, sy);
      const newFill = Math.max(sx, sy);
      setFitScale(newFit);
      setFillScale(newFill);
      setScale((prev) => {
        if (zoomModeRef.current === 'fit') return newFit;
        if (zoomModeRef.current === 'fill') return newFill;
        return prev;
      });
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasWidth, canvasHeight]);

  /* ── Theme application ──────────────────────────────── */
  const applyTheme = useCallback((theme: ColorTheme) => {
    setActiveThemeId(theme.id);
    const c = theme.colors;
    const updatedObjects = style.objects.map((obj) => {
      const updated = { ...obj, content: { ...obj.content } };
      const nameLower = obj.name.toLowerCase();
      if (obj.type === DisplayObjectType.SCROLLING_TICKER) {
        updated.backgroundColor = c.tickerBg;
        updated.font = { ...obj.font, color: c.tickerText };
      } else if (obj.type === DisplayObjectType.PLAIN_TEXT && (nameLower.includes('header') || nameLower.includes('shul') || nameLower.includes('name'))) {
        updated.backgroundColor = c.headerBg;
        updated.font = { ...obj.font, color: c.headerText };
      } else if (obj.type === DisplayObjectType.DIGITAL_CLOCK || obj.type === DisplayObjectType.ANALOG_CLOCK) {
        updated.backgroundColor = 'transparent';
        updated.font = { ...obj.font, color: c.accent };
      } else {
        updated.backgroundColor = c.widgetBg;
        updated.font = { ...obj.font, color: c.textPrimary };
      }
      if (obj.type === DisplayObjectType.ZMANIM_TABLE || obj.type === DisplayObjectType.EVENTS_TABLE) {
        updated.content.rowAltBg = c.rowAltBg;
      }
      return updated;
    });
    onStyleChange({ ...style, backgroundColor: c.canvasBg, objects: updatedObjects });
  }, [style, onStyleChange]);

  /* ── Mutations ──────────────────────────────────────── */
  const updateObj = useCallback((id: string, fn: (o: DisplayObject) => DisplayObject) => {
    onStyleChange({ ...style, objects: style.objects.map((o) => (o.id === id ? fn(o) : o)) });
  }, [style, onStyleChange]);

  const deleteObj = useCallback((id: string) => {
    onStyleChange({ ...style, objects: style.objects.filter((o) => o.id !== id) });
    if (selectedId === id) setSelectedId(null);
    if (popupId === id) setPopupId(null);
  }, [style, onStyleChange, selectedId, popupId]);

  const addObj = useCallback((type: DisplayObjectType) => {
    const maxZ = style.objects.reduce((m, o) => Math.max(m, o.zIndex), 0);
    const obj = createObject(type, 100, 100);
    obj.zIndex = maxZ + 1;
    onStyleChange({ ...style, objects: [...style.objects, obj] });
    setSelectedId(obj.id);
    setPopupId(obj.id);
    setPopupTab('general');
    setAddMenuOpen(false);
    setRightPanelOpen(true);
  }, [style, onStyleChange]);

  const duplicateObj = useCallback((id: string) => {
    const source = style.objects.find((o) => o.id === id);
    if (!source) return;
    const maxZ = style.objects.reduce((m, o) => Math.max(m, o.zIndex), 0);
    const clone: DisplayObject = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId(),
      name: `${source.name} (copy)`,
      zIndex: maxZ + 1,
      position: { ...source.position, x: source.position.x + 20, y: source.position.y + 20 },
    };
    onStyleChange({ ...style, objects: [...style.objects, clone] });
    setSelectedId(clone.id);
    setPopupId(clone.id);
    setPopupTab('general');
    setRightPanelOpen(true);
  }, [style, onStyleChange]);

  /* ── Drag ───────────────────────────────────────────── */
  const handleMouseDown = useCallback((e: React.MouseEvent, id: string, handle?: ResizeHandle) => {
    e.stopPropagation();
    e.preventDefault();
    const obj = style.objects.find((o) => o.id === id);
    if (!obj) return;
    if (!handle && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      setSelectedId(id);
      if (!selectedIds.has(id)) setSelectedIds(new Set());
    }
    setDragState({ type: handle ? 'resize' : 'move', objectId: id, startMouseX: e.clientX, startMouseY: e.clientY, startPos: { ...obj.position }, handle });
  }, [style.objects, selectedIds]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState) return;
    const dx = (e.clientX - dragState.startMouseX) / scale;
    const dy = (e.clientY - dragState.startMouseY) / scale;
    updateObj(dragState.objectId, (obj) => {
      const pos = { ...dragState.startPos };
      if (dragState.type === 'move') {
        pos.x = snap(pos.x + dx, gridSize, snapToGrid);
        pos.y = snap(pos.y + dy, gridSize, snapToGrid);
        const virtual = { ...obj, position: pos };
        const { guides, snapX, snapY } = computeSnapGuides(virtual, style.objects, canvasWidth, canvasHeight);
        if (snapX !== null) pos.x = snapX;
        if (snapY !== null) pos.y = snapY;
        setActiveGuides(guides);
      } else if (dragState.handle) {
        const h = dragState.handle;
        if (h.includes('e')) pos.width = Math.max(MIN_SIZE, snap(pos.width + dx, gridSize, snapToGrid));
        if (h.includes('w')) { const nw = Math.max(MIN_SIZE, snap(pos.width - dx, gridSize, snapToGrid)); pos.x = snap(pos.x + (pos.width - nw), gridSize, snapToGrid); pos.width = nw; }
        if (h.includes('s')) pos.height = Math.max(MIN_SIZE, snap(pos.height + dy, gridSize, snapToGrid));
        if (h.includes('n')) { const nh = Math.max(MIN_SIZE, snap(pos.height - dy, gridSize, snapToGrid)); pos.y = snap(pos.y + (pos.height - nh), gridSize, snapToGrid); pos.height = nh; }
        setActiveGuides([]);
      }
      return { ...obj, position: pos };
    });
  }, [dragState, scale, gridSize, snapToGrid, updateObj, style.objects, canvasWidth, canvasHeight]);

  const handleMouseUp = useCallback(() => { setDragState(null); setActiveGuides([]); }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).tagName === 'rect' || (e.target as HTMLElement).tagName === 'path') {
      setSelectedId(null);
      setSelectedIds(new Set());
      setPopupId(null);
    }
    setAddMenuOpen(false);
  }, []);

  const handleObjClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (selectedId && !next.has(selectedId)) next.add(selectedId);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      setPopupId(null);
    } else {
      setSelectedId(id);
      setSelectedIds(new Set());
      if (!dragState) {
        const isNewSelection = id !== popupId;
        setPopupId(id);
        if (isNewSelection) setPopupTab('general');
        setRightPanelOpen(true);
      }
    }
  }, [dragState, selectedId, popupId]);

  /* ── Alignment ──────────────────────────────────────── */
  const alignObjects = useCallback((mode:
    'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v' |
    'canvas-center-h' | 'canvas-center-v' | 'canvas-center-both' |
    'distribute-h' | 'distribute-v'
  ) => {
    const ids = Array.from(allSelected);
    if (ids.length === 0) return;
    const objs = style.objects.filter((o) => ids.includes(o.id));
    if (objs.length === 0) return;

    if (objs.length === 1) {
      const o = objs[0];
      const newPos = { ...o.position };
      if (mode === 'canvas-center-h' || mode === 'canvas-center-both') newPos.x = (canvasWidth - newPos.width) / 2;
      if (mode === 'canvas-center-v' || mode === 'canvas-center-both') newPos.y = (canvasHeight - newPos.height) / 2;
      if (mode === 'left') newPos.x = 0;
      if (mode === 'right') newPos.x = canvasWidth - newPos.width;
      if (mode === 'top') newPos.y = 0;
      if (mode === 'bottom') newPos.y = canvasHeight - newPos.height;
      if (mode === 'center-h') newPos.x = (canvasWidth - newPos.width) / 2;
      if (mode === 'center-v') newPos.y = (canvasHeight - newPos.height) / 2;
      updateObj(o.id, (obj) => ({ ...obj, position: newPos }));
      return;
    }

    let updatedObjects = [...style.objects];
    const ref = objs.reduce((a, b) => (a.zIndex >= b.zIndex ? a : b));

    if (mode === 'left') {
      const minX = Math.min(...objs.map((o) => o.position.x));
      updatedObjects = updatedObjects.map((o) => ids.includes(o.id) ? { ...o, position: { ...o.position, x: minX } } : o);
    } else if (mode === 'right') {
      const maxR = Math.max(...objs.map((o) => o.position.x + o.position.width));
      updatedObjects = updatedObjects.map((o) => ids.includes(o.id) ? { ...o, position: { ...o.position, x: maxR - o.position.width } } : o);
    } else if (mode === 'top') {
      const minY = Math.min(...objs.map((o) => o.position.y));
      updatedObjects = updatedObjects.map((o) => ids.includes(o.id) ? { ...o, position: { ...o.position, y: minY } } : o);
    } else if (mode === 'bottom') {
      const maxB = Math.max(...objs.map((o) => o.position.y + o.position.height));
      updatedObjects = updatedObjects.map((o) => ids.includes(o.id) ? { ...o, position: { ...o.position, y: maxB - o.position.height } } : o);
    } else if (mode === 'center-h') {
      const cx = ref.position.x + ref.position.width / 2;
      updatedObjects = updatedObjects.map((o) => ids.includes(o.id) ? { ...o, position: { ...o.position, x: cx - o.position.width / 2 } } : o);
    } else if (mode === 'center-v') {
      const cy = ref.position.y + ref.position.height / 2;
      updatedObjects = updatedObjects.map((o) => ids.includes(o.id) ? { ...o, position: { ...o.position, y: cy - o.position.height / 2 } } : o);
    } else if (mode === 'canvas-center-h') {
      updatedObjects = updatedObjects.map((o) => ids.includes(o.id) ? { ...o, position: { ...o.position, x: (canvasWidth - o.position.width) / 2 } } : o);
    } else if (mode === 'canvas-center-v') {
      updatedObjects = updatedObjects.map((o) => ids.includes(o.id) ? { ...o, position: { ...o.position, y: (canvasHeight - o.position.height) / 2 } } : o);
    } else if (mode === 'canvas-center-both') {
      updatedObjects = updatedObjects.map((o) => ids.includes(o.id) ? { ...o, position: { ...o.position, x: (canvasWidth - o.position.width) / 2, y: (canvasHeight - o.position.height) / 2 } } : o);
    } else if (mode === 'distribute-h') {
      const sorted = [...objs].sort((a, b) => a.position.x - b.position.x);
      if (sorted.length < 3) return;
      const first = sorted[0].position.x;
      const last = sorted[sorted.length - 1].position.x + sorted[sorted.length - 1].position.width;
      const totalW = sorted.reduce((s, o) => s + o.position.width, 0);
      const gap = (last - first - totalW) / (sorted.length - 1);
      let cx = first;
      const posMap = new Map<string, number>();
      for (const o of sorted) { posMap.set(o.id, cx); cx += o.position.width + gap; }
      updatedObjects = updatedObjects.map((o) => posMap.has(o.id) ? { ...o, position: { ...o.position, x: posMap.get(o.id)! } } : o);
    } else if (mode === 'distribute-v') {
      const sorted = [...objs].sort((a, b) => a.position.y - b.position.y);
      if (sorted.length < 3) return;
      const first = sorted[0].position.y;
      const last = sorted[sorted.length - 1].position.y + sorted[sorted.length - 1].position.height;
      const totalH = sorted.reduce((s, o) => s + o.position.height, 0);
      const gap = (last - first - totalH) / (sorted.length - 1);
      let cy = first;
      const posMap = new Map<string, number>();
      for (const o of sorted) { posMap.set(o.id, cy); cy += o.position.height + gap; }
      updatedObjects = updatedObjects.map((o) => posMap.has(o.id) ? { ...o, position: { ...o.position, y: posMap.get(o.id)! } } : o);
    }

    onStyleChange({ ...style, objects: updatedObjects });
  }, [allSelected, style, onStyleChange, canvasWidth, canvasHeight, updateObj]);

  /* ── Keyboard shortcuts ─────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelectedId(null); setSelectedIds(new Set()); setPopupId(null); return; }
      if (!selectedId && selectedIds.size === 0) return;
      if (e.key === 'Delete') {
        e.preventDefault();
        if (selectedIds.size > 0) { selectedIds.forEach((id) => deleteObj(id)); setSelectedIds(new Set()); }
        else if (selectedId) { deleteObj(selectedId); }
        return;
      }
      const arrowMap: Record<string, { dx: number; dy: number }> = {
        ArrowUp: { dx: 0, dy: -1 },
        ArrowDown: { dx: 0, dy: 1 },
        ArrowLeft: { dx: -1, dy: 0 },
        ArrowRight: { dx: 1, dy: 0 },
      };
      const arrow = arrowMap[e.key];
      if (arrow) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const ids = selectedIds.size > 0 ? Array.from(selectedIds) : (selectedId ? [selectedId] : []);
        for (const id of ids) {
          updateObj(id, (obj) => ({
            ...obj,
            position: {
              ...obj.position,
              x: obj.position.x + arrow.dx * step,
              y: obj.position.y + arrow.dy * step,
            },
          }));
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, selectedIds, deleteObj, updateObj]);

  const sorted = [...style.objects].sort((a, b) => a.zIndex - b.zIndex);

  /* ── Property helpers ───────────────────────────────── */
  const pUpdate = (partial: Partial<DisplayObject>) => {
    if (!popupId) return;
    updateObj(popupId, (o) => ({ ...o, ...partial }));
  };
  const pPos = (partial: Partial<Position>) => {
    if (!popupObj) return;
    pUpdate({ position: { ...popupObj.position, ...partial } });
  };
  const pFont = (partial: Partial<DisplayObject['font']>) => {
    if (!popupObj) return;
    pUpdate({ font: { ...popupObj.font, ...partial } });
  };
  const pContent = (partial: Record<string, any>) => {
    if (!popupObj) return;
    pUpdate({ content: { ...popupObj.content, ...partial } });
  };

  const changeZoom = (delta: number) => {
    setScale((prev) => { const next = Math.max(0.2, Math.min(3, prev + delta)); setZoomMode('custom'); return next; });
  };
  const setZoom = (value: number) => { setZoomMode('custom'); setScale(Math.max(0.2, Math.min(3, value))); };

  const scaledW = canvasWidth * scale;
  const scaledH = canvasHeight * scale;
  const overflowsX = scaledW > containerSize.w;
  const overflowsY = scaledH > containerSize.h;
  const overflows = overflowsX || overflowsY;
  const offsetX = overflows ? 0 : Math.round((containerSize.w - scaledW) / 2);
  const offsetY = overflows ? 0 : Math.round((containerSize.h - scaledH) / 2);

  /* ── Render ─────────────────────────────────────────── */
  return (
    <ColorProvider themeColors={activeThemeColors}>
    <div style={{ display: 'flex', width: '100%', height: '100%', direction: 'ltr' }}>

    {/* Left Panel */}
    <div
      className="ed-panel"
      style={{
        width: rightPanelOpen ? PANEL_WIDTH : 36,
        minWidth: rightPanelOpen ? PANEL_WIDTH : 36,
        height: '100%',
        transition: 'width 0.2s ease, min-width 0.2s ease',
      }}
    >
      {!popupObj && (
        <>
          {/* Collapse toggle */}
          <div className="ed-panelHeader" style={{ justifyContent: rightPanelOpen ? 'space-between' : 'center', padding: rightPanelOpen ? '8px 12px' : '8px 0' }}>
            {rightPanelOpen && (
              <span className="ed-sectionLabel">Editor</span>
            )}
            <button onClick={() => setRightPanelOpen((p) => !p)} className="ed-btnGhost" style={{ fontSize: 14 }} title={rightPanelOpen ? 'Collapse panel' : 'Expand panel'}>
              {rightPanelOpen ? '\u25C0' : '\u25B6'}
            </button>
          </div>

          {rightPanelOpen && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Settings */}
              {editorSettings && (
                <SettingsSection
                  editorSettings={editorSettings}
                  style={style}
                  onStyleChange={onStyleChange}
                  settingsOpen={settingsOpen}
                  setSettingsOpen={setSettingsOpen}
                  themePanelOpen={themePanelOpen}
                  setThemePanelOpen={setThemePanelOpen}
                />
              )}
              {/* Objects list */}
              <ObjectsList
                objects={sorted}
                selectedId={selectedId}
                popupId={popupId}
                allSelected={allSelected}
                setSelectedId={setSelectedId}
                setSelectedIds={setSelectedIds}
                setPopupId={setPopupId}
                setPopupTab={setPopupTab}
                setAddMenuOpen={setAddMenuOpen}
                onDuplicate={duplicateObj}
                onDelete={deleteObj}
              />
            </div>
          )}
        </>
      )}

      {popupObj && rightPanelOpen && (
        <EditorPropertyPanel
          popupObj={popupObj}
          popupTab={popupTab}
          setPopupTab={setPopupTab}
          setPopupId={setPopupId}
          setSelectedId={setSelectedId}
          setSelectedIds={setSelectedIds}
          pUpdate={pUpdate}
          pPos={pPos}
          pFont={pFont}
          pContent={pContent}
          deleteObj={deleteObj}
          daveningGroups={daveningGroups}
          onUploadImage={onUploadImage}
          boxBgUploading={boxBgUploading}
          setBoxBgUploading={setBoxBgUploading}
          boxBgFileRef={boxBgFileRef}
        />
      )}
    </div>

    {/* Canvas Area */}
    <div ref={containerRef} style={{ flex: 1, minWidth: 0, height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#1e1e2e' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: overflows ? 'auto' : 'hidden' }}>
      <div style={{ position: 'relative', width: overflowsX ? scaledW : containerSize.w || '100%', height: overflowsY ? scaledH : containerSize.h || '100%' }}>
      <FrameRenderer frameId={style.backgroundFrameId} thickness={style.backgroundFrameThickness ?? 1}>
      <div
        ref={canvasRef}
        style={{
          position: 'absolute', left: offsetX, top: offsetY,
          width: canvasWidth, height: canvasHeight,
          transform: `scale(${scale})`, transformOrigin: 'top left',
          ...resolveCanvasBackground(style, canvasWidth, canvasHeight),
          boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
          cursor: dragState ? 'grabbing' : 'default',
          userSelect: 'none',
        }}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
              <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Snap Guides */}
        {activeGuides.map((g, i) => (
          <div key={`guide-${i}`} style={{
            position: 'absolute',
            [g.orientation === 'v' ? 'left' : 'top']: g.position,
            [g.orientation === 'v' ? 'top' : 'left']: 0,
            [g.orientation === 'v' ? 'width' : 'height']: 1,
            [g.orientation === 'v' ? 'height' : 'width']: g.orientation === 'v' ? canvasHeight : canvasWidth,
            backgroundColor: '#f472b6', opacity: 0.7, pointerEvents: 'none', zIndex: 99998,
          }} />
        ))}

        {/* Objects */}
        {sorted.map((obj) => {
          const sel = obj.id === selectedId || allSelected.has(obj.id);
          const bgMode = getObjBgMode(obj);
          const bgStyles = resolveObjBackground(obj, style.backgroundColor, canvasWidth, canvasHeight, style.backgroundImage, {
            backgroundMode: style.backgroundMode,
            backgroundGradient: style.backgroundGradient,
            backgroundTexture: style.backgroundTexture,
            backgroundImage: style.backgroundImage,
          });
          return (
            <div
              key={obj.id}
              style={{
                position: 'absolute',
                left: obj.position.x, top: obj.position.y,
                width: obj.position.width, height: obj.position.height,
                zIndex: obj.zIndex,
              }}
            >
              <div
                onMouseDown={(e) => handleMouseDown(e, obj.id)}
                onClick={(e) => handleObjClick(e, obj.id)}
                style={{
                  position: 'absolute', inset: 0,
                  ...bgStyles,
                  border: sel ? `2px solid ${allSelected.size > 1 && allSelected.has(obj.id) ? '#a78bfa' : '#60a5fa'}` : `1px dashed ${bgMode === 'transparent' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 3, cursor: sel ? 'grab' : 'pointer', opacity: obj.visible ? 1 : 0.35,
                  overflow: 'hidden', boxSizing: 'border-box', transition: 'border-color 0.1s',
                }}
              >
                <FrameRenderer frameId={obj.content?.frameId as string | undefined} thickness={typeof obj.content?.frameThickness === 'number' ? obj.content.frameThickness : 1}>
                <ScrollWrapper config={obj.content?.scroll as ScrollConfig | undefined}>
                <div style={{
                  pointerEvents: 'none', overflow: 'hidden', width: '100%', minHeight: '100%',
                  display: 'flex', flexDirection: 'column',
                  justifyContent: (obj.content?.verticalAlign ?? 'top') === 'middle' ? 'center' : (obj.content?.verticalAlign ?? 'top') === 'bottom' ? 'flex-end' : 'flex-start',
                }}>
                  {renderWidget(
                    obj, zmanim,
                    previewCalendar as any,
                    announcements?.map((a: any) => ({ id: a.id ?? '', title: a.title ?? '', content: a.content, priority: a.priority ?? 0 })),
                    memorials?.map((m: any) => ({ id: m.id ?? '', hebrewName: m.hebrewName ?? '', englishName: m.englishName, hebrewDate: m.hebrewDate, relationship: m.relationship })),
                    previewSchedules?.map((s) => ({ id: s.name, name: s.name, hebrewName: s.hebrewName ?? s.name, time: s.time ?? s.fixedTime ?? '', type: s.type, groupId: s.groupId, isPlaceholder: s.isPlaceholder, placeholderLabel: s.placeholderLabel })),
                    media?.map((m: any) => ({ id: m.id ?? '', url: m.url ?? '', mimeType: m.mimeType ?? '' })),
                  )}
                </div>
                </ScrollWrapper>
                </FrameRenderer>
                <div className="ed-typeBadge">
                  {TYPE_LABELS[obj.type]}
                </div>
              </div>
              {sel && HANDLE_DEFS.map(({ key, cursor, getPos }) => (
                <div key={key} onMouseDown={(e) => handleMouseDown(e, obj.id, key)} style={{ position: 'absolute', width: HANDLE_SIZE, height: HANDLE_SIZE, backgroundColor: '#60a5fa', border: '1px solid #fff', borderRadius: 2, cursor, zIndex: 9999, ...getPos(obj.position.width, obj.position.height) }} />
              ))}
            </div>
          );
        })}
      </div>
      </FrameRenderer>
      </div>
      </div>

      {/* Theme Panel */}
      {themePanelOpen && (
        <div className="ed-slidePanel" onClick={(e) => e.stopPropagation()}>
          <div className="ed-panelHeader" style={{ padding: '12px 16px' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ed-text)' }}>Themes</span>
            <button onClick={() => setThemePanelOpen(false)} className="ed-closeBtn" style={{ fontSize: 20 }}>&times;</button>
          </div>
          <ThemePicker activeThemeId={activeThemeId} customThemes={customThemes} onApplyTheme={(theme) => { applyTheme(theme); }} onSaveCustomTheme={onSaveCustomTheme ?? (() => {})} onDeleteCustomTheme={onDeleteCustomTheme ?? (() => {})} backgroundImageUrl={style.backgroundImage} />
        </div>
      )}

      {/* Add Widget Overlay */}
      {addMenuOpen && (
        <div className="ed-overlay" onClick={() => setAddMenuOpen(false)}>
          <div className="ed-addWidgetModal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ed-text)', marginBottom: 4 }}>Add Widget</div>
            <div style={{ fontSize: 12, color: 'var(--ed-text-dim)', marginBottom: 16 }}>Choose a widget to add to your display</div>
            <div className="ed-widgetGrid">
              {(Object.keys(DisplayObjectType) as (keyof typeof DisplayObjectType)[]).map((key) => {
                const type = DisplayObjectType[key];
                return (
                  <button key={type} onClick={() => addObj(type)} className="ed-widgetCard">
                    <span style={{ fontSize: 28 }}>{TYPE_ICONS[type]}</span>
                    <span style={{ fontWeight: 500 }}>{TYPE_LABELS[type]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Alignment Toolbar */}
      <AlignmentToolbar allSelected={allSelected} alignObjects={alignObjects} />

      {/* Zoom Bar */}
      <ZoomBar scale={scale} changeZoom={changeZoom} setZoom={setZoom} zoomMode={zoomMode} setZoomMode={setZoomMode} fillScale={fillScale} fitScale={fitScale} setScale={setScale} canvasWidth={canvasWidth} canvasHeight={canvasHeight} objectCount={style.objects.length} popupObj={popupObj} allSelectedSize={allSelected.size} />
    </div>
    </div>
    </ColorProvider>
  );
}

/* ── Extracted sub-components ─────────────────────────── */

function CanvasBackgroundSection({ style, onStyleChange, editorSettings }: {
  style: DisplayStyle;
  onStyleChange: (s: DisplayStyle) => void;
  editorSettings: EditorSettingsProps;
}) {
  const bgMode = getCanvasBgMode(style);
  const [frameOpen, setFrameOpen] = React.useState(false);
  return (
    <>
      <div>
        <div className="ed-subLabel">Canvas background</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {([
            ['solid', 'Solid'],
            ['gradient', 'Gradient'],
            ['texture', 'Texture'],
            ['image', 'Image'],
          ] as const).map(([mode, label]) => {
            const active = bgMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  if (mode === 'solid') {
                    onStyleChange({ ...style, backgroundMode: 'solid', backgroundImage: undefined });
                  } else if (mode === 'gradient') {
                    onStyleChange({
                      ...style,
                      backgroundMode: 'gradient',
                      backgroundGradient: style.backgroundGradient || 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                      backgroundImage: undefined,
                    });
                  } else if (mode === 'texture') {
                    onStyleChange({
                      ...style,
                      backgroundMode: 'texture',
                      backgroundTexture: style.backgroundTexture || 'linen',
                      backgroundImage: undefined,
                    });
                  } else {
                    onStyleChange({ ...style, backgroundMode: 'image' });
                  }
                }}
                className={active ? 'ed-bgModeBtnActive' : 'ed-bgModeBtn'}
                style={{ fontSize: 10 }}
              >
                {label}
              </button>
            );
          })}
        </div>
        {bgMode === 'solid' && (
          <ColorInput
            value={style.backgroundColor || '#000000'}
            onChange={(v) => onStyleChange({ ...style, backgroundColor: v })}
          />
        )}
        {bgMode === 'gradient' && (
          <GradientPicker
            onChange={(css) => onStyleChange({ ...style, backgroundMode: 'gradient', backgroundGradient: css })}
          />
        )}
        {bgMode === 'texture' && (
          <TexturePicker
            value={style.backgroundTexture}
            onChange={(id) => onStyleChange({ ...style, backgroundMode: 'texture', backgroundTexture: id })}
          />
        )}
        {bgMode === 'image' && (
          <div className="ed-colorRow">
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async () => {
                  const file = input.files?.[0];
                  if (file) await editorSettings.onBgUpload(file);
                };
                input.click();
              }}
              disabled={editorSettings.bgUploading}
              className="ed-btnSmall"
              style={{ flex: 1, fontSize: 10 }}
            >
              {editorSettings.bgUploading ? 'Uploading...' : style.backgroundImage ? 'Change BG' : 'Upload BG'}
            </button>
            {style.backgroundImage && (
              <button
                type="button"
                onClick={() => onStyleChange({ ...style, backgroundImage: undefined })}
                className="ed-btnDanger"
                style={{ padding: '3px 6px' }}
                title="Remove BG"
              >
                &times;
              </button>
            )}
          </div>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => setFrameOpen(!frameOpen)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            padding: '2px 0', color: 'var(--ed-text-dim)', fontSize: 11, fontWeight: 600,
          }}
        >
          <span className="ed-subLabel" style={{ margin: 0 }}>Canvas frame</span>
          <span style={{ fontSize: 9, transition: 'transform 0.15s', transform: frameOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>&#9660;</span>
        </button>
        {frameOpen && (
          <FramePicker
            value={style.backgroundFrameId}
            onChange={(id) => onStyleChange({ ...style, backgroundFrameId: id })}
            thickness={style.backgroundFrameThickness ?? 1}
            onThicknessChange={(t) => onStyleChange({ ...style, backgroundFrameThickness: t })}
          />
        )}
      </div>
    </>
  );
}

function SettingsSection({ editorSettings, style, onStyleChange, settingsOpen, setSettingsOpen, themePanelOpen, setThemePanelOpen }: {
  editorSettings: EditorSettingsProps;
  style: DisplayStyle;
  onStyleChange: (s: DisplayStyle) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  themePanelOpen: boolean;
  setThemePanelOpen: (v: boolean) => void;
}) {
  return (
    <div className="ed-section">
      <button onClick={() => setSettingsOpen(!settingsOpen)} className="ed-settingsToggle">
        Settings
        <span style={{ fontSize: 10 }}>{settingsOpen ? '\u25BE' : '\u25B8'}</span>
      </button>
      {settingsOpen && (
        <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div className="ed-subLabel">Screen</div>
            <select value={editorSettings.activeScreenId ?? ''} onChange={(e) => editorSettings.onScreenChange(e.target.value || null)} className="ed-select">
              {editorSettings.screens.length === 0 && <option value="">No screens</option>}
              {editorSettings.screens.map((s, i) => <option key={s.id} value={s.id}>{s.name || `Screen ${i + 1}`}</option>)}
            </select>
          </div>
          <div>
            <div className="ed-subLabel">Style</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <select value={editorSettings.activeStyleId ?? ''} onChange={(e) => editorSettings.onStyleSelect(e.target.value || null)} className="ed-select" style={{ flex: 1 }}>
                {editorSettings.styles.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button onClick={() => editorSettings.onStyleCreate(`Style ${editorSettings.styles.length + 1}`)} className="ed-btnSmall" title="New Style">+</button>
              {editorSettings.styles.length > 1 && (
                <button onClick={() => editorSettings.onStyleDelete(editorSettings.activeStyleId!)} className="ed-btnDanger" title="Delete Style">&times;</button>
              )}
            </div>
          </div>
          <CanvasBackgroundSection style={style} onStyleChange={onStyleChange} editorSettings={editorSettings} />
          <div>
            <div className="ed-subLabel">Theme</div>
            <button onClick={() => setThemePanelOpen(!themePanelOpen)} className="ed-btnSmall" style={{ width: '100%', justifyContent: 'center', backgroundColor: themePanelOpen ? '#6366f1' : undefined, color: themePanelOpen ? '#fff' : undefined }}>
              {themePanelOpen ? 'Close Themes' : 'Open Themes'}
            </button>
          </div>
          {editorSettings.previewUrl && (
            <a href={editorSettings.previewUrl} target="_blank" rel="noopener" className="ed-link">
              Preview Display &rarr;
            </a>
          )}
        </div>
      )}
    </div>
  );
}

const OBJ_ACTION_STYLE: React.CSSProperties = {
  width: 24, height: 24,
  padding: 0, border: '1px solid var(--ed-border)', background: 'var(--ed-bg)',
  cursor: 'pointer', fontSize: 14, lineHeight: 1, borderRadius: 4,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, transition: 'background-color 0.1s, border-color 0.1s',
};

function ObjectsList({ objects, selectedId, popupId, allSelected, setSelectedId, setSelectedIds, setPopupId, setPopupTab, setAddMenuOpen, onDuplicate, onDelete }: {
  objects: DisplayObject[];
  selectedId: string | null;
  popupId: string | null;
  allSelected: Set<string>;
  setSelectedId: (id: string | null) => void;
  setSelectedIds: (ids: Set<string>) => void;
  setPopupId: (id: string | null) => void;
  setPopupTab: (t: 'general' | 'appearance' | 'content') => void;
  setAddMenuOpen: (v: boolean) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div style={{ padding: '6px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px 6px' }}>
        <span className="ed-sectionLabelSm">Objects</span>
        <button onClick={() => setAddMenuOpen(true)} className="ed-addBtn">+ Add</button>
      </div>
      {objects.length === 0 ? (
        <div className="ed-smEmpty">No objects yet.</div>
      ) : (
        objects.map((obj) => {
          const isSel = obj.id === selectedId || allSelected.has(obj.id);
          return (
            <div
              key={obj.id}
              onClick={() => { setSelectedId(obj.id); setSelectedIds(new Set()); }}
              className={isSel ? "ed-objItemSelected" : "ed-objItem"}
              style={{ cursor: 'pointer' }}
            >
              <span className="ed-objIcon">{TYPE_ICONS[obj.type]}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="ed-objName">{obj.name}</div>
                <div className="ed-objType">{TYPE_LABELS[obj.type]}</div>
              </div>
              {!obj.visible && <span style={{ fontSize: 10, color: 'var(--ed-text-faint)', flexShrink: 0 }}>hidden</span>}
              <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                <button
                  title="Edit"
                  onClick={() => { setSelectedId(obj.id); setSelectedIds(new Set()); setPopupId(obj.id); setPopupTab('general'); }}
                  style={{ ...OBJ_ACTION_STYLE, color: '#93c5fd' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#334155'; e.currentTarget.style.borderColor = '#93c5fd'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ed-bg)'; e.currentTarget.style.borderColor = 'var(--ed-border)'; }}
                >&#9998;</button>
                <button
                  title="Duplicate"
                  onClick={() => onDuplicate(obj.id)}
                  style={{ ...OBJ_ACTION_STYLE, color: '#cbd5e1' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#334155'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ed-bg)'; e.currentTarget.style.borderColor = 'var(--ed-border)'; }}
                >&#x2398;</button>
                <button
                  title="Delete"
                  onClick={() => onDelete(obj.id)}
                  style={{ ...OBJ_ACTION_STYLE, color: '#f87171' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3b1c1c'; e.currentTarget.style.borderColor = '#f87171'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ed-bg)'; e.currentTarget.style.borderColor = 'var(--ed-border)'; }}
                >&#x2715;</button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function AlignmentToolbar({ allSelected, alignObjects }: { allSelected: Set<string>; alignObjects: (mode: any) => void }) {
  if (allSelected.size === 0) return null;
  return (
    <div className="ed-toolbar" style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10004 }} onClick={(e) => e.stopPropagation()}>
      {allSelected.size === 1 && (
        <>
          <AlignBtn title="Align Left on Canvas" iconKey="align-left" onClick={() => alignObjects('left')} />
          <AlignBtn title="Center Horizontally on Canvas" iconKey="align-center-h" onClick={() => alignObjects('canvas-center-h')} />
          <AlignBtn title="Align Right on Canvas" iconKey="align-right" onClick={() => alignObjects('right')} />
          <div className="ed-divider" />
          <AlignBtn title="Align Top on Canvas" iconKey="align-top" onClick={() => alignObjects('top')} />
          <AlignBtn title="Center Vertically on Canvas" iconKey="align-center-v" onClick={() => alignObjects('canvas-center-v')} />
          <AlignBtn title="Align Bottom on Canvas" iconKey="align-bottom" onClick={() => alignObjects('bottom')} />
          <div className="ed-divider" />
          <AlignBtn title="Center Both on Canvas" iconKey="center-both" onClick={() => alignObjects('canvas-center-both')} />
        </>
      )}
      {allSelected.size > 1 && (
        <>
          <AlignBtn title="Align Left Edges" iconKey="align-left" onClick={() => alignObjects('left')} />
          <AlignBtn title="Align Centers Horizontally" iconKey="align-center-h" onClick={() => alignObjects('center-h')} />
          <AlignBtn title="Align Right Edges" iconKey="align-right" onClick={() => alignObjects('right')} />
          <div className="ed-divider" />
          <AlignBtn title="Align Top Edges" iconKey="align-top" onClick={() => alignObjects('top')} />
          <AlignBtn title="Align Centers Vertically" iconKey="align-center-v" onClick={() => alignObjects('center-v')} />
          <AlignBtn title="Align Bottom Edges" iconKey="align-bottom" onClick={() => alignObjects('bottom')} />
          {allSelected.size >= 3 && (
            <>
              <div className="ed-divider" />
              <AlignBtn title="Distribute Horizontally" iconKey="distribute-h" onClick={() => alignObjects('distribute-h')} />
              <AlignBtn title="Distribute Vertically" iconKey="distribute-v" onClick={() => alignObjects('distribute-v')} />
            </>
          )}
        </>
      )}
      <span className="ed-infoText">
        {allSelected.size === 1 ? 'Position on canvas' : `${allSelected.size} selected \u2014 Shift+click to select more`}
      </span>
    </div>
  );
}

function ZoomBar({ scale, changeZoom, setZoom, zoomMode, setZoomMode, fillScale, fitScale, setScale, canvasWidth, canvasHeight, objectCount, popupObj, allSelectedSize }: {
  scale: number; changeZoom: (d: number) => void; setZoom: (v: number) => void;
  zoomMode: string; setZoomMode: (m: any) => void; fillScale: number; fitScale: number; setScale: (s: number) => void;
  canvasWidth: number; canvasHeight: number; objectCount: number; popupObj: DisplayObject | null; allSelectedSize: number;
}) {
  return (
    <div className="ed-zoomBar">
      <button onClick={() => changeZoom(0.1)} className="ed-zoomBtn">+</button>
      <input type="number" value={Math.round(scale * 100)} onChange={(e) => { const val = parseFloat(e.target.value); if (!isNaN(val)) setZoom(val / 100); }}
        onBlur={(e) => { const val = parseFloat(e.target.value); if (isNaN(val) || val <= 0) e.target.value = String(Math.round(scale * 100)); }}
        className="ed-zoomInput" />
      <button onClick={() => changeZoom(-0.1)} className="ed-zoomBtn">&minus;</button>
      <button onClick={() => { setZoomMode((prev: string) => { const nextMode = prev === 'fill' ? 'fit' : 'fill'; setScale(nextMode === 'fill' ? fillScale : fitScale); return nextMode; }); }}
        className="ed-zoomLabel">
        {zoomMode === 'fill' ? 'Fit' : 'Fill'}
      </button>
      <span style={{ marginLeft: 6, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
        {canvasWidth}x{canvasHeight} &middot; {objectCount} object{objectCount !== 1 ? 's' : ''}
        {popupObj && <> &middot; {popupObj.name}</>}
        {allSelectedSize > 1 && <> &middot; {allSelectedSize} selected</>}
      </span>
    </div>
  );
}
