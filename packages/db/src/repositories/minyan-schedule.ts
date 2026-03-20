import { Prisma, PrismaClient, MinyanSchedule } from '@prisma/client';
import { getDbClient } from '../client';

export class MinyanScheduleRepository {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db ?? getDbClient();
  }

  async findById(id: string): Promise<MinyanSchedule | null> {
    return this.db.minyanSchedule.findUnique({ where: { id } });
  }

  async findByOrgId(orgId: string): Promise<MinyanSchedule[]> {
    return this.db.minyanSchedule.findMany({
      where: { orgId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findActiveByOrgId(orgId: string): Promise<MinyanSchedule[]> {
    return this.db.minyanSchedule.findMany({
      where: { orgId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(data: Prisma.MinyanScheduleUncheckedCreateInput): Promise<MinyanSchedule> {
    return this.db.minyanSchedule.create({ data });
  }

  async update(id: string, data: Prisma.MinyanScheduleUncheckedUpdateInput): Promise<MinyanSchedule> {
    return this.db.minyanSchedule.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.minyanSchedule.delete({ where: { id } });
  }
}
