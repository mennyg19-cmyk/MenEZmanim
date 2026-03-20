import { PrismaClient, Style } from '@prisma/client';
import { getDbClient } from '../client';

export class StyleRepository {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db ?? getDbClient();
  }

  async findById(id: string): Promise<Style | null> {
    return this.db.style.findUnique({
      where: { id },
      include: { displayObjects: true },
    });
  }

  async findByOrgId(orgId: string): Promise<Style[]> {
    return this.db.style.findMany({
      where: { orgId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findDefaultByOrgId(orgId: string): Promise<Style | null> {
    return this.db.style.findFirst({
      where: { orgId, isDefault: true },
      include: { displayObjects: true },
    });
  }

  async create(data: Omit<Style, 'id' | 'createdAt' | 'updatedAt'>): Promise<Style> {
    return this.db.style.create({ data });
  }

  async update(id: string, data: Partial<Style>): Promise<Style> {
    return this.db.style.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.style.delete({ where: { id } });
  }
}
