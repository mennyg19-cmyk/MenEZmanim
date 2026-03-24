'use client';

import React, { useMemo, useRef, useState } from 'react';
import type { VisibilityRule } from '@zmanim-app/core';
import {
  generateGroupsSampleCsv,
  generateEventsSampleCsv,
  parseGroupsCsv,
  parseEventsCsv,
  exportGroupsCsv,
  exportEventsCsv,
  downloadCsv,
  readFileAsText,
  type CsvGroup,
  type CsvSchedule,
} from '../shared/csvImportExport';
import {
  type WeeklyExportConfig,
  type WeekData,
  buildWeeklyExportCsv,
  getNextDayOfWeek,
  formatDateDisplay,
} from '../shared/weeklyExport';

/** Schedule row shape (matches admin store / ScheduleEditor) */
export interface ScheduleRecord {
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
  priority?: number;
  startDateGregorian?: string;
  endDateGregorian?: string;
  startDateHebrew?: string;
  endDateHebrew?: string;
  nearestEvent?: boolean;
  nearestBefore?: number;
  nearestAfter?: number;
}

export interface DaveningGroupRecord {
  id: string;
  name: string;
  nameHebrew: string;
  color: string;
  sortOrder: number;
  active: boolean;
}

export interface WeekExportFetcher {
  fetchZmanim: (date: Date) => Promise<Array<{ type: string; time: Date | null; label: string; hebrewLabel: string }>>;
  fetchCalendar: (date: Date) => Promise<{ parsha?: { upcoming?: string; upcomingHebrew?: string; parsha?: string; parshaHebrew?: string } }>;
}

export interface ScheduleImportExportPanelProps {
  schedules: ScheduleRecord[];
  groups: DaveningGroupRecord[];
  onChange: (s: ScheduleRecord[]) => void;
  onGroupsChange?: (g: DaveningGroupRecord[]) => void;
  weekExportFetcher?: WeekExportFetcher;
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--adm-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const tdStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 12,
  verticalAlign: 'middle',
};

export function ScheduleImportExportPanel({
  schedules,
  groups,
  onChange,
  onGroupsChange,
  weekExportFetcher,
}: ScheduleImportExportPanelProps) {
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
      if (parsed.length === 0) {
        setImportError('No groups found in the file. Make sure the CSV has headers and data rows.');
        return;
      }
      setGroupsPreview(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setImportError(`Failed to parse groups file: ${msg}`);
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
      if (parsed.length === 0) {
        setImportError('No events found in the file. Make sure the CSV has headers and data rows.');
        return;
      }
      setEventsPreview(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setImportError(`Failed to parse events file: ${msg}`);
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
      onChange(eventsPreview as ScheduleRecord[]);
    } else {
      const maxSort = schedules.reduce((m, s) => Math.max(m, s.sortOrder ?? 0), 0);
      const withSort = eventsPreview.map((ev, i) => ({
        ...ev,
        orgId: 'default',
        sortOrder: (ev.sortOrder ?? 0) + maxSort + 1 + i,
      }));
      onChange([...schedules, ...(withSort as ScheduleRecord[])]);
    }
    setEventsPreview(null);
    setImportSuccess(`Imported ${eventsPreview.length} event(s) successfully.`);
    if (eventsFileRef.current) eventsFileRef.current.value = '';
  };

  return (
    <div style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {importError && <div className="adm-ieMsg adm-ieMsg--err">{importError}</div>}
      {importSuccess && <div className="adm-ieMsg adm-ieMsg--ok">{importSuccess}</div>}

      <div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--adm-text)' }}>1. Download sample files</div>
        <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginBottom: 10 }}>
          Download a sample CSV, edit it in Excel / Google Sheets, then upload it below. The sample includes every possible column with
          example data.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => downloadCsv(generateGroupsSampleCsv(), 'groups-sample.csv')}
            className="adm-btnSmallOutline"
            style={{ padding: '8px 16px', color: 'var(--adm-accent)' }}
          >
            Download Groups Sample
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(generateEventsSampleCsv(), 'events-sample.csv')}
            className="adm-btnSmallOutline"
            style={{ padding: '8px 16px', color: 'var(--adm-accent)' }}
          >
            Download Events Sample
          </button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--adm-text)' }}>2. Choose import mode</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['append', 'replace'] as const).map((m) => (
            <button
              key={m}
              type="button"
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
          <div style={{ fontSize: 11, color: 'var(--adm-danger)', marginTop: 6 }}>
            Warning: Replace mode will delete all existing data of that type before importing.
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--adm-text)' }}>3. Upload Groups CSV</div>
        <input ref={groupsFileRef} type="file" accept=".csv,.txt" onChange={handleGroupsFile} style={{ fontSize: 13 }} />
        {groupsPreview && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Preview: {groupsPreview.length} group(s) found</div>
            <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--adm-border)', borderRadius: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--adm-border)', textAlign: 'left' }}>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Hebrew</th>
                    <th style={thStyle}>Color</th>
                    <th style={thStyle}>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {groupsPreview.map((g, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--adm-sched-border-soft)' }}>
                      <td style={tdStyle}>{g.name}</td>
                      <td style={tdStyle}>{g.nameHebrew}</td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: g.color,
                            verticalAlign: 'middle',
                          }}
                        />{' '}
                        {g.color}
                      </td>
                      <td style={tdStyle}>{g.active ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="button" onClick={confirmGroupsImport} className="adm-btnSave" style={{ padding: '8px 16px' }}>
                Import {groupsPreview.length} Group(s)
              </button>
              <button
                type="button"
                onClick={() => {
                  setGroupsPreview(null);
                  if (groupsFileRef.current) groupsFileRef.current.value = '';
                }}
                className="adm-btnCancel"
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--adm-text)' }}>4. Upload Events CSV</div>
        <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginBottom: 6 }}>
          Make sure to import groups first if your events reference group IDs.
        </div>
        <input ref={eventsFileRef} type="file" accept=".csv,.txt" onChange={handleEventsFile} style={{ fontSize: 13 }} />
        {eventsPreview && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Preview: {eventsPreview.length} event(s) found</div>
            <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--adm-border)', borderRadius: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--adm-border)', textAlign: 'left' }}>
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
                    <tr key={i} style={{ borderBottom: '1px solid var(--adm-sched-border-soft)' }}>
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
              <button type="button" onClick={confirmEventsImport} className="adm-btnSave" style={{ padding: '8px 16px' }}>
                Import {eventsPreview.length} Event(s)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEventsPreview(null);
                  if (eventsFileRef.current) eventsFileRef.current.value = '';
                }}
                className="adm-btnCancel"
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--adm-border)', paddingTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--adm-text)' }}>Export current data</div>
        <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginBottom: 10 }}>Download your current groups and events as CSV files.</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => downloadCsv(exportGroupsCsv(groups as CsvGroup[]), `groups-export-${new Date().toISOString().slice(0, 10)}.csv`)}
            className="adm-btnSmallOutline"
            style={{ padding: '8px 16px' }}
            disabled={groups.length === 0}
          >
            Export Groups ({groups.length})
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(exportEventsCsv(schedules as CsvSchedule[]), `events-export-${new Date().toISOString().slice(0, 10)}.csv`)}
            className="adm-btnSmallOutline"
            style={{ padding: '8px 16px' }}
            disabled={schedules.length === 0}
          >
            Export Events ({schedules.length})
          </button>
        </div>
      </div>

      {weekExportFetcher && (
        <MultiWeekExportSection schedules={schedules} groups={groups} fetcher={weekExportFetcher} />
      )}
    </div>
  );
}

