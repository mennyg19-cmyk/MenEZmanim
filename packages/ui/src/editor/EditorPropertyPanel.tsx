'use client';

import React from 'react';
import { DisplayObjectType, type DisplayObject, type Position } from '@zmanim-app/core';
import { TYPE_LABELS, FONT_CATEGORIES, ZMANIM_OPTIONS_REGULAR, ZMANIM_OPTIONS_TUKACHINSKY } from '../shared/constants';
import { BgMode, getObjBgMode } from '../shared/backgroundUtils';
import { GradientPicker } from './GradientPicker';
import { TexturePicker } from './TexturePicker';
import { FramePicker } from './FramePicker';
import { hexToRgba, extractHex } from '../shared/colorUtils';
import { bestTextColorFromPalette, sampleBackgroundAtObject } from '../shared/colorExtract';
import { useColorContext } from './ColorContext';
import { Field, Section, Input, NumInput, ColorInput, Select, Toggle } from './FormPrimitives';
import { ColorPicker } from '../shared/ColorPicker';


interface DaveningGroupInfo {
  id: string;
  name: string;
  nameHebrew: string;
  color: string;
}

interface MediaItem {
  id: string;
  url: string;
  mimeType: string;
  filename?: string;
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
  canvasStyle?: import('@zmanim-app/core').DisplayStyle;
  canvasWidth?: number;
  canvasHeight?: number;
  media?: MediaItem[];
  /** For ticker: which org announcements exist (editor preview / admin data) */
  previewAnnouncements?: Array<{ id: string; title: string; priority?: number }>;
}

