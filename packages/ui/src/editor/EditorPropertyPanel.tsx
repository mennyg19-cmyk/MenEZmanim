'use client';

import React from 'react';
import { DisplayObjectType, type DisplayObject, type Position } from '@zmanim-app/core';
import { TYPE_LABELS, FONT_CATEGORIES, ZMANIM_OPTIONS_REGULAR, ZMANIM_OPTIONS_TUKACHINSKY } from '../shared/constants';
import { BgMode, getObjBgMode } from '../shared/backgroundUtils';
import { GradientPicker } from './GradientPicker';
import { TexturePicker } from './TexturePicker';
import { FramePicker } from './FramePicker';
import { hexToRgba, extractHex } from '../shared/colorUtils';
import { Field, Section, Input, NumInput, ColorInput, Select, Toggle } from './FormPrimitives';


interface DaveningGroupInfo {
  id: string;
  name: string;
  nameHebrew: string;
  color: string;
}

interface EditorPropertyPanelProps {
  popupObj: DisplayObject;
  popupTab: 'general' | 'appearance' | 'content';
  setPopupTab: (t: 'general' | 'appearance' | 'content') => void;
  setPopupId: (id: string | null) => void;
  setSelectedId: (id: string | null) => void;
  setSelectedIds: (ids: Set<string>) => void;
  pUpdate: (patch: Partial<DisplayObject>) => void;
  pPos: (patch: Partial<Position>) => void;
  pFont: (patch: Partial<DisplayObject['font']>) => void;
  pContent: (patch: Record<string, any>) => void;
  deleteObj: (id: string) => void;
  daveningGroups: DaveningGroupInfo[];
  onUploadImage?: (file: File) => Promise<string | null>;
  boxBgUploading: boolean;
  setBoxBgUploading: (v: boolean) => void;
  boxBgFileRef: React.RefObject<HTMLInputElement | null>;
}