function computeTimeForExport(schedule: ScheduleRecord, zmanim: Array<{ type: string; time: Date | null }>): string {
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
    if (!isNaN(hh) && !isNaN(mm)) {
      const lim = new Date(t);
      lim.setHours(hh, mm, 0, 0);
      if (t < lim) t = lim;
    }
  }
  if (schedule.limitAfter) {
    const [hh, mm] = schedule.limitAfter.split(':').map(Number);
    if (!isNaN(hh) && !isNaN(mm)) {
      const lim = new Date(t);
      lim.setHours(hh, mm, 0, 0);
      if (t > lim) t = lim;
    }
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
  schedules: ScheduleRecord[];
  groups: DaveningGroupRecord[];
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
      const startDate = getNextDayOfWeek(new Date(), 0);
      const weekDataList: WeekData[] = [];
      const eventNames = filteredEvents.map((e) => e.name);

      for (let w = 0; w < weeks; w++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + w * 7);

        const shabbos = new Date(weekStart);
        shabbos.setDate(shabbos.getDate() + 6);

        const dateForDisplay = dateDay === 'sunday' ? weekStart : shabbos;
        const zmanimDate = dateDay === 'shabbos' ? shabbos : weekStart;

        const [zmanimResult, calResult] = await Promise.all([fetcher.fetchZmanim(zmanimDate), fetcher.fetchCalendar(shabbos)]);

        const parsha =
          calResult?.parsha?.parshaHebrew ||
          calResult?.parsha?.parsha ||
          calResult?.parsha?.upcomingHebrew ||
          calResult?.parsha?.upcoming ||
          `Week ${w + 1}`;

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGenError(msg || 'Export failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ borderTop: '1px solid var(--adm-border)', paddingTop: 16, marginTop: 4 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--adm-text)' }}>Multi-week schedule export</div>
      <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginBottom: 12 }}>
        Export a table of event times across multiple weeks with parsha headers. Great for printing seasonal schedules.
      </div>

      {genError && <div className="adm-ieMsg adm-ieMsg--err" style={{ marginBottom: 10 }}>{genError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label className="adm-labelSm">Number of weeks</label>
          <input
            type="number"
            className="adm-input"
            value={weeks}
            onChange={(e) => setWeeks(Math.max(1, parseInt(e.target.value, 10) || 1))}
            min={1}
            max={52}
          />
        </div>
        <div>
          <label className="adm-labelSm">Parsha / weeks on</label>
          <select className="adm-select" value={parshaAxis} onChange={(e) => setParshaAxis(e.target.value as 'columns' | 'rows')}>
            <option value="columns">Columns (X axis)</option>
            <option value="rows">Rows (Y axis)</option>
          </select>
        </div>
        <div>
          <label className="adm-labelSm">Event names position</label>
          <select className="adm-select" value={eventNamesPos} onChange={(e) => setEventNamesPos(e.target.value as 'left' | 'right')}>
            <option value="left">Left / Top</option>
            <option value="right">Right / Bottom</option>
          </select>
        </div>
        <div>
          <label className="adm-labelSm">Date display day</label>
          <select className="adm-select" value={dateDay} onChange={(e) => setDateDay(e.target.value as 'sunday' | 'shabbos')}>
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
        type="button"
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
