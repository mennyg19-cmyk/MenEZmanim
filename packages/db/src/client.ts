import { PrismaClient } from '@prisma/client';
import { createRequire } from 'node:module';
import path from 'path';

/**
 * Lazy-load the libsql adapter only when `TURSO_DATABASE_URL` is set so `next build`
 * and local SQLite runs do not pull in `@prisma/adapter-libsql` / broken optional ESM graphs.
 */
const nodeRequire = createRequire(import.meta.url);

let client: PrismaClient | null = null;

export function getDbClient(): PrismaClient {
  if (client) return client;

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    const { PrismaLibSQL } = nodeRequire('@prisma/adapter-libsql') as typeof import('@prisma/adapter-libsql');
    client = new PrismaClient({
      adapter: new PrismaLibSQL({
        url: tursoUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }),
    });
    return client;
  }

  if (!process.env.DATABASE_URL) {
    const dbPath = path.resolve(process.cwd(), 'data', 'zmanim.db');
    process.env.DATABASE_URL = `file:${dbPath}`;
  }

  client = new PrismaClient();
  return client;
}