export function EditorPropertyPanel({
  popupObj, popupTab, setPopupTab, setPopupId, setSelectedId, setSelectedIds,
  pUpdate, pPos, pFont, pContent, deleteObj, daveningGroups, onUploadImage,
  boxBgUploading, setBoxBgUploading, boxBgFileRef, canvasStyle, canvasWidth, canvasHeight,
  media,
  previewAnnouncements,
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
            canvasStyle={canvasStyle}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />
        )}
        {popupTab === 'content' && (
          <ContentTab
            popupObj={popupObj}
            pContent={pContent}
            daveningGroups={daveningGroups}
            media={media}
            onUploadImage={onUploadImage}
            previewAnnouncements={previewAnnouncements}
          />
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

function AppearanceTab({ popupObj, pFont, pContent, pUpdate, onUploadImage, boxBgUploading, setBoxBgUploading, boxBgFileRef, canvasStyle, canvasWidth, canvasHeight }: {
  popupObj: DisplayObject;
  pFont: (patch: Partial<DisplayObject['font']>) => void;
  pContent: (patch: Record<string, any>) => void;
  pUpdate: (patch: Partial<DisplayObject>) => void;
  onUploadImage?: (file: File) => Promise<string | null>;
  boxBgUploading: boolean;
  setBoxBgUploading: (v: boolean) => void;
  boxBgFileRef: React.RefObject<HTMLInputElement | null>;
  canvasStyle?: import('@zmanim-app/core').DisplayStyle;
  canvasWidth?: number;
  canvasHeight?: number;
}) {
  const content = popupObj.content || {};
  const isTable = popupObj.type === DisplayObjectType.ZMANIM_TABLE || popupObj.type === DisplayObjectType.EVENTS_TABLE;
  const { themeColors } = useColorContext();
  const [autoContrastBusy, setAutoContrastBusy] = React.useState(false);

  const handleAutoContrast = React.useCallback(async () => {
    if (!canvasStyle) return;
    setAutoContrastBusy(true);
    try {
      // If the object has its own opaque solid background, use that directly
      const objBgMode = (popupObj.content?.backgroundMode as string) ?? 'solid';
      const hasOwnBg = objBgMode === 'solid' && popupObj.backgroundColor
        && popupObj.backgroundColor !== 'transparent' && popupObj.backgroundColor !== 'inherit';

      let bgColor: string;
      if (hasOwnBg) {
        bgColor = extractHex(popupObj.backgroundColor!) || '#000000';
      } else {
        // Sample the actual canvas background at the object's position
        bgColor = await sampleBackgroundAtObject(
          popupObj,
          canvasStyle,
          canvasWidth || 1920,
          canvasHeight || 1080,
        );
      }

      const textColor = bestTextColorFromPalette(bgColor, themeColors);
      pFont({ color: textColor });
    } finally {
      setAutoContrastBusy(false);
    }
  }, [popupObj, canvasStyle, canvasWidth, canvasHeight, themeColors, pFont]);

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
        <Field label="Text Color">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <ColorInput value={popupObj.font.color} onChange={(v) => pFont({ color: v })} />
            <button
              type="button"
              onClick={handleAutoContrast}
              disabled={autoContrastBusy}
              className="ed-btn"
              style={{ fontSize: 11, padding: '3px 8px' }}
              title="Samples the actual background behind this object and picks a readable text color"
            >{autoContrastBusy ? 'Sampling...' : 'Auto contrast'}</button>
          </div>
        </Field>
        <TextAlignField popupObj={popupObj} pContent={pContent} />
        <VerticalAlignField popupObj={popupObj} pContent={pContent} />
        {![DisplayObjectType.ANALOG_CLOCK, DisplayObjectType.MEDIA_VIEWER].includes(popupObj.type) && (
          <Field label={`Line Height: ${content.lineHeight ?? 1.4}`}>
            <input
              type="range"
              min={0.8}
              max={3}
              step={0.1}
              value={content.lineHeight ?? 1.4}
              onChange={(e) => pContent({ lineHeight: parseFloat(e.target.value) })}
              className="ed-range"
            />
          </Field>
        )}
      </Section>

      <Section title="Background">
        <BackgroundSection popupObj={popupObj} pContent={pContent} pUpdate={pUpdate} onUploadImage={onUploadImage} boxBgUploading={boxBgUploading} setBoxBgUploading={setBoxBgUploading} boxBgFileRef={boxBgFileRef} />
      </Section>

      <Section title="Frame" defaultOpen={false}>
        <FramePicker
          value={content.frameId as string | undefined}
          onChange={(id) => pContent({ frameId: id })}
          thickness={typeof content.frameThickness === 'number' ? content.frameThickness : 1}
          onThicknessChange={(t) => pContent({ frameThickness: t })}
        />
      </Section>

      <ScrollSection popupObj={popupObj} pContent={pContent} />

      {isTable && <TableLayoutSection popupObj={popupObj} pContent={pContent} />}
      {isTable && <BorderSection popupObj={popupObj} pContent={pContent} />}
      {popupObj.type === DisplayObjectType.EVENTS_TABLE && <HeaderRowSection popupObj={popupObj} pContent={pContent} />}
      {isTable && <RowStylingSection popupObj={popupObj} pContent={pContent} />}
    </>
  );
}

/* ── Tab: Content ─────────────────────────────────────── */

function TickerContentSection({
  popupObj,
  pContent,
  announcements,
}: {
  popupObj: DisplayObject;
  pContent: (patch: Record<string, any>) => void;
  announcements: Array<{ id: string; title: string; priority?: number }>;
}) {
  const content = popupObj.content || {};
  const useAll = content.tickerUseAllAnnouncements !== false;
  const selected = new Set<string>((content.tickerAnnouncementIds as string[] | undefined) ?? []);

  const toggleId = (id: string, checked: boolean) => {
    const cur = new Set((content.tickerAnnouncementIds as string[] | undefined) ?? []);
    if (checked) cur.add(id);
    else cur.delete(id);
    pContent({ tickerAnnouncementIds: [...cur], tickerUseAllAnnouncements: false });
  };

  return (
    <Section title="Ticker content">
      <Field label="Separator between titles">
        <Input value={content.separator ?? '•'} onChange={(v) => pContent({ separator: v })} placeholder="•" />
      </Field>
      <label className="ed-checkRow" style={{ marginBottom: 8 }}>
        <input
          type="checkbox"
          checked={useAll}
          onChange={(e) => {
            if (e.target.checked) {
              pContent({ tickerUseAllAnnouncements: true, tickerAnnouncementIds: undefined });
            } else {
              pContent({ tickerUseAllAnnouncements: false });
            }
          }}
        />
        Show all announcements (by priority)
      </label>
      {!useAll && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {announcements.length === 0 ? (
            <div className="ed-hintSm">No announcements in preview. Open Admin → Announcements or reload the editor after announcements sync.</div>
          ) : (
            announcements.map((a) => (
              <label key={a.id} className="ed-checkRow">
                <input type="checkbox" checked={selected.has(a.id)} onChange={(e) => toggleId(a.id, e.target.checked)} />
                <span style={{ color: 'var(--ed-text)' }}>{a.title || '(Untitled)'}</span>
              </label>
            ))
          )}
        </div>
      )}
      <div className="ed-hintSm" style={{ marginTop: 10 }}>
        Scrolling speed and direction are controlled under <strong>Appearance → Scrolling</strong> (enable horizontal left/right for a marquee).
      </div>
    </Section>
  );
}

