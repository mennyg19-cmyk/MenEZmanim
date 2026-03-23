'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useBreakpoint } from '../shared/useBreakpoint';
import type { DisplayStyle } from '@zmanim-app/core';
import { LocationSetup } from './LocationSetup';
import { ZmanimConfig } from './ZmanimConfig';
import { ScheduleEditor } from './ScheduleEditor';
import { AnnouncementEditor } from './AnnouncementEditor';
import { MemorialEditor } from './MemorialEditor';
import { SponsorManager } from './SponsorManager';
import { FlyerUploader } from './FlyerUploader';
import { DisplaySettings } from './DisplaySettings';
import { ImportWizard } from './ImportWizard';
import { ExportPanel } from './ExportPanel';
import { ScreenManager } from './ScreenManager';
import { DisplayNamesEditor } from './DisplayNamesEditor';
import { QuickActionsPanel, ScreenPreviewWidget } from './DashboardWidgets';
import { WysiwygCanvas } from '../editor/WysiwygCanvas';
import type { ColorTheme } from '../editor/ThemePicker';
import type { DisplayNameOverrides } from '@zmanim-app/core';


interface AdminAppProps {
  orgId: string;
  onSave: (entity: string, data: any) => Promise<void>;
  onLoad: (entity: string, query?: any) => Promise<any>;
  onDelete: (entity: string, id: string) => Promise<void>;
}

type Section =
  | 'dashboard'
  | 'editor'
  | 'screens'
  | 'location'
  | 'zmanim'
  | 'displayNames'
  | 'schedules'
  | 'announcements'
  | 'yahrzeit'
  | 'sponsors'
  | 'media'
  | 'display'
  | 'import'
  | 'export';

const navItems: { key: Section; icon: string; labelHe: string; labelEn: string; group?: string }[] = [
  { key: 'dashboard', icon: '🏠', labelHe: 'לוח בקרה', labelEn: 'Dashboard' },
  { key: 'editor', icon: '🎨', labelHe: 'עורך תצוגה', labelEn: 'Display Editor', group: 'display' },
  { key: 'screens', icon: '🖥️', labelHe: 'מסכים וסגנונות', labelEn: 'Screens & Styles', group: 'display' },
  { key: 'schedules', icon: '📅', labelHe: 'זמני תפילה', labelEn: 'Davening Times', group: 'content' },
  { key: 'announcements', icon: '📢', labelHe: 'הודעות', labelEn: 'Announcements', group: 'content' },
  { key: 'yahrzeit', icon: '🕯️', labelHe: 'יארצייט', labelEn: 'Yahrzeit', group: 'content' },
  { key: 'sponsors', icon: '💰', labelHe: 'תורמים', labelEn: 'Sponsors', group: 'content' },
  { key: 'media', icon: '🖼️', labelHe: 'מדיה', labelEn: 'Media & Flyers', group: 'content' },
  { key: 'location', icon: '📍', labelHe: 'מיקום', labelEn: 'Location', group: 'settings' },
  { key: 'zmanim', icon: '⏰', labelHe: 'הגדרות זמנים', labelEn: 'Zmanim Config', group: 'settings' },
  { key: 'displayNames', icon: '🏷️', labelHe: 'שמות תצוגה', labelEn: 'Display Names', group: 'settings' },
  { key: 'display', icon: '⚙️', labelHe: 'הגדרות תצוגה', labelEn: 'Display Settings', group: 'settings' },
  { key: 'import', icon: '📥', labelHe: 'ייבוא', labelEn: 'Import', group: 'tools' },
  { key: 'export', icon: '📤', labelHe: 'ייצוא', labelEn: 'Export', group: 'tools' },
];

const groupLabels: Record<string, string> = {
  display: 'Display',
  content: 'Content',
  settings: 'Settings',
  tools: 'Tools',
};

