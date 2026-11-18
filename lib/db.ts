import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const createClient = () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

// Reuse one client across hot reloads in development and across warm
// invocations in production.
export const db = globalForPrisma.prisma ?? createClient();
globalForPrisma.prisma = db;
