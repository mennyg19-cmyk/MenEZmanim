import { NextRequest } from 'next/server';
import { json, error, options } from '../../_lib/response';
import { authorizeWrite, isAuthError } from '../../_lib/auth-helpers';
import * as da from '../../_lib/data-access';
import { getDbClient } from '@zmanim-app/db';

/**
 * POST /api/admin/clone
 * Body: { sourceOrgId: string, targetOrgId: string }
 * Clones schedules, groups, announcements, memorials, and styles from source to target.
 * Requires owner/admin on target org (or super admin).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceOrgId, targetOrgId } = body;

    if (!sourceOrgId || !targetOrgId) {
      return error('sourceOrgId and targetOrgId are required', 400);
    }

    const authResult = await authorizeWrite(targetOrgId, ['owner', 'admin']);
    if (isAuthError(authResult)) return authResult;

    const sourceResolved = await da.resolveOrgId(sourceOrgId);
    const targetResolved = await da.resolveOrgId(targetOrgId);
    if (!sourceResolved) return error('Source organization not found', 404);
    if (!targetResolved) return error('Target organization not found', 404);

    const db = getDbClient();

    // Clone schedule groups (with new IDs, mapping old→new)
    const sourceGroups = await db.scheduleGroup.findMany({ where: { orgId: sourceResolved } });
    const groupIdMap = new Map<string, string>();
    for (const g of sourceGroups) {
      const newId = `${g.id}-${targetResolved}`;
      groupIdMap.set(g.id, newId);
      await db.scheduleGroup.upsert({
        where: { id: newId },
        create: {
          id: newId,
          orgId: targetResolved,
          name: g.name,
          hebrewName: g.hebrewName,
          color: g.color,
          sortOrder: g.sortOrder,
          active: g.active,
          isBuiltIn: false,
        },
        update: {},
      });
    }

    // Clone schedules
    const sourceSchedules = await db.minyanSchedule.findMany({ where: { orgId: sourceResolved } });
    for (const s of sourceSchedules) {
      const newId = `${s.id}-${targetResolved}`;
      const newGroupIds = s.scheduleGroupIds
        ? s.scheduleGroupIds.split(',').map((gid: string) => groupIdMap.get(gid.trim()) ?? gid.trim()).join(',')
        : null;
      await db.minyanSchedule.upsert({
        where: { id: newId },
        create: {
          id: newId,
          orgId: targetResolved,
          name: s.name,
          hebrewName: s.hebrewName,
          type: s.type,
          baseZman: s.baseZman,
          fixedTime: s.fixedTime,
          offset: s.offset,
          roundTo: s.roundTo,
          earliest: s.earliest,
          latest: s.latest,
          room: s.room,
          dayOfWeekMask: s.dayOfWeekMask,
          scheduleGroupIds: newGroupIds,
          details: s.details ?? undefined,
          isActive: s.isActive,
          sortOrder: s.sortOrder,
        },
        update: {},
      });
    }

    // Clone announcements
    const sourceAnnouncements = await db.announcement.findMany({ where: { orgId: sourceResolved } });
    for (const a of sourceAnnouncements) {
      const newId = `${a.id}-${targetResolved}`;
      await db.announcement.upsert({
        where: { id: newId },
        create: {
          id: newId,
          orgId: targetResolved,
          title: a.title,
          titleHebrew: a.titleHebrew,
          content: a.content,
          contentHebrew: a.contentHebrew,
          priority: a.priority,
          isActive: a.isActive,
        },
        update: {},
      });
    }

    // Clone memorials
    const sourceMemorials = await db.memorial.findMany({ where: { orgId: sourceResolved } });
    for (const m of sourceMemorials) {
      const newId = `${m.id}-${targetResolved}`;
      await db.memorial.upsert({
        where: { id: newId },
        create: {
          id: newId,
          orgId: targetResolved,
          hebrewName: m.hebrewName,
          englishName: m.englishName,
          hebrewFamilyName: m.hebrewFamilyName,
          hebrewBenBat: m.hebrewBenBat,
          hebrewYear: m.hebrewYear,
          hebrewMonth: m.hebrewMonth,
          hebrewDay: m.hebrewDay,
          hebrewAdar: m.hebrewAdar,
          civilDate: m.civilDate,
          isYahrzeit: m.isYahrzeit,
          donorInfo: m.donorInfo,
          notes: m.notes,
          isActive: m.isActive,
        },
        update: {},
      });
    }

    // Clone styles and display objects
    const sourceStyles = await db.style.findMany({
      where: { orgId: sourceResolved },
      include: { displayObjects: true },
    });
    const styleIdMap = new Map<string, string>();
    for (const style of sourceStyles) {
      const newStyleId = `${style.id}-${targetResolved}`;
      styleIdMap.set(style.id, newStyleId);
      await db.style.upsert({
        where: { id: newStyleId },
        create: {
          id: newStyleId,
          orgId: targetResolved,
          name: style.name,
          backgroundImage: style.backgroundImage,
          backgroundColor: style.backgroundColor,
          backgroundMode: style.backgroundMode,
          backgroundGradient: style.backgroundGradient,
          backgroundTexture: style.backgroundTexture,
          backgroundFrameId: style.backgroundFrameId,
          backgroundFrameThickness: style.backgroundFrameThickness,
          canvasWidth: style.canvasWidth,
          canvasHeight: style.canvasHeight,
          isDefault: style.isDefault,
          activationRules: style.activationRules,
          sortOrder: style.sortOrder,
        },
        update: {},
      });

      // Clone display objects for this style
      await db.displayObject.deleteMany({ where: { styleId: newStyleId } });
      for (const obj of style.displayObjects) {
        // Remap group IDs inside content if present
        let content = obj.content;
        if (content && typeof content === 'string') {
          try {
            const parsed = JSON.parse(content);
            if (parsed.groupIds && Array.isArray(parsed.groupIds)) {
              parsed.groupIds = parsed.groupIds.map((gid: string) => groupIdMap.get(gid) ?? gid);
              content = JSON.stringify(parsed);
            }
          } catch { /* not JSON, keep as-is */ }
        }

        await db.displayObject.create({
          data: {
            id: `${obj.id}-${targetResolved}`,
            styleId: newStyleId,
            name: obj.name,
            type: obj.type,
            posX: obj.posX,
            posY: obj.posY,
            width: obj.width,
            height: obj.height,
            layer: obj.layer,
            fontFamily: obj.fontFamily,
            fontSize: obj.fontSize,
            fontBold: obj.fontBold,
            fontItalic: obj.fontItalic,
            foreColor: obj.foreColor,
            backColor: obj.backColor,
            language: obj.language,
            content: content,
            scheduleRules: obj.scheduleRules,
            scheduleGroupVisibility: obj.scheduleGroupVisibility,
            visible: obj.visible,
          },
        });
      }
    }

    // Update target screens to use the cloned style
    const targetScreens = await db.screen.findMany({ where: { orgId: targetResolved } });
    if (targetScreens.length > 0 && styleIdMap.size > 0) {
      const firstNewStyleId = styleIdMap.values().next().value;
      for (const screen of targetScreens) {
        if (!screen.assignedStyleId || !styleIdMap.has(screen.assignedStyleId)) {
          await db.screen.update({
            where: { id: screen.id },
            data: { assignedStyleId: firstNewStyleId },
          });
        }
      }
    }

    return json({
      success: true,
      cloned: {
        groups: sourceGroups.length,
        schedules: sourceSchedules.length,
        announcements: sourceAnnouncements.length,
        memorials: sourceMemorials.length,
        styles: sourceStyles.length,
      },
    });
  } catch (err) {
    console.error('Clone error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}
