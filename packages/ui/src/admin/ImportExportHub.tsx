'use client';

import React, { useCallback, useState } from 'react';
import { ScheduleImportExportPanel, type WeekExportFetcher } from './ScheduleImportExportPanel';
import { ImportWizard } from './ImportWizard';
import { ExportPanel } from './ExportPanel';
import { readFileAsText } from '../shared/csvImportExport';

export type ImportHubTab = 'schedules' | 'announcements' | 'yahrzeits' | 'sponsors' | 'beezee' | 'media';

export interface ImportExportHubProps {
  schedules: any[];
  groups: any[];
  onSchedulesChange: (s: any[]) => void;
  onGroupsChange: (g: any[]) => void;
  weekExportFetcher?: WeekExportFetcher;
  onImportBeeZee: (sourcePath: string) => Promise<unknown>;
  importResult: unknown;
  onExport: (type: string, options: unknown) => Promise<void>;
  announcements: any[];
  onAnnouncementsChange: (a: any[]) => void;
  memorials: any[];
  onMemorialsChange: (m: any[]) => void;
  sponsors: any[];
  onSponsorsChange: (s: any[]) => void;
  importTab: ImportHubTab;
  onImportTabChange: (t: ImportHubTab) => void;
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function JsonListImportSection({
  title,
  hint,
  sampleFilename,
  sampleRow,
  currentCount,
  onApply,
}: {
  title: string;
  hint: string;
  sampleFilename: string;
  sampleRow: unknown;
  currentCount: number;
  onApply: (parsed: unknown[], mode: 'append' | 'replace') => void;
}) {
  const [mode, setMode] = useState<'append' | 'replace'>('append');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [preview, setPreview] = useState<unknown[] | null>(null);

  const parseFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErr('');
    setOk('');
    setPreview(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const data = JSON.parse(text) as unknown;
      if (!Array.isArray(data)) {
        setErr('File must contain a JSON array.');
        return;
      }
      setPreview(data);
    } catch (ex: unknown) {
      const msg = ex instanceof Error ? ex.message : String(ex);
      setErr(`Invalid JSON: ${msg}`);
    }
  };

