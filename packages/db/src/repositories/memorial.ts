import { PrismaClient, Memorial } from '@prisma/client';
import { getDbClient } from '../client';

export class MemorialRepository {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db ?? getDbClient();
  }

  async findById(id: string): Promise<Memorial | null> {
    return this.db.memorial.findUnique({ where: { id } });
  }

  async findByOrgId(orgId: string): Promise<Memorial[]> {
    return this.db.memorial.findMany({ where: { orgId } });
  }

  async findActiveByOrgId(orgId: string): Promise<Memorial[]> {
    return this.db.memorial.findMany({
      where: { orgId, isActive: true },
    });
  }

  async findByHebrewDate(orgId: string, hebrewMonth: number, hebrewDay: number): Promise<Memorial[]> {
    return this.db.memorial.findMany({
      where: { orgId, hebrewMonth, hebrewDay, isActive: true },
    });
  }

  async create(data: Omit<Memorial, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memorial> {
    return this.db.memorial.create({ data });
  }

  async update(id: string, data: Partial<Memorial>): Promise<Memorial> {
    return this.db.memorial.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.memorial.delete({ where: { id } });
  }
}
