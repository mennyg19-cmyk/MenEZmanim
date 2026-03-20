import { PrismaClient, DisplayObject } from '@prisma/client';
import { getDbClient } from '../client';

export class DisplayObjectRepository {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db ?? getDbClient();
  }

  async findById(id: string): Promise<DisplayObject | null> {
    return this.db.displayObject.findUnique({ where: { id } });
  }

  async findByStyleId(styleId: string): Promise<DisplayObject[]> {
    return this.db.displayObject.findMany({
      where: { styleId },
      orderBy: { layer: 'asc' },
    });
  }

  async create(data: Omit<DisplayObject, 'id' | 'createdAt' | 'updatedAt'>): Promise<DisplayObject> {
    return this.db.displayObject.create({ data });
  }

  async update(id: string, data: Partial<DisplayObject>): Promise<DisplayObject> {
    return this.db.displayObject.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.displayObject.delete({ where: { id } });
  }

  async deleteByStyleId(styleId: string): Promise<void> {
    await this.db.displayObject.deleteMany({ where: { styleId } });
  }
}
