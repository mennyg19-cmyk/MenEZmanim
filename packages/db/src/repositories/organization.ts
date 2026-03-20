import { PrismaClient, Organization } from '@prisma/client';
import { getDbClient } from '../client';

export class OrganizationRepository {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db ?? getDbClient();
  }

  async findById(id: string): Promise<Organization | null> {
    return this.db.organization.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    return this.db.organization.findUnique({ where: { slug } });
  }

  async findAll(): Promise<Organization[]> {
    return this.db.organization.findMany();
  }

  async create(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
    return this.db.organization.create({ data });
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    return this.db.organization.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.organization.delete({ where: { id } });
  }
}
