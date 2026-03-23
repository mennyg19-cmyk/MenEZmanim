// Shared types and utilities
export type { CalendarInfo, AnnouncementData, MemorialData, MinyanData, MediaData, ZmanResult } from './shared/types';
export { formatTime12h, formatZmanTime, formatEventTime, parseTime12 } from './shared/timeUtils';
export { splitEven, splitFill, buildColumnData } from './shared/tableUtils';
export { hexToRgba, extractHex } from './shared/colorUtils';
export { resolveObjBackground, getObjBgMode, resolveCanvasBackground, getCanvasBgMode } from './shared/backgroundUtils';
export type { BgMode, CanvasBgExtras } from './shared/backgroundUtils';
export { useBreakpoint } from './shared/useBreakpoint';
export type { Breakpoint } from './shared/useBreakpoint';
export { useDisplayBreakpoint } from './shared/useDisplayBreakpoint';
export { useRecentColors } from './shared/useRecentColors';
export { extractPaletteFromImage, paletteToThemeColors, contrastTextColor, bestTextColorFromPalette, sampleBackgroundAtObject } from './shared/colorExtract';
export { ColorProvider, useColorContext } from './editor/ColorContext';
export { ColorPicker, ColorDot } from './shared/ColorPicker';
export type { ColorPickerProps, ColorPickerVariant } from './shared/ColorPicker';
export { Modal, ConfirmDialog } from './shared/Modal';
export type { ModalProps, ConfirmDialogProps } from './shared/Modal';
export { Toggle } from './shared/Toggle';
export type { ToggleProps, ToggleVariant } from './shared/Toggle';
export { FormField, FormInput, FormSelect, FormTextarea } from './shared/FormField';
export { Badge } from './shared/Badge';
export type { BadgeProps, BadgeVariant, BadgeArea } from './shared/Badge';
export { EmptyState } from './shared/EmptyState';
export type { EmptyStateProps, EmptyStateArea } from './shared/EmptyState';
export { TEXTURE_CATALOG, getTextureById, getTextureStyles } from './shared/textures';
export type { TextureEntry } from './shared/textures';
export { GRADIENT_PRESETS } from './shared/gradients';
export { FRAME_CATALOG, getFrameById } from './shared/frames';
export type { FrameDefinition } from './shared/frames';
export { FrameRenderer } from './display/FrameRenderer';
export type { FrameRendererProps } from './display/FrameRenderer';
export { ScrollWrapper } from './display/ScrollWrapper';
export type { ScrollConfig } from './display/ScrollWrapper';
export { DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, TYPE_LABELS, TYPE_ICONS, ZMANIM_OPTIONS_REGULAR, ZMANIM_OPTIONS_TUKACHINSKY, FONT_CATEGORIES } from './shared/constants';

// Display components
export { DisplayApp } from './display/DisplayApp';
export { BoardRenderer, renderWidget } from './display/BoardRenderer';
export type { BoardRendererProps } from './display/BoardRenderer';

// Display widgets
export { ZmanimTable } from './display/widgets/ZmanimTable';
export { JewishInfoWidget, TEFILAH_LABELS_ENGLISH, TEFILAH_LABELS_HEBREW } from './display/widgets/JewishInfoWidget';
export { DigitalClock } from './display/widgets/DigitalClock';
export { AnalogClock } from './display/widgets/AnalogClock';
export { PlainText } from './display/widgets/PlainText';
export { RichText } from './display/widgets/RichText';
export { MediaViewer } from './display/widgets/MediaViewer';
export { EventsTable } from './display/widgets/EventsTable';
export { YahrzeitDisplay } from './display/widgets/YahrzeitDisplay';
export { ScrollingTicker } from './display/widgets/ScrollingTicker';
export { SefiraCounter } from './display/widgets/SefiraCounter';
export { CountdownTimer } from './display/widgets/CountdownTimer';
export { FIDSBoard } from './display/widgets/FIDSBoard';

// Editor components
export { WysiwygCanvas } from './editor/WysiwygCanvas';
export { EditorPropertyPanel } from './editor/EditorPropertyPanel';
export { StyleManager } from './editor/StyleManager';
export { BackgroundPicker } from './editor/BackgroundPicker';
export { ScheduleRuleEditor } from './editor/ScheduleRuleEditor';
export { ZmanLimitEditor } from './editor/ZmanLimitEditor';
export { ThemePicker, BUILT_IN_THEMES } from './editor/ThemePicker';
export type { ColorTheme, ThemeColors } from './editor/ThemePicker';

// Editor form primitives
export { Field, Section, Input, NumInput, ColorInput, Select } from './editor/FormPrimitives';

// Admin components
export { AdminApp } from './admin/AdminApp';
export { LocationSetup } from './admin/LocationSetup';
export { SettingsPage } from './admin/SettingsPage';
export { MemberManager } from './admin/MemberManager';
export { ScheduleEditor, type WeekExportFetcher } from './admin/ScheduleEditor';
export { AnnouncementEditor } from './admin/AnnouncementEditor';
export { MemorialEditor } from './admin/MemorialEditor';
export { SponsorManager } from './admin/SponsorManager';
export { FlyerUploader } from './admin/FlyerUploader';
export { DisplayNamesEditor } from './admin/DisplayNamesEditor';
export { ImportWizard } from './admin/ImportWizard';
export { ExportPanel } from './admin/ExportPanel';
export { ScreenManager } from './admin/ScreenManager';

// i18n
export { t, getDirection, getLocale } from './i18n/i18n';
export type { Language } from './i18n/i18n';

// Interactive tutorial (admin)
export {
  TutorialProvider,
  useTutorial,
  useTutorialOptional,
  TutorialLauncher,
  TutorialHelpLink,
  type TutorialContextValue,
  type AdminSection,
  type ChapterId,
  type EditorPropertyTab,
  type ScheduleEditorTab,
} from './tutorial';

// Mobile components
export { MobileApp } from './mobile/MobileApp';
export { MobileDatePicker } from './mobile/MobileDatePicker';
export { MobileZmanim } from './mobile/MobileZmanim';
export { MobileSchedule } from './mobile/MobileSchedule';
export { MobileAnnouncements } from './mobile/MobileAnnouncements';
