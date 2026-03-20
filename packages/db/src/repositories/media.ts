import { PrismaClient, Media } from '@prisma/client';
import { getDbClient } from '../client';

export class MediaRepository {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db ?? getDbClient();
  }

  async findById(id: string): Promise<Media | null> {
    return this.db.media.findUnique({ where: { id } });
  }

  async findByOrgId(orgId: string): Promise<Media[]> {
    return this.db.media.findMany({
      where: { orgId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findActiveByOrgId(orgId: string): Promise<Media[]> {
    return this.db.media.findMany({
      where: { orgId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(data: Omit<Media, 'id' | 'createdAt' | 'updatedAt'>): Promise<Media> {
    return this.db.media.create({ data });
  }

  async update(id: string, data: Partial<Media>): Promise<Media> {
    return this.db.media.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.media.delete({ where: { id } });
  }
}
