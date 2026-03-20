import { PrismaClient, Screen } from '@prisma/client';
import { getDbClient } from '../client';

export class ScreenRepository {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db ?? getDbClient();
  }

  async findById(id: string): Promise<Screen | null> {
    return this.db.screen.findUnique({ where: { id } });
  }

  async findByOrgId(orgId: string): Promise<Screen[]> {
    return this.db.screen.findMany({ where: { orgId } });
  }

  async create(data: Omit<Screen, 'id' | 'createdAt' | 'updatedAt'>): Promise<Screen> {
    return this.db.screen.create({ data });
  }

  async update(id: string, data: Partial<Screen>): Promise<Screen> {
    return this.db.screen.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.screen.delete({ where: { id } });
  }
}
