'use client';

import React from 'react';
import type { TooltipRenderProps } from 'react-joyride';
import { CHAPTER_META, CHAPTER_ORDER } from './chapters';
import type { ChapterId } from './types';

function formatLine(s: string): React.ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function TutorialTooltip(props: TooltipRenderProps) {
  const { backProps, closeProps, primaryProps, skipProps, tooltipProps, index, size, step, isLastStep } = props;
  const chapterId = (step.data?.chapterId as ChapterId | undefined) ?? 'welcome';
  const meta = CHAPTER_META[chapterId];
  const chapterIndex = CHAPTER_ORDER.indexOf(chapterId) + 1;
  const totalChapters = CHAPTER_ORDER.length;

  const content = step.content;
  const body =
    typeof content === 'string' ? (
      <div className="tut-tooltipText">{formatLine(content)}</div>
    ) : (
      <div className="tut-tooltipText">{content}</div>
    );

  return (
    <div className="tut-tooltipCard" {...tooltipProps}>
      <div className="tut-tooltipMeta">
        <span className="tut-tooltipChapterIcon">{meta?.icon ?? '📖'}</span>
        <span className="tut-tooltipChapterLabel">
          Chapter {chapterIndex}/{totalChapters}: {meta?.title ?? 'Tutorial'}
        </span>
      </div>
      {step.title != null && step.title !== '' && (
        <div className="tut-tooltipTitle">{step.title}</div>
      )}
      <div className="tut-tooltipBody">{body}</div>
      <div className="tut-tooltipProgress">
        Step {index + 1} of {size}
      </div>
      <div className="tut-tooltipFooter">
        <span className={index === 0 ? 'tut-btnHidden' : undefined}>
          <button type="button" className="tut-btn tut-btnGhost" {...backProps}>
            Back
          </button>
        </span>
        <div className="tut-tooltipFooterMid">
          <button type="button" className="tut-btn tut-btnSkip" {...skipProps}>
            Skip chapter
          </button>
        </div>
        <button type="button" className="tut-btn tut-btnPrimary" {...primaryProps}>
          {isLastStep ? 'Done' : 'Next'}
        </button>
      </div>
      <button type="button" className="tut-tooltipClose" {...closeProps} aria-label="Close">
        ×
      </button>
    </div>
  );
}
