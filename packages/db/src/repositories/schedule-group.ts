import { PrismaClient, ScheduleGroup } from '@prisma/client';
import { getDbClient } from '../client';

export class ScheduleGroupRepository {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db ?? getDbClient();
  }

  async findById(id: string): Promise<ScheduleGroup | null> {
    return this.db.scheduleGroup.findUnique({ where: { id } });
  }

  async findByOrgId(orgId: string): Promise<ScheduleGroup[]> {
    return this.db.scheduleGroup.findMany({
      where: { orgId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(data: Omit<ScheduleGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleGroup> {
    return this.db.scheduleGroup.create({ data });
  }

  async update(id: string, data: Partial<ScheduleGroup>): Promise<ScheduleGroup> {
    return this.db.scheduleGroup.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.scheduleGroup.delete({ where: { id } });
  }
}
