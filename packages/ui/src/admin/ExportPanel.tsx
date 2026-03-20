'use client';

import React, { useState } from 'react';


interface ExportPanelProps {
  onExport: (type: string, options: any) => Promise<void>;
}

type ExportType = 'PDF' | 'CSV' | 'JSON' | 'ICS' | 'Image';

const EXPORT_TYPES: { type: ExportType; icon: string; description: string }[] = [
  { type: 'PDF', icon: '📄', description: 'Export zmanim as a printable PDF' },
  { type: 'CSV', icon: '📊', description: 'Export data as CSV spreadsheet' },
  { type: 'JSON', icon: '💾', description: 'Full backup in JSON format' },
  { type: 'ICS', icon: '📅', description: 'Calendar events in ICS format' },
  { type: 'Image', icon: '🖼️', description: 'Screenshot of current display' },
];

const CSV_ENTITIES = ['zmanim', 'yahrzeits', 'schedules', 'sponsors', 'announcements'];

export function ExportPanel({ onExport }: ExportPanelProps) {
  const [selectedType, setSelectedType] = useState<ExportType>('PDF');
  const [exporting, setExporting] = useState(false);

  const [pdfDateFrom, setPdfDateFrom] = useState('');
  const [pdfDateTo, setPdfDateTo] = useState('');
  const [pdfZmanim, setPdfZmanim] = useState('');

  const [csvEntities, setCsvEntities] = useState<string[]>(['zmanim']);

  const [icsDateFrom, setIcsDateFrom] = useState('');
  const [icsDateTo, setIcsDateTo] = useState('');
  const [icsEvents, setIcsEvents] = useState('');

  const handleExport = async () => {
    setExporting(true);
    try {
      const options: any = {};
      switch (selectedType) {
        case 'PDF':
          options.dateFrom = pdfDateFrom;
          options.dateTo = pdfDateTo;
          options.zmanim = pdfZmanim;
          break;
        case 'CSV':
          options.entities = csvEntities;
          break;
        case 'JSON':
          break;
        case 'ICS':
          options.dateFrom = icsDateFrom;
          options.dateTo = icsDateTo;
          options.events = icsEvents;
          break;
        case 'Image':
          break;
      }
      await onExport(selectedType, options);
    } finally {
      setExporting(false);
    }
  };

  const toggleCsvEntity = (entity: string) => {
    setCsvEntities((prev) =>
      prev.includes(entity) ? prev.filter((e) => e !== entity) : [...prev, entity]
    );
  };

  const renderOptions = () => {
    switch (selectedType) {
      case 'PDF':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="adm-label">Date From</label>
                <input className="adm-inputLg" type="date" value={pdfDateFrom} onChange={(e) => setPdfDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="adm-label">Date To</label>
                <input className="adm-inputLg" type="date" value={pdfDateTo} onChange={(e) => setPdfDateTo(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="adm-label">Which Zmanim (comma-separated)</label>
              <input className="adm-inputLg" value={pdfZmanim} onChange={(e) => setPdfZmanim(e.target.value)} placeholder="e.g. hanetz, shkia, tzeis (leave empty for all)" />
            </div>
          </div>
        );
      case 'CSV':
        return (
          <div>
            <label className="adm-label">Select Entities</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {CSV_ENTITIES.map((entity) => (
                <label key={entity} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={csvEntities.includes(entity)}
                    onChange={() => toggleCsvEntity(entity)}
                  />
                  {entity.charAt(0).toUpperCase() + entity.slice(1)}
                </label>
              ))}
            </div>
          </div>
        );
      case 'JSON':
        return (
          <p style={{ color: 'var(--adm-text-muted)', fontSize: 14, margin: 0 }}>
            Exports a complete backup of all data in JSON format. No additional options needed.
          </p>
        );
      case 'ICS':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="adm-label">Date From</label>
                <input className="adm-inputLg" type="date" value={icsDateFrom} onChange={(e) => setIcsDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="adm-label">Date To</label>
                <input className="adm-inputLg" type="date" value={icsDateTo} onChange={(e) => setIcsDateTo(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="adm-label">Which Events (comma-separated)</label>
              <input className="adm-inputLg" value={icsEvents} onChange={(e) => setIcsEvents(e.target.value)} placeholder="e.g. shabbat, yomtov (leave empty for all)" />
            </div>
          </div>
        );
      case 'Image':
        return (
          <p style={{ color: 'var(--adm-text-muted)', fontSize: 14, margin: 0 }}>
            Captures a screenshot of the current display board. No additional options needed.
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <div className="adm-card" style={{ maxWidth: 640 }}>
      <h2 className="adm-pageTitle" style={{ margin: '0 0 20px' }}>ייצוא — Export</h2>

      <div className="adm-tabBar" style={{ border: 'none', marginBottom: 20, gap: 8 }}>
        {EXPORT_TYPES.map((et) => (
          <button
            key={et.type}
            onClick={() => setSelectedType(et.type)}
            className={selectedType === et.type ? "adm-tabActive" : "adm-tab"}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: selectedType === et.type ? '2px solid var(--adm-accent-dark)' : '1px solid var(--adm-border)',
              borderRadius: 8,
              backgroundColor: selectedType === et.type ? 'var(--adm-bg-active)' : 'var(--adm-bg)',
              textAlign: 'center',
              marginBottom: 0,
            }}
          >
            <div style={{ fontSize: 24 }}>{et.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{et.type}</div>
          </button>
        ))}
      </div>

      <div style={{ fontSize: 13, color: 'var(--adm-text-muted)', marginBottom: 16 }}>
        {EXPORT_TYPES.find((e) => e.type === selectedType)?.description}
      </div>

      <div className="adm-formPanel" style={{ marginBottom: 20 }}>
        {renderOptions()}
      </div>

      <button
        onClick={handleExport}
        disabled={exporting}
        className="adm-btnPrimary"
        style={{
          padding: '10px 24px',
          fontSize: 14,
          opacity: exporting ? 0.6 : 1,
        }}
      >
        {exporting ? 'Exporting...' : `Export ${selectedType}`}
      </button>
    </div>
  );
}
