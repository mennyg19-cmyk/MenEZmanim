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
  type PrismaUser,
  type PrismaOrgMembership,
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

  // Fields that are nullable: if the patch is a full style object (has 'name')
  // but omits these keys, treat them as explicitly cleared (null).
  // This handles the case where JSON.stringify strips undefined values.
  const NULLABLE_FIELDS = ['backgroundImage', 'backgroundGradient', 'backgroundTexture', 'backgroundFrameId', 'backgroundFrameThickness'] as const;
  if (patch.name !== undefined) {
    for (const f of NULLABLE_FIELDS) {
      if (!(f in patch)) {
        (patch as any)[f] = null;
      }
    }
  }

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

/* ─── User / Org / Auth helpers ─── */

export interface UserMembership {
  orgId: string;
  orgName: string;
  orgSlug: string;
  orgStatus: string;
  role: string;
}

export interface MeResponse {
  user: { id: string; clerkUserId: string; email: string; name: string; isSuperAdmin: boolean };
  memberships: UserMembership[];
}

export async function getOrCreateUser(clerkUserId: string, email: string, name: string) {
  await ensureSeeded();
  const db = getDbClient();

  // Check if a pre-seeded user exists by email with a placeholder clerkUserId
  const existingByEmail = await db.user.findUnique({ where: { email } });
  if (existingByEmail && existingByEmail.clerkUserId !== clerkUserId) {
    return db.user.update({
      where: { id: existingByEmail.id },
      data: { clerkUserId, name },
    });
  }

  return db.user.upsert({
    where: { clerkUserId },
    create: { clerkUserId, email, name },
    update: { email, name },
  });
}

export async function getUserByClerkId(clerkUserId: string) {
  await ensureSeeded();
  const db = getDbClient();
  return db.user.findUnique({ where: { clerkUserId } });
}

export async function getUserMemberships(userId: string): Promise<UserMembership[]> {
  const db = getDbClient();
  const memberships = await db.orgMembership.findMany({
    where: { userId },
    include: { organization: true },
  });
  return memberships.map((m) => ({
    orgId: m.orgId,
    orgName: m.organization.name,
    orgSlug: m.organization.slug,
    orgStatus: (m.organization as any).status ?? 'active',
    role: m.role,
  }));
}

export async function getMeData(clerkUserId: string): Promise<MeResponse | null> {
  const user = await getUserByClerkId(clerkUserId);
  if (!user) return null;
  const memberships = await getUserMemberships(user.id);
  return {
    user: {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      name: user.name,
      isSuperAdmin: user.isSuperAdmin,
    },
    memberships,
  };
}

export type AuthResult =
  | { ok: true; userId: string; role: string; isSuperAdmin: boolean }
  | { ok: false; status: number; message: string };

export async function authorizeOrgAccess(
  clerkUserId: string,
  orgId: string,
  requiredRoles?: string[],
): Promise<AuthResult> {
  await ensureSeeded();
  const db = getDbClient();
  const user = await db.user.findUnique({ where: { clerkUserId } });
  if (!user) return { ok: false, status: 401, message: 'User not found' };

  const resolved = await resolveOrgId(orgId);
  if (!resolved) return { ok: false, status: 404, message: 'Organization not found' };

  if (user.isSuperAdmin) {
    return { ok: true, userId: user.id, role: 'owner', isSuperAdmin: true };
  }

  const org = await db.organization.findUnique({ where: { id: resolved } });
  if (org && (org as any).slug === 'demo') {
    return { ok: false, status: 403, message: 'Demo organization is read-only' };
  }

  const membership = await db.orgMembership.findUnique({
    where: { userId_orgId: { userId: user.id, orgId: resolved } },
  });
  if (!membership) return { ok: false, status: 403, message: 'Not a member of this organization' };

  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(membership.role)) {
    return { ok: false, status: 403, message: 'Insufficient permissions' };
  }

  return { ok: true, userId: user.id, role: membership.role, isSuperAdmin: false };
}

export async function createOrganization(data: {
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  timezone: string;
  elevation?: number;
  inIsrael?: boolean;
}, ownerUserId: string) {
  await ensureSeeded();
  const db = getDbClient();
  const org = await db.organization.create({
    data: {
      name: data.name,
      slug: data.slug,
      status: 'pending',
      latitude: data.latitude,
      longitude: data.longitude,
      elevation: data.elevation ?? 0,
      timezone: data.timezone,
      inIsrael: data.inIsrael ?? false,
      settings: JSON.stringify({ nameHebrew: data.name, locationName: data.name }),
    },
  });
  await db.orgMembership.create({
    data: { userId: ownerUserId, orgId: org.id, role: 'owner' },
  });
  return org;
}

