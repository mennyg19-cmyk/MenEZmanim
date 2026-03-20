import { PrismaClient } from '@prisma/client';
import path from 'path';

let client: PrismaClient | null = null;

export function getDbClient(): PrismaClient {
  if (client) return client;

  if (!process.env.DATABASE_URL) {
    const dbPath = path.resolve(process.cwd(), 'data', 'zmanim.db');
    process.env.DATABASE_URL = `file:${dbPath}`;
  }

  client = new PrismaClient();
  return client;
}
