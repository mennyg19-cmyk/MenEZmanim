import type { PrismaClient } from '@prisma/client';

/**
 * All CREATE TABLE / CREATE INDEX statements needed for the schema.
 * Uses IF NOT EXISTS so it's safe to run on every cold start.
 * Only runs when TURSO_DATABASE_URL is set (remote DB that can't use `prisma db push`).
 */
const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "elevation" REAL NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL,
    "dialect" TEXT NOT NULL DEFAULT 'Ashkenazi',
    "candleLightingMinutes" INTEGER NOT NULL DEFAULT 18,
    "shabbatEndType" TEXT NOT NULL DEFAULT 'degrees',
    "shabbatEndValue" REAL NOT NULL DEFAULT 8.5,
    "rabbeinu_tam_minutes" INTEGER NOT NULL DEFAULT 72,
    "amPmFormat" BOOLEAN NOT NULL DEFAULT false,
    "inIsrael" BOOLEAN NOT NULL DEFAULT false,
    "settings" TEXT NOT NULL DEFAULT '{}',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Style" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "backgroundImage" TEXT,
    "backgroundColor" TEXT NOT NULL DEFAULT '#0f172a',
    "backgroundMode" TEXT NOT NULL DEFAULT 'solid',
    "backgroundGradient" TEXT,
    "backgroundTexture" TEXT,
    "backgroundFrameId" TEXT,
    "backgroundFrameThickness" REAL DEFAULT 1.0,
    "canvasWidth" INTEGER NOT NULL DEFAULT 1920,
    "canvasHeight" INTEGER NOT NULL DEFAULT 1080,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "activationRules" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Style_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Screen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "assignedStyleId" TEXT,
    "styleSchedules" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "resolution" TEXT NOT NULL DEFAULT '1920x1080',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Screen_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Screen_assignedStyleId_fkey" FOREIGN KEY ("assignedStyleId") REFERENCES "Style" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "OrgMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrgMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrgMembership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "OrgInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrgInvite_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "EditLock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "EditLock_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EditLock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "DisplayObject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "styleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "posX" INTEGER NOT NULL,
    "posY" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "layer" INTEGER NOT NULL DEFAULT 0,
    "fontFamily" TEXT NOT NULL DEFAULT 'David Libre',
    "fontSize" INTEGER NOT NULL DEFAULT 16,
    "fontBold" BOOLEAN NOT NULL DEFAULT false,
    "fontItalic" BOOLEAN NOT NULL DEFAULT false,
    "foreColor" TEXT NOT NULL DEFAULT '#000000',
    "backColor" TEXT NOT NULL DEFAULT 'transparent',
    "language" TEXT NOT NULL DEFAULT 'hebrew',
    "content" TEXT,
    "scheduleRules" TEXT,
    "scheduleGroupVisibility" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DisplayObject_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ScheduleGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hebrewName" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "autoActivationRules" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleGroup_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ZmanimConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "zmanType" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "degreesBelow" REAL,
    "fixedMinutes" INTEGER,
    "earliest" TEXT,
    "latest" TEXT,
    "roundTo" INTEGER,
    "offset" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ZmanimConfig_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "MinyanSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hebrewName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "baseZman" TEXT,
    "fixedTime" TEXT,
    "offset" INTEGER NOT NULL DEFAULT 0,
    "earliest" TEXT,
    "latest" TEXT,
    "roundTo" INTEGER NOT NULL DEFAULT 5,
    "room" TEXT,
    "dayOfWeekMask" TEXT NOT NULL DEFAULT '1111111',
    "scheduleGroupIds" TEXT,
    "details" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MinyanSchedule_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleHebrew" TEXT,
    "content" TEXT NOT NULL,
    "contentHebrew" TEXT,
    "scheduleRules" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TEXT,
    "endDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Announcement_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Memorial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "hebrewName" TEXT NOT NULL,
    "englishName" TEXT,
    "hebrewFamilyName" TEXT,
    "hebrewBenBat" TEXT,
    "hebrewYear" INTEGER,
    "hebrewMonth" INTEGER NOT NULL,
    "hebrewDay" INTEGER NOT NULL,
    "hebrewAdar" INTEGER NOT NULL DEFAULT 0,
    "civilDate" DATETIME,
    "isYahrzeit" BOOLEAN NOT NULL DEFAULT true,
    "donorInfo" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Memorial_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Sponsor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sponsorName" TEXT NOT NULL,
    "hebrewText" TEXT,
    "englishText" TEXT,
    "hebrewDate" TEXT,
    "civilDate" DATETIME,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sponsor_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "scheduleRules" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Media_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "TukachinskyNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hebrewMonth" INTEGER NOT NULL,
    "hebrewDay" INTEGER NOT NULL,
    "noteHebrew" TEXT NOT NULL,
    "noteEnglish" TEXT,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SyncLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug")`,
  `CREATE INDEX IF NOT EXISTS "Screen_orgId_idx" ON "Screen"("orgId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_clerkUserId_key" ON "User"("clerkUserId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "OrgMembership_userId_orgId_key" ON "OrgMembership"("userId", "orgId")`,
  `CREATE INDEX IF NOT EXISTS "OrgMembership_orgId_idx" ON "OrgMembership"("orgId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "OrgInvite_token_key" ON "OrgInvite"("token")`,
  `CREATE INDEX IF NOT EXISTS "OrgInvite_orgId_idx" ON "OrgInvite"("orgId")`,
  `CREATE INDEX IF NOT EXISTS "OrgInvite_email_idx" ON "OrgInvite"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "EditLock_orgId_key" ON "EditLock"("orgId")`,
  `CREATE INDEX IF NOT EXISTS "Style_orgId_idx" ON "Style"("orgId")`,
  `CREATE INDEX IF NOT EXISTS "DisplayObject_styleId_idx" ON "DisplayObject"("styleId")`,
  `CREATE INDEX IF NOT EXISTS "ScheduleGroup_orgId_idx" ON "ScheduleGroup"("orgId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ZmanimConfig_orgId_zmanType_key" ON "ZmanimConfig"("orgId", "zmanType")`,
  `CREATE INDEX IF NOT EXISTS "MinyanSchedule_orgId_idx" ON "MinyanSchedule"("orgId")`,
  `CREATE INDEX IF NOT EXISTS "Announcement_orgId_idx" ON "Announcement"("orgId")`,
  `CREATE INDEX IF NOT EXISTS "Memorial_orgId_idx" ON "Memorial"("orgId")`,
  `CREATE INDEX IF NOT EXISTS "Sponsor_orgId_idx" ON "Sponsor"("orgId")`,
  `CREATE INDEX IF NOT EXISTS "Media_orgId_idx" ON "Media"("orgId")`,
  `CREATE INDEX IF NOT EXISTS "SyncLog_orgId_idx" ON "SyncLog"("orgId")`,
  `CREATE INDEX IF NOT EXISTS "SyncLog_synced_idx" ON "SyncLog"("synced")`,
];