function ContentTab({ popupObj, pContent, daveningGroups, media, onUploadImage, previewAnnouncements }: {
  popupObj: DisplayObject;
  pContent: (patch: Record<string, any>) => void;
  daveningGroups: DaveningGroupInfo[];
  media?: MediaItem[];
  onUploadImage?: (file: File) => Promise<string | null>;
  previewAnnouncements?: Array<{ id: string; title: string; priority?: number }>;
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
        <MediaContentSection popupObj={popupObj} pContent={pContent} media={media} onUploadImage={onUploadImage} />
      )}
      {popupObj.type === DisplayObjectType.SCROLLING_TICKER && (
        <TickerContentSection popupObj={popupObj} pContent={pContent} announcements={previewAnnouncements ?? []} />
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
          <ColorPicker
            variant="swatch-only"
            value={content.rowColor1 ?? '#000000'}
            onChange={(hex) => { const op = content.rowColor1Opacity ?? 0; pContent({ rowColor1: hexToRgba(hex, op) }); }}
            swatchClassName="ed-rowColorSwatch"
          />
          <input type="range" min={0} max={100} step={1} value={Math.round((content.rowColor1Opacity ?? 0) * 100)} onChange={(e) => { const op = parseInt(e.target.value) / 100; const hex = extractHex(content.rowColor1) || '#000000'; pContent({ rowColor1: hexToRgba(hex, op), rowColor1Opacity: op }); }} className="ed-range" style={{ flex: 1 }} title="Opacity" />
          <span className="ed-rowColorOpacity">{Math.round((content.rowColor1Opacity ?? 0) * 100)}%</span>
          {content.rowColor1 && (
            <button onClick={() => pContent({ rowColor1: undefined, rowColor1Opacity: undefined })} className="ed-rowColorClear">x</button>
          )}
        </div>
      </Field>
      <Field label="Row Color 2 (odd rows)">
        <div className="ed-rowColorRow">
          <ColorPicker
            variant="swatch-only"
            value={content.rowColor2 || content.rowAltBg || '#000000'}
            onChange={(hex) => { const op = content.rowColor2Opacity ?? 0.03; pContent({ rowColor2: hexToRgba(hex, op), rowAltBg: undefined }); }}
            swatchClassName="ed-rowColorSwatch"
          />
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

/* ── Media Content Section ────────────────────────────── */

function MediaContentSection({ popupObj, pContent, media, onUploadImage }: {
  popupObj: DisplayObject;
  pContent: (patch: Record<string, any>) => void;
  media?: MediaItem[];
  onUploadImage?: (file: File) => Promise<string | null>;
}) {
  const content = popupObj.content || {};
  const selectedIds: string[] = content.mediaIds ?? [];
  const useAll = !content.mediaIds || content.mediaIds.length === 0;
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadImage) return;
    setUploading(true);
    try {
      await onUploadImage(file);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const toggleItem = (id: string) => {
    if (useAll) {
      pContent({ mediaIds: [id] });
    } else if (selectedIds.includes(id)) {
      const next = selectedIds.filter((x) => x !== id);
      pContent({ mediaIds: next.length > 0 ? next : undefined });
    } else {
      pContent({ mediaIds: [...selectedIds, id] });
    }
  };

  const selectAll = () => pContent({ mediaIds: undefined });

  const items = media ?? [];

  return (
    <>
      <Section title="Media Library">
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleUpload} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || !onUploadImage}
            className="ed-btnSmall"
            style={{ flex: 1, cursor: uploading ? 'wait' : 'pointer' }}
          >
            {uploading ? 'Uploading...' : '+ Upload'}
          </button>
          <button
            type="button"
            onClick={selectAll}
            className={useAll ? 'ed-optionBtnActive' : 'ed-optionBtn'}
            style={{ fontSize: 11, padding: '4px 8px' }}
          >
            Use all
          </button>
        </div>

        {items.length === 0 ? (
          <div className="ed-hint">No media uploaded yet. Upload images from here or the Media &amp; Flyers section.</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 4,
            maxHeight: 240,
            overflowY: 'auto',
          }}>
            {items.map((item) => {
              const isSelected = useAll || selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  style={{
                    position: 'relative',
                    paddingBottom: '75%',
                    borderRadius: 4,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: isSelected ? '2px solid var(--ed-accent, #4a9eff)' : '2px solid transparent',
                    opacity: isSelected ? 1 : 0.45,
                    transition: 'opacity 0.15s, border-color 0.15s',
                  }}
                >
                  <img
                    src={item.url}
                    alt={item.filename || ''}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  {isSelected && !useAll && (
                    <div style={{
                      position: 'absolute', top: 2, right: 2,
                      width: 16, height: 16, borderRadius: '50%',
                      background: 'var(--ed-accent, #4a9eff)',
                      color: '#fff', fontSize: 10, lineHeight: '16px', textAlign: 'center',
                    }}>
                      {selectedIds.indexOf(item.id) + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!useAll && selectedIds.length > 0 && (
          <div className="ed-hint" style={{ marginTop: 4 }}>
            {selectedIds.length} of {items.length} selected — click to toggle, numbers show slideshow order
          </div>
        )}
        {useAll && items.length > 0 && (
          <div className="ed-hint" style={{ marginTop: 4 }}>
            Showing all {items.length} media items. Click an image to select specific items.
          </div>
        )}
      </Section>

      <Section title="Slideshow Settings">
        <Field label={`Rotation Interval: ${content.rotationInterval ?? 10}s`}>
          <input
            type="range"
            min={2}
            max={60}
            step={1}
            value={content.rotationInterval ?? 10}
            onChange={(e) => pContent({ rotationInterval: parseInt(e.target.value) })}
            className="ed-range"
          />
        </Field>
        <Field label="Image Fit">
          <Select
            value={content.fit ?? 'contain'}
            onChange={(v) => pContent({ fit: v })}
            options={[['contain', 'Contain'], ['cover', 'Cover'], ['fill', 'Fill']]}
          />
        </Field>
        <Field label="Fade Transition">
          <Toggle checked={content.showTransition ?? true} onChange={(v) => pContent({ showTransition: v })} />
        </Field>
      </Section>
    </>
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

function ScrollSection({ popupObj, pContent }: { popupObj: DisplayObject; pContent: (p: Record<string, any>) => void }) {
  const scroll = popupObj.content?.scroll ?? {};
  const enabled = scroll.enabled === true;
  return (
    <Section title="Scrolling" defaultOpen={false}>
      <label className="ed-checkRow" style={{ marginBottom: 8 }}>
        <input type="checkbox" checked={enabled} onChange={(e) => pContent({ scroll: { ...scroll, enabled: e.target.checked } })} />
        Enable scrolling
      </label>
      {enabled && (
        <>
          <Field label="Direction">
            <select
              value={scroll.direction ?? 'up'}
              onChange={(e) => pContent({ scroll: { ...scroll, direction: e.target.value } })}
              className="ed-input"
            >
              <option value="up">Up</option>
              <option value="down">Down</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </Field>
          <Field label="Speed (px/sec)">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={scroll.speed ?? 30}
                onChange={(e) => pContent({ scroll: { ...scroll, speed: Number(e.target.value) } })}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 11, color: 'var(--ed-text-dim)', minWidth: 32, textAlign: 'right' }}>
                {scroll.speed ?? 30}
              </span>
            </div>
          </Field>
        </>
      )}
    </Section>
  );
}

const JI_ALL_ITEMS: [string, string, string][] = [
  ['dayOfWeek', 'Day of Week', '\u05D9\u05D5\u05DD \u05D1\u05E9\u05D1\u05D5\u05E2'],
  ['date', 'Hebrew Date', '\u05EA\u05D0\u05E8\u05D9\u05DA \u05E2\u05D1\u05E8\u05D9'],
  ['parsha', 'Parshat HaShavua', '\u05E4\u05E8\u05E9\u05EA \u05D4\u05E9\u05D1\u05D5\u05E2'],
  ['holiday', 'Yom Tov / Holiday', '\u05D9\u05D5\u05DD \u05D8\u05D5\u05D1 / \u05D7\u05D2'],
  ['omer', 'Sefiras HaOmer', '\u05E1\u05E4\u05D9\u05E8\u05EA \u05D4\u05E2\u05D5\u05DE\u05E8'],
  ['dafYomi', 'Daf Yomi', '\u05D3\u05E3 \u05D9\u05D5\u05DE\u05D9'],
  ['tefilah', 'Tefillah Changes', '\u05E9\u05D9\u05E0\u05D5\u05D9\u05D9\u05DD \u05D1\u05EA\u05E4\u05D9\u05DC\u05D4'],
];
const JI_DEFAULT_ORDER = JI_ALL_ITEMS.map(([k]) => k);

function JewishInfoItemsSection({ popupObj, pContent }: { popupObj: DisplayObject; pContent: (p: Record<string, any>) => void }) {
  const items = popupObj.content?.showItems ?? {};
  const layout = popupObj.content?.layout ?? 'vertical';
  const separator = popupObj.content?.horizontalSeparator ?? '|';
  const currentOrder: string[] = popupObj.content?.itemOrder ?? JI_DEFAULT_ORDER;

  const orderedItems = currentOrder.map((key) => JI_ALL_ITEMS.find(([k]) => k === key)).filter(Boolean) as [string, string, string][];
  for (const item of JI_ALL_ITEMS) {
    if (!currentOrder.includes(item[0])) orderedItems.push(item);
  }

  const moveItem = (key: string, dir: -1 | 1) => {
    const arr = [...orderedItems.map(([k]) => k)];
    const idx = arr.indexOf(key);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    pContent({ itemOrder: arr });
  };

  return (
    <>
      <Field label="Show in this box (drag to reorder)">
        {orderedItems.map(([key, labelEn, labelHe], idx) => {
          const checked = key === 'dayOfWeek' ? items[key] === true : items[key] !== false;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <button type="button" disabled={idx === 0} onClick={() => moveItem(key, -1)}
                  style={{ fontSize: 8, lineHeight: 1, padding: '1px 3px', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, background: 'none', border: 'none', color: 'var(--ed-text-dim)' }}>▲</button>
                <button type="button" disabled={idx === orderedItems.length - 1} onClick={() => moveItem(key, 1)}
                  style={{ fontSize: 8, lineHeight: 1, padding: '1px 3px', cursor: idx === orderedItems.length - 1 ? 'default' : 'pointer', opacity: idx === orderedItems.length - 1 ? 0.3 : 1, background: 'none', border: 'none', color: 'var(--ed-text-dim)' }}>▼</button>
              </div>
              <label className={checked ? "ed-groupItemActive" : "ed-groupItem"} style={{ flex: 1, marginBottom: 0 }}>
                <input type="checkbox" checked={checked} onChange={(e) => pContent({ showItems: { ...items, [key]: e.target.checked } })} />
                <span style={{ color: 'var(--ed-text)' }}>{labelHe}</span>
                <span style={{ color: 'var(--ed-text-dim)', marginLeft: 'auto', fontSize: 11 }}>{labelEn}</span>
              </label>
            </div>
          );
        })}
      </Field>
      <Field label="Layout">
        <select
          value={layout}
          onChange={(e) => pContent({ layout: e.target.value })}
          className="ed-input"
        >
          <option value="vertical">Vertical (stacked)</option>
          <option value="horizontal">Horizontal (row)</option>
        </select>
        {layout === 'horizontal' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span className="ed-hint">Separator:</span>
            <input
              value={separator}
              onChange={(e) => pContent({ horizontalSeparator: e.target.value })}
              className="ed-input" style={{ width: 60, textAlign: 'center' }}
              placeholder="|"
            />
          </div>
        )}
      </Field>
    </>
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