export async function checkEditLock(orgId: string, userId: string): Promise<{ locked: boolean; lockedBy?: string }> {
  const db = getDbClient();
  const resolved = await resolveOrgId(orgId);
  if (!resolved) return { locked: false };

  const lock = await db.editLock.findUnique({ where: { orgId: resolved } });
  if (!lock) return { locked: false };

  if (new Date(lock.expiresAt) < new Date()) {
    await db.editLock.delete({ where: { orgId: resolved } });
    return { locked: false };
  }

  if (lock.userId === userId) return { locked: false };

  const lockUser = await db.user.findUnique({ where: { id: lock.userId } });
  return { locked: true, lockedBy: lockUser?.name ?? 'Another user' };
}

export async function acquireEditLock(orgId: string, userId: string): Promise<{ ok: boolean; lockedBy?: string }> {
  const db = getDbClient();
  const resolved = await resolveOrgId(orgId);
  if (!resolved) return { ok: false };

  const existing = await db.editLock.findUnique({ where: { orgId: resolved } });
  if (existing) {
    if (new Date(existing.expiresAt) < new Date()) {
      await db.editLock.delete({ where: { orgId: resolved } });
    } else if (existing.userId !== userId) {
      const lockUser = await db.user.findUnique({ where: { id: existing.userId } });
      return { ok: false, lockedBy: lockUser?.name ?? 'Another user' };
    }
  }

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await db.editLock.upsert({
    where: { orgId: resolved },
    create: { orgId: resolved, userId, expiresAt },
    update: { userId, expiresAt, lockedAt: new Date() },
  });
  return { ok: true };
}

export async function renewEditLock(orgId: string, userId: string): Promise<boolean> {
  const db = getDbClient();
  const resolved = await resolveOrgId(orgId);
  if (!resolved) return false;

  const lock = await db.editLock.findUnique({ where: { orgId: resolved } });
  if (!lock || lock.userId !== userId) return false;

  await db.editLock.update({
    where: { orgId: resolved },
    data: { expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
  });
  return true;
}

export async function releaseEditLock(orgId: string, userId: string): Promise<boolean> {
  const db = getDbClient();
  const resolved = await resolveOrgId(orgId);
  if (!resolved) return false;

  const lock = await db.editLock.findUnique({ where: { orgId: resolved } });
  if (!lock || lock.userId !== userId) return false;

  await db.editLock.delete({ where: { orgId: resolved } });
  return true;
}

export async function getEditLockStatus(orgId: string): Promise<{ locked: boolean; userId?: string; userName?: string; expiresAt?: string }> {
  const db = getDbClient();
  const resolved = await resolveOrgId(orgId);
  if (!resolved) return { locked: false };

  const lock = await db.editLock.findUnique({ where: { orgId: resolved } });
  if (!lock) return { locked: false };

  if (new Date(lock.expiresAt) < new Date()) {
    await db.editLock.delete({ where: { orgId: resolved } });
    return { locked: false };
  }

  const user = await db.user.findUnique({ where: { id: lock.userId } });
  return { locked: true, userId: lock.userId, userName: user?.name, expiresAt: lock.expiresAt.toISOString() };
}

/* ─── Super Admin helpers ─── */

export async function getAllOrgs() {
  await ensureSeeded();
  const db = getDbClient();
  return db.organization.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function updateOrgStatus(orgId: string, status: string) {
  const db = getDbClient();
  return db.organization.update({ where: { id: orgId }, data: { status } as any });
}

export async function getAllUsers() {
  await ensureSeeded();
  const db = getDbClient();
  return db.user.findMany({
    include: { memberships: { include: { organization: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

/* ─── Invite helpers ─── */

export async function createInvite(orgId: string, email: string, role: string) {
  const db = getDbClient();
  const resolved = await resolveOrgId(orgId);
  if (!resolved) throw new Error('Org not found');

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return db.orgInvite.create({
    data: { orgId: resolved, email: email.toLowerCase(), role, expiresAt },
  });
}

export async function getOrgInvites(orgId: string) {
  const db = getDbClient();
  const resolved = await resolveOrgId(orgId);
  if (!resolved) return [];
  return db.orgInvite.findMany({
    where: { orgId: resolved, usedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

export async function acceptInvite(token: string, clerkUserId: string) {
  const db = getDbClient();
  const invite = await db.orgInvite.findUnique({ where: { token } });
  if (!invite) throw new Error('Invite not found');
  if (invite.usedAt) throw new Error('Invite already used');
  if (new Date(invite.expiresAt) < new Date()) throw new Error('Invite expired');

  const user = await db.user.findUnique({ where: { clerkUserId } });
  if (!user) throw new Error('User not found');

  await db.orgMembership.upsert({
    where: { userId_orgId: { userId: user.id, orgId: invite.orgId } },
    create: { userId: user.id, orgId: invite.orgId, role: invite.role },
    update: { role: invite.role },
  });

  await db.orgInvite.update({ where: { id: invite.id }, data: { usedAt: new Date() } });
  return { orgId: invite.orgId };
}

export async function getPendingInvitesForEmail(email: string) {
  const db = getDbClient();
  return db.orgInvite.findMany({
    where: { email: email.toLowerCase(), usedAt: null },
    include: { organization: true },
  });
}
