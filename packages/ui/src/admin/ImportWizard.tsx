'use client';

import React, { useState } from 'react';


interface ImportWizardProps {
  onImport: (sourcePath: string) => Promise<any>;
  importResult: any;
}

export function ImportWizard({ onImport, importResult }: ImportWizardProps) {
  const [step, setStep] = useState(1);
  const [sourcePath, setSourcePath] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoadPreview = async () => {
    if (!sourcePath.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await onImport(sourcePath);
      setPreview(result);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to load import source');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setLoading(true);
    setError('');
    try {
      await onImport(sourcePath);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const stepIndicator = (stepNum: number, label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          backgroundColor: step >= stepNum ? 'var(--adm-accent-dark)' : 'var(--adm-border)',
          color: step >= stepNum ? '#fff' : 'var(--adm-text-dim)',
        }}
      >
        {step > stepNum ? '✓' : stepNum}
      </div>
      <span style={{ fontSize: 14, color: step >= stepNum ? 'var(--adm-text)' : 'var(--adm-text-dim)', fontWeight: step === stepNum ? 600 : 400 }}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="adm-card" style={{ maxWidth: 640 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 600 }}>ייבוא — BeeZee Import Wizard</h2>

      <div style={{ display: 'flex', gap: 24, marginBottom: 24, padding: '0 0 16px', borderBottom: '1px solid var(--adm-border)' }}>
        {stepIndicator(1, 'Source Path')}
        <div style={{ width: 40, height: 1, backgroundColor: 'var(--adm-border)', alignSelf: 'center' }} />
        {stepIndicator(2, 'Preview')}
        <div style={{ width: 40, height: 1, backgroundColor: 'var(--adm-border)', alignSelf: 'center' }} />
        {stepIndicator(3, 'Results')}
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: 'var(--adm-danger)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {step === 1 && (
        <div>
          <label className="adm-label">
            Source Path / נתיב מקור
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="adm-inputLg"
              value={sourcePath}
              onChange={(e) => setSourcePath(e.target.value)}
              placeholder="e.g. C:\BeeZee\data or /path/to/beezee"
            />
            <button
              className="adm-btnCancel"
              style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
              disabled
              title="Browse not available in this context"
            >
              Browse...
            </button>
          </div>
          <button
            onClick={handleLoadPreview}
            disabled={loading || !sourcePath.trim()}
            className="adm-btnPrimary"
            style={{ marginTop: 16, padding: '10px 24px', fontSize: 14, fontWeight: 600, opacity: loading || !sourcePath.trim() ? 0.6 : 1 }}
          >
            {loading ? 'Loading...' : 'Load Preview'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>Import Preview</h3>
          <div className="adm-formPanel">
            {preview ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {Object.entries(preview).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' }}>
                    <span style={{ color: 'var(--adm-text-muted)' }}>{key}:</span>
                    <span style={{ fontWeight: 600 }}>{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--adm-text-muted)', margin: 0, fontSize: 14 }}>No preview data available.</p>
            )}
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={() => setStep(1)} className="adm-btnCancel" style={{ padding: '10px 24px', fontSize: 14 }}>
              Back
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={loading}
              className="adm-btnSave"
              style={{ padding: '10px 24px', fontSize: 14, fontWeight: 600, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Importing...' : 'Confirm Import'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>Import Complete</h3>
            <p style={{ color: 'var(--adm-text-muted)', fontSize: 14, margin: '0 0 16px' }}>
              Data has been successfully imported.
            </p>
          </div>
          {importResult && (
            <div className="adm-formPanel" style={{ marginBottom: 16 }}>
              <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap', color: 'var(--adm-text)' }}>
                {JSON.stringify(importResult, null, 2)}
              </pre>
            </div>
          )}
          <button
            onClick={() => { setStep(1); setSourcePath(''); setPreview(null); }}
            className="adm-btnPrimary"
            style={{ padding: '10px 24px', fontSize: 14 }}
          >
            Import Another
          </button>
        </div>
      )}
    </div>
  );
}
