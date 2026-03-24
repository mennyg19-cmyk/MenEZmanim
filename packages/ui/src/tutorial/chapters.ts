import type { Step } from 'react-joyride';
import type { AdminSection, ChapterId, EditorPropertyTab, ScheduleEditorTab } from './types';

export const STORAGE_COMPLETED = 'zmanim-tutorial-completed-chapters';
export const STORAGE_WELCOME = 'zmanim-tutorial-welcome-shown';

export const CHAPTER_ORDER: ChapterId[] = [
  'welcome',
  'styles',
  'screens',
  'groups',
  'events',
  'editor',
  'widgets',
  'settings',
];

export const CHAPTER_META: Record<
  ChapterId,
  { title: string; description: string; icon: string }
> = {
  welcome: {
    icon: '🏠',
    title: 'Dashboard & navigation',
    description: 'Find your way around the admin: sidebar, stats, quick actions, and live preview.',
  },
  styles: {
    icon: '🎨',
    title: 'Create a style',
    description: 'Build display layouts: add a style, set resolution presets, open the editor.',
  },
  screens: {
    icon: '🖥️',
    title: 'Screens & breakpoints',
    description: 'Add screens, wire styles, and use “Applies to” for mobile, tablet, or full desktop.',
  },
  groups: {
    icon: '👥',
    title: 'Davening groups',
    description: 'Organize minyan rows with named, colored groups.',
  },
  events: {
    icon: '📅',
    title: 'Events (schedule)',
    description: 'Add fixed or dynamic times, rooms, days, and visibility rules.',
  },
  editor: {
    icon: '✏️',
    title: 'Display editor basics',
    description: 'Pick a style, add widgets, and work on the canvas.',
  },
  widgets: {
    icon: '⚙️',
    title: 'Widget customization',
    description: 'General, Appearance, Content tabs, themes, and backgrounds.',
  },
  settings: {
    icon: '🔧',
    title: 'Settings & display names',
    description: 'Location, language & kiosk, and custom zman/tefilah labels.',
  },
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type NavHelpers = {
  goSection: (s: AdminSection) => void;
  goScheduleTab: (t: ScheduleEditorTab) => void;
  requestEditorTab: (t: EditorPropertyTab) => void;
};

function ch(id: ChapterId, step: Partial<Step> & Pick<Step, 'target' | 'title' | 'content'>): Step {
  return {
    placement: 'bottom',
    skipBeacon: true,
    ...step,
    data: { ...(step.data ?? {}), chapterId: id },
  };
}

export function buildChapterSteps(chapterId: ChapterId, nav: NavHelpers): Step[] {
  const { goSection, goScheduleTab, requestEditorTab } = nav;

  switch (chapterId) {
    case 'welcome':
      return [
        ch('welcome', {
          target: '[data-tutorial="adm-root"]',
          placement: 'center',
          title: 'Welcome to Zmanim Admin',
          content:
            'This short tour uses highlights and arrows so you can learn by doing. Use Next to move forward — you can reopen any chapter anytime from the help button.',
          before: async () => {
            goSection('dashboard');
            await delay(350);
          },
        }),
        ch('welcome', {
          target: '[data-tutorial="sidebar-nav"]',
          title: 'Sidebar',
          content:
            'All main tools live here: Display (editor & screens), Content (schedules, announcements…), Settings, and Tools. Collapse the sidebar if you need more room.',
        }),
        ch('welcome', {
          target: '[data-tutorial="dash-stats"]',
          title: 'At-a-glance stats',
          content: 'These cards jump straight to the right section — counts update as you add data.',
        }),
        ch('welcome', {
          target: '[data-tutorial="dash-quick-actions"]',
          title: 'Quick actions',
          content: 'Shortcuts to add events, open the display editor, manage screens & styles, and more.',
        }),
        ch('welcome', {
          target: '[data-tutorial="dash-live-preview"]',
          title: 'Live preview',
          content: 'Pick a screen and breakpoint (desktop / tablet / mobile) to see how your wall display will look.',
        }),
        ch('welcome', {
          target: '[data-tutorial="sidebar-footer"]',
          title: 'Theme & live display',
          content: 'Toggle light/dark for this admin UI. Open Live Display to see the public URL in a new tab.',
        }),
      ];

    case 'styles':
      return [
        ch('styles', {
          target: '[data-tutorial="styles-panel"]',
          title: 'Styles panel',
          content:
            'Styles are saved layouts for your TVs and monitors — background, resolution, and widgets. You will create and edit them here and in the Display Editor.',
          before: async () => {
            goSection('screens');
            await delay(400);
          },
        }),
        ch('styles', {
          target: '[data-tutorial="styles-new"]',
          title: 'Add a style',
          content: 'Click **+ New Style**, type a name, then Add. You can set resolution and open the editor from a style card.',
        }),
        ch('styles', {
          target: '[data-tutorial="styles-grid"]',
          title: 'Style cards',
          content:
            'Click a card to expand it. Choose **Resolution** (breakpoint presets like 1920×1080 or mobile sizes), then **Open in Editor** to design widgets.',
        }),
      ];

    case 'screens':
      return [
        ch('screens', {
          target: '[data-tutorial="screens-panel"]',
          title: 'Screens',
          content:
            'Each **screen** is a physical device or URL (`/show/org/screen`). You assign which style shows when, including different styles per viewport.',
          before: async () => {
            goSection('screens');
            await delay(400);
          },
        }),
        ch('screens', {
          target: '[data-tutorial="screens-add"]',
          title: 'Add a screen',
          content: 'Click **+ Add Screen**. Give it a name and keep **Active** on for production displays.',
        }),
        ch('screens', {
          target: '[data-tutorial="screen-schedule"]',
          title: 'Style schedule',
          content:
            'Rules are evaluated top to bottom. You need at least one **Always (default)** row as a fallback.',
          before: async () => {
            goSection('screens');
            await delay(200);
            const btn = document.querySelector('[data-tutorial="screens-add"]') as HTMLButtonElement | null;
            btn?.click();
            await delay(450);
          },
        }),
        ch('screens', {
          target: '[data-tutorial="screen-schedule-toggle"]',
          title: 'Breakpoints (“Applies to”)',
          content:
            'Expand a row to edit it. Set **Applies to**: All views, Mobile, Tablet, or Full / Desktop. Order matters — specific breakpoints override “all” when they match.',
        }),
        ch('screens', {
          target: '[data-tutorial="screen-add-schedule"]',
          title: 'More rules',
          content: 'Use **+ Add schedule entry** for extra rows (e.g. Shabbat vs weekday). Reorder with arrows. Then **Save**.',
        }),
      ];

    case 'groups':
      return [
        ch('groups', {
          target: '[data-tutorial="sched-tab-bar"]',
          title: 'Davening Times',
          content: 'Open **Groups** to create buckets for your schedule (e.g. Main minyan, Vasikin).',
          before: async () => {
            goSection('content-hub');
            await delay(400);
          },
        }),
        ch('groups', {
          target: '[data-tutorial="sched-add-group"]',
          title: 'Add a group',
          content: 'Click **Add Group**, set English and Hebrew names, pick a color, and Save. Groups power filters and Events Table widgets.',
        }),
      ];

    case 'events':
      return [
        ch('events', {
          target: '[data-tutorial="sched-tab-events"]',
          title: 'Davening Times list',
          content: 'Here you add real minyan rows: times, rooms, and which group they belong to.',
          before: async () => {
            goSection('content-hub');
            await delay(400);
          },
        }),
        ch('events', {
          target: '[data-tutorial="sched-add-event"]',
          title: 'Add an event',
          content: 'Click **+ Event** (or **+ Spacer** for a visual gap). If you filter by one group, new events default to that group.',
        }),
        ch('events', {
          target: '[data-tutorial="sched-event-detail"]',
          title: 'Event options',
          content:
            'Set **fixed** time or **dynamic** (from halachic zmanim + offset). Configure active days, room, duration, refresh, and visibility rules.',
          before: async () => {
            goSection('content-hub');
            await delay(200);
            const first = document.querySelector('[data-tutorial="sched-first-event-row"]') as HTMLElement | null;
            first?.click();
            await delay(200);
          },
          targetWaitTimeout: 10000,
        }),
      ];

    case 'editor':
      return [
        ch('editor', {
          target: '[data-tutorial="editor-shell"]',
          title: 'Display Editor',
          content:
            'Design what appears on the wall: pick a style, add widgets, drag to position. Changes save automatically after edits.',
          before: async () => {
            goSection('editor');
            await delay(450);
          },
        }),
        ch('editor', {
          target: '[data-tutorial="editor-settings"]',
          title: 'Style & canvas',
          content: 'Expand **Settings** to switch styles, set canvas resolution (breakpoint presets), canvas background modes, and open **Themes**.',
        }),
        ch('editor', {
          target: '[data-tutorial="editor-add-widget"]',
          title: 'Add widgets',
          content: 'Click **+ Add** to open the widget gallery — zmanim, clocks, events table, ticker, media, and more.',
        }),
        ch('editor', {
          target: '[data-tutorial="editor-canvas"]',
          title: 'Canvas',
          content: 'Click objects to select; drag to move; use blue handles to resize. Use zoom controls at the bottom.',
        }),
      ];

    case 'widgets':
      return [
        ch('widgets', {
          target: '[data-tutorial="editor-add-widget"]',
          title: 'Add a widget',
          content:
            'Click **+ Add** and pick a widget (e.g. **Events Table**). It appears on the canvas and in the object list.',
          before: async () => {
            goSection('editor');
            await delay(450);
          },
        }),
        ch('widgets', {
          target: '[data-tutorial="editor-shell"]',
          title: 'Open the property panel',
          content:
            'In the **Objects** list, click the **pencil (Edit)** on a row to open the inspector. (If the list is empty, add a widget first.)',
          before: async () => {
            goSection('editor');
            await delay(200);
          },
        }),
        ch('widgets', {
          target: '[data-tutorial="prop-tab-general"]',
          title: 'General',
          content: 'Name (for your reference), language, position, size, z-order, and visibility.',
          before: async () => {
            goSection('editor');
            await delay(200);
            requestEditorTab('general');
          },
          targetWaitTimeout: 12000,
        }),
        ch('widgets', {
          target: '[data-tutorial="prop-tab-appearance"]',
          title: 'Appearance',
          content: 'Fonts, colors, backgrounds, frames, scrolling, and table styling where relevant.',
          before: async () => {
            requestEditorTab('appearance');
            await delay(100);
          },
        }),
        ch('widgets', {
          target: '[data-tutorial="prop-tab-content"]',
          title: 'Content',
          content: 'Widget-specific data: zmanim checklists, events groups, media, ticker text, and more.',
          before: async () => {
            requestEditorTab('content');
            await delay(100);
          },
        }),
        ch('widgets', {
          target: '[data-tutorial="editor-theme-btn"]',
          title: 'Themes',
          content: 'From Settings, open **Themes** to recolor widgets from a palette (including custom themes).',
          before: async () => {
            requestEditorTab('general');
            await delay(100);
          },
        }),
        ch('widgets', {
          target: '[data-tutorial="editor-canvas-bg"]',
          title: 'Canvas background',
          content: 'Under Settings, set **Canvas background** to solid, gradient, texture, or image — independent of widget fills.',
          before: async () => {
            requestEditorTab('general');
            await delay(100);
          },
        }),
      ];

    case 'settings':
      return [
        ch('settings', {
          target: '[data-tutorial="settings-location"]',
          title: 'Location',
          content: 'Set latitude/longitude (or use the map) so zmanim calculate correctly for your shul.',
          before: async () => {
            goSection('settings');
            await delay(400);
          },
        }),
        ch('settings', {
          target: '[data-tutorial="settings-display-prefs"]',
          title: 'Language & kiosk',
          content: 'Default language for displays, kiosk mode, hiding the cursor, and auto-start options for dedicated devices.',
        }),
        ch('settings', {
          target: '[data-tutorial="settings-display-names"]',
          title: 'Display names',
          content:
            'Override default English and Hebrew labels for zmanim and tefilah names — these flow through tables and info widgets on the wall.',
        }),
      ];

    default:
      return [];
  }
}
