import { PrismaClient, SyncLog } from '@prisma/client';
import { getDbClient } from '../client';

export class SyncLogRepository {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db ?? getDbClient();
  }

  async findUnsynced(orgId: string): Promise<SyncLog[]> {
    return this.db.syncLog.findMany({
      where: { orgId, synced: false },
      orderBy: { timestamp: 'asc' },
    });
  }

  async create(data: Omit<SyncLog, 'id' | 'timestamp' | 'synced'>): Promise<SyncLog> {
    return this.db.syncLog.create({ data });
  }

  async markSynced(ids: string[]): Promise<void> {
    await this.db.syncLog.updateMany({
      where: { id: { in: ids } },
      data: { synced: true },
    });
  }

  async deleteOlderThan(date: Date): Promise<void> {
    await this.db.syncLog.deleteMany({
      where: { timestamp: { lt: date }, synced: true },
    });
  }
}
