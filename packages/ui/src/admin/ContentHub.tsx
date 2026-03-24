'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnnouncementEditor } from './AnnouncementEditor';
import { MemorialEditor } from './MemorialEditor';
import { SponsorManager } from './SponsorManager';
import { FlyerUploader } from './FlyerUploader';
import { ScheduleEditor } from './ScheduleEditor';
import type { ImportHubTab } from './ImportExportHub';
import type { ScheduleRecord, DaveningGroupRecord, WeekExportFetcher } from './ScheduleImportExportPanel';

export type ContentHubSection = 'schedules' | 'announcements' | 'yahrzeit' | 'sponsors' | 'media';

export interface ContentHubSeed {
  section: ContentHubSection;
  triggerAdd?: boolean;
}

export interface ContentHubProps {
  schedules: ScheduleRecord[];
  onSchedulesChange: (s: ScheduleRecord[]) => void;
  groups: DaveningGroupRecord[];
  onGroupsChange: (g: DaveningGroupRecord[]) => void;
  weekExportFetcher?: WeekExportFetcher;
  announcements: any[];
  onAnnouncementsChange: (a: any[]) => void;
  memorials: any[];
  onMemorialsChange: (m: any[]) => void;
  sponsors: any[];
  onSponsorsChange: (s: any[]) => void;
  media: any[];
  onMediaUpload: (file: File) => Promise<void>;
  onMediaDelete: (id: string) => Promise<void>;
  onMediaChange: (m: any[]) => void;
  seed?: ContentHubSeed | null;
  onSeedConsumed?: () => void;
  onRequestImportExport: (tab: ImportHubTab) => void;
}

const SECTIONS: {
  id: ContentHubSection;
  label: string;
  icon: string;
  accentClass: string;
  importTab: ImportHubTab;
}[] = [
  { id: 'schedules', label: 'Davening Times', icon: '📅', accentClass: 'adm-hubSummaryCard--schedules', importTab: 'schedules' },
  { id: 'announcements', label: 'Announcements', icon: '📢', accentClass: 'adm-hubSummaryCard--announcements', importTab: 'announcements' },
  { id: 'yahrzeit', label: 'Yahrzeit', icon: '🕯️', accentClass: 'adm-hubSummaryCard--yahrzeit', importTab: 'yahrzeits' },
  { id: 'sponsors', label: 'Sponsors', icon: '💰', accentClass: 'adm-hubSummaryCard--sponsors', importTab: 'sponsors' },
  { id: 'media', label: 'Media & Flyers', icon: '🖼️', accentClass: 'adm-hubSummaryCard--media', importTab: 'media' },
];

