import type React from 'react';
import type { DisplayObject } from '@zmanim-app/core';

export type BgMode = 'solid' | 'transparent' | 'image' | 'canvas';

export function getObjBgMode(obj: DisplayObject): BgMode {
  return obj.content?.backgroundMode ?? 'solid';
}

export function resolveObjBackground(
  obj: DisplayObject,
  canvasBgColor: string,
  canvasW: number,
  canvasH: number,
  canvasBgImage?: string,
): React.CSSProperties {
  const mode = getObjBgMode(obj);
  switch (mode) {
    case 'transparent':
      return { backgroundColor: 'transparent' };
    case 'image':
      return obj.content?.backgroundImageUrl
        ? { backgroundImage: `url(${obj.content.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'transparent' }
        : { backgroundColor: 'transparent' };
    case 'canvas': {
      const base: React.CSSProperties = { backgroundColor: canvasBgColor || '#000' };
      if (canvasBgImage) {
        base.backgroundImage = `url(${canvasBgImage})`;
        base.backgroundSize = `${canvasW}px ${canvasH}px`;
        base.backgroundPosition = `-${obj.position.x}px -${obj.position.y}px`;
        base.backgroundRepeat = 'no-repeat';
      }
      return base;
    }
    case 'solid':
    default:
      return { backgroundColor: obj.backgroundColor || 'transparent' };
  }
}
