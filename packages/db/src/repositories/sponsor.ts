import { PrismaClient, Sponsor } from '@prisma/client';
import { getDbClient } from '../client';

export class SponsorRepository {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db ?? getDbClient();
  }

  async findById(id: string): Promise<Sponsor | null> {
    return this.db.sponsor.findUnique({ where: { id } });
  }

  async findByOrgId(orgId: string): Promise<Sponsor[]> {
    return this.db.sponsor.findMany({ where: { orgId } });
  }

  async findActiveByOrgId(orgId: string): Promise<Sponsor[]> {
    return this.db.sponsor.findMany({
      where: { orgId, isActive: true },
    });
  }

  async create(data: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sponsor> {
    return this.db.sponsor.create({ data });
  }

  async update(id: string, data: Partial<Sponsor>): Promise<Sponsor> {
    return this.db.sponsor.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.sponsor.delete({ where: { id } });
  }
}
