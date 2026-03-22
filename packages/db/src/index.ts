export { getDbClient } from './client';
export * from './repositories';
export * from './style-mapper';
export { seedDemoOrganization } from './demo-seed';
export { ensureTablesExist } from './auto-migrate';

/** Types for consumers (e.g. Next.js API) without adding a direct `@prisma/client` dependency. */
export type { Prisma } from '@prisma/client';
export type {
  Announcement as PrismaAnnouncement,
  Memorial as PrismaMemorial,
  Media as PrismaMedia,
  MinyanSchedule as PrismaSchedule,
  Organization as PrismaOrgRow,
  ScheduleGroup as PrismaGroup,
  Screen as PrismaScreen,
} from '@prisma/client';
