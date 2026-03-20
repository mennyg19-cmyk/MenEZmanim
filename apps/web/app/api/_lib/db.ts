/**
 * Shared Prisma repository singletons for API routes that prefer class-based access.
 * Most handlers use `data-access.ts` instead; both use the same `@zmanim-app/db` client.
 */
import {
  AnnouncementRepository,
  DisplayObjectRepository,
  getDbClient,
  MediaRepository,
  MemorialRepository,
  MinyanScheduleRepository,
  OrganizationRepository,
  ScheduleGroupRepository,
  ScreenRepository,
  StyleRepository,
  UserRepository,
  ZmanimConfigRepository,
} from '@zmanim-app/db';

export { getDbClient };

export const organizationRepository = new OrganizationRepository();
export const screenRepository = new ScreenRepository();
export const styleRepository = new StyleRepository();
export const displayObjectRepository = new DisplayObjectRepository();
export const scheduleGroupRepository = new ScheduleGroupRepository();
export const minyanScheduleRepository = new MinyanScheduleRepository();
export const announcementRepository = new AnnouncementRepository();
export const memorialRepository = new MemorialRepository();
export const mediaRepository = new MediaRepository();
export const userRepository = new UserRepository();
export const zmanimConfigRepository = new ZmanimConfigRepository();
