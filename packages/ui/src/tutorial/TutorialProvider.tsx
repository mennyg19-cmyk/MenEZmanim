'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Joyride, EVENTS, STATUS, type EventData, type Step, type TooltipRenderProps } from 'react-joyride';
import { buildChapterSteps, type NavHelpers } from './chapters';
import { TutorialTooltip } from './TutorialTooltip';
import type { AdminSection, ChapterId, EditorPropertyTab, ScheduleEditorTab } from './types';

export type TutorialContextValue = {
  startChapter: (id: ChapterId) => void;
  stopTour: () => void;
  openChapterPicker: () => void;
  chapterPickerOpen: boolean;
  setChapterPickerOpen: (v: boolean) => void;
  isRunning: boolean;
  activeChapterId: ChapterId | null;
  completedChapters: Set<ChapterId>;
  markChapterCompleted: (id: ChapterId) => void;
  isChapterComplete: (id: ChapterId) => boolean;
  requestEditorTab: (t: EditorPropertyTab) => void;
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial must be used within TutorialProvider');
  return ctx;
}

export function useTutorialOptional(): TutorialContextValue | null {
  return useContext(TutorialContext);
}

type TutorialProviderProps = {
  children: React.ReactNode;
  setActiveSection: (s: AdminSection) => void;
  scheduleTab: ScheduleEditorTab;
  setScheduleTab: (t: ScheduleEditorTab) => void;
};

function loadCompleted(): Set<ChapterId> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem('zmanim-tutorial-completed-chapters');
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as ChapterId[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveCompleted(set: Set<ChapterId>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('zmanim-tutorial-completed-chapters', JSON.stringify([...set]));
}

export function TutorialProvider({
  children,
  setActiveSection,
  scheduleTab: _scheduleTab,
  setScheduleTab,
}: TutorialProviderProps) {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<ChapterId | null>(null);
  const [chapterPickerOpen, setChapterPickerOpen] = useState(false);
  const [completedChapters, setCompletedChapters] = useState<Set<ChapterId>>(() => loadCompleted());

  const joyrideKeyRef = useRef(0);
  const activeChapterIdRef = useRef<ChapterId | null>(null);
  activeChapterIdRef.current = activeChapterId;

  const requestEditorTab = useCallback((t: EditorPropertyTab) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('zmanim-tutorial-editor-tab', { detail: t }));
  }, []);

  const nav: NavHelpers = useMemo(
    () => ({
      goSection: (s: AdminSection) => setActiveSection(s),
      goScheduleTab: (t: ScheduleEditorTab) => setScheduleTab(t),
      requestEditorTab,
    }),
    [setActiveSection, setScheduleTab, requestEditorTab],
  );

  const markChapterCompleted = useCallback((id: ChapterId) => {
    setCompletedChapters((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveCompleted(next);
      return next;
    });
  }, []);

  const isChapterComplete = useCallback(
    (id: ChapterId) => completedChapters.has(id),
    [completedChapters],
  );

  const stopTour = useCallback(() => {
    setRun(false);
    setSteps([]);
    setActiveChapterId(null);
  }, []);

  const startChapter = useCallback(
    (id: ChapterId) => {
      const nextSteps = buildChapterSteps(id, nav);
      if (nextSteps.length === 0) return;
      joyrideKeyRef.current += 1;
      setActiveChapterId(id);
      setSteps(nextSteps);
      setRun(true);
      setChapterPickerOpen(false);
    },
    [nav],
  );

  const openChapterPicker = useCallback(() => {
    setChapterPickerOpen(true);
  }, []);

  const finishChapter = useCallback(() => {
    const id = activeChapterIdRef.current;
    if (id) markChapterCompleted(id);
    setActiveChapterId(null);
    setRun(false);
    setSteps([]);
  }, [markChapterCompleted]);

  const onEvent = useCallback(
    (data: EventData) => {
      const { type, status } = data;

      if (type === EVENTS.TARGET_NOT_FOUND) {
        console.warn('Tutorial: target not found', data);
        return;
      }

      if (type === EVENTS.TOUR_END) {
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
          finishChapter();
        }
        return;
      }
    },
    [finishChapter],
  );

  const tooltipComponent = useCallback((props: TooltipRenderProps) => <TutorialTooltip {...props} />, []);

  const value: TutorialContextValue = useMemo(
    () => ({
      startChapter,
      stopTour,
      openChapterPicker,
      chapterPickerOpen,
      setChapterPickerOpen,
      isRunning: run,
      activeChapterId,
      completedChapters,
      markChapterCompleted,
      isChapterComplete,
      requestEditorTab,
    }),
    [
      startChapter,
      stopTour,
      openChapterPicker,
      chapterPickerOpen,
      run,
      activeChapterId,
      completedChapters,
      markChapterCompleted,
      isChapterComplete,
      requestEditorTab,
    ],
  );

  return (
    <TutorialContext.Provider value={value}>
      {children}
      <Joyride
        key={`${joyrideKeyRef.current}-${activeChapterId ?? 'idle'}`}
        run={run}
        steps={steps}
        continuous
        scrollToFirstStep
        tooltipComponent={tooltipComponent}
        onEvent={onEvent}
        locale={{ skip: 'Skip chapter' }}
        floatingOptions={{
          /** Use viewport-fixed positioning so tooltips are not clipped or mispositioned inside scrollable admin panels. */
          strategy: 'fixed',
          shiftOptions: {
            padding: 16,
            crossAxis: true,
            rootBoundary: 'viewport',
          },
          flipOptions: {
            padding: 16,
            crossAxis: true,
          },
        }}
        styles={{
          floater: {
            maxWidth: 'min(100vw - 24px, 440px)',
            boxSizing: 'border-box',
          },
          tooltip: {
            maxWidth: '100%',
            boxSizing: 'border-box',
          },
        }}
        options={{
          zIndex: 25000,
          overlayColor: 'rgba(15, 23, 42, 0.72)',
          buttons: ['back', 'close', 'primary', 'skip'],
          width: 'min(420px, calc(100vw - 32px))',
          scrollOffset: 48,
        }}
      />
    </TutorialContext.Provider>
  );
}