export function EditorPropertyPanel({
  popupObj, popupTab, setPopupTab, setPopupId, setSelectedId, setSelectedIds,
  pUpdate, pPos, pFont, pContent, deleteObj, daveningGroups, onUploadImage,
  boxBgUploading, setBoxBgUploading, boxBgFileRef,
}: EditorPropertyPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header */}
      <div className="ed-panelHeaderBg">
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{popupObj.name}</div>
          <div className="ed-objType" style={{ marginTop: 1 }}>{(TYPE_LABELS as any)[popupObj.type]}</div>
        </div>
        <button onClick={() => { setPopupId(null); setSelectedId(null); setSelectedIds(new Set()); }} className="ed-closeBtn">&times;</button>
      </div>

      {/* Tabs */}
      <div className="ed-tabBar">
        {(['general', 'appearance', 'content'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setPopupTab(tab)}
            className={popupTab === tab ? "ed-tabActive" : "ed-tab"}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="ed-panelBody">
        {popupTab === 'general' && <GeneralTab popupObj={popupObj} pUpdate={pUpdate} pPos={pPos} />}
        {popupTab === 'appearance' && (
          <AppearanceTab
            popupObj={popupObj}
            pFont={pFont}
            pContent={pContent}
            pUpdate={pUpdate}
            onUploadImage={onUploadImage}
            boxBgUploading={boxBgUploading}
            setBoxBgUploading={setBoxBgUploading}
            boxBgFileRef={boxBgFileRef}
          />
        )}
        {popupTab === 'content' && (
          <ContentTab popupObj={popupObj} pContent={pContent} daveningGroups={daveningGroups} />
        )}
      </div>

      {/* Footer */}
      <div className="ed-panelFooter">
        <button
          onClick={() => { setPopupId(null); setSelectedId(null); setSelectedIds(new Set()); }}
          className="ed-btnSmall"
        >
          Back to list
        </button>
        <button
          onClick={() => deleteObj(popupObj.id)}
          className="ed-btnDangerFull"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

/* ── Tab: General ──────────────────────────────────────── */

function GeneralTab({ popupObj, pUpdate, pPos }: {
  popupObj: DisplayObject;
  pUpdate: (patch: Partial<DisplayObject>) => void;
  pPos: (patch: Partial<Position>) => void;
}) {
  return (
    <>
      <Field label="Name">
        <Input value={popupObj.name} onChange={(v) => pUpdate({ name: v })} />
      </Field>
      <Field label="Language">
        <Select value={popupObj.language} onChange={(v) => pUpdate({ language: v as any })} options={[['hebrew', 'Hebrew'], ['english', 'English'], ['yiddish', 'Yiddish']]} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="X"><NumInput value={Math.round(popupObj.position.x)} onChange={(v) => pPos({ x: v })} /></Field>
        <Field label="Y"><NumInput value={Math.round(popupObj.position.y)} onChange={(v) => pPos({ y: v })} /></Field>
        <Field label="Width"><NumInput value={Math.round(popupObj.position.width)} onChange={(v) => pPos({ width: Math.max(20, v) })} /></Field>
        <Field label="Height"><NumInput value={Math.round(popupObj.position.height)} onChange={(v) => pPos({ height: Math.max(20, v) })} /></Field>
      </div>
      <Field label="Z-Index"><NumInput value={popupObj.zIndex} onChange={(v) => pUpdate({ zIndex: v })} /></Field>
      <Field label="Visible">
        <Toggle checked={popupObj.visible} onChange={(v) => pUpdate({ visible: v })} />
      </Field>
    </>
  );
}

/* ── Tab: Appearance ──────────────────────────────────── */

function AppearanceTab({ popupObj, pFont, pContent, pUpdate, onUploadImage, boxBgUploading, setBoxBgUploading, boxBgFileRef }: {
  popupObj: DisplayObject;
  pFont: (patch: Partial<DisplayObject['font']>) => void;
  pContent: (patch: Record<string, any>) => void;
  pUpdate: (patch: Partial<DisplayObject>) => void;
  onUploadImage?: (file: File) => Promise<string | null>;
  boxBgUploading: boolean;
  setBoxBgUploading: (v: boolean) => void;
  boxBgFileRef: React.RefObject<HTMLInputElement | null>;
}) {
  const content = popupObj.content || {};
  const isTable = popupObj.type === DisplayObjectType.ZMANIM_TABLE || popupObj.type === DisplayObjectType.EVENTS_TABLE;

  return (
    <>
      <Section title="Font & Text">
        <Field label="Font Family">
          <select
            value={popupObj.font.family}
            onChange={(e) => pFont({ family: e.target.value })}
            className="ed-input"
            style={{ fontFamily: popupObj.font.family }}
          >
            {FONT_CATEGORIES.map((cat) => (
              <optgroup key={cat.label} label={cat.label}>
                {cat.fonts.map((f) => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                    {f.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="ed-fontPreview">
            <span style={{ fontFamily: popupObj.font.family, fontSize: 16, color: 'var(--ed-text)' }}>
              אבגד — Preview 123
            </span>
          </div>
        </Field>
        <Field label="Font Size"><NumInput value={popupObj.font.size} onChange={(v) => pFont({ size: Math.max(1, v) })} /></Field>
        <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
          <label className="ed-checkRow">
            <input type="checkbox" checked={popupObj.font.bold} onChange={(e) => pFont({ bold: e.target.checked })} /> Bold
          </label>
          <label className="ed-checkRow">
            <input type="checkbox" checked={popupObj.font.italic} onChange={(e) => pFont({ italic: e.target.checked })} /> Italic
          </label>
        </div>
        <Field label="Text Color"><ColorInput value={popupObj.font.color} onChange={(v) => pFont({ color: v })} /></Field>
        <TextAlignField popupObj={popupObj} pContent={pContent} />
        <VerticalAlignField popupObj={popupObj} pContent={pContent} />
      </Section>

      <Section title="Background">
        <BackgroundSection popupObj={popupObj} pContent={pContent} pUpdate={pUpdate} onUploadImage={onUploadImage} boxBgUploading={boxBgUploading} setBoxBgUploading={setBoxBgUploading} boxBgFileRef={boxBgFileRef} />
      </Section>

      <Section title="Frame" defaultOpen={false}>
        <FramePicker
          value={content.frameId as string | undefined}
          onChange={(id) => pContent({ frameId: id })}
        />
      </Section>

      {isTable && <TableLayoutSection popupObj={popupObj} pContent={pContent} />}
      {isTable && <BorderSection popupObj={popupObj} pContent={pContent} />}
      {popupObj.type === DisplayObjectType.EVENTS_TABLE && <HeaderRowSection popupObj={popupObj} pContent={pContent} />}
      {isTable && <RowStylingSection popupObj={popupObj} pContent={pContent} />}
    </>
  );
}

/* ── Tab: Content ─────────────────────────────────────── */

function ContentTab({ popupObj, pContent, daveningGroups }: {
  popupObj: DisplayObject;
  pContent: (patch: Record<string, any>) => void;
  daveningGroups: DaveningGroupInfo[];
}) {
  const content = popupObj.content || {};

  return (
    <>
      {popupObj.type === DisplayObjectType.PLAIN_TEXT && (
        <Field label="Text">
          <textarea value={content.text || ''} onChange={(e) => pContent({ text: e.target.value })} rows={4} className="ed-input" style={{ resize: 'vertical' }} />
        </Field>
      )}
      {popupObj.type === DisplayObjectType.RICH_TEXT && (
        <Field label="HTML Content">
          <textarea value={content.html || ''} onChange={(e) => pContent({ html: e.target.value })} rows={4} className="ed-input" style={{ resize: 'vertical' }} />
        </Field>
      )}
      {popupObj.type === DisplayObjectType.ZMANIM_TABLE && (
        <>
          <Section title="Regular Zmanim">
            <Field label="Zmanim to show">
              {ZMANIM_OPTIONS_REGULAR.map((z) => (
                <label key={z.key} className="ed-checkRow" style={{ marginBottom: 3 }}>
                  <input type="checkbox" checked={content.zmanim?.[z.key] ?? true} onChange={(e) => pContent({ zmanim: { ...(content.zmanim || {}), [z.key]: e.target.checked } })} />
                  {z.label}
                </label>
              ))}
            </Field>
          </Section>
          <Section title="Tukachinsky Zmanim">
            <Field label="Tukachinsky variants">
              {ZMANIM_OPTIONS_TUKACHINSKY.map((z) => (
                <label key={z.key} className="ed-checkRow" style={{ marginBottom: 3 }}>
                  <input type="checkbox" checked={content.zmanim?.[z.key] ?? false} onChange={(e) => pContent({ zmanim: { ...(content.zmanim || {}), [z.key]: e.target.checked } })} />
                  {z.label}
                </label>
              ))}
            </Field>
          </Section>
        </>
      )}
      {popupObj.type === DisplayObjectType.DIGITAL_CLOCK && (
        <>
          <Field label="24 Hour Format"><Toggle checked={content.format24h ?? false} onChange={(v) => pContent({ format24h: v })} /></Field>
          <Field label="Show Seconds"><Toggle checked={content.showSeconds ?? true} onChange={(v) => pContent({ showSeconds: v })} /></Field>
          <Field label="Show AM / PM"><Toggle checked={content.showAmPm ?? true} onChange={(v) => pContent({ showAmPm: v })} /></Field>
        </>
      )}
      {popupObj.type === DisplayObjectType.MEDIA_VIEWER && (
        <Field label="Media URL"><Input value={content.url || ''} onChange={(v) => pContent({ url: v })} placeholder="https://..." /></Field>
      )}
      {popupObj.type === DisplayObjectType.SCROLLING_TICKER && (
        <Field label="Ticker Text">
          <textarea value={content.text || ''} onChange={(e) => pContent({ text: e.target.value })} rows={3} className="ed-input" style={{ resize: 'vertical' }} />
        </Field>
      )}
      {popupObj.type === DisplayObjectType.COUNTDOWN_TIMER && (
        <Field label="Target Label"><Input value={content.label || ''} onChange={(v) => pContent({ label: v })} placeholder="e.g. Shabbos" /></Field>
      )}
      {popupObj.type === DisplayObjectType.EVENTS_TABLE && (
        <>
          <Section title="Display Settings">
            <Field label="Title">
              <Input value={content.title || ''} onChange={(v) => pContent({ title: v })} placeholder="e.g. מניינים" />
            </Field>
            <Field label="Show Room">
              <Toggle checked={content.showRoom ?? false} onChange={(v) => pContent({ showRoom: v })} />
            </Field>
          </Section>
          <Section title="Davening Groups">
            <DaveningGroupsSection popupObj={popupObj} pContent={pContent} daveningGroups={daveningGroups} />
          </Section>
          <Section title="Event Emphasis" defaultOpen={false}>
            <EmphasisSection popupObj={popupObj} pContent={pContent} />
          </Section>
        </>
      )}
      {popupObj.type === DisplayObjectType.JEWISH_INFO && (
        <>
          <Section title="Display Items">
            <JewishInfoItemsSection popupObj={popupObj} pContent={pContent} />
          </Section>
          <Section title="Title Settings" defaultOpen={false}>
            <JewishInfoTitleSection popupObj={popupObj} pContent={pContent} />
          </Section>
        </>
      )}
      {[DisplayObjectType.ANALOG_CLOCK, DisplayObjectType.YAHRZEIT_DISPLAY, DisplayObjectType.FIDS_BOARD, DisplayObjectType.SEFIRA_COUNTER].includes(popupObj.type) && (
        <div className="ed-hint">This widget auto-populates its content from data.</div>
      )}
    </>
  );
}

/* ── Shared Appearance Sub-Sections ───────────────────── */

function TextAlignField({ popupObj, pContent }: { popupObj: DisplayObject; pContent: (p: Record<string, any>) => void }) {
  return (
    <Field label="Text Align">
      <div style={{ display: 'flex', gap: 4 }}>
        {(['left', 'center', 'right'] as const).map((a) => {
          const active = popupObj.content?.textAlign === a || (!popupObj.content?.textAlign && a === 'center');
          return (
          <button
            key={a}
            onClick={() => pContent({ textAlign: a })}
            className={active ? "ed-optionBtnActive" : "ed-optionBtn"}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              {a === 'left' && <><rect x="1" y="2" width="12" height="1.5" rx="0.5"/><rect x="1" y="5.5" width="8" height="1.5" rx="0.5"/><rect x="1" y="9" width="10" height="1.5" rx="0.5"/></>}
              {a === 'center' && <><rect x="1" y="2" width="12" height="1.5" rx="0.5"/><rect x="3" y="5.5" width="8" height="1.5" rx="0.5"/><rect x="2" y="9" width="10" height="1.5" rx="0.5"/></>}
              {a === 'right' && <><rect x="1" y="2" width="12" height="1.5" rx="0.5"/><rect x="5" y="5.5" width="8" height="1.5" rx="0.5"/><rect x="3" y="9" width="10" height="1.5" rx="0.5"/></>}
            </svg>
            {a.charAt(0).toUpperCase() + a.slice(1)}
          </button>
          );
        })}
      </div>
    </Field>
  );
}

function VerticalAlignField({ popupObj, pContent }: { popupObj: DisplayObject; pContent: (p: Record<string, any>) => void }) {
  return (
    <Field label="Vertical Align">
      <div style={{ display: 'flex', gap: 4 }}>
        {(['top', 'middle', 'bottom'] as const).map((v) => {
          const active = popupObj.content?.verticalAlign === v || (!popupObj.content?.verticalAlign && v === 'top');
          return (
            <button
              key={v}
              onClick={() => pContent({ verticalAlign: v })}
              className={active ? "ed-optionBtnActive" : "ed-optionBtn"}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

function BackgroundSection({ popupObj, pContent, pUpdate, onUploadImage, boxBgUploading, setBoxBgUploading, boxBgFileRef }: {
  popupObj: DisplayObject;
  pContent: (p: Record<string, any>) => void;
  pUpdate: (p: Partial<DisplayObject>) => void;
  onUploadImage?: (file: File) => Promise<string | null>;
  boxBgUploading: boolean;
  setBoxBgUploading: (v: boolean) => void;
  boxBgFileRef: React.RefObject<HTMLInputElement | null>;
}) {
  const bgMode = getObjBgMode(popupObj);
  return (
    <Field label="Background Mode">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {([
          ['solid', 'Solid Color', '\uD83C\uDFA8'],
          ['transparent', 'Transparent', '\uD83D\uDD0D'],
          ['gradient', 'Gradient', '\u25C6'],
          ['texture', 'Texture', '\u25A7'],
          ['image', 'Image', '\uD83D\uDDBC\uFE0F'],
          ['canvas', 'Canvas BG', '\uD83E\uDE9F'],
        ] as [BgMode, string, string][]).map(([mode, label, icon]) => {
          const active = bgMode === mode;
          return (
            <button
              key={mode}
              onClick={() => {
                if (mode === 'gradient') {
                  pContent({
                    backgroundMode: 'gradient',
                    gradientValue:
                      (popupObj.content?.gradientValue as string) ||
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  });
                } else if (mode === 'texture') {
                  pContent({
                    backgroundMode: 'texture',
                    textureId: (popupObj.content?.textureId as string) || 'linen',
                  });
                } else {
                  pContent({ backgroundMode: mode });
                }
              }}
              className={active ? "ed-bgModeBtnActive" : "ed-bgModeBtn"}
              title={label}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      {bgMode === 'solid' && (
        <ColorInput value={popupObj.backgroundColor || '#000000'} onChange={(v) => pUpdate({ backgroundColor: v })} />
      )}
      {bgMode === 'transparent' && (
        <div className="ed-hint">Fully transparent — objects behind will be visible.</div>
      )}
      {bgMode === 'image' && (
        <div>
          {popupObj.content?.backgroundImageUrl && (
            <div style={{ marginBottom: 6, borderRadius: 4, overflow: 'hidden', border: '1px solid #334155', height: 60 }}>
              <img src={popupObj.content.backgroundImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <input ref={boxBgFileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !onUploadImage) return;
              try { setBoxBgUploading(true); const url = await onUploadImage(file); if (url) pContent({ backgroundImageUrl: url }); }
              finally { setBoxBgUploading(false); if (boxBgFileRef.current) boxBgFileRef.current.value = ''; }
            }}
          />
          <button onClick={() => boxBgFileRef.current?.click()} disabled={boxBgUploading || !onUploadImage}
            className="ed-btnSmall" style={{ width: '100%', cursor: boxBgUploading ? 'wait' : 'pointer' }}>
            {boxBgUploading ? 'Uploading...' : popupObj.content?.backgroundImageUrl ? 'Change Image' : 'Upload Image'}
          </button>
          {popupObj.content?.backgroundImageUrl && (
            <button onClick={() => pContent({ backgroundImageUrl: undefined })}
              className="ed-btnDangerFull" style={{ marginTop: 4, width: '100%' }}>
              Remove Image
            </button>
          )}
        </div>
      )}
      {bgMode === 'gradient' && (
        <GradientPicker onChange={(css) => pContent({ gradientValue: css })} />
      )}
      {bgMode === 'texture' && (
        <TexturePicker
          value={typeof popupObj.content?.textureId === 'string' ? popupObj.content.textureId : undefined}
          onChange={(id) => pContent({ textureId: id })}
        />
      )}
      {bgMode === 'canvas' && (
        <div className="ed-hint">Shows the canvas background (color/image), hiding objects underneath.</div>
      )}
    </Field>
  );
}

function TableLayoutSection({ popupObj, pContent }: { popupObj: DisplayObject; pContent: (p: Record<string, any>) => void }) {
  const content = popupObj.content || {};
  return (
    <Section title="Table Layout" defaultOpen={false}>
      <Field label="Time Format">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label className="ed-checkRow">
            <input type="checkbox" checked={content.use24h ?? false} onChange={(e) => pContent({ use24h: e.target.checked, hideAmPm: e.target.checked ? false : content.hideAmPm })} />
            24-hour format
          </label>
          {!content.use24h && (
            <label className="ed-checkRow">
              <input type="checkbox" checked={content.hideAmPm ?? false} onChange={(e) => pContent({ hideAmPm: e.target.checked })} />
              Hide AM/PM
            </label>
          )}
        </div>
      </Field>
      <Field label={`Columns: ${content.columns ?? 1}`}>
        <input type="range" min={1} max={4} step={1} value={content.columns ?? 1} onChange={(e) => pContent({ columns: parseInt(e.target.value) })} className="ed-range" />
      </Field>
      {(content.columns ?? 1) > 1 && (
        <>
          <Field label="Column Split">
            <div style={{ display: 'flex', gap: 4 }}>
              {(['even', 'fill'] as const).map((m) => {
                const active = (content.columnSplit ?? 'fill') === m;
                return (
                  <button key={m} onClick={() => pContent({ columnSplit: m })} className={active ? "ed-optionBtnSmActive" : "ed-optionBtnSm"}>
                    {m === 'even' ? 'Even Split' : 'Fill Height'}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label={`Column Gap: ${content.columnGap ?? 0}px`}>
            <input type="range" min={0} max={60} step={2} value={content.columnGap ?? 0} onChange={(e) => pContent({ columnGap: parseInt(e.target.value) })} className="ed-range" />
          </Field>
          <Field label="Column Separator">
            <Toggle checked={content.columnSeparator ?? false} onChange={(v) => pContent({ columnSeparator: v })} />
          </Field>
          {content.columnSeparator && (
            <>
              <Field label="Separator Color">
                <ColorInput value={content.columnSeparatorColor ?? 'rgba(0,0,0,0.1)'} onChange={(v) => pContent({ columnSeparatorColor: v })} />
              </Field>
              <Field label={`Separator Width: ${content.columnSeparatorWidth ?? 1}px`}>
                <input type="range" min={1} max={5} step={1} value={content.columnSeparatorWidth ?? 1} onChange={(e) => pContent({ columnSeparatorWidth: parseInt(e.target.value) })} className="ed-range" />
              </Field>
            </>
          )}
        </>
      )}
    </Section>
  );
}

function BorderSection({ popupObj, pContent }: { popupObj: DisplayObject; pContent: (p: Record<string, any>) => void }) {
  const content = popupObj.content || {};
  return (
    <Section title="Border" defaultOpen={false}>
      <Field label={`Border Width: ${content.borderWidth ?? 0}px`}>
        <input type="range" min={0} max={5} step={1} value={content.borderWidth ?? 0} onChange={(e) => pContent({ borderWidth: parseInt(e.target.value) })} className="ed-range" />
      </Field>
      {(content.borderWidth ?? 0) > 0 && (
        <>
          <Field label="Border Color">
            <ColorInput value={content.borderColor ?? 'rgba(0,0,0,0.1)'} onChange={(v) => pContent({ borderColor: v })} />
          </Field>
          <Field label={`Border Radius: ${content.borderRadius ?? 0}px`}>
            <input type="range" min={0} max={20} step={1} value={content.borderRadius ?? 0} onChange={(e) => pContent({ borderRadius: parseInt(e.target.value) })} className="ed-range" />
          </Field>
        </>
      )}
    </Section>
  );
}

function HeaderRowSection({ popupObj, pContent }: { popupObj: DisplayObject; pContent: (p: Record<string, any>) => void }) {
  const content = popupObj.content || {};
  return (
    <Section title="Header Row" defaultOpen={false}>
      <Field label="Show Header Row">
        <Toggle checked={content.showHeader ?? true} onChange={(v) => pContent({ showHeader: v })} />
      </Field>
      {(content.showHeader ?? true) && (
        <>
          <Field label="Header Background">
            <ColorInput value={content.headerBg ?? 'transparent'} onChange={(v) => pContent({ headerBg: v })} />
          </Field>
          <Field label={`Header Font Size: ${content.headerFontSize ?? Math.round(popupObj.font.size * 0.85)}`}>
            <input type="range" min={8} max={60} step={1} value={content.headerFontSize ?? Math.round(popupObj.font.size * 0.85)} onChange={(e) => pContent({ headerFontSize: parseInt(e.target.value) })} className="ed-range" />
          </Field>
          <Field label="Header Text Color">
            <ColorInput value={content.headerColor ?? popupObj.font.color} onChange={(v) => pContent({ headerColor: v })} />
          </Field>
          <Field label="Header Bottom Border">
            <Input value={content.headerBorderBottom ?? '1px solid rgba(0,0,0,0.08)'} onChange={(v) => pContent({ headerBorderBottom: v })} placeholder="e.g. 2px solid #333" />
          </Field>
        </>
      )}
    </Section>
  );
}

function RowStylingSection({ popupObj, pContent }: { popupObj: DisplayObject; pContent: (p: Record<string, any>) => void }) {
  const content = popupObj.content || {};
  return (
    <Section title="Row Styling" defaultOpen={false}>
      <Field label="Row Color 1 (even rows)">
        <div className="ed-rowColorRow">
          <input type="color" value={extractHex(content.rowColor1) || '#000000'} onChange={(e) => { const op = content.rowColor1Opacity ?? 0; pContent({ rowColor1: hexToRgba(e.target.value, op) }); }} className="ed-rowColorSwatch" />
          <input type="range" min={0} max={100} step={1} value={Math.round((content.rowColor1Opacity ?? 0) * 100)} onChange={(e) => { const op = parseInt(e.target.value) / 100; const hex = extractHex(content.rowColor1) || '#000000'; pContent({ rowColor1: hexToRgba(hex, op), rowColor1Opacity: op }); }} className="ed-range" style={{ flex: 1 }} title="Opacity" />
          <span className="ed-rowColorOpacity">{Math.round((content.rowColor1Opacity ?? 0) * 100)}%</span>
          {content.rowColor1 && (
            <button onClick={() => pContent({ rowColor1: undefined, rowColor1Opacity: undefined })} className="ed-rowColorClear">x</button>
          )}
        </div>
      </Field>
      <Field label="Row Color 2 (odd rows)">
        <div className="ed-rowColorRow">
          <input type="color" value={extractHex(content.rowColor2 || content.rowAltBg) || '#000000'} onChange={(e) => { const op = content.rowColor2Opacity ?? 0.03; pContent({ rowColor2: hexToRgba(e.target.value, op), rowAltBg: undefined }); }} className="ed-rowColorSwatch" />
          <input type="range" min={0} max={100} step={1} value={Math.round((content.rowColor2Opacity ?? 0.03) * 100)} onChange={(e) => { const op = parseInt(e.target.value) / 100; const hex = extractHex(content.rowColor2 || content.rowAltBg) || '#000000'; pContent({ rowColor2: hexToRgba(hex, op), rowColor2Opacity: op, rowAltBg: undefined }); }} className="ed-range" style={{ flex: 1 }} title="Opacity" />
          <span className="ed-rowColorOpacity">{Math.round((content.rowColor2Opacity ?? 0.03) * 100)}%</span>
          {(content.rowColor2 || content.rowAltBg) && (
            <button onClick={() => pContent({ rowColor2: undefined, rowColor2Opacity: undefined, rowAltBg: undefined })} className="ed-rowColorClear">x</button>
          )}
        </div>
      </Field>
      <Field label={`Row Spacing: ${content.rowPaddingPx ?? 10}px`}>
        <input type="range" min={0} max={30} step={1} value={content.rowPaddingPx ?? 10} onChange={(e) => pContent({ rowPaddingPx: parseInt(e.target.value) })} className="ed-range" />
      </Field>
      {popupObj.type === DisplayObjectType.EVENTS_TABLE && (
        <Field label={`Inner Padding: ${content.paddingX ?? 0}px`}>
          <input type="range" min={0} max={40} step={1} value={content.paddingX ?? 0} onChange={(e) => pContent({ paddingX: parseInt(e.target.value) })} className="ed-range" />
        </Field>
      )}
    </Section>
  );
}

/* ── Content Sub-Sections ─────────────────────────────── */

function DaveningGroupsSection({ popupObj, pContent, daveningGroups }: {
  popupObj: DisplayObject;
  pContent: (p: Record<string, any>) => void;
  daveningGroups: DaveningGroupInfo[];
}) {
  const content = popupObj.content || {};
  const selected = (content.groupIds as string[] | undefined) ?? [];

  return (
    <>
      <div className="ed-hintSm">Select which groups appear in this events box.</div>
      {daveningGroups.length === 0 ? (
        <div className="ed-hint">No groups defined. Add groups in the Davening Times section.</div>
      ) : (
        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
          {daveningGroups.map((g) => {
            const isChecked = selected.includes(g.id);
            return (
              <label key={g.id} className={isChecked ? "ed-groupItemActive" : "ed-groupItem"}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    let next: string[];
                    if (e.target.checked) { next = [...selected, g.id]; } else { next = selected.filter((id) => id !== g.id); }
                    pContent({ groupIds: next });
                  }}
                />
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: g.color, flexShrink: 0 }} />
                <span style={{ color: 'var(--ed-text)' }}>{g.nameHebrew}</span>
                <span style={{ color: 'var(--ed-text-dim)', marginLeft: 'auto' }}>{g.name}</span>
              </label>
            );
          })}
        </div>
      )}
      {selected.length > 1 && (
        <>
          <div className="ed-fieldLabel" style={{ marginTop: 8 }}>Group Order</div>
          <div className="ed-hintSm">Drag to reorder how groups appear.</div>
          <div>
            {selected.map((gId, i) => {
              const g = daveningGroups.find((gr) => gr.id === gId);
              if (!g) return null;
              return (
                <div key={gId} draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', String(i))}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                    if (isNaN(fromIdx) || fromIdx === i) return;
                    const arr = [...selected];
                    const [moved] = arr.splice(fromIdx, 1);
                    arr.splice(i, 0, moved);
                    pContent({ groupIds: arr });
                  }}
                  className="ed-groupItemActive" style={{ cursor: 'grab' }}
                >
                  <span style={{ color: 'var(--ed-text-faint)' }}>&#9776;</span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: g.color }} />
                  {g.nameHebrew}
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function EmphasisSection({ popupObj, pContent }: { popupObj: DisplayObject; pContent: (p: Record<string, any>) => void }) {
  const content = popupObj.content || {};
  return (
    <>
      <div style={{ marginBottom: 6 }}>
        <label className="ed-checkRow">
          <input type="checkbox" checked={content.emphasis?.enabled ?? false} onChange={(e) => pContent({ emphasis: { ...content.emphasis, enabled: e.target.checked } })} />
          <span style={{ color: 'var(--ed-text)' }}>Emphasize current/next event</span>
        </label>
      </div>
      {content.emphasis?.enabled && (
        <div className="ed-emphasisBox">
          <div className="ed-hintSm">If a current event is happening it gets emphasis, otherwise the next upcoming event does.</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <label className="ed-checkRow">
              <input type="checkbox" checked={content.emphasis?.bold ?? true} onChange={(e) => pContent({ emphasis: { ...content.emphasis, bold: e.target.checked } })} /> Bold
            </label>
            <label className="ed-checkRow">
              <input type="checkbox" checked={content.emphasis?.italic ?? false} onChange={(e) => pContent({ emphasis: { ...content.emphasis, italic: e.target.checked } })} /> Italic
            </label>
            <span style={{ color: 'var(--ed-text-dim)' }}>Color:</span>
            <ColorInput value={content.emphasis?.color ?? '#2980b9'} onChange={(v) => pContent({ emphasis: { ...content.emphasis, color: v } })} />
            <span style={{ color: 'var(--ed-text-dim)' }}>Size:</span>
            <input type="number" value={content.emphasis?.fontSize ?? popupObj.font.size}
              onChange={(e) => pContent({ emphasis: { ...content.emphasis, fontSize: Number(e.target.value) } })}
              className="ed-input" style={{ width: 56 }} min={8} max={200} />
          </div>
        </div>
      )}
    </>
  );
}

function JewishInfoItemsSection({ popupObj, pContent }: { popupObj: DisplayObject; pContent: (p: Record<string, any>) => void }) {
  const items = popupObj.content?.showItems ?? {};
  return (
    <Field label="Show in this box">
      {([
        ['date', 'Hebrew Date', '\u05EA\u05D0\u05E8\u05D9\u05DA \u05E2\u05D1\u05E8\u05D9'],
        ['parsha', 'Parshat HaShavua', '\u05E4\u05E8\u05E9\u05EA \u05D4\u05E9\u05D1\u05D5\u05E2'],
        ['holiday', 'Yom Tov / Holiday', '\u05D9\u05D5\u05DD \u05D8\u05D5\u05D1 / \u05D7\u05D2'],
        ['omer', 'Sefiras HaOmer', '\u05E1\u05E4\u05D9\u05E8\u05EA \u05D4\u05E2\u05D5\u05DE\u05E8'],
        ['dafYomi', 'Daf Yomi', '\u05D3\u05E3 \u05D9\u05D5\u05DE\u05D9'],
        ['tefilah', 'Tefillah Changes', '\u05E9\u05D9\u05E0\u05D5\u05D9\u05D9\u05DD \u05D1\u05EA\u05E4\u05D9\u05DC\u05D4'],
      ] as [string, string, string][]).map(([key, labelEn, labelHe]) => {
        const checked = items[key] !== false;
        return (
          <label key={key} className={checked ? "ed-groupItemActive" : "ed-groupItem"} style={{ marginBottom: 6 }}>
            <input type="checkbox" checked={checked} onChange={(e) => pContent({ showItems: { ...items, [key]: e.target.checked } })} />
            <span style={{ color: 'var(--ed-text)' }}>{labelHe}</span>
            <span style={{ color: 'var(--ed-text-dim)', marginLeft: 'auto', fontSize: 11 }}>{labelEn}</span>
          </label>
        );
      })}
    </Field>
  );
}

function JewishInfoTitleSection({ popupObj, pContent }: { popupObj: DisplayObject; pContent: (p: Record<string, any>) => void }) {
  const ts = popupObj.content?.titleSettings ?? {};
  return (
    <Field label="Title Settings">
      {([
        ['parsha', 'Parshat HaShavua'],
        ['holiday', 'Yom Tov'],
        ['omer', 'Sefiras HaOmer'],
        ['dafYomi', 'Daf Yomi'],
        ['tefilah', 'Tefillah Changes'],
      ] as [string, string][]).map(([key, defaultLabel]) => {
        const setting = ts[key] ?? {};
        const mode = setting.mode ?? 'default';
        return (
          <div key={key} className="ed-emphasisBox" style={{ marginBottom: 8 }}>
            <div className="ed-hintSm">{defaultLabel}</div>
            <select
              value={mode}
              onChange={(e) => pContent({ titleSettings: { ...ts, [key]: { ...setting, mode: e.target.value } } })}
              className="ed-input" style={{ marginBottom: 4 }}
            >
              <option value="default">Default Title</option>
              <option value="hidden">Hidden</option>
              <option value="custom">Custom Title</option>
              <option value="inline">Inline (title + value on one line)</option>
            </select>
            {(mode === 'custom' || mode === 'inline') && (
              <input
                value={setting.customTitle ?? defaultLabel}
                onChange={(e) => pContent({ titleSettings: { ...ts, [key]: { ...setting, customTitle: e.target.value } } })}
                placeholder="Custom title"
                className="ed-input" style={{ marginBottom: 4 }}
              />
            )}
            {mode === 'inline' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="ed-hint">Separator:</span>
                <input
                  value={setting.separator ?? ':'}
                  onChange={(e) => pContent({ titleSettings: { ...ts, [key]: { ...setting, separator: e.target.value } } })}
                  className="ed-input" style={{ width: 40, textAlign: 'center' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </Field>
  );
}
