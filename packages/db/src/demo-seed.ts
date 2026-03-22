import type { Prisma, PrismaClient } from '@prisma/client';
import { getDbClient } from './client';
import {
  DEMO_ANNOUNCEMENTS,
  DEMO_DISPLAY_STYLE,
  DEMO_GROUPS,
  DEMO_MEMORIALS,
  DEMO_ORG_ID,
  DEMO_ORG_SLUG,
  DEMO_SCHEDULES,
  type ScheduleSeed,
} from './seed-constants';
import { displayObjectToPrismaFields, styleRowCreateFromDisplayStyle } from './style-mapper';

function scheduleSeedToPrismaRow(s: ScheduleSeed, orgId: string) {
  const details: Record<string, unknown> = {};
  if (s.limitBefore) details.limitBefore = s.limitBefore;
  const hasDetails = Object.keys(details).length > 0;
  return {
    id: s.id,
    orgId,
    name: s.name,
    hebrewName: s.name,
    type: s.type,
    baseZman: s.baseZman ?? null,
    fixedTime: s.fixedTime ?? null,
    offset: s.offset ?? 0,
    roundTo: 5,
    earliest: s.limitBefore ?? null,
    latest: null,
    room: s.room ?? null,
    dayOfWeekMask: '1111111',
    scheduleGroupIds: s.groupId ?? null,
    details: hasDetails ? (details as Prisma.InputJsonValue) : undefined,
    isActive: true,
    sortOrder: s.sortOrder,
  };
}

/**
 * Idempotent demo org (`default` / slug `demo`) with full default layout and data.
 */
export async function seedDemoOrganization(db: PrismaClient = getDbClient()) {
  const settings = JSON.stringify({
    nameHebrew: 'בית הכנסת',
    locationName: 'Jerusalem',
  });

  await db.organization.upsert({
    where: { id: DEMO_ORG_ID },
    create: {
      id: DEMO_ORG_ID,
      name: 'Default Synagogue',
      slug: DEMO_ORG_SLUG,
      latitude: 31.7683,
      longitude: 35.2137,
      elevation: 0,
      timezone: 'Asia/Jerusalem',
      dialect: 'Ashkenazi',
      candleLightingMinutes: 18,
      shabbatEndType: 'degrees',
      shabbatEndValue: 8.5,
      rabbeinu_tam_minutes: 72,
      amPmFormat: false,
      inIsrael: true,
      settings,
    },
    update: {
      slug: DEMO_ORG_SLUG,
      settings,
    },
  });

  const styleRow = styleRowCreateFromDisplayStyle(DEMO_DISPLAY_STYLE, DEMO_ORG_ID);
  await db.style.upsert({
    where: { id: DEMO_DISPLAY_STYLE.id },
    create: styleRow,
    update: {
      name: styleRow.name,
      backgroundImage: styleRow.backgroundImage,
      backgroundColor: styleRow.backgroundColor,
      backgroundMode: styleRow.backgroundMode,
      backgroundGradient: styleRow.backgroundGradient,
      backgroundTexture: styleRow.backgroundTexture,
      backgroundFrameId: styleRow.backgroundFrameId,
      backgroundFrameThickness: styleRow.backgroundFrameThickness,
      canvasWidth: styleRow.canvasWidth,
      canvasHeight: styleRow.canvasHeight,
      activationRules: styleRow.activationRules,
      sortOrder: styleRow.sortOrder,
      isDefault: styleRow.isDefault,
    },
  });

  await db.displayObject.deleteMany({ where: { styleId: DEMO_DISPLAY_STYLE.id } });
  const objData = DEMO_DISPLAY_STYLE.objects.map((o) => displayObjectToPrismaFields(o, DEMO_DISPLAY_STYLE.id));
  await db.displayObject.createMany({ data: objData });

  await db.screen.upsert({
    where: { id: '1' },
    create: {
      id: '1',
      name: 'Main Display',
      orgId: DEMO_ORG_ID,
      assignedStyleId: DEMO_DISPLAY_STYLE.id,
      isActive: true,
      resolution: '1920x1080',
    },
    update: {
      assignedStyleId: DEMO_DISPLAY_STYLE.id,
      isActive: true,
    },
  });

  await db.scheduleGroup.deleteMany({ where: { orgId: DEMO_ORG_ID } });
  await db.scheduleGroup.createMany({
    data: DEMO_GROUPS.map((g) => ({
      id: g.id,
      orgId: DEMO_ORG_ID,
      name: g.name,
      hebrewName: g.nameHebrew,
      color: g.color,
      sortOrder: g.sortOrder,
      active: g.active,
      isBuiltIn: false,
    })),
  });

  await db.minyanSchedule.deleteMany({ where: { orgId: DEMO_ORG_ID } });
  await db.minyanSchedule.createMany({
    data: DEMO_SCHEDULES.map((s) => scheduleSeedToPrismaRow(s, DEMO_ORG_ID)),
  });

  await db.announcement.deleteMany({ where: { orgId: DEMO_ORG_ID } });
  await db.announcement.createMany({
    data: DEMO_ANNOUNCEMENTS.map((a) => ({
      id: a.id,
      orgId: DEMO_ORG_ID,
      title: a.title,
      titleHebrew: 'titleHebrew' in a ? (a.titleHebrew ?? null) : null,
      content: a.content,
      contentHebrew: 'contentHebrew' in a ? (a.contentHebrew ?? null) : null,
      priority: a.priority,
      isActive: a.active,
    })),
  });

  await db.memorial.deleteMany({ where: { orgId: DEMO_ORG_ID } });
  await db.memorial.createMany({
    data: DEMO_MEMORIALS.map((m) => ({
      id: m.id,
      orgId: DEMO_ORG_ID,
      hebrewName: m.hebrewName,
      englishName: m.englishName,
      hebrewFamilyName: m.hebrewDate,
      hebrewMonth: m.hebrewMonth,
      hebrewDay: m.hebrewDay,
      donorInfo: m.relationship ?? null,
      notes: 'notes' in m ? (m.notes ?? null) : null,
      isActive: true,
    })),
  });

  await db.media.deleteMany({ where: { orgId: DEMO_ORG_ID } });
  await db.media.create({
    data: {
      id: 'media-sample-1',
      orgId: DEMO_ORG_ID,
      filename: 'sample-banner.svg',
      originalName: 'sample-banner.svg',
      mimeType: 'image/svg+xml',
      fileSize: 1,
      filePath: '/sample-banner.svg',
      sortOrder: 0,
      isActive: true,
    },
  });
}
