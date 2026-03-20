import { PrismaClient, ZmanimConfig } from '@prisma/client';
import { getDbClient } from '../client';

export class ZmanimConfigRepository {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db ?? getDbClient();
  }

  async findById(id: string): Promise<ZmanimConfig | null> {
    return this.db.zmanimConfig.findUnique({ where: { id } });
  }

  async findByOrgId(orgId: string): Promise<ZmanimConfig[]> {
    return this.db.zmanimConfig.findMany({ where: { orgId } });
  }

  async findByOrgAndType(orgId: string, zmanType: string): Promise<ZmanimConfig | null> {
    return this.db.zmanimConfig.findUnique({
      where: { orgId_zmanType: { orgId, zmanType } },
    });
  }

  async upsert(orgId: string, zmanType: string, data: Partial<ZmanimConfig>): Promise<ZmanimConfig> {
    return this.db.zmanimConfig.upsert({
      where: { orgId_zmanType: { orgId, zmanType } },
      create: { orgId, zmanType, authority: data.authority ?? '', ...data },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.zmanimConfig.delete({ where: { id } });
  }
}
