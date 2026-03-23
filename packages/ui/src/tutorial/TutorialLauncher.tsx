'use client';

import React, { useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { CHAPTER_META, CHAPTER_ORDER, STORAGE_WELCOME } from './chapters';
import { useTutorial } from './TutorialProvider';

export function TutorialLauncher() {
  const { setChapterPickerOpen, chapterPickerOpen, startChapter, completedChapters } = useTutorial();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_WELCOME) === '1') return;
    localStorage.setItem(STORAGE_WELCOME, '1');
    setChapterPickerOpen(true);
  }, [setChapterPickerOpen]);

  return (
    <>
      <button
        type="button"
        className="tut-fab"
        title="Interactive tutorial — learn the app step by step"
        aria-label="Open tutorial chapters"
        onClick={() => setChapterPickerOpen(true)}
      >
        <span className="tut-fabIcon" aria-hidden>
          ?
        </span>
        <span className="tut-fabLabel">Tutorial</span>
      </button>

      <Modal
        open={chapterPickerOpen}
        onClose={() => setChapterPickerOpen(false)}
        title="Interactive tutorial"
        maxWidth={720}
        zIndex={24000}
        className="tut-pickerModalWrap"
        bodyClassName="tut-pickerBody"
      >
        <p className="tut-pickerIntro">
          Pick a chapter to learn that area — overlays and arrows guide you through real clicks. You can restart any chapter anytime.
        </p>
        <div className="tut-chapterGrid">
          {CHAPTER_ORDER.map((id) => {
            const meta = CHAPTER_META[id];
            const done = completedChapters.has(id);
            return (
              <button key={id} type="button" className="tut-chapterCard" onClick={() => startChapter(id)}>
                <span className="tut-chapterIcon">{meta.icon}</span>
                <span className="tut-chapterTitle">{meta.title}</span>
                <span className="tut-chapterDesc">{meta.description}</span>
                {done && <span className="tut-chapterDone">Completed</span>}
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
}

/** Compact link for dashboard header — opens the chapter picker */
export function TutorialHelpLink() {
  const { setChapterPickerOpen } = useTutorial();
  return (
    <button type="button" className="tut-helpLink" onClick={() => setChapterPickerOpen(true)}>
      <span aria-hidden>📘</span> Tutorial
    </button>
  );
}
