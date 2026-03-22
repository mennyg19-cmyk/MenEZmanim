import type React from 'react';
import type { CanvasBackgroundMode, DisplayObject, DisplayStyle } from '@zmanim-app/core';
import { getTextureCss } from './textures';

export type BgMode = 'solid' | 'transparent' | 'image' | 'canvas' | 'gradient' | 'texture';

/** Optional canvas style fields for "Canvas BG" object mode (gradient/texture canvases). */
export type CanvasBgExtras = Pick<DisplayStyle, 'backgroundMode' | 'backgroundGradient' | 'backgroundTexture' | 'backgroundImage'>;

export function getObjBgMode(obj: DisplayObject): BgMode {
  return (obj.content?.backgroundMode as BgMode) ?? 'solid';
}

/** Effective canvas background mode (backward compatible with styles that only set backgroundImage). */
export function getCanvasBgMode(style: DisplayStyle): CanvasBackgroundMode {
  const explicit = style.backgroundMode as CanvasBackgroundMode | undefined;
  if (explicit) return explicit;
  if (style.backgroundImage) return 'image';
  return 'solid';
}

function getCanvasBgModeFromExtras(_canvasBgColor: string, canvasBgImage?: string, extras?: CanvasBgExtras): CanvasBackgroundMode {
  if (extras?.backgroundMode) return extras.backgroundMode as CanvasBackgroundMode;
  if (extras?.backgroundImage || canvasBgImage) return 'image';
  return 'solid';
}

export function resolveObjBackground(
  obj: DisplayObject,
  canvasBgColor: string,
  canvasW: number,
  canvasH: number,
  canvasBgImage?: string,
  canvasExtras?: CanvasBgExtras,
): React.CSSProperties {
  const mode = getObjBgMode(obj);
  switch (mode) {
    case 'transparent':
      return { backgroundColor: 'transparent' };
    case 'image':
      return obj.content?.backgroundImageUrl
        ? {
            backgroundImage: `url(${obj.content.backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: 'transparent',
          }
        : { backgroundColor: 'transparent' };
    case 'gradient': {
      const g =
        (typeof obj.content?.gradientValue === 'string' && obj.content.gradientValue) ||
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      return { background: g, backgroundColor: 'transparent' };
    }
    case 'texture': {
      const id = typeof obj.content?.textureId === 'string' ? obj.content.textureId : undefined;
      return { background: getTextureCss(id), backgroundColor: 'transparent' };
    }
    case 'canvas': {
      const cbgMode = getCanvasBgModeFromExtras(canvasBgColor, canvasBgImage, canvasExtras);
      if (cbgMode === 'gradient') {
        const g =
          (typeof canvasExtras?.backgroundGradient === 'string' && canvasExtras.backgroundGradient) ||
          'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
        return {
          background: g,
          backgroundSize: `${canvasW}px ${canvasH}px`,
          backgroundPosition: `-${obj.position.x}px -${obj.position.y}px`,
        };
      }
      if (cbgMode === 'texture') {
        return {
          background: getTextureCss(canvasExtras?.backgroundTexture),
          backgroundSize: `${canvasW}px ${canvasH}px`,
          backgroundPosition: `-${obj.position.x}px -${obj.position.y}px`,
        };
      }
      const base: React.CSSProperties = { backgroundColor: canvasBgColor || '#000' };
      const img = canvasExtras?.backgroundImage ?? canvasBgImage;
      if (img) {
        base.backgroundImage = `url(${img})`;
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

/** Inline styles for the display canvas background (inside optional frame). */
export function resolveCanvasBackground(style: DisplayStyle, canvasW: number, canvasH: number): React.CSSProperties {
  const mode = getCanvasBgMode(style);
  switch (mode) {
    case 'image':
      if (style.backgroundImage) {
        return {
          backgroundColor: style.backgroundColor || '#000',
          backgroundImage: `url(${style.backgroundImage})`,
          backgroundSize: `${canvasW}px ${canvasH}px`,
          backgroundPosition: '0 0',
          backgroundRepeat: 'no-repeat',
        };
      }
      return { backgroundColor: style.backgroundColor || '#000' };
    case 'gradient': {
      const g =
        (typeof style.backgroundGradient === 'string' && style.backgroundGradient) ||
        'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
      return { background: g, backgroundColor: 'transparent' };
    }
    case 'texture': {
      const id = typeof style.backgroundTexture === 'string' ? style.backgroundTexture : undefined;
      return { background: getTextureCss(id), backgroundColor: 'transparent' };
    }
    case 'solid':
    default:
      return { backgroundColor: style.backgroundColor || '#000' };
  }
}
