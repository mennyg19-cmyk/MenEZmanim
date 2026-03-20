import { PrismaClient, Announcement } from '@prisma/client';
import { getDbClient } from '../client';

export class AnnouncementRepository {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db ?? getDbClient();
  }

  async findById(id: string): Promise<Announcement | null> {
    return this.db.announcement.findUnique({ where: { id } });
  }

  async findByOrgId(orgId: string): Promise<Announcement[]> {
    return this.db.announcement.findMany({
      where: { orgId },
      orderBy: { priority: 'desc' },
    });
  }

  async findActiveByOrgId(orgId: string): Promise<Announcement[]> {
    return this.db.announcement.findMany({
      where: { orgId, isActive: true },
      orderBy: { priority: 'desc' },
    });
  }

  async create(data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Announcement> {
    return this.db.announcement.create({ data });
  }

  async update(id: string, data: Partial<Announcement>): Promise<Announcement> {
    return this.db.announcement.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.announcement.delete({ where: { id } });
  }
}