export function ContentHub({
  schedules,
  onSchedulesChange,
  groups,
  onGroupsChange,
  weekExportFetcher,
  announcements,
  onAnnouncementsChange,
  memorials,
  onMemorialsChange,
  sponsors,
  onSponsorsChange,
  media,
  onMediaUpload,
  onMediaDelete,
  onMediaChange,
  seed,
  onSeedConsumed,
  onRequestImportExport,
}: ContentHubProps) {
  const [expanded, setExpanded] = useState<ContentHubSection | null>(null);
  const [addNonce, setAddNonce] = useState<Partial<Record<ContentHubSection, number>>>({});
  const sectionRefs = useRef<Partial<Record<ContentHubSection, HTMLDivElement | null>>>({});

  const schedCount = schedules.filter((s) => !s.isPlaceholder).length;
  const groupCount = groups.length;
  const annActive = announcements.filter((a) => a.active !== false).length;
  const yahCount = memorials.length;
  const spActive = sponsors.filter((s) => s.active !== false).length;
  const mediaCount = media.length;

  const counts: Record<ContentHubSection, number> = {
    schedules: schedCount,
    announcements: annActive,
    yahrzeit: yahCount,
    sponsors: spActive,
    media: mediaCount,
  };

  const meta: Record<ContentHubSection, string> = {
    schedules: `${schedCount} events, ${groupCount} groups`,
    announcements: `${annActive} active`,
    yahrzeit: `${yahCount} entr${yahCount === 1 ? 'y' : 'ies'}`,
    sponsors: `${spActive} active`,
    media: `${mediaCount} file${mediaCount === 1 ? '' : 's'}`,
  };

  useEffect(() => {
    if (!seed) return;
    setExpanded(seed.section);
    if (seed.triggerAdd) {
      setAddNonce((prev) => ({ ...prev, [seed.section]: (prev[seed.section] ?? 0) + 1 }));
    }
    const id = window.setTimeout(() => {
      sectionRefs.current[seed.section]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    onSeedConsumed?.();
    return () => window.clearTimeout(id);
  }, [seed, onSeedConsumed]);

  const toggle = useCallback((id: ContentHubSection) => {
    setExpanded((prev) => (prev === id ? null : id));
  }, []);

  const scrollTo = useCallback((id: ContentHubSection) => {
    setExpanded(id);
    window.setTimeout(() => sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }, []);

  const bumpAdd = useCallback((id: ContentHubSection) => {
    setExpanded(id);
    setAddNonce((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }, []);

  return (
    <div className="adm-hubPage">
      <h2 className="adm-hubTitle">Content Hub</h2>
      <p className="adm-hubSubtitle">
        All your content in one place — davening times, announcements, yahrzeits, sponsors, and media.
        Expand a section to edit. Use <strong>Import &amp; Export</strong> in the sidebar for bulk operations.
      </p>

      <div className="adm-hubGrid">
        {SECTIONS.map((s) => (
          <div
            key={s.id}
            role="button"
            tabIndex={0}
            className={`adm-hubSummaryCard ${s.accentClass}`}
            onClick={() => scrollTo(s.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                scrollTo(s.id);
              }
            }}
          >
            <div className="adm-hubSummaryLabel">
              {s.icon} {s.label}
            </div>
            <div className="adm-hubSummaryMeta">{meta[s.id]}</div>
            <div className="adm-hubSummaryActions">
              <button
                type="button"
                className="adm-btnSmallOutline"
                onClick={(e) => { e.stopPropagation(); scrollTo(s.id); }}
              >
                Manage
              </button>
              <button
                type="button"
                className="adm-btnPrimary"
                style={{ padding: '6px 12px', fontSize: 13 }}
                onClick={(e) => { e.stopPropagation(); bumpAdd(s.id); }}
              >
                {s.id === 'media' ? 'Upload' : '+ Add'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {SECTIONS.map((s) => {
        const isOpen = expanded === s.id;
        return (
          <div
            key={s.id}
            ref={(el) => { sectionRefs.current[s.id] = el; }}
            className="adm-hubSection"
          >
            <button type="button" className="adm-hubSectionHeader" onClick={() => toggle(s.id)} aria-expanded={isOpen}>
              <span className="adm-hubSectionChevron" aria-hidden>
                {isOpen ? '▼' : '▶'}
              </span>
              <span className="adm-hubSectionTitle">
                {s.icon} {s.label}
              </span>
              <span className="adm-hubBadge">{counts[s.id]}</span>
              <div className="adm-hubSectionActions" onClick={(e) => e.stopPropagation()}>
                {s.id === 'media' ? (
                  <button type="button" className="adm-btnSmallOutline" onClick={() => bumpAdd('media')}>Upload</button>
                ) : (
                  <button type="button" className="adm-btnSmallOutline" onClick={() => bumpAdd(s.id)}>+ Add</button>
                )}
                <button type="button" className="adm-btnSmallOutline" onClick={() => onRequestImportExport(s.importTab)}>
                  Import...
                </button>
              </div>
            </button>
            {isOpen && (
              <div className="adm-hubSectionBody">
                <div className="adm-hubEditorEmbed">
                  {s.id === 'schedules' && (
                    <ScheduleEditor
                      embedded
                      quickAddNonce={addNonce.schedules ?? 0}
                      schedules={schedules}
                      onChange={onSchedulesChange}
                      groups={groups}
                      onGroupsChange={onGroupsChange}
                      weekExportFetcher={weekExportFetcher}
                    />
                  )}
                  {s.id === 'announcements' && (
                    <AnnouncementEditor
                      embedded
                      quickAddNonce={addNonce.announcements ?? 0}
                      announcements={announcements}
                      onChange={onAnnouncementsChange}
                    />
                  )}
                  {s.id === 'yahrzeit' && (
                    <MemorialEditor
                      embedded
                      quickAddNonce={addNonce.yahrzeit ?? 0}
                      memorials={memorials}
                      onChange={onMemorialsChange}
                    />
                  )}
                  {s.id === 'sponsors' && (
                    <SponsorManager
                      embedded
                      quickAddNonce={addNonce.sponsors ?? 0}
                      sponsors={sponsors}
                      onChange={onSponsorsChange}
                    />
                  )}
                  {s.id === 'media' && (
                    <FlyerUploader
                      embedded
                      openUploadNonce={addNonce.media ?? 0}
                      media={media}
                      onUpload={onMediaUpload}
                      onDelete={onMediaDelete}
                      onChange={onMediaChange}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
