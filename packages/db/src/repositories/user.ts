import { PrismaClient, User } from '@prisma/client';
import { getDbClient } from '../client';

export class UserRepository {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db ?? getDbClient();
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } });
  }

  async findByClerkId(clerkUserId: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { clerkUserId } });
  }

  async findByOrgId(orgId: string): Promise<User[]> {
    const memberships = await this.db.orgMembership.findMany({
      where: { orgId },
      include: { user: true },
    });
    return memberships.map((m) => m.user);
  }

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return this.db.user.create({ data });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.db.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.user.delete({ where: { id } });
  }
}
