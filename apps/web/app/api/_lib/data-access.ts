import {
  displayObjectToPrismaFields,
  ensureTablesExist,
  getDbClient,
  prismaStyleRowToDisplayStyle,
  seedDemoOrganization,
  styleRowCreateFromDisplayStyle,
  type Prisma,
  type PrismaAnnouncement,
  type PrismaGroup,
  type PrismaMedia,
  type PrismaMemorial,
  type PrismaOrgRow,
  type PrismaSchedule,
  type PrismaScreen,
} from '@zmanim-app/db';
import type { DisplayStyle } from '@zmanim-app/core';
import type {
  Announcement,
  DaveningGroup,
  MediaItem,
  Memorial,
  MinyanSchedule,
  Organization,
  Screen,
} from './store-types';

function normalizeOrgKey(key: string): string {
  return decodeURIComponent(key).trim();
}

function parseSettingsJson(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function stringifySettings(obj: Record<string, unknown>): string {
  return JSON.stringify(obj);
}

function orgRowToDto(row: PrismaOrgRow): Organization {
  const settings = parseSettingsJson(row.settings);
  const nameHebrew = (settings.nameHebrew as string) ?? row.name;
  const locationName = (settings.locationName as string) ?? row.name;
  return {
    id: row.id,
    name: row.name,
    nameHebrew,
    slug: row.slug,
    location: {
      name: locationName,
      latitude: row.latitude,
      longitude: row.longitude,
      elevation: row.elevation,
      timezone: row.timezone,
      inIsrael: row.inIsrael,
    },
    settings,
  };
}

async function findOrgRow(orgKey: string): Promise<PrismaOrgRow | null> {
  const key = normalizeOrgKey(orgKey);
  const db = getDbClient();
  const byId = await db.organization.findUnique({ where: { id: key } });
  if (byId) return byId;
  const bySlug = await db.organization.findUnique({ where: { slug: key } });
  if (bySlug) return bySlug;
  const lower = key.toLowerCase();
  const all = await db.organization.findMany({ take: 50 });
  return all.find((o) => o.id.toLowerCase() === lower || o.slug.toLowerCase() === lower) ?? null;
}

let ensureSeededPromise: Promise<void> | null = null;

async function ensureSeeded(): Promise<void> {
  if (!ensureSeededPromise) {
    ensureSeededPromise = (async () => {
      const db = getDbClient();
      if (process.env.TURSO_DATABASE_URL) {
        await ensureTablesExist(db);
      }
      const n = await db.organization.count();
      if (n === 0) {
        await seedDemoOrganization(db);
      }
    })();
  }
  await ensureSeededPromise;
}

export async function getOrg(orgKey: string): Promise<Organization | null> {
  await ensureSeeded();
  const row = await findOrgRow(orgKey);
  return row ? orgRowToDto(row) : null;
}

export async function resolveOrgId(orgKey: string): Promise<string | undefined> {
  const o = await getOrg(orgKey);
  return o?.id;
}

/** Persist full org DTO (matches former in-memory merge behavior). */
export async function saveOrganizationDto(org: Organization): Promise<Organization> {
  await ensureSeeded();
  const settings = {
    ...org.settings,
    nameHebrew: org.nameHebrew,
    locationName: org.location.name,
  };
  const db = getDbClient();
  await db.organization.update({
    where: { id: org.id },
    data: {
      name: org.name,
      slug: org.slug,
      latitude: org.location.latitude,
      longitude: org.location.longitude,
      elevation: org.location.elevation,
      timezone: org.location.timezone,
      inIsrael: org.location.inIsrael,
      settings: stringifySettings(settings),
    },
  });
  const row = await db.organization.findUnique({ where: { id: org.id } });
  return orgRowToDto(row!);
}

function scheduleToPrisma(s: MinyanSchedule, orgId: string) {
  const mask = s.daysActive?.length
    ? s.daysActive.map((d) => (d ? '1' : '0')).join('').padEnd(7, '1').slice(0, 7)
    : '1111111';
  const detailsObj = {
    timeMode: s.timeMode,
    roundMode: s.roundMode,
    limitBefore: s.limitBefore,
    limitAfter: s.limitAfter,
    durationMinutes: s.durationMinutes,
    visibilityRules: s.visibilityRules,
    isPlaceholder: s.isPlaceholder,
    placeholderLabel: s.placeholderLabel,
    groupId: s.groupId,
    daysActive: s.daysActive,
  };
  const hasDetails = Object.values(detailsObj).some((v) => v !== undefined && v !== null);
  return {
    id: s.id,
    orgId,
    name: s.name,
    hebrewName: s.name,
    type: s.type,
    baseZman: s.baseZman ?? null,
    fixedTime: s.fixedTime ?? null,
    offset: s.offset ?? 0,
    roundTo: s.roundTo ?? 5,
    earliest: s.limitBefore ?? null,
    latest: s.limitAfter ?? null,
    room: s.room ?? null,
    dayOfWeekMask: mask,
    scheduleGroupIds: s.groupId ?? null,
    details: hasDetails ? (detailsObj as Prisma.InputJsonValue) : undefined,
    isActive: true,
    sortOrder: s.sortOrder ?? 0,
  };
}

function scheduleFromPrisma(row: PrismaSchedule): MinyanSchedule {
  const d = (row.details as Record<string, unknown> | null) ?? {};
  const mask = row.dayOfWeekMask ?? '1111111';
  const daysFromMask = mask.split('').slice(0, 7).map((c) => c === '1');
  return {
    id: row.id,
    orgId: row.orgId,
    name: row.name,
    type: row.type,
    groupId: (d.groupId as string) ?? row.scheduleGroupIds ?? undefined,
    timeMode: d.timeMode as MinyanSchedule['timeMode'],
    fixedTime: row.fixedTime ?? undefined,
    baseZman: row.baseZman ?? undefined,
    offset: row.offset,
    roundTo: row.roundTo,
    roundMode: d.roundMode as MinyanSchedule['roundMode'],
    limitBefore: (d.limitBefore as string) ?? row.earliest ?? undefined,
    limitAfter: (d.limitAfter as string) ?? row.latest ?? undefined,
    durationMinutes: d.durationMinutes as number | undefined,
    daysActive: (d.daysActive as boolean[]) ?? daysFromMask,
    visibilityRules: d.visibilityRules as MinyanSchedule['visibilityRules'],
    room: row.room ?? undefined,
    sortOrder: row.sortOrder,
    isPlaceholder: d.isPlaceholder as boolean | undefined,
    placeholderLabel: d.placeholderLabel as string | undefined,
  };
}

function groupFromPrisma(g: PrismaGroup): DaveningGroup {
  return {
    id: g.id,
    name: g.name,
    nameHebrew: g.hebrewName,
    color: g.color,
    sortOrder: g.sortOrder,
    active: g.active,
  };
}

function announcementFromPrisma(a: PrismaAnnouncement): Announcement {
  return {
    id: a.id,
    orgId: a.orgId,
    title: a.title,
    titleHebrew: a.titleHebrew ?? undefined,
    content: a.content,
    contentHebrew: a.contentHebrew ?? undefined,
    priority: a.priority,
    active: a.isActive,
    startDate: a.startDate ?? undefined,
    endDate: a.endDate ?? undefined,
    createdAt: a.createdAt.toISOString(),
  };
}

function memorialFromPrisma(m: PrismaMemorial): Memorial {
  return {
    id: m.id,
    orgId: m.orgId,
    hebrewName: m.hebrewName,
    englishName: m.englishName ?? undefined,
    hebrewDate: m.hebrewFamilyName ?? '',
    hebrewMonth: m.hebrewMonth,
    hebrewDay: m.hebrewDay,
    relationship: m.donorInfo ?? undefined,
    notes: m.notes ?? undefined,
  };
}

function mediaFromPrisma(m: PrismaMedia): MediaItem {
  return {
    id: m.id,
    orgId: m.orgId,
    url: m.filePath.startsWith('http') || m.filePath.startsWith('/') ? m.filePath : `/${m.filePath}`,
    filename: m.originalName,
    mimeType: m.mimeType,
    uploadedAt: m.createdAt.toISOString(),
  };
}

function screenFromPrisma(s: PrismaScreen): Screen {
  return {
    id: s.id,
    orgId: s.orgId,
    name: s.name,
    styleId: s.assignedStyleId ?? '',
    active: s.isActive,
    resolution: s.resolution,
  };
}

export async function getOrgStyles(orgIdOrSlug: string): Promise<DisplayStyle[]> {
  await ensureSeeded();
  const id = await resolveOrgId(orgIdOrSlug);
  if (!id) return [];
  const db = getDbClient();
  const rows = await db.style.findMany({
    where: { orgId: id },
    orderBy: { sortOrder: 'asc' },
    include: { displayObjects: { orderBy: { layer: 'asc' } } },
  });
  return rows.map((r) => prismaStyleRowToDisplayStyle(r, r.displayObjects));
}

export async function getOrgScreens(orgIdOrSlug: string): Promise<Screen[]> {
  await ensureSeeded();
  const id = await resolveOrgId(orgIdOrSlug);
  if (!id) return [];
  const db = getDbClient();
  const rows = await db.screen.findMany({ where: { orgId: id } });
  return rows.map(screenFromPrisma);
}

export async function getOrgAnnouncements(orgIdOrSlug: string): Promise<Announcement[]> {
  await ensureSeeded();
  const id = await resolveOrgId(orgIdOrSlug);
  if (!id) return [];
  const db = getDbClient();
  const rows = await db.announcement.findMany({
    where: { orgId: id },
    orderBy: { priority: 'desc' },
  });
  return rows.map(announcementFromPrisma);
}

export async function getOrgMemorials(orgIdOrSlug: string): Promise<Memorial[]> {
  await ensureSeeded();
  const id = await resolveOrgId(orgIdOrSlug);
  if (!id) return [];
  const db = getDbClient();
  const rows = await db.memorial.findMany({ where: { orgId: id } });
  return rows.map(memorialFromPrisma);
}

export async function getOrgGroups(orgIdOrSlug: string): Promise<DaveningGroup[]> {
  await ensureSeeded();
  const id = await resolveOrgId(orgIdOrSlug);
  if (!id) return [];
  const db = getDbClient();
  const rows = await db.scheduleGroup.findMany({
    where: { orgId: id },
    orderBy: { sortOrder: 'asc' },
  });
  return rows.map(groupFromPrisma);
}

export async function getOrgSchedules(orgIdOrSlug: string): Promise<MinyanSchedule[]> {
  await ensureSeeded();
  const id = await resolveOrgId(orgIdOrSlug);
  if (!id) return [];
  const db = getDbClient();
  const rows = await db.minyanSchedule.findMany({
    where: { orgId: id },
    orderBy: { sortOrder: 'asc' },
  });
  return rows.map(scheduleFromPrisma);
}

export async function getOrgMedia(orgIdOrSlug: string): Promise<MediaItem[]> {
  await ensureSeeded();
  const id = await resolveOrgId(orgIdOrSlug);
  if (!id) return [];
  const db = getDbClient();
  const rows = await db.media.findMany({
    where: { orgId: id },
    orderBy: { sortOrder: 'asc' },
  });
  return rows.map(mediaFromPrisma);
}

export async function replaceSchedules(orgId: string, schedules: MinyanSchedule[]): Promise<void> {
  const db = getDbClient();
  await db.minyanSchedule.deleteMany({ where: { orgId } });
  if (schedules.length === 0) return;
  await db.minyanSchedule.createMany({
    data: schedules.map((s) => scheduleToPrisma({ ...s, orgId }, orgId)),
  });
}

export async function appendSchedule(orgId: string, s: MinyanSchedule): Promise<MinyanSchedule> {
  const db = getDbClient();
  const row = await db.minyanSchedule.create({
    data: scheduleToPrisma({ ...s, orgId }, orgId),
  });
  return scheduleFromPrisma(row);
}

export async function replaceGroups(orgId: string, groups: DaveningGroup[]): Promise<void> {
  const db = getDbClient();
  await db.scheduleGroup.deleteMany({ where: { orgId } });
  if (groups.length === 0) return;
  await db.scheduleGroup.createMany({
    data: groups.map((g) => ({
      id: g.id,
      orgId,
      name: g.name,
      hebrewName: g.nameHebrew,
      color: g.color,
      sortOrder: g.sortOrder,
      active: g.active,
      isBuiltIn: false,
    })),
  });
}

export async function appendGroup(orgId: string, g: DaveningGroup): Promise<DaveningGroup> {
  const db = getDbClient();
  const row = await db.scheduleGroup.create({
    data: {
      id: g.id,
      orgId,
      name: g.name,
      hebrewName: g.nameHebrew,
      color: g.color,
      sortOrder: g.sortOrder,
      active: g.active,
      isBuiltIn: false,
    },
  });
  return groupFromPrisma(row);
}

export async function createAnnouncement(orgId: string, body: Record<string, unknown>): Promise<Announcement> {
  const db = getDbClient();
  const id = (body.id as string) ?? `ann-${Date.now()}`;
  const row = await db.announcement.create({
    data: {
      id,
      orgId,
      title: (body.title as string) ?? '',
      titleHebrew: (body.titleHebrew as string) ?? null,
      content: (body.content as string) ?? '',
      contentHebrew: (body.contentHebrew as string) ?? null,
      priority: (body.priority as number) ?? 0,
      isActive: (body.active as boolean) ?? true,
      startDate: (body.startDate as string) ?? null,
      endDate: (body.endDate as string) ?? null,
    },
  });
  return announcementFromPrisma(row);
}

export async function updateAnnouncement(orgId: string, body: Record<string, unknown>): Promise<Announcement | null> {
  const id = body.id as string;
  if (!id) return null;
  const db = getDbClient();
  const existing = await db.announcement.findFirst({ where: { id, orgId } });
  if (!existing) return null;
  const row = await db.announcement.update({
    where: { id },
    data: {
      title: body.title as string | undefined,
      titleHebrew: body.titleHebrew as string | null | undefined,
      content: body.content as string | undefined,
      contentHebrew: body.contentHebrew as string | null | undefined,
      priority: body.priority as number | undefined,
      isActive: body.active as boolean | undefined,
      startDate: body.startDate as string | null | undefined,
      endDate: body.endDate as string | null | undefined,
    },
  });
  return announcementFromPrisma(row);
}

export async function createMemorial(orgId: string, body: Record<string, unknown>): Promise<Memorial> {
  const db = getDbClient();
  const id = (body.id as string) ?? `mem-${Date.now()}`;
  const row = await db.memorial.create({
    data: {
      id,
      orgId,
      hebrewName: (body.hebrewName as string) ?? '',
      englishName: (body.englishName as string) ?? null,
      hebrewFamilyName: (body.hebrewDate as string) ?? null,
      hebrewMonth: (body.hebrewMonth as number) ?? 0,
      hebrewDay: (body.hebrewDay as number) ?? 0,
      donorInfo: (body.relationship as string) ?? null,
      notes: (body.notes as string) ?? null,
      isActive: true,
    },
  });
  return memorialFromPrisma(row);
}

export async function createMediaItem(item: MediaItem, filePathForDb: string, fileSize: number): Promise<MediaItem> {
  const db = getDbClient();
  const row = await db.media.create({
    data: {
      id: item.id,
      orgId: item.orgId,
      filename: item.filename,
      originalName: item.filename,
      mimeType: item.mimeType,
      fileSize,
      filePath: filePathForDb,
      sortOrder: 0,
      isActive: true,
    },
  });
  return mediaFromPrisma(row);
}

export type DeleteMediaResult = { ok: true; filePath: string } | { ok: false };

export async function deleteMediaItem(orgId: string, mediaId: string): Promise<DeleteMediaResult> {
  const db = getDbClient();
  const row = await db.media.findFirst({ where: { id: mediaId, orgId } });
  if (!row) return { ok: false };
  try {
    await db.media.delete({ where: { id: mediaId } });
    return { ok: true, filePath: row.filePath };
  } catch {
    return { ok: false };
  }
}

export async function createStyle(orgId: string, body: Record<string, unknown>): Promise<DisplayStyle> {
  const db = getDbClient();
  const id = (body.id as string) ?? `style-${Date.now()}`;
  const partial: DisplayStyle = {
    id,
    name: (body.name as string) ?? 'Untitled Style',
    backgroundColor: (body.backgroundColor as string) ?? '#000000',
    canvasWidth: (body.canvasWidth as number) ?? 1920,
    canvasHeight: (body.canvasHeight as number) ?? 1080,
    objects: (body.objects as DisplayStyle['objects']) ?? [],
    activationRules: (body.activationRules as DisplayStyle['activationRules']) ?? [{ type: 'default' }],
    sortOrder: (body.sortOrder as number) ?? 0,
    backgroundImage: body.backgroundImage as string | undefined,
    backgroundMode: body.backgroundMode as DisplayStyle['backgroundMode'],
    backgroundGradient: body.backgroundGradient as string | undefined,
    backgroundTexture: body.backgroundTexture as string | undefined,
    backgroundFrameId: body.backgroundFrameId as string | undefined,
    backgroundFrameThickness: typeof body.backgroundFrameThickness === 'number' ? body.backgroundFrameThickness : undefined,
  };
  const styleRow = styleRowCreateFromDisplayStyle(partial, orgId);
  await db.style.create({
    data: styleRow,
  });
  const objects = partial.objects.map((o) => displayObjectToPrismaFields(o, id));
  if (objects.length) {
    await db.displayObject.createMany({ data: objects });
  }
  const full = await db.style.findUnique({
    where: { id },
    include: { displayObjects: { orderBy: { layer: 'asc' } } },
  });
  if (!full) throw new Error('style missing');
  return prismaStyleRowToDisplayStyle(full, full.displayObjects);
}

export async function getStyleById(orgIdOrSlug: string, styleId: string): Promise<DisplayStyle | null> {
  await ensureSeeded();
  const id = await resolveOrgId(orgIdOrSlug);
  if (!id) return null;
  const db = getDbClient();
  const row = await db.style.findFirst({
    where: { id: styleId, orgId: id },
    include: { displayObjects: { orderBy: { layer: 'asc' } } },
  });
  if (!row) return null;
  return prismaStyleRowToDisplayStyle(row, row.displayObjects);
}

export async function updateStyle(
  orgId: string,
  styleId: string,
  patch: Record<string, unknown>,
): Promise<DisplayStyle | null> {
  const db = getDbClient();
  const existing = await db.style.findFirst({
    where: { id: styleId, orgId },
    include: { displayObjects: { orderBy: { layer: 'asc' } } },
  });
  if (!existing) return null;
  let merged: DisplayStyle = prismaStyleRowToDisplayStyle(existing, existing.displayObjects);
  merged = {
    ...merged,
    ...patch,
    id: styleId,
    objects: (patch.objects as DisplayStyle['objects']) ?? merged.objects,
    activationRules: (patch.activationRules as DisplayStyle['activationRules']) ?? merged.activationRules,
  };
  const styleRow = styleRowCreateFromDisplayStyle(merged, orgId);
  await db.style.update({
    where: { id: styleId },
    data: {
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
  await db.displayObject.deleteMany({ where: { styleId } });
  const objects = merged.objects.map((o) => displayObjectToPrismaFields(o, styleId));
  if (objects.length) {
    await db.displayObject.createMany({ data: objects });
  }
  const full = await db.style.findUnique({
    where: { id: styleId },
    include: { displayObjects: { orderBy: { layer: 'asc' } } },
  });
  if (!full) return null;
  return prismaStyleRowToDisplayStyle(full, full.displayObjects);
}

export async function deleteStyle(orgId: string, styleId: string): Promise<boolean> {
  const db = getDbClient();
  const row = await db.style.findFirst({ where: { id: styleId, orgId } });
  if (!row) return false;
  await db.style.delete({ where: { id: styleId } });
  return true;
}

export async function createScreen(orgId: string, body: Record<string, unknown>): Promise<Screen> {
  const db = getDbClient();
  const id = (body.id as string) ?? `screen-${Date.now()}`;
  const row = await db.screen.create({
    data: {
      id,
      orgId,
      name: (body.name as string) ?? 'New Screen',
      assignedStyleId: (body.styleId as string) || null,
      isActive: (body.active as boolean) ?? true,
      resolution: (body.resolution as string) ?? '1920x1080',
    },
  });
  return screenFromPrisma(row);
}

export async function updateScreen(
  orgId: string,
  screenId: string,
  patch: Partial<Pick<Screen, 'name' | 'styleId' | 'active' | 'resolution'>>,
): Promise<Screen | null> {
  const db = getDbClient();
  const row = await db.screen.findFirst({ where: { id: screenId, orgId } });
  if (!row) return null;
  const updated = await db.screen.update({
    where: { id: screenId },
    data: {
      name: patch.name,
      assignedStyleId:
        patch.styleId === undefined ? undefined : patch.styleId === '' ? null : patch.styleId,
      isActive: patch.active,
      resolution: patch.resolution,
    },
  });
  return screenFromPrisma(updated);
}

export async function deleteScreen(orgId: string, screenId: string): Promise<boolean> {
  const db = getDbClient();
  const row = await db.screen.findFirst({ where: { id: screenId, orgId } });
  if (!row) return false;
  await db.screen.delete({ where: { id: screenId } });
  return true;
}
