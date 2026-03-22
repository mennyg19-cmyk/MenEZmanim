import type { DisplayObject, DisplayStyle, StyleActivationRule } from '@zmanim-app/core';
import type { DisplayObject as PrismaDO, Style as PrismaStyle } from '@prisma/client';

export function parseActivationRules(raw: string): StyleActivationRule[] {
  try {
    const v = JSON.parse(raw) as unknown;
    if (Array.isArray(v)) return v as StyleActivationRule[];
    if (v && typeof v === 'object' && Array.isArray((v as { rules?: unknown }).rules)) {
      return (v as { rules: StyleActivationRule[] }).rules;
    }
    if (v && typeof v === 'object' && 'type' in (v as object)) {
      return [v as StyleActivationRule];
    }
    return [{ type: 'default' }];
  } catch {
    return [{ type: 'default' }];
  }
}

export function serializeActivationRules(rules: StyleActivationRule[]): string {
  return JSON.stringify(rules);
}

export function prismaDisplayObjectToDisplayObject(row: PrismaDO): DisplayObject {
  let content: Record<string, unknown> = {};
  if (row.content) {
    try {
      content = JSON.parse(row.content) as Record<string, unknown>;
    } catch {
      content = {};
    }
  }
  let scheduleRules: DisplayObject['scheduleRules'];
  if (row.scheduleRules) {
    try {
      scheduleRules = JSON.parse(row.scheduleRules) as DisplayObject['scheduleRules'];
    } catch {
      scheduleRules = undefined;
    }
  }
  let scheduleGroupVisibility: DisplayObject['scheduleGroupVisibility'];
  if (row.scheduleGroupVisibility) {
    try {
      scheduleGroupVisibility = JSON.parse(row.scheduleGroupVisibility) as DisplayObject['scheduleGroupVisibility'];
    } catch {
      scheduleGroupVisibility = undefined;
    }
  }
  return {
    id: row.id,
    type: row.type as DisplayObject['type'],
    name: row.name,
    position: { x: row.posX, y: row.posY, width: row.width, height: row.height },
    zIndex: row.layer,
    font: {
      family: row.fontFamily,
      size: row.fontSize,
      bold: row.fontBold,
      italic: row.fontItalic,
      color: row.foreColor,
    },
    backgroundColor: row.backColor,
    language: row.language as DisplayObject['language'],
    content,
    scheduleRules,
    scheduleGroupVisibility,
    visible: row.visible,
  };
}

export function displayObjectToPrismaFields(obj: DisplayObject, styleId: string) {
  return {
    id: obj.id,
    styleId,
    name: obj.name,
    type: String(obj.type),
    posX: obj.position.x,
    posY: obj.position.y,
    width: obj.position.width,
    height: obj.position.height,
    layer: obj.zIndex,
    fontFamily: obj.font.family,
    fontSize: obj.font.size,
    fontBold: obj.font.bold,
    fontItalic: obj.font.italic,
    foreColor: obj.font.color,
    backColor: obj.backgroundColor,
    language: obj.language,
    content: JSON.stringify(obj.content ?? {}),
    scheduleRules: obj.scheduleRules ? JSON.stringify(obj.scheduleRules) : null,
    scheduleGroupVisibility: obj.scheduleGroupVisibility
      ? JSON.stringify(obj.scheduleGroupVisibility)
      : null,
    visible: obj.visible,
  };
}

export function prismaStyleRowToDisplayStyle(row: PrismaStyle, objects: PrismaDO[]): DisplayStyle {
  return {
    id: row.id,
    name: row.name,
    backgroundImage: row.backgroundImage ?? undefined,
    backgroundColor: row.backgroundColor,
    backgroundMode: row.backgroundMode as DisplayStyle['backgroundMode'],
    backgroundGradient: row.backgroundGradient ?? undefined,
    backgroundTexture: row.backgroundTexture ?? undefined,
    backgroundFrameId: row.backgroundFrameId ?? undefined,
    backgroundFrameThickness: row.backgroundFrameThickness ?? undefined,
    canvasWidth: row.canvasWidth,
    canvasHeight: row.canvasHeight,
    objects: objects.map(prismaDisplayObjectToDisplayObject),
    activationRules: parseActivationRules(row.activationRules),
    sortOrder: row.sortOrder,
  };
}

export function styleRowCreateFromDisplayStyle(style: DisplayStyle, orgId: string) {
  return {
    id: style.id,
    orgId,
    name: style.name,
    backgroundImage: style.backgroundImage ?? null,
    backgroundColor: style.backgroundColor,
    backgroundMode: style.backgroundMode ?? 'solid',
    backgroundGradient: style.backgroundGradient ?? null,
    backgroundTexture: style.backgroundTexture ?? null,
    backgroundFrameId: style.backgroundFrameId ?? null,
    backgroundFrameThickness: style.backgroundFrameThickness ?? null,
    canvasWidth: style.canvasWidth,
    canvasHeight: style.canvasHeight,
    isDefault: style.activationRules.some((r) => r.type === 'default'),
    activationRules: serializeActivationRules(style.activationRules),
    sortOrder: style.sortOrder,
  };
}