  const confirm = () => {
    if (!preview) return;
    onApply(preview, mode);
    setOk(`Imported ${preview.length} record(s) (${mode}).`);
    setPreview(null);
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--adm-text-muted)', margin: '0 0 12px', lineHeight: 1.45 }}>{hint}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button
          type="button"
          className="adm-btnSmallOutline"
          onClick={() => downloadJson(sampleFilename, [sampleRow])}
        >
          Download sample JSON
        </button>
        <span style={{ fontSize: 12, color: 'var(--adm-text-muted)', alignSelf: 'center' }}>
          Current: <strong>{currentCount}</strong> record(s)
        </span>
      </div>
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--adm-text)' }}>Mode: </span>
        {(['append', 'replace'] as const).map((m) => (
          <button
            key={m}
            type="button"
            className="adm-btnSmallOutline"
            style={{
              marginLeft: 6,
              padding: '6px 12px',
              fontWeight: mode === m ? 700 : 400,
              borderColor: mode === m ? 'var(--adm-accent)' : undefined,
              color: mode === m ? 'var(--adm-accent)' : undefined,
            }}
            onClick={() => setMode(m)}
          >
            {m === 'append' ? 'Add to existing' : 'Replace all'}
          </button>
        ))}
      </div>
      {mode === 'replace' && (
        <div className="adm-ieMsg adm-ieMsg--err" style={{ marginBottom: 10 }}>
          Replace will remove all existing {title.toLowerCase()} before importing.
        </div>
      )}
      <label className="adm-labelSm">Upload JSON array</label>
      <input type="file" accept=".json,.txt,application/json" onChange={parseFile} style={{ display: 'block', marginTop: 4 }} />
      {err && <div className="adm-ieMsg adm-ieMsg--err" style={{ marginTop: 10 }}>{err}</div>}
      {ok && <div className="adm-ieMsg adm-ieMsg--ok" style={{ marginTop: 10 }}>{ok}</div>}
      {preview && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Preview: {preview.length} item(s)</div>
          <pre
            style={{
              maxHeight: 160,
              overflow: 'auto',
              fontSize: 11,
              padding: 10,
              borderRadius: 8,
              border: '1px solid var(--adm-border)',
              background: 'var(--adm-bg-muted)',
              color: 'var(--adm-text)',
            }}
          >
            {JSON.stringify(preview.slice(0, 5), null, 2)}
            {preview.length > 5 ? '\n…' : ''}
          </pre>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="adm-btnSave" onClick={confirm}>
              Import {preview.length} record(s)
            </button>
            <button type="button" className="adm-btnCancel" onClick={() => setPreview(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ImportExportHub({
  schedules,
  groups,
  onSchedulesChange,
  onGroupsChange,
  weekExportFetcher,
  onImportBeeZee,
  importResult,
  onExport,
  announcements,
  onAnnouncementsChange,
  memorials,
  onMemorialsChange,
  sponsors,
  onSponsorsChange,
  importTab,
  onImportTabChange,
}: ImportExportHubProps) {
  const tabs: { id: ImportHubTab; label: string }[] = [
    { id: 'schedules', label: 'Schedules' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'yahrzeits', label: 'Yahrzeits' },
    { id: 'sponsors', label: 'Sponsors' },
    { id: 'media', label: 'Media' },
    { id: 'beezee', label: 'BeeZee' },
  ];

  const handleAnnouncementsApply = useCallback(
    (parsed: unknown[], mode: 'append' | 'replace') => {
      const next = parsed as any[];
      if (mode === 'replace') onAnnouncementsChange(next);
      else onAnnouncementsChange([...announcements, ...next]);
    },
    [announcements, onAnnouncementsChange],
  );

  const handleMemorialsApply = useCallback(
    (parsed: unknown[], mode: 'append' | 'replace') => {
      const next = parsed as any[];
      if (mode === 'replace') onMemorialsChange(next);
      else onMemorialsChange([...memorials, ...next]);
    },
    [memorials, onMemorialsChange],
  );

  const handleSponsorsApply = useCallback(
    (parsed: unknown[], mode: 'append' | 'replace') => {
      const next = parsed as any[];
      if (mode === 'replace') onSponsorsChange(next);
      else onSponsorsChange([...sponsors, ...next]);
    },
    [sponsors, onSponsorsChange],
  );

  const annSample = {
    id: 'sample-id',
    title: 'Example',
    content: 'Text',
    priority: 0,
    active: true,
    visibilityRules: [],
  };

  const yahSample = {
    id: 'sample-id',
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
  };

  const sponsorSample = {
    id: 'sample-id',
    name: '',
    type: 'Parnas HaYom',
    hebrewText: '',
    englishText: '',
    date: '',
    recurring: false,
    active: true,
  };

  return (
    <div className="adm-ieHubPage">
      <h2 className="adm-hubTitle" style={{ marginBottom: 4 }}>
        Import &amp; Export
      </h2>
      <p className="adm-hubSubtitle">Import data from CSV/JSON or export backups. Davening schedule CSV tools are under <strong>Schedules</strong>.</p>

      <div className="adm-ieCard">
        <h3 className="adm-ieCardTitle">Import</h3>
        <p className="adm-ieCardDesc">Choose a category. Schedules use the same group/event CSV flow as before; other lists use JSON arrays (export from backup or use the sample).</p>
        <div className="adm-ieTabBar" role="tablist" aria-label="Import category">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={importTab === t.id}
              className={`adm-ieTab ${importTab === t.id ? 'adm-ieTab--active' : ''}`}
              onClick={() => onImportTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {importTab === 'schedules' && (
          <ScheduleImportExportPanel
            schedules={schedules}
            groups={groups}
            onChange={onSchedulesChange}
            onGroupsChange={onGroupsChange}
            weekExportFetcher={weekExportFetcher}
          />
        )}

        {importTab === 'announcements' && (
          <JsonListImportSection
            title="Announcements"
            hint="Provide a JSON file containing an array of announcement objects (same fields as the admin editor). You can merge with existing data or replace the full list."
            sampleFilename="announcements-sample.json"
            sampleRow={annSample}
            currentCount={announcements.length}
            onApply={handleAnnouncementsApply}
          />
        )}

        {importTab === 'yahrzeits' && (
          <JsonListImportSection
            title="Yahrzeits"
            hint="JSON array of yahrzeit / memorial records. IDs should be unique; use append to add many at once."
            sampleFilename="yahrzeits-sample.json"
            sampleRow={yahSample}
            currentCount={memorials.length}
            onApply={handleMemorialsApply}
          />
        )}

        {importTab === 'sponsors' && (
          <JsonListImportSection
            title="Sponsors"
            hint="JSON array of sponsor records matching your organization's sponsor fields."
            sampleFilename="sponsors-sample.json"
            sampleRow={sponsorSample}
            currentCount={sponsors.length}
            onApply={handleSponsorsApply}
          />
        )}

        {importTab === 'media' && (
          <div>
            <p style={{ fontSize: 14, color: 'var(--adm-text-muted)', lineHeight: 1.5, margin: 0 }}>
              Images and flyers are uploaded per file from the <strong>Content Hub</strong> → Media &amp; Flyers section, or from the{' '}
              <strong>Display Editor</strong> when setting a background. There is no bulk image import here yet — use the content hub to add
              files one at a time.
            </p>
          </div>
        )}

        {importTab === 'beezee' && <ImportWizard onImport={onImportBeeZee} importResult={importResult} />}
      </div>

      <div className="adm-ieCard">
        <h3 className="adm-ieCardTitle">Export</h3>
        <p className="adm-ieCardDesc">Full org backup (JSON/CSV/ICS) and printable exports. Opens or downloads according to your browser settings.</p>
        <div style={{ maxWidth: '100%' }}>
          <ExportPanel onExport={onExport} />
        </div>
      </div>
    </div>
  );
}