export function AdminApp({ orgId, onSave, onLoad, onDelete }: AdminAppProps) {
  const bp = useBreakpoint();
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [location, setLocation] = useState<any>({});
  const [zmanimConfigs, setZmanimConfigs] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [memorials, setMemorials] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [displaySettingsData, setDisplaySettingsData] = useState<any>({});
  const [displayNames, setDisplayNames] = useState<DisplayNameOverrides>({});
  const [importResult, setImportResult] = useState<any>(null);
  const [screens, setScreens] = useState<any[]>([]);
  const [styles, setStyles] = useState<DisplayStyle[]>([]);
  const [previewCalendar, setPreviewCalendar] = useState<any>(null);
  const [previewZmanim, setPreviewZmanim] = useState<any[]>([]);
  const [previewSchedules, setPreviewSchedules] = useState<any[]>([]);

  // WYSIWYG editor state
  const [editorStyleId, setEditorStyleId] = useState<string | null>(null);
  const [customThemes, setCustomThemes] = useState<ColorTheme[]>([]);
  const [bgUploading, setBgUploading] = useState(false);

  const activeEditorStyle = styles.find((s) => s.id === editorStyleId) ?? null;

  const handleSaveCustomTheme = useCallback((theme: ColorTheme) => {
    setCustomThemes((prev) => {
      const idx = prev.findIndex((t) => t.id === theme.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = theme; return next; }
      return [...prev, theme];
    });
  }, []);

  const handleDeleteCustomTheme = useCallback((themeId: string) => {
    setCustomThemes((prev) => prev.filter((t) => t.id !== themeId));
  }, []);

  // Load data once on mount
  const onLoadRef = React.useRef(onLoad);
  onLoadRef.current = onLoad;
  useEffect(() => {
    const load = onLoadRef.current;
    Promise.all([
      load('schedules').then((d: any) => { if (d) { setSchedules(d); setPreviewSchedules(d); } }),
      load('groups').then((d: any) => d && setGroups(d)),
      load('announcements').then((d: any) => d && setAnnouncements(d)),
      load('memorials').then((d: any) => d && setMemorials(d)),
      load('media').then((d: any) => d && setMedia(d)),
      load('displayNames').then((d: any) => d && setDisplayNames(d)),
      load('calendar').then((d: any) => d && setPreviewCalendar(d)),
      load('zmanim').then((d: any) => {
        if (d?.zmanim) {
          setPreviewZmanim(d.zmanim.map((z: any) => ({ ...z, time: z.time ? new Date(z.time) : null })));
        }
      }),
      Promise.all([load('screens'), load('styles')]).then(([loadedScreens, loadedStyles]: any[]) => {
        if (loadedStyles) {
          setStyles(loadedStyles);
          if (loadedStyles.length > 0) setEditorStyleId(loadedStyles[0].id);
        }
        if (loadedScreens) {
          setScreens(loadedScreens);
        }
      }),
    ]).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (bp === 'tablet') setSidebarCollapsed(true);
  }, [bp]);

  useEffect(() => {
    if (bp === 'mobile' && activeSection === 'editor') {
      setActiveSection('dashboard');
    }
  }, [bp, activeSection]);

  // ── Save handlers ───────────────────────────────────────
  const handleLocationChange = async (loc: any) => { setLocation(loc); await onSave('location', loc); };
  const handleZmanimChange = async (configs: any[]) => { setZmanimConfigs(configs); await onSave('zmanimConfigs', configs); };
  const handleSchedulesChange = async (s: any[]) => { setSchedules(s); setPreviewSchedules(s); await onSave('schedules', s); };
  const handleGroupsChange = async (g: any[]) => { setGroups(g); await onSave('groups', g); };
  const handleAnnouncementsChange = async (a: any[]) => { setAnnouncements(a); await onSave('announcements', a); };
  const handleMemorialsChange = async (m: any[]) => { setMemorials(m); await onSave('memorials', m); };
  const handleSponsorsChange = async (s: any[]) => { setSponsors(s); await onSave('sponsors', s); };
  const handleMediaUpload = async (file: File) => {
    await onSave('media-upload', file);
    const updated = await onLoadRef.current('media');
    if (updated) setMedia(updated);
  };
  const handleUploadImage = useCallback(async (file: File): Promise<string | null> => {
    await onSaveRef.current('media-upload', file);
    const updated = await onLoadRef.current('media');
    if (updated) {
      setMedia(updated);
      const latest = updated[updated.length - 1];
      return latest?.url ?? null;
    }
    return null;
  }, []);
  const handleMediaDelete = async (id: string) => {
    await onDelete('media', id);
    const updated = await onLoadRef.current('media');
    if (updated) setMedia(updated);
  };
  const handleMediaChange = async (m: any[]) => { setMedia(m); await onSave('media', m); };
  const handleDisplaySettingsChange = async (s: any) => { setDisplaySettingsData(s); await onSave('displaySettings', s); };
  const handleDisplayNamesChange = async (names: DisplayNameOverrides) => { setDisplayNames(names); await onSave('displayNames', names); };
  const handleImport = async (sourcePath: string) => { const r = await onLoad('import', { sourcePath }); setImportResult(r); return r; };
  const handleExport = async (type: string, options: any) => { await onSave('export', { type, options }); };
  const handleScreensChange = async (s: any[]) => { setScreens(s); await onSave('screens', s); };

  // ── WYSIWYG editor handlers ─────────────────────────────
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = React.useRef(onSave);
  onSaveRef.current = onSave;

  const handleStyleChange = useCallback((updatedStyle: DisplayStyle) => {
    setStyles((prev) => prev.map((s) => (s.id === updatedStyle.id ? updatedStyle : s)));
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onSaveRef.current('styles', updatedStyle).catch(console.error);
    }, 500);
  }, []);

  const handleStyleCreate = useCallback((name: string) => {
    const newStyle: DisplayStyle = {
      id: `style-${Date.now()}`,
      name,
      backgroundColor: '#1a1a2e',
      backgroundMode: 'solid',
      canvasWidth: 1920,
      canvasHeight: 1080,
      objects: [],
      activationRules: [{ type: 'default' }],
      sortOrder: styles.length,
    };
    setStyles((prev) => [...prev, newStyle]);
    setEditorStyleId(newStyle.id);
    onSave('styles', newStyle).catch(console.error);
  }, [styles, onSave]);

  const handleStyleDelete = useCallback((id: string) => {
    setStyles((prev) => prev.filter((s) => s.id !== id));
    if (editorStyleId === id) setEditorStyleId(styles.find((s) => s.id !== id)?.id ?? null);
    onDelete('styles', id).catch(console.error);
  }, [editorStyleId, styles, onDelete]);

  const handleStyleRename = useCallback((id: string, name: string) => {
    setStyles((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
    const style = styles.find((s) => s.id === id);
    if (style) onSave('styles', { ...style, name }).catch(console.error);
  }, [styles, onSave]);

  const handleStyleDuplicate = useCallback((id: string) => {
    const source = styles.find((s) => s.id === id);
    if (!source) return;
    const dup: DisplayStyle = {
      ...source,
      id: `style-${Date.now()}`,
      name: `${source.name} (copy)`,
      sortOrder: styles.length,
    };
    setStyles((prev) => [...prev, dup]);
    onSave('styles', dup).catch(console.error);
  }, [styles, onSave]);


  // ── Render sections ─────────────────────────────────────
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div>
            <h2 className="adm-pageTitle" style={{ margin: '0 0 16px', fontSize: 24 }}>
              Dashboard
            </h2>
            <div className="adm-dashGrid" style={{ marginBottom: 24 }}>
              {([
                { label: 'Davening Times', value: schedules.length, color: 'var(--adm-accent)', section: 'schedules' as Section },
                { label: 'Announcements', value: announcements.length, color: 'var(--adm-success)', section: 'announcements' as Section },
                { label: 'Yahrzeit Entries', value: memorials.length, color: '#f59e0b', section: 'yahrzeit' as Section },
                { label: 'Display Styles', value: styles.length, color: '#8b5cf6', section: 'editor' as Section },
                { label: 'Screens', value: screens.length, color: '#ec4899', section: 'screens' as Section },
              ] as const)
                .filter((card) => bp !== 'mobile' || card.section !== 'editor')
                .map((card) => (
                <button
                  key={card.label}
                  onClick={() => setActiveSection(card.section)}
                  className="adm-dashCard"
                  style={{ borderTop: `4px solid ${card.color}`, textAlign: 'left' }}
                >
                  <div style={{ fontSize: 32, fontWeight: 700, color: card.color }}>{card.value}</div>
                  <div className="adm-dashCardDesc">{card.label}</div>
                </button>
              ))}
            </div>
            <div className="adm-dashQuickGrid" style={{ alignItems: 'stretch' }}>
              <QuickActionsPanel
                showEditorLink={bp !== 'mobile'}
                onNavigate={(s) => setActiveSection(s as Section)}
                onAddEvent={(item) => {
                  const next = [...schedules, item];
                  setSchedules(next);
                  setPreviewSchedules(next);
                  onSave('schedules', next).catch(console.error);
                }}
                onAddAnnouncement={(item) => {
                  const next = [...announcements, item];
                  setAnnouncements(next);
                  onSave('announcements', next).catch(console.error);
                }}
                onAddYahrzeit={(item) => {
                  const next = [...memorials, item];
                  setMemorials(next);
                  onSave('memorials', next).catch(console.error);
                }}
                onAddSponsor={(item) => {
                  const next = [...sponsors, item];
                  setSponsors(next);
                  onSave('sponsors', next).catch(console.error);
                }}
              />
              <ScreenPreviewWidget
                screens={screens}
                styles={styles}
                orgSlug={orgId}
                zmanim={previewZmanim}
                calendarInfo={previewCalendar}
                announcements={announcements}
                memorials={memorials}
                schedules={previewSchedules}
                media={media}
                displayNames={displayNames}
                onEditStyle={(styleId) => {
                  setEditorStyleId(styleId);
                  setActiveSection('editor');
                }}
              />
            </div>
          </div>
        );

      case 'editor':
        return (
          <div style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
            {activeEditorStyle ? (
              <WysiwygCanvas
                  style={activeEditorStyle}
                  onStyleChange={handleStyleChange}
                  customThemes={customThemes}
                  onSaveCustomTheme={handleSaveCustomTheme}
                  onDeleteCustomTheme={handleDeleteCustomTheme}
                  daveningGroups={groups}
                  onUploadImage={handleUploadImage}
                  previewCalendar={previewCalendar}
                  previewSchedules={previewSchedules}
                  zmanim={previewZmanim}
                  announcements={announcements}
                  memorials={memorials}
                  media={media}
                  editorSettings={{
                    styles,
                    activeStyleId: editorStyleId,
                    onStyleSelect: (styleId) => setEditorStyleId(styleId),
                    onStyleCreate: handleStyleCreate,
                    onStyleDelete: handleStyleDelete,
                    onBgUpload: async (file: File) => {
                      try {
                        setBgUploading(true);
                        await onSave('media-upload', file);
                        const updated = await onLoadRef.current('media');
                        if (updated) {
                          setMedia(updated);
                          const latest = updated[updated.length - 1];
                          if (latest?.url && activeEditorStyle) {
                            handleStyleChange({
                              ...activeEditorStyle,
                              backgroundMode: 'image',
                              backgroundImage: latest.url,
                            });
                          }
                        }
                      } catch (err) {
                        console.error('Background upload error:', err);
                      } finally {
                        setBgUploading(false);
                      }
                    },
                    bgUploading,
                    previewUrl: `/show/${orgId}/${screens.length > 0 ? 1 : 1}`,
                  }}
                  snapToGrid
                  gridSize={10}
                />
            ) : (
              <div className="adm-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 18, backgroundColor: '#0f172a' }}>
                Select or create a style to start editing
              </div>
            )}
          </div>
        );

      case 'screens':
        return (
          <ScreenManager
            screens={screens}
            styles={styles}
            orgSlug={orgId}
            onChange={handleScreensChange}
            onStyleCreate={handleStyleCreate}
            onStyleRename={handleStyleRename}
            onStyleDuplicate={handleStyleDuplicate}
            onStyleDelete={handleStyleDelete}
            onStyleChange={handleStyleChange}
            onEditStyle={(styleId) => {
              setEditorStyleId(styleId);
              setActiveSection('editor');
            }}
          />
        );
      case 'location':
        return <LocationSetup location={location} onChange={handleLocationChange} />;
      case 'zmanim':
        return <ZmanimConfig configs={zmanimConfigs} onChange={handleZmanimChange} />;
      case 'schedules':
        return <ScheduleEditor schedules={schedules} onChange={handleSchedulesChange} groups={groups} onGroupsChange={handleGroupsChange} />;
      case 'announcements':
        return <AnnouncementEditor announcements={announcements} onChange={handleAnnouncementsChange} />;
      case 'yahrzeit':
        return <MemorialEditor memorials={memorials} onChange={handleMemorialsChange} />;
      case 'sponsors':
        return <SponsorManager sponsors={sponsors} onChange={handleSponsorsChange} />;
      case 'media':
        return <FlyerUploader media={media} onUpload={handleMediaUpload} onDelete={handleMediaDelete} onChange={handleMediaChange} />;
      case 'displayNames':
        return <DisplayNamesEditor overrides={displayNames} onChange={handleDisplayNamesChange} />;
      case 'display':
        return <DisplaySettings settings={displaySettingsData} onChange={handleDisplaySettingsChange} />;
      case 'import':
        return <ImportWizard onImport={handleImport} importResult={importResult} />;
      case 'export':
        return <ExportPanel onExport={handleExport} />;
      default:
        return null;
    }
  };

  const filteredNavItems = bp === 'mobile' ? navItems.filter((i) => i.key !== 'editor') : navItems;

  const grouped = filteredNavItems.reduce<Record<string, typeof filteredNavItems>>((acc, item) => {
    const g = item.group ?? '_top';
    (acc[g] ??= []).push(item);
    return acc;
  }, {});

  const sidebarWidth = sidebarCollapsed ? 60 : 240;
  const isMobile = bp === 'mobile';

  return (
    <div className="adm-page" style={{ height: '100vh', overflow: 'hidden' }}>
      {isMobile && mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="adm-sidebarBackdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      {/* Left sidebar */}
      <aside
        className={`adm-sidebar${isMobile ? ' adm-sidebar--mobile' : ''}${isMobile && mobileMenuOpen ? ' adm-sidebar--open' : ''}`}
        style={
          isMobile
            ? {
                width: 260,
                minWidth: 260,
                overflow: 'hidden',
                padding: 0,
              }
            : {
                width: sidebarWidth,
                minWidth: sidebarWidth,
                transition: 'width 0.2s ease, min-width 0.2s ease',
                overflow: 'hidden',
                padding: 0,
              }
        }
      >
        <div
          className="adm-sidebarBrand"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
            padding: '16px 12px',
            margin: 0,
          }}
        >
          {!sidebarCollapsed && (
            <span style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap' }}>Zmanim Admin</span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ background: 'none', border: 'none', color: 'var(--adm-sidebar-text)', cursor: 'pointer', fontSize: 18, padding: 4 }}
          >
            {sidebarCollapsed ? '▶' : '◀'}
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', padding: '8px 6px', flex: 1, overflowY: 'auto' }}>
          {(grouped['_top'] ?? []).map((item) => (
            <NavButton
              key={item.key}
              item={item}
              active={activeSection}
              collapsed={sidebarCollapsed}
              onClick={(key) => {
                setActiveSection(key);
                if (isMobile) setMobileMenuOpen(false);
              }}
            />
          ))}

          {Object.entries(groupLabels).map(([groupKey, groupLabel]) => (
            <React.Fragment key={groupKey}>
              {!sidebarCollapsed && (
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--adm-text-muted)', padding: '16px 12px 4px', letterSpacing: 1 }}>
                  {groupLabel}
                </div>
              )}
              {sidebarCollapsed && <div style={{ height: 8 }} />}
              {(grouped[groupKey] ?? []).map((item) => (
                <NavButton
                  key={item.key}
                  item={item}
                  active={activeSection}
                  collapsed={sidebarCollapsed}
                  onClick={(key) => {
                    setActiveSection(key);
                    if (isMobile) setMobileMenuOpen(false);
                  }}
                />
              ))}
            </React.Fragment>
          ))}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--adm-sidebar-border)' }}>
          <a
            href="/show/demo/1"
            target="_blank"
            rel="noopener"
            className="adm-btnPrimary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              textDecoration: 'none',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            }}
          >
            <span>📺</span>
            {!sidebarCollapsed && <span>Live Display</span>}
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header className="adm-pageHeader" style={{ padding: '12px 24px', backgroundColor: 'var(--adm-bg)', borderBottom: '1px solid var(--adm-border)', flexShrink: 0, gap: 12 }}>
          {isMobile && (
            <button
              type="button"
              className="adm-menuHamburger"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
            >
              ☰
            </button>
          )}
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--adm-text)', flex: 1, minWidth: 0 }}>
            {navItems.find((n) => n.key === activeSection)?.icon}{' '}
            {navItems.find((n) => n.key === activeSection)?.labelEn}
            <span style={{ color: 'var(--adm-text-dim)', fontWeight: 400, marginLeft: 8, fontSize: 13 }}>
              {navItems.find((n) => n.key === activeSection)?.labelHe}
            </span>
          </h1>
          {activeSection === 'editor' && (
            <a href="/show/demo/1" target="_blank" rel="noopener" className="adm-link" style={{ fontSize: 13 }}>
              Preview in new tab →
            </a>
          )}
        </header>
        <main style={{ flex: 1, overflow: activeSection === 'editor' ? 'hidden' : 'auto', backgroundColor: 'var(--adm-bg-hover)' }}>
          <div style={{ padding: activeSection === 'editor' ? 0 : 24, height: activeSection === 'editor' ? '100%' : undefined }}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}


function NavButton({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: { key: Section; icon: string; labelHe: string; labelEn: string };
  active: Section;
  collapsed: boolean;
  onClick: (key: Section) => void;
}) {
  const isActive = active === item.key;
  return (
    <button
      onClick={() => onClick(item.key)}
      title={`${item.labelEn} — ${item.labelHe}`}
      className={isActive ? "adm-navBtnActive" : "adm-navBtn"}
      style={{
        padding: collapsed ? '10px 0' : '10px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 8,
        whiteSpace: 'nowrap',
      }}
    >
      <span className="adm-navIcon">{item.icon}</span>
      {!collapsed && <span>{item.labelEn}</span>}
    </button>
  );
}