const FIXUP_STATEMENTS: string[] = [
  `UPDATE "Media" SET "sortOrder" = 0 WHERE "sortOrder" > 2147483647`,
  `UPDATE "Organization" SET "status" = 'active' WHERE "slug" = 'demo' AND "status" = 'pending'`,
];

/**
 * The old User table had passwordHash/orgId columns. The new schema uses clerkUserId/isSuperAdmin.
 * SQLite can't ALTER columns, so we must drop and recreate if the old schema is detected.
 */
const USER_TABLE_MIGRATION: string[] = [
  `DROP TABLE IF EXISTS "User"`,
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_clerkUserId_key" ON "User"("clerkUserId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
];

const SUPER_ADMIN_SEED = [
  `INSERT OR IGNORE INTO "User" ("id", "clerkUserId", "email", "name", "isSuperAdmin", "createdAt", "updatedAt")
    VALUES ('superadmin-1', 'pending-clerk-sync', 'mennyg19@gmail.com', 'Menny', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  `INSERT OR IGNORE INTO "OrgMembership" ("id", "userId", "orgId", "role", "createdAt")
    VALUES ('membership-superadmin-demo', 'superadmin-1', 'default', 'owner', CURRENT_TIMESTAMP)`,
];

/** Idempotent ALTERs for existing Turso/SQLite DBs created before new columns. */
const ALTER_STATEMENTS: string[] = [
  `ALTER TABLE "Style" ADD COLUMN "backgroundMode" TEXT NOT NULL DEFAULT 'solid'`,
  `ALTER TABLE "Style" ADD COLUMN "backgroundGradient" TEXT`,
  `ALTER TABLE "Style" ADD COLUMN "backgroundTexture" TEXT`,
  `ALTER TABLE "Style" ADD COLUMN "backgroundFrameId" TEXT`,
  `ALTER TABLE "Style" ADD COLUMN "backgroundFrameThickness" REAL DEFAULT 1.0`,
  `ALTER TABLE "Organization" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending'`,
  `ALTER TABLE "Organization" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free'`,
  `ALTER TABLE "Screen" ADD COLUMN "styleSchedules" TEXT`,
];

async function needsUserTableMigration(db: PrismaClient): Promise<boolean> {
  try {
    const rows = await db.$queryRawUnsafe<{ name: string }[]>(
      `PRAGMA table_info('User')`
    );
    if (!Array.isArray(rows)) return false;
    return rows.some((r) => r.name === 'passwordHash');
  } catch {
    return false;
  }
}

export async function ensureTablesExist(db: PrismaClient): Promise<void> {
  // Check if the old User table schema exists and needs migration
  const migrateUser = await needsUserTableMigration(db);
  if (migrateUser) {
    for (const sql of USER_TABLE_MIGRATION) {
      await db.$executeRawUnsafe(sql);
    }
  }

  for (const sql of SCHEMA_STATEMENTS) {
    await db.$executeRawUnsafe(sql);
  }
  for (const sql of ALTER_STATEMENTS) {
    try {
      await db.$executeRawUnsafe(sql);
    } catch {
      /* column already exists */
    }
  }
  for (const sql of FIXUP_STATEMENTS) {
    try { await db.$executeRawUnsafe(sql); } catch { /* table may not exist yet */ }
  }

  // Seed super admin if not present
  for (const sql of SUPER_ADMIN_SEED) {
    try { await db.$executeRawUnsafe(sql); } catch { /* already exists */ }
  }
}
